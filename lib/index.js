'use strict';

const { waterfall } = require('async');
// const { parse } = require('url');

const nconf = require.main.require('nconf');
const meta = require.main.require('./src/meta');
const { getObject, setObject } = require.main.require('./src/database');

exports.preLoad = ({ app }, callback) => {
  const relativePath = nconf.get('relative_path');
  getObject('plugin_cdn:settings', (err, settings) => {
    if (err) {
      callback(err);
      return;
    }

    if (settings && settings.enabled) {
      const buster = Date.now();

      // redirect to CDN with busted path
      // if already busted, rewrite the url so
      // express.static serves the right files to the CDN
      app.use(`${relativePath}/assets`, (req, res, next) => {
        if (req.url.startsWith(`/${buster}`)) {
          req.url = req.url.replace(`/${buster}`, '');
          next();
          return;
        }
        res.redirect(`${settings.url}/assets/${buster}${req.path}`);
      });
      app.use(`${relativePath}/plugins`, (req, res, next) => {
        if (req.url.startsWith(`/${buster}`)) {
          req.url = req.url.replace(`/${buster}`, '');
          next();
          return;
        }
        res.redirect(`${settings.url}/plugins/${buster}${req.path}`);
      });
    }

    callback();
  });
};

const renderAdmin = (req, res, callback) => {
  waterfall([
    next => getObject('plugin_cdn:settings', next),
    (settings, next) => {
      res.render('admin/plugins/cdn', {
        settings: settings || { enabled: false, url: '' },
      });
      next();
    },
  ], (err) => {
    if (err) {
      callback(err);
    }
  });
};

exports.init = ({ router, middleware }, callback) => {
  router.get('/admin/plugins/cdn', middleware.admin.buildHeader, renderAdmin);
  router.get('/api/admin/plugins/cdn', renderAdmin);

  router.get('/api/admin/plugins/cdn/save', (req, res, cb) => {
    waterfall([
      next => setObject('plugin_cdn:settings', JSON.parse(req.query.settings), next),
      (next) => {
        res.sendStatus(200);
        next();
      },
    ], (err) => {
      if (err) {
        cb(err);
      }
    });
  });

  callback();
};

exports.addAdminNavigation = (header, callback) => {
  header.plugins.push({
    route: '/plugins/cdn',
    icon: 'fa-tachometer',
    name: 'CDN',
  });
  callback(null, header);
};
