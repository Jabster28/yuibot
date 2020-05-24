// TODO: change name & others in package.json
import * as toHex from "colornames"
import * as Discord from "discord.js"
import { data } from "./data"
import * as env from "dotenv"
const getArguments = function (x: Discord.Message) {
  x.content.split(" ").shift()
};
env.config()

let client = new Discord.Client();
const prefix = data.prefix;
const commands = data.commands;
const hiddencommands = data.hiddencommands;
const token = process.env.TOKEN;

client.on('ready', function () {
  console.log("Hacking the mainframe with an identity of:");
  console.log(client.user.username);
  console.log("I'm in");
});

client.on("message", function (msg) {
  const args = getArguments(msg);
  let v: any, k: string
  for (k in commands) {
    // @ts-ignore
    v = commands[k];
    if (msg.content.split(" ")[0].toLowerCase() === prefix + k) {
      v.run(msg, args, client);
    }
  }
  let results = [];
  for (k in hiddencommands) {
    // @ts-ignore
    v = hiddencommands[k];
    if (msg.content.split(" ")[0].toLowerCase() === k) {
      results.push(v.run(msg, args, client));
    } else {
      results.push(void 0);
    }
  }
  return results;
});

client.login(token);
