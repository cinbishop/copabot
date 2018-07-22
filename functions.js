module.exports = function (client) {
	var functions = {};

	functions.warningChron = function(reset) {
		const warning = client.schedule.scheduleJob(client.gameweeks.get('nextupdate'), function(){
			client.guilds.array().forEach(function(guild){
				if(reset) client.gameweeks.set('warning',0);
				let defaultChan = guild.channels.find(c=>c.permissionsFor(guild.me).has('SEND_MESSAGES'));
				defaultChan.send('@FEPL **'+nextGW.name+'** locks in 1 hour!');
			});
		});
	},

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
						client.players.set(player.id.toString(),player);
					});
					/*! MAKE TEAM ENMAP **/
					data.teams.forEach(function(team){
						team.name = team.name.toLowerCase();
						team.short_name = team.short_name.toLowerCase();
						client.teams.set(team.short_name,team);
					});
					/*! MAKE FIXTURES ENMAP **/
					data.next_event_fixtures.forEach(function(fixture,i){
						client.fixtures.set(i,fixture);
					});
					/*! MAKE TEAM AND POSITION MAPS **/
					var teamsMapID = new Map();
					var posMapID = new Map();
					var teamsMapName = new Map();
					var posMapName = new Map();

					client.teamsMapID = teamsMapID;
					client.posMapID = posMapID;
					client.teamsMapName = teamsMapName;
					client.posMapName = posMapName;

					client.teams.array().forEach(function(team){
						client.teamsMapID.set(team.id, team.short_name);
						client.teamsMapName.set(team.short_name,team.id);
					});

					data.element_types.forEach(function(pos){
						client.posMapID.set(pos.id, pos.singular_name_short.toLowerCase());
						client.posMapName.set(pos.singular_name_short.toLowerCase(),pos.id);
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
						client.functions.warningChron(false);
					} else if(!preseason && warningScheduled == 0) {
						client.gameweeks.set('warning',1);
						client.functions.warningChron(true);
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
		let nextGW = client.gameweeks.get('nextgw');
		let botresponse = '**'+nextGW.name+'**\n';
		let dayArr = [];
		client.fixtures.array().forEach(function(fixture){
			var home = client.teamsMapID.get(fixture.team_h).toUpperCase();
			var away = client.teamsMapID.get(fixture.team_a).toUpperCase();
			if(dayArr[fixture.event_day]) {
				dayArr[fixture.event_day] += home + ' v ' +away +'\n';
			} else {
				let dayName = fixture.kickoff_time_formatted.slice(0,-6);
				dayArr[fixture.event_day] = '*'+dayName+'*\n';
				dayArr[fixture.event_day] += home + ' v ' +away +'\n';
			}
			console.log(dayArr);
		});

		botresponse += dayArr.join('\n');
		return botresponse;
	},

	functions.getTeam = function(team) {
		const reqTeam = client.teams.get(team);
		const teamID = client.teamsMapName.get(team);
		let botresponse = '**'+client.functions.formatTeamName(reqTeam.name)+' - '+ reqTeam.short_name.toUpperCase() +'**\n\n';
		let goalies = '**GKP**\n'; 
		let defenders = '**DEF**\n';
		let midfielders = '**MID**\n';
		let forwards = '**FWD**\n';

		const teamPlayers = client.players.findAll('team',teamID);
		teamPlayers.forEach(function(player){
			let formattedPlayer = player.web_name + ' - £' + client.functions.formatPrice(player.now_cost.toString()) + '\n';
			let playerPos = client.posMapID.get(player.element_type);
			if(playerPos == 'gkp') goalies += formattedPlayer;
			if(playerPos == 'def') defenders += formattedPlayer;
			if(playerPos == 'mid') midfielders += formattedPlayer;
			if(playerPos == 'fwd') forwards += formattedPlayer;
		});

		botresponse += goalies + '\n' + defenders + '\n' + midfielders + '\n' + forwards;
		return botresponse;
	}

	return functions;
}