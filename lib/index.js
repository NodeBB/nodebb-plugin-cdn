'use strict';

const { parallel } = require('async');

const nconf = require.main.require('nconf');
const { getObject, setObject } = require.main.require('./src/database');
const cacheBuster = require.main.require('./src/meta/cacheBuster');

exports.preLoad = ({ app }, callback) => {
  const relativePath = nconf.get('relative_path');

  parallel({
    buster: cacheBuster.read,
    settings: next => getObject('plugin_cdn:settings', next),
  }, (err, { buster, settings }) => {
    if (err) {
      callback(err);
      return;
    }

    if (!settings || !settings.enabled) {
      callback();
      return;
    }

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

    callback();
  });
};

const renderAdmin = (req, res, callback) => {
  getObject('plugin_cdn:settings', (err, settings) => {
    if (err) {
      callback(err);
      return;
    }
    res.render('admin/plugins/cdn', {
      settings: settings || { enabled: false, url: '' },
    });
  });
};

exports.init = ({ router, middleware }, callback) => {
  router.get('/admin/plugins/cdn', middleware.admin.buildHeader, renderAdmin);
  router.get('/api/admin/plugins/cdn', renderAdmin);

  router.get('/api/admin/plugins/cdn/save', (req, res, next) => {
    setObject('plugin_cdn:settings', JSON.parse(req.query.settings), (err) => {
      if (err) {
        next(err);
        return;
      }

      res.sendStatus(200);
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
