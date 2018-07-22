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
					/*! MAKE PLAYER ENMAP **/
					data.elements.forEach(function(player,i){
						/*! SET TEAM TO TEAM NAME **/
						data.teams.forEach(function(team){
							if(player.team == team.id) {
								player.team = team.short_name.toLowerCase();
							}
						});
						/*! SET ELEMENT TYPE TO POSITION NAME **/
						data.element_types.forEach(function(position){
							if(player.element_type == position.id) {
								player.element_type = position.singular_name_short.toLowerCase();
							}
						});
						client.players.set(player.id.toString(),player);
					});
					/*! MAKE TEAM ENMAP **/
					data.teams.forEach(function(team){
						team.name = team.name.toLowerCase();
						team.short_name = team.short_name.toLowerCase();
						client.teams.set(team.short_name.toLowerCase(),team);
					});
					/*! MAKE FIXTURES ENMAP **/
					data.next_event_fixtures.forEach(function(fixture,i){
						client.fixtures.set(i,fixture);
					});
					/*! MAKE GAMEWEEKS ENMAP **/
					let preseason = data['current-event'] == null ? true : false;

					client.gameweeks.set('nextgw',data.events[data['next-event']-1]);
					preseason ?	client.gameweeks.set('currentgw',data.events[0]) : client.gameweeks.set('currentgw',data.events[data['current-event']-1]);

					/*! SET NEXT UPDATE TIME **/
					let nextGW = client.gameweeks.get('nextgw');
					let nextWarnDate = new Date((nextGW.deadline_time_epoch*1000)-3600000);
					client.gameweeks.set('nextupdate',nextWarnDate);
					/*! CHECK FOR WARNINGS **/
					let psWarningScheduled = client.gameweeks.get('pswarning');
					let warningScheduled = client.gameweeks.get('warning');
					/*! TRIGGER CHRON TO UPDATE WARNING **/
					if(preseason && psWarningScheduled == 0) {
						client.gameweeks.set('pswarning',1);
						const warning = client.schedule.scheduleJob(client.gameweeks.get('nextupdate'), function(){
							client.guilds.array().forEach(function(guild){
								let defaultChan = guild.channels.find(c=>c.permissionsFor(guild.me).has('SEND_MESSAGES'));
								defaultChan.send('@FEPL **'+nextGW.name+'** locks in 1 hour!');
							});
						});
					} else if(!preseason && warningScheduled == 0) {
						client.gameweeks.set('warning',1);
						const warning = client.schedule.scheduleJob(client.gameweeks.get('nextupdate'), function(){
							client.gameweeks.set('warning',0);
							client.guilds.array().forEach(function(guild){
								let defaultChan = guild.channels.find(c=>c.permissionsFor(guild.me).has('SEND_MESSAGES'));
								defaultChan.send('@FEPL **'+nextGW.name+'** locks in 1 hour!');
							});
						});
					}
					console.log('FPL data updated.');
				} catch (e) {
					console.log('FPL API Is Down!');
				}

			}).on("error",(err) => {
				console.log('Error: ' + err.message);
			});
		});
	},

	/*! TODO: REVISIT THIS AFTER FIRST GW AND YOU CAN SEE HOW THE DATA IS STRUCTURED **/
	functions.getLeagueData = function() {
		let requestUrl = 'https://fantasy.premierleague.com/drf/leagues-classic-standings/114228';

		client.https.get(requestUrl, (resp) => {
			let data = '';

			resp.on("data",(chunk) => {
				data += chunk;
			});

			resp.on("end",() => {
				try {
					console.log('League data updated.');
				} catch (e) {
					console.log('League API Is Down!');
				}

			}).on("error",(err) => {
				console.log('Error: ' + err.message);
			});
		});
	},

	functions.formatTeamName = function(team) {
		const regex = /\b[a-zA-Z]/g;
		return team.replace(regex, function(x){return x.toUpperCase();});
	},

	functions.formatPrice = function(price) {
		let len = price.length;
		return price.substring(0, len-1) + '.' + price.substring(len-1);
	}

	functions.formatTeams = function() {
		const teamsArr = client.teams.array();
		let botresponse = '**TEAMS**\n';
		teamsArr.forEach(function(team){
			botresponse += client.functions.formatTeamName(team.name) +' - '+team.short_name.toUpperCase()+'\n';
		});
		return botresponse;
	},

	functions.formatGWSchedule = function() {
		let teamsMap = new Map();
		let nextGW = client.gameweeks.get('nextgw');
		let botresponse = '**'+nextGW.name+'**\n';
		client.teams.array().forEach(function(team){
			teamsMap.set(team.id, team.short_name);
		});
		client.fixtures.array().forEach(function(fixture){
			var home = teamsMap.get(fixture.team_h).toUpperCase();
			var away = teamsMap.get(fixture.team_a).toUpperCase();
			botresponse += home + ' v ' +away +'\n';
		});
		return botresponse;
	},

	functions.getTeam = function(team) {
		const reqTeam = client.teams.get(team);
		let botresponse = '**'+client.functions.formatTeamName(reqTeam.name)+' - '+ reqTeam.short_name.toUpperCase() +'**\n\n';
		let goalies = '**GKP**\n'; 
		let defenders = '**DEF**\n';
		let midfielders = '**MID**\n';
		let forwards = '**FWD**\n';

		const teamPlayers = client.players.findAll('team',team);
		teamPlayers.forEach(function(player){
			let formattedPlayer = player.web_name + ' - £' + client.functions.formatPrice(player.now_cost.toString()) + '\n';
			if(player.element_type == 'gkp') goalies += formattedPlayer;
			if(player.element_type == 'def') defenders += formattedPlayer;
			if(player.element_type == 'mid') midfielders += formattedPlayer;
			if(player.element_type == 'fwd') forwards += formattedPlayer;
		});

		botresponse += goalies + '\n' + defenders + '\n' + midfielders + '\n' + forwards;
		return botresponse;
	}

	return functions;
}