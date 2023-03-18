define('admin/plugins/cdn', ['alerts'], function (alerts) {
	$('#save').click(function () {
		const settings = {
			url: $('#url').val(),
			enabled: $('#enabled').prop('checked'),
		};

		$.get('/api/admin/plugins/cdn/save', {
			settings: JSON.stringify(settings),
		}, function () {
			alerts.success();
		});
	});
});
