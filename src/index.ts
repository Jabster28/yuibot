// TODO: change name & others in package.json
// import * as toHex from 'colornames';
import * as Discord from 'discord.js';
import { data, command, logger } from './data';
// eslint-disable-next-line node/no-unpublished-import
import * as env from 'dotenv';
import appPath from 'app-root-path';

// logging

const getArguments = function (x: Discord.Message) {
  const w = x.content.split(' ');
  w.shift();
  return w;
};
env.config({ path: appPath + '/.env' });

const client = new Discord.Client();
const prefix = data.prefix;
const db = data.dbPrefix;
const commands = data.commands;
const hiddencommands = data.hiddencommands;
const token = process.env.TOKEN;

client.on('ready', () => {
  logger.info(
    'Joining the multiverse under the name: ' +
      `${client.user?.username}#${client.user?.discriminator}` || 'undef'
  );
  logger.info('Integration complete.');
});

client.on('message', msg => {
  const args = getArguments(msg);
  let v: command, k: string;
  for (k in commands) {
    v = commands[k];
    if (msg.content.split(' ')[0].toLowerCase() === prefix + k) {
      v.run(msg, args, client);
    } else if (msg.content.split(' ')[0].toLowerCase() === db + k) {
      v.run(msg, args, client)
        .then((e: any) => {
          msg.channel.send(e);
        })
        .catch(e => {
          msg.channel.send(e);
        });
    }
  }
  const results = [];
  for (k in hiddencommands) {
    if (msg.author.bot) {
      return;
    }
    v = hiddencommands[k];
    if (msg.content.split(' ')[0].toLowerCase() === k) {
      results.push(v.run(msg, args, client));
    } else {
      results.push(void 0);
    }
  }
  return results;
});
// allow for edited commands to be ran too
client.on('messageUpdate', async (_old, newmsg) => {
  // uncache new messages
  const msg = newmsg.partial ? await newmsg.fetch() : newmsg;
  const args = getArguments(msg);
  let v: command, k: string;
  for (k in commands) {
    v = commands[k];
    if (msg.content.split(' ')[0].toLowerCase() === prefix + k) {
      v.run(msg, args, client);
    } else if (msg.content.split(' ')[0].toLowerCase() === db + k) {
      v.run(msg, args, client)
        .then((e: any) => {
          msg.channel.send(e);
        })
        .catch(e => {
          msg.channel.send(e);
        });
    }
  }
  const results = [];
  for (k in hiddencommands) {
    if (msg.author.bot) {
      return;
    }
    v = hiddencommands[k];
    if (msg.content.split(' ')[0].toLowerCase() === k) {
      results.push(v.run(msg, args, client));
    } else {
      results.push(void 0);
    }
  }
  return results;
});
client.login(token);
