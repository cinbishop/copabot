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
					/*! MAKE GAMEWEEKS ENMAP **/
					client.gameweeks.set('nextgw',data.events[data['next-event']-1]);
					data['current-event'] == null ?	client.gameweeks.set('currentgw',data.events[0]) : client.gameweeks.set('currentgw',data.events[data['current-event']-1]);
					let nextGW = client.gameweeks.get('nextgw');
					let date = new Date((nextGW.deadline_time_epoch*1000)-3600000);
					client.gameweeks.set('nextupdate',date);
					/*! TRIGGER CHRONS TO UPDATE DATA **/
					client.functions.startChrons();
					console.log('FPL data updated.');
				} catch (e) {
					console.log('FPL API Is Down!');
				}

			}).on("error",(err) => {
				console.log('Error: ' + err.message);
			});
		});
	},

	functions.startChrons = function() {

		const chron = client.schedule.scheduleJob(client.gameweeks.get('nextupdate'), function(){
			client.guilds.array().forEach(function(guild,i){
				let nextGW = client.gameweeks.get('nextgw');
				let defaultChan = guild.channels.find(c=>c.permissionsFor(guild.me).has('SEND_MESSAGES'));
				defaultChan.send('**'+nextGW.name+'** locks in 1 hour!');
			});
		});

		const update = client.schedule.scheduleJob('0 0 * * *', function(){
			client.functions.getFPLData();
			chron.reschedule(client.gameweeks.get('nextupdate'));
		});
	},

	functions.updateGameweek = function() {
		const chron = client.schedule.scheduleJob('0 ')
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

	functions.getTeam = function(team) {
		const reqTeam = client.teams.get(team);
		let botresponse = '**'+client.functions.formatTeamName(reqTeam.name)+' - '+ reqTeam.short_name.toUpperCase() +'**\n\n';
		let goalies = '**GKP**\n'; 
		let defenders = '**DEF**\n';
		let midfielders = '**MID**\n';
		let forwards = '**FWD**\n';

		const teamPlayers = client.players.findAll('team',team);
		console.log(client.players);
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