# Speeding Up Redirections with nginx

This plugin works by redirecting requests to static assets to a cache-busted route on the CDN. This cache-busted route is at a subpath of `/assets` on the CDN. The subpath's name is a string of 13 digits representing the epoch time integer, the number of milliseconds since *00:00:00 Coordinated Universal Time (UTC), Thursday, 1 January 1970*. This integer will be 13 digits until the year 2286 AD. 

Here is an example nginx config file for NodeBB:

```
server {
  listen 80;
  server_name example.com;

  location @nodebb {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-NginX-Proxy true;

    proxy_pass http://127.0.0.1:4567;
    proxy_redirect off;

    # Socket.io Support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
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
    try_files /502.html @nodebb;
  }
}
```

But this doesn't do anything to redirect client requests to the CDN, and will pass on CDN requests to the NodeBB server. First, we want to serve requests from the CDN directly from the NodeBB directories with nginx, since NodeBB isn't as fast with static assets.

To do this, we will change the `/assets/` and `/plugins/` blocks to a RegExp matching a subpath with 13 digits:

```
location ~ ^/assets/[0-9]{13}/(.*) {
  root /home/saas/nodebb/;
  try_files build/public/$1 public/$1 @nodebb;
}

location ~ ^/plugins/[0-9]{13}/(.*) {
  root /home/saas/nodebb/build/public/;
  try_files plugins/$1 @nodebb;
}
```

We also want to redirect other client requests of `/assets/` and `/plugins/` to the CDN:

```
# loads $cacheBuster into the file
include /home/saas/nodebb/build/cache-buster.conf;

location /assets/ {
  return 302 https://cdn.example.com/$cacheBuster/$uri;
}

location /plugins/ {
  return 302 https://cdn.example.com/$cacheBuster/$uri;
}
```

You can install the [`entr` package](http://entrproject.org/), and use a command like this (executed in the background) to reload nginx whenever the cache buster file changes:

```
echo /home/saas/nodebb/build/cache-buster.conf | entr service nginx reload
```

A cache buster like this is necessary otherwise the CDN will continue to serve old assets after new ones have been built.

### Example Config File for Accelerating Redirects with nginx

```
server {
  listen 80;
  server_name example.com;

  location @nodebb {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-NginX-Proxy true;

    proxy_pass http://127.0.0.1:4567;
    proxy_redirect off;

    # Socket.io Support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  location ~ "^/assets/\d{13,}/(.*)" {
    root /home/saas/nodebb/;
    try_files /build/public/$1 /public/$1 @nodebb;
  }

  location ~ "^/plugins/\d{13,}/(.*)" {
    root /home/saas/nodebb/build/public/;
    try_files /plugins/$1 @nodebb;
  }

  set $cdn https://cdn.example.com;

  # loads $cacheBuster into the file
  include /home/saas/nodebb/build/cache-buster.conf;

  location ~ ^/assets/(.*) {
    return 302 $cdn/assets/$cacheBuster/$1;
  }

  location ~ ^/plugins/(.*) {
    return 302 $cdn/plugins/$cacheBuster/$1;
  }

  location / {
    try_files /502.html @nodebb;
  }
}
```
