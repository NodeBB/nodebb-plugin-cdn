define('admin/plugins/cdn', ['alerts'], function (alerts) {
	const CDN = {};

	CDN.init = function () {
		$('#save').click(function () {
			const settings = {
				url: $('#url').val(),
				enabled: $('#enabled').prop('checked'),
			};

			$.ajax({
				url: '/api/admin/plugins/cdn/save',
				method: 'POST',
				data: JSON.stringify(settings),
				contentType: 'application/json',
				headers: {
					'x-csrf-token': config.csrf_token,
				},
				success: function () {
					alerts.success();
				},
			});
		});
	};

	return CDN;
});
