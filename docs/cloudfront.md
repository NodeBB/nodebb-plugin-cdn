# Setup with Amazon Cloudfront

## Creating a new distribution

In the [Cloudfront management interface](https://console.aws.amazon.com/cloudfront/home?#create-distribution:), create a new **Web Distribution**. 

### Origin Settings

- *Origin Domain Name*: enter the domain of your NodeBB forum
- *Origin Path*: enter the relative path of your NodeBB forum if you for instance access it at `example.com/forum`
- *Origin ID*: this can be anything you want, just make it unique
- *Origin SSL Protocols*: select the protocols your site supports
- *Origin Protocol Policy*: select `HTTPS only` if your site supports HTTPS, otherwise `HTTP only`
- *HTTP port* and *HTTPS port*: these are most likely the defaults of `80` and `443` on your site. If not, enter the ones you use.

### Default Cache Behavior Settings

- *Viewer Protocol Policy*: if your site uses HTTPS, select `HTTPS only`. Otherwise, select `HTTP and HTTPS`
- *Allowed HTTP methods*: `GET, HEAD`
- *Forward Headers*: `None (Improves Caching)`
- *Object Caching*: `Use Origin Cache Headers`
- *Forward Cookies*: `None (Improves Caching)`
- *Query String Forwarding and Caching*: `None (Improves Caching)`
- *Smooth Streaming*: `No`
- *Restrict Viewer Access*: `No`
- *Compress Objects Automatically*: `Yes`

### Distribution Settings

- *Price Class*: select what you're willing to pay for
- *AWS WAF Web ACL*: `None`
- *Alternate Domain Names (CNAMEs)*: cloudfront lets you use your own domain to point at their CDN. You can add your own CNAMEs here, if you want to use your own.
- *SSL Certificate*: if you use CNAMEs, you may need to add a custom SSL certificate. Otherwise, you can use the default Cloudfront one.
- *Supported HTTP Versions*: `HTTP/2, HTTP/1.1, HTTP/1.0`
- *Default Root Object*: (blank)
- *Logging*: you can be charged for logs
- *Enable IPv6*: checked
- *Distribution State*: `Enabled`

### Get the Cloudfront Domain Name

In the [Cloudfront interface](https://console.aws.amazon.com/cloudfront/home), there is a list of distributions. Find the one you're using for NodeBB, and copy the **Domain Name** field. The domain name should look something like this: `dfxabcd935xus.cloudfront.net`. 

## Set up the plugin

You can install the plugin via the ACP, or by running `npm install nodebb-plugin-cdn`. After doing so, activate the plugin and restart NodeBB. When NodeBB is restarted, go to the ACP and navigate to the CDN plugin settings page. On that page, there are two fields: a toggle for enabling the CDN redirection and a text field for entering the URL to the CDN.

First, set the CDN URL. If you used `HTTPS only` earlier, enter `https://[domain]`, using the domain you copied earlier in place of `[domain]`. If you didn't use `HTTPS only`, enter `http://[domain]` instead.

After doing that, enable the CDN redirection, click the save button, and restart NodeBB. When people start visiting your site, NodeBB will redirect them to the CDN for static assets.
