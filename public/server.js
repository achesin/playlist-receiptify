(function () {
	/**
	 * Obtains parameters from the hash of the URL
	 * @return Object
	 */

	var displayName = 'RECEIPTIFY';
	var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
	var today = new Date();

	var userProfileSource = document.getElementById('user-profile-template').innerHTML,
		userProfileTemplate = Handlebars.compile(userProfileSource),
		userProfilePlaceholder = document.getElementById('receipt');

	function getHashParams() {
		var hashParams = {};
		var e,
			r = /([^&;=]+)=?([^&;]*)/g,
			q = window.location.hash.substring(1);
		while ((e = r.exec(q))) {
			hashParams[e[1]] = decodeURIComponent(e[2]);
		}
		return hashParams;
	}

	function retrieveTracks(timeRangeSlug, domNumber, domPeriod) {
		$.ajax({
			url: `https://api.spotify.com/v1/playlists/0KIPWaDK3jePD5zZDuPG4G?market=US`,
			headers: {
				Authorization: 'Bearer ' + access_token
			},
			success: function (response) {
				var data = {
					title: response.name,
					trackList: response.tracks.items,
					total: 0,
					date: today.toLocaleDateString('en-US', dateOptions).toUpperCase(),
					json: true
				};
				data.title = data.title.toUpperCase();
				console.log(data.title);
				console.log(data.trackList);
				for (var i = 0; i < data.trackList.length; i++) {
					data.trackList[i].track.name = data.trackList[i].track.name.toUpperCase();
					console.log(data.trackList[i].track.name);
					data.total += data.trackList[i].track.duration_ms;
					let minutes = Math.floor(data.trackList[i].track.duration_ms / 60000);
					let seconds = ((data.trackList[i].track.duration_ms % 60000) / 1000).toFixed(0);
					data.trackList[i].track.duration_ms = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
					for (var j = 0; j < data.trackList[i].track.artists.length; j++) {
						data.trackList[i].track.artists[j].name = data.trackList[i].track.artists[j].name.trim();
						data.trackList[i].track.artists[j].name = data.trackList[i].track.artists[j].name.toUpperCase();
						if (j != data.trackList[i].track.artists.length - 1) {
							data.trackList[i].track.artists[j].name = data.trackList[i].track.artists[j].name + ', ';
						}
					}
					console.log(data.trackList[i].track.artists.name);
				}
				minutes = Math.floor(data.total / 60000);
				seconds = ((data.total % 60000) / 1000).toFixed(0);
				data.total = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
				console.log(data.trackList);
				userProfilePlaceholder.innerHTML = userProfileTemplate({
					title: data.title,
					tracks: data.trackList,
					total: data.total,
					time: data.date,
					num: domNumber,
					name: displayName,
					period: domPeriod
				});

				document.getElementById('download').addEventListener('click', function () {
					var offScreen = document.querySelector('.receiptContainer');

					window.scrollTo(0, 0);
					// Use clone with htm2canvas and delete clone
					html2canvas(offScreen).then((canvas) => {
						var dataURL = canvas.toDataURL();
						console.log(dataURL);
						var link = document.createElement('a');
						link.download = `${timeRangeSlug}_receiptify.png`;
						link.href = dataURL;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
						delete link;
					});
				});
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				// error handler here
				console.error("Failed to access endpoint");
			}
		});
	}


	var params = getHashParams();

	var access_token = params.access_token,
		refresh_token = params.refresh_token,
		error = params.error;

	if (error) {
		alert('There was an error during the authentication');
	} else {
		if (access_token) {
			$.ajax({
				url: 'https://api.spotify.com/v1/me',
				headers: {
					Authorization: 'Bearer ' + access_token
				},
				success: function (response) {
					displayName = response.display_name.toUpperCase();
					$('#login').hide();
					$('#loggedin').show();
				}
			});
		} else {
			// render initial screen
			$('#login').show();
			$('#loggedin').hide();
		}

		document.getElementById('short_term').addEventListener('click', retrieveTracks('short_term', 1, 'LAST MONTH'), false);
		document.getElementById('medium_term').addEventListener('click', retrieveTracks('medium_term', 2, 'LAST 6 MONTHS'), false);
		document.getElementById('long_term').addEventListener('click', retrieveTracks('long_term', 3, 'ALL TIME'), false);
	}
})();
