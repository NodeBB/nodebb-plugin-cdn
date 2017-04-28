# Speeding Up Redirections with nginx

This plugin works by redirecting requests to static assets to a cache-busted route on the CDN. This cache-busted route is at a subpath of `/assets` or `/plugins` on the CDN. The cache buster string is a random 11-character alphanumeric string stored in the file `build/cache-buster`.

Here is an example nginx config file for NodeBB:

```
upstream nodes {
  ip_hash;
  server 127.0.0.1:4567;
  server 127.0.0.1:4568;
  server 127.0.0.1:4569;
}

server {
  listen 80;
  server_name example.com;

  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header Host $http_host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-NginX-Proxy true;

  proxy_redirect off;

  # Socket.io Support
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";

  location @nodebb {
    proxy_pass http://nodes;
  }

  location ~ ^/assets/(.*) {
    root /home/saas/nodebb/;
    try_files /build/public/$1 /public/$1 @nodebb;
  }

  location /plugins/ {
    root /home/saas/nodebb/build/public/;
    try_files $uri @nodebb;
  }

  location / {
    proxy_pass http://nodes;
  }
}
```

But this doesn't do anything to redirect client requests to the CDN, and will pass on CDN requests to the NodeBB server. First, we want to serve requests from the CDN directly from the NodeBB directories with nginx, since NodeBB isn't as fast with static assets.

To do this, we will change the `/assets/` and `/plugins/` blocks to a RegExp matching a subpath with 13 digits:

```
location ~ "^/assets/[a-z0-9]{11}/(.*)" {
  root /home/saas/nodebb/;
  try_files /build/public/$1 /public/$1 @nodebb;
}

location ~ "^/plugins/[a-z0-9]{11}/(.*)" {
  root /home/saas/nodebb/build/public/;
  try_files /plugins/$1 @nodebb;
}
```

We also want to redirect other client requests of `/assets/` and `/plugins/` to the CDN:

```
set $cdn https://cdn.example.com;

# loads $cacheBuster into the file
include /home/saas/nodebb/build/cache-buster.conf;

location ~ ^/(assets|plugins)/(.*) {
  return 302 $cdn/$1/$cacheBuster/$2;
}
```

You can install the [`entr` package](http://entrproject.org/), and use a scipt like this (executed in the background) to build `cache-buster.conf` and reload nginx whenever the cache buster file changes:

```
reload() {
  echo "set \$cacheBuster $(cat /home/saas/nodebb/build/cache-buster);" > /home/saas/nodebb/build/cache-buster.conf
  service nginx reload
}
nohup echo /home/saas/nodebb/build/cache-buster | entr reload &> /dev/null &
```

A cache buster like this is necessary otherwise nginx will continue to redirect to old assets after new ones have been built.

### Example Config File for Accelerating Redirects with nginx

```
upstream nodes {
  ip_hash;
  server 127.0.0.1:4567;
  server 127.0.0.1:4568;
  server 127.0.0.1:4569;
}

server {
  listen 80;
  server_name example.com;

  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header Host $http_host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-NginX-Proxy true;

  proxy_redirect off;

  # Socket.io Support
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";

  location @nodebb {
    proxy_pass http://nodes;
  }

  location ~ "^/assets/[a-z0-9]{11}/(.*)" {
    add_header Access-Control-Allow-Origin $scheme://$server_name;
    root /home/saas/nodebb/;
    try_files /build/public/$1 /public/$1 @nodebb;
  }

  location ~ "^/plugins/[a-z0-9]{11}/(.*)" {
    add_header Access-Control-Allow-Origin $scheme://$server_name;
    root /home/saas/nodebb/build/public/;
    try_files /plugins/$1 @nodebb;
  }

  set $cdn http://cdn.example.com;

  # loads $cacheBuster into the file
  include /home/saas/nodebb/build/cache-buster.conf;

  location ~ ^/(assets|plugins)/(.*) {
    return 302 $cdn/$1/$cacheBuster/$2;
  }

  location / {
    proxy_pass http://nodes;
  }
}
```
