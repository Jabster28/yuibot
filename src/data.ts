import Discord from 'discord.js';
import toHex from 'colornames';
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
    new transports.File({ filename: 'runtime-errors.log', level: 'error' }),
    new transports.File({ filename: 'runtime.log' }),
  ],
});

logger.add(
  new transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  })
);

export type command = {
  run: (
    msg: Discord.Message,
    args: string[],
    client: Discord.Client
  ) => Promise<unknown>;
  desc?: string;
  args?: string;
};
process.stdin.resume();
const onexit: Record<string, () => Promise<void>> = {};
async function asyncForEach(
  array: unknown[],
  callback: (item: any, index: number, array: unknown[]) => Promise<void>
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
function exitHandler(_options: unknown, exitCode: number) {
  if (exitCode === 0) {
    return;
  }
  console.log('\n');
  logger.warn('Exit requested, doing cleanup.');
  asyncForEach(Object.keys(onexit), async (e, i, a) => {
    await onexit[e]();
    logger.info(Object.keys(a).length - 1 - i + ' cleanup operations left.');
  }).then(() => {
    logger.info('Done.');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  });
}

process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

// {[key: string]: command}
const maxlist = 10;
const prefix = '-';
const dbPrefix = ';';
const myID = 'myIDHere'; // TODO: replace with your Snowflake
const muteRole = 'mutedRoleIDHere'; // TODO: replace with Snowflake of mute role
const adminRole = 'mutedRoleIDHere'; // TODO: replace with Snowflake of admin role
const spamInts: NodeJS.Timeout[] = [];
const afkInts: Record<string, NodeJS.Timeout> = {};
const allInts: NodeJS.Timeout[] = [];
const afkKids: Record<string, string> = {};
const eventify = function (arr: unknown[], callback: () => void) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  arr.push = function (e) {
    Array.prototype.push.call(arr, e);
    callback();
  };
};
eventify(allInts, () => {
  logger.info('New listener, now at ' + allInts.length);
  if (allInts.length > maxlist) {
    logger.warn(`Hit ${maxlist} concurrent listeners, clearing the first one`);
    clearInterval(allInts.shift()!);
  }
});
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
    stopSpam: {
      desc: "Stops the spam. You're welcome",
      run: async function (msg) {
        spamInts.forEach(e => clearInterval(e));
        return msg.react('✅');
      },
    },
    autoAfk: {
      desc:
        'Automatically moves deafened users in the server to the AFK channel.',
      args: '[disable]',
      run: async function (msg, args, client) {
        if (args.length === 0) {
          afkInts[msg?.guild?.id || 'undef'] = setInterval(() => {
            msg.guild?.channels.cache.forEach(e => {
              if (e.type === 'voice' && e.id !== e.guild.afkChannelID) {
                e.members.forEach(f => {
                  if (f.voice.deaf) {
                    afkKids[f.id] = f.voice.channelID || '';
                    f.voice.setChannel(e.guild.afkChannelID);
                  }
                });
              } else if (e.type === 'voice') {
                e.members.forEach(f => {
                  if (!f.voice.deaf && afkKids[f.id]) {
                    f.voice.setChannel(afkKids[f.id]);
                    delete afkKids[f.id];
                  }
                });
              }
            });
          }, 1200);
          const embed = new Discord.MessageEmbed();
          embed.setColor(toHex('lime')!);
          embed.setTitle('Enabled');
          embed.setDescription(
            'Enabled Auto AFK. Use the reactions to disable.  '
          );
          embed.setFooter('Bot made by Jabster28#6048');
          const sentMsg = await msg.channel.send(embed);
          sentMsg.react('🛑');
          onexit[sentMsg.id] = async () => {
            const embed = new Discord.MessageEmbed();
            embed.setColor(toHex('mistyrose')!);
            embed.setTitle('R.I.P');
            embed.setDescription(
              "Bot has shut down. Please retry the command once it's online."
            );
            embed.setFooter('Bot made by Jabster28#6048');
            await sentMsg.reactions.removeAll();
            await sentMsg.edit(embed);
            logger.info('Cleared up ' + sentMsg.id);
          };
          const int = setInterval(async () => {
            const w = (await sentMsg.fetch()).reactions;
            w.cache.forEach(async e => {
              if (!(await e.users.fetch()).find(e => e.id !== client?.user?.id))
                return;
              if (e.emoji.name === '🛑') {
                await w.removeAll();
                clearInterval(afkInts[msg?.guild?.id || 'undef']);
                delete afkInts[msg?.guild?.id || 'undef'];
                const embed = new Discord.MessageEmbed();
                embed.setColor(toHex('salmon')!);
                embed.setTitle('Disabled');
                embed.setDescription(
                  'Disabled Auto AFK. Use the reactions to enable.  '
                );
                embed.setFooter('Bot made by Jabster28#6048');
                await sentMsg.edit(embed);
                await sentMsg.react('▶️');
              } else if (e.emoji.name === '▶️') {
                await w.removeAll();
                afkInts[msg?.guild?.id || 'undef'] = setInterval(() => {
                  msg.guild?.channels.cache.forEach(e => {
                    if (e.type === 'voice' && e.id !== e.guild.afkChannelID) {
                      e.members.forEach(f => {
                        if (f.voice.deaf) {
                          f.voice.setChannel(e.guild.afkChannelID);
                        }
                      });
                    }
                  });
                }, 1200);
                allInts.push(afkInts[msg?.guild?.id || 'undef']);
                const embed = new Discord.MessageEmbed();
                embed.setColor(toHex('lime')!);
                embed.setTitle('Enabled');
                embed.setDescription(
                  'Enabled Auto AFK. Use the reactions to disable.  '
                );
                embed.setFooter('Bot made by Jabster28#6048');
                await sentMsg.edit(embed);
                await sentMsg.react('🛑');
              }
            });
          }, 1200);
          allInts.push(int);
          setTimeout(() => {
            clearInterval(int);
            const embed = new Discord.MessageEmbed();
            embed.setColor(toHex('gray')!);
            embed.setTitle('N/A');
            embed.setDescription(
              'AutoAFK reactions expired. Please run AutoAFK again to re-enable reactions'
            );
            embed.setFooter('Bot made by Jabster28#6048');
            sentMsg.edit(embed);
            delete onexit[sentMsg.id];
          }, 300000);
        } else {
          clearInterval(afkInts[msg?.guild?.id || 'undef']);
          delete afkInts[msg?.guild?.id || 'undef'];
        }
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
          }, 1000);
          spamInts.push(x);
          return x;
        });
      },
    },
    // TODO: fix this
    // upload: {
    //   desc: 'Uploads a meme to https://teeheehee.club',
    //   args: '(tags e.g funny,oreo,blood) [link to file]',
    //   run: function (msg, args) {
    //     return new Promise((s, j) => {
    //       //
    //       const attachment = args[1] || msg.attachments.array()[0].proxyURL;
    //       console.log(attachment);
    //       request.get(attachment, (e, r, b) => {
    //         //
    //         if (!e && r.statusCode === 200) {
    //           const file = new FormData();
    //           file.append('upload_file', b);
    //           axios
    //             .post('https://teeheehee.club/upload.php', file, {
    //               headers: {
    //                 ...file.getHeaders(),
    //               },
    //             })
    //             .then(e => {
    //               msg.channel.send('Uploaded!');
    //               s(JSON.stringify(e));
    //             })
    //             .catch(e => {
    //               msg.channel.send("Uh oh! There's an error:");
    //               console.log(e);
    //               j(JSON.stringify(e));
    //             });
    //         }
    //       });
    //     });
    //   },
    // },
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
              if (e.id.trim() !== '') usr = e;
            })
            .catch(() => {
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
            .catch(() => {
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
