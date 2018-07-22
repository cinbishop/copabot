exports.run = (client, message, args) => {

	let botresponse = '';
	botresponse += '**!team [team short name|team web name]**\n';
	botresponse += 'Returns a list of team short names and team web names for reference. Optional team arguement returns specific team information.\n';
	botresponse += '*example: !team*\n';
	botresponse += '*example: !team EVE*\n';
	botresponse += '*example: !team Everton*\n\n';
	botresponse += '**!next [fixtures]**\n';
	botresponse += 'Returns the start time for the next gameweek. Optional fixtures arguement returns list of fixtures for next gameweek.\n';
	botresponse += '*example: !next*\n';
	botresponse += '*example: !next fixtures*\n\n';

	message.channel.send('DM Sent!');
	message.author.send(botresponse);

}