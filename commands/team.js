exports.run = (client, message, args) => {

	let arg = args.join(" ").toLowerCase();

	/*! FULL LIST OF TEAMS AND ABBREVS **/
	if(arg == "list") {
		message.channel.send(client.functions.formatTeams());
	}

	/*! GET SPECIFIC TEAM - BY SHORT NAME **/
	if(client.teams.findAll('short_name',arg).length > 0) {
		message.channel.send(client.functions.getTeam(arg));
	}
	
	/*! GET SPECIFIC TEAM - BY NAME **/
	if(client.teams.findAll('name',arg).length > 0) {
		let reqTeam = client.teams.findAll('name',arg);
		/*! CONVERT TO SHORT NAME **/
		arg = reqTeam[0].short_name;
		message.channel.send(client.functions.getTeam(arg));
	}
}