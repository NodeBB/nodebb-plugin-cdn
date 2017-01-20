'use strict';

const { waterfall } = require('async');
const nconf = require('nconf');

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
      app.use(`${relativePath}/assets`, (req, res) => {
        res.redirect(`${settings.url}/${req.path}?${meta.config['cache-buster']}`);
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
