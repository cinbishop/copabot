const Discord = require("discord.js");
const Enmap = require("enmap");
const Provider = require("enmap-sqlite");
const Schedule = require("node-schedule");

const fs = require("fs");

const client = new Discord.Client();
const config = require("./auth.json");

client.schedule = Schedule;
client.discord = Discord;
client.config = config;

const functions = require("./functions.js")(client);

client.on("ready" , () => {
	console.log("Kicking off.");
;});

fs.readdir("./events/", (err, files) => {
	if (err) return console.log(err);
	files.forEach(file => {
		const event = require(`./events/${file}`);
		let eventName = file.split(".")[0];
		client.on(eventName, event.bind(null, client));
	});
});

client.commands = new Enmap();

fs.readdir("./commands/", (err,files) => {
	if (err) return console.log(err);
	files.forEach(file => {
		if(!file.endsWith(".js")) return;
		let props = require(`./commands/${file}`);
		let commandName = file.split(".")[0];
		console.log(`Attempting to load command ${commandName}`);
		client.commands.set(commandName, props);
	});
});

client.functions = functions;

client.login(config.token);