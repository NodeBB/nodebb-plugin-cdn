nodebb-plugin-cdn
====

This plugin allows you to automatically redirect requests to a CDN. It has been tested with AWS Cloudfront, but other services will likely also work.

There are setup instructions for AWS Cloudfront [here](docs/cloudfront.md). If you want to get the absolute best performance, you'll want to use nginx to handle redirects as described [here](docs/nginx.md).

Make sure, prior to setup, that your nginx config does not have any `location` directives which apply to `/plugins` or `/assets`.
