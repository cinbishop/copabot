module.exports = function (client) {
	var functions = {};

	functions.getFPLData = function() {
		let requestUrl = 'https://fantasy.premierleague.com/drf/bootstrap-static';

		client.https.get(requestUrl, (resp) => {
			let data = '';

			resp.on("data",(chunk) => {
				data += chunk;
			});

			resp.on("end",() => {
				try {
					data = JSON.parse(data);
					data.elements.forEach(function(player){
						client.players.set(player.id,player);
					});
					data.teams.forEach(function(team){
						client.teams.set(team.code,team);
					});
					/*! TODO: FORMAT DATA INTO ENMAP HERE **/
					console.log('FPL data loaded.');
				} catch (e) {
					console.log('FPL API Is Down!');
				}

			}).on("error",(err) => {
				console.log('Error: ' + err.message);
			});
		});
	}

	return functions;
}