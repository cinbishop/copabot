exports.run = (client, message, args) => {

	let arg = args[0]

	/*! GET/SET ID **/
	if(arg == "id") {
		let key = message.author.id;
		let teamID = args[1] ? parseInt(args[1]) : null;

		if(isNaN(teamID)) {
			message.channel.send(`I don't recognize that ID!`);
			return;
		} 

		if(teamID) {
			if(!client.members.has(key)) {
				client.functions.getMemberData(message, teamID);
				message.channel.send(`Your team ID has been set! Type !my team for team info!`);
				return;
			} else {
				message.channel.send(`Your team ID has already been set! Type !my team for team info!`);
				return;
			}
		}
	}

	if(arg == "team") {
		let key = message.author.id;

		if(!client.members.has(key)) {
			message.channel.send('Please specify a team ID by typing !me id [teamID]');
		} else {
			console.log(client.members.get(key));
		}
	}

}