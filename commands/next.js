exports.run = (client, message, args) => {
	if(args.length == 0) {
		const nextGW = client.gameweeks.get('nextgw');
		const nextGWDate = new Date((nextGW.deadline_time_epoch*1000));
		const nextGWDateJP = new Date((nextGW.deadline_time_epoch*1000)+ 46800000);

		const botresponse = nextGW.name +' starts: **'+nextGWDate.toLocaleString()+'** EST (**'+nextGWDateJP.toLocaleString()+'** JST)';
		message.channel.send(botresponse);
	}

	let arg = args.join(" ").toLowerCase();
	
	if(arg == 'fixtures') {
		const botresponse = client.functions.formatGWSchedule();
		message.channel.send(botresponse);
	}
}