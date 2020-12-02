var Server = function () {
	/**
	 * Obtains parameters from the hash of the URL
	 * @return Object
	 */

	var displayName = 'RECEIPTIFY';
	var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
	var today = new Date();
	var receiptNum = 0;

	var userProfileSource = document.getElementById('user-profile-template').innerHTML,
		userProfileTemplate = Handlebars.compile(userProfileSource),
		userProfilePlaceholder = document.getElementById('receipt');

	var userPlaylistSource = document.getElementById('user-playlists-template').innerHTML,
		userPlaylistTemplate = Handlebars.compile(userPlaylistSource),
		userPlaylistPlaceholder = document.getElementById('dropdown');

	Handlebars.registerHelper('ifCond', function(value, options) {
		if(value < 10) {
			return options.fn(this);
		}
		return options.inverse(this);
	});

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

	function retrievePlaylists() {
		$.ajax({
			url: `https://api.spotify.com/v1/me/playlists?limit=50`,
			headers: {
				Authorization: 'Bearer ' + access_token
			},
			success: function (response) {
				var data = {
					playlistList: response.items,
					json: true
				};
				userPlaylistPlaceholder.innerHTML = userPlaylistTemplate({
					playlists: data.playlistList,
				});
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				// error handler here
				console.error("Failed to access playlist endpoint");
			}
		});
	}

	function retrieveTracks(playlistId) {
		$.ajax({
			url: `https://api.spotify.com/v1/playlists/${playlistId}?market=US`,
			// 6mB0KUI2hdFGdSqWvklpQr 'best of 2020'
			// 0KIPWaDK3jePD5zZDuPG4G 'a playlist of songs i say are the best songs ever written'
			headers: {
				Authorization: 'Bearer ' + access_token
			},
			success: function (response) {
				var itemNumber = 1;
				var data = {
					title: response.name,
					trackList: response.tracks.items,
					total: 0,
					date: today.toLocaleDateString('en-US', dateOptions).toUpperCase(),
					owner: response.owner.display_name,
					json: true
				};
				data.title = data.title.toUpperCase();
				data.owner = data.owner.toUpperCase();
				for (var i = 0; i < data.trackList.length; i++) {
					data.trackList[i].track.name = data.trackList[i].track.name.toUpperCase();
					data.trackList[i].itemNum = itemNumber;
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
					itemNumber++;
				}
				minutes = Math.floor(data.total / 60000);
				seconds = ((data.total % 60000) / 1000).toFixed(0);
				receiptNum++;
				data.total = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
				userProfilePlaceholder.innerHTML = userProfileTemplate({
					title: data.title,
					tracks: data.trackList,
					total: data.total,
					time: data.date,
					num: receiptNum,
					name: displayName,
					owner: data.owner,
				});

				document.getElementById('download').addEventListener('click', function () {
					var offScreen = document.querySelector('.receiptContainer');

					window.scrollTo(0, 0);
					// Use clone with htm2canvas and delete clone
					html2canvas(offScreen).then((canvas) => {
						var dataURL = canvas.toDataURL();
						var link = document.createElement('a');
						link.download = `${data.title}_receiptify.png`;
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

	function retrievePlaylistId(playlistName) {
		$.ajax({
			url: `https://api.spotify.com/v1/me/playlists?limit=50`,
			headers: {
				Authorization: 'Bearer ' + access_token
			},
			success: function (response) {
				var playlistId = "";
				var data = {
					playlistList: response.items,
					json: true
				};
				for(var i = 0; i < data.playlistList.length; i++) {
					if(data.playlistList[i].name == playlistName) {
						playlistId = data.playlistList[i].id;
					}
				}
				retrieveTracks(playlistId);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				// error handler here
				console.error("Failed to access playlist endpoint");
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
					retrievePlaylists();
					$('#loggedin').show();
				}
			});
		} else {
			// render initial screen
			$('#login').show();
			$('#loggedin').hide();
		}

		document.getElementById("submit").addEventListener("click", function(){ retrievePlaylistId(document.getElementById("selection").elements[0].value); });
	}
}();
