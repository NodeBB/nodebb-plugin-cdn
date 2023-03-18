'use strict';

const nconf = require.main.require('nconf');
const { getObject, setObject } = require.main.require('./src/database');
const cacheBuster = require.main.require('./src/meta/cacheBuster');
const meta = require.main.require('./src/meta');

exports.preLoad = async ({ app }) => {
	const relativePath = nconf.get('relative_path');
	const busted = /^\/[a-z0-9]{11}/;
	const [buster, settings] = await Promise.all([
		cacheBuster.read(),
		getObject('plugin_cdn:settings'),
	]);

	if (!settings || !settings.enabled) {
		return;
	}
	// redirect to CDN with busted path
	// if already busted, rewrite the url so
	// express.static serves the right files to the CDN
	app.use(`${relativePath}/assets`, (req, res, next) => {
		if (req.method === 'OPTIONS') {
			res.sendStatus(200);
			return;
		}

		if (busted.test(req.url)) {
			req.url = req.url.slice(12);
			next();
			return;
		}
		if (req.url.startsWith('/uploads/files') &&
				parseInt(meta.config.privateUploads, 10) === 1) {
			next();
			return;
		}
		res.redirect(`${settings.url}/assets/${buster}${req.path}`);
	});

	app.use(`${relativePath}/plugins`, (req, res, next) => {
		if (req.method === 'OPTIONS') {
			res.sendStatus(200);
			return;
		}

		if (busted.test(req.url)) {
			req.url = req.url.slice(12);
			next();
			return;
		}
		res.redirect(`${settings.url}/plugins/${buster}${req.path}`);
	});
};

const renderAdmin = async (req, res) => {
	const settings = await getObject('plugin_cdn:settings');
	res.render('admin/plugins/cdn', {
		settings: settings || { enabled: false, url: '' },
	});
};

exports.init = async ({ router, middleware }) => {
	router.get('/admin/plugins/cdn', middleware.admin.buildHeader, renderAdmin);
	router.get('/api/admin/plugins/cdn', renderAdmin);

	router.get('/api/admin/plugins/cdn/save', async (req, res) => {
		await setObject('plugin_cdn:settings', JSON.parse(req.query.settings));
		res.sendStatus(200);
	});
};

exports.addAdminNavigation = (header) => {
	header.plugins.push({
		route: '/plugins/cdn',
		icon: 'fa-tachometer',
		name: 'CDN',
	});
	return header;
};
