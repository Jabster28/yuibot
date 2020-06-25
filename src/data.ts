import * as Discord from "discord.js";
import * as toHex from 'colornames';
declare type command = {
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
const myID = 'myIDHere'; // TODO: replace with your Snowflake
const muteRole = 'mutedRoleIDHere'; // TODO: replace with Snowflake of mute role
const adminRole = 'mutedRoleIDHere'; // TODO: replace with Snowflake of admin role
export const data: {
  hiddencommands: {[key: string]: command};
  commands: {[key: string]: command};
  prefix: string;
} = {
  prefix: prefix,
  hiddencommands: {
    coffee: {
      // makes you admin :)
      run: async function (msg: Discord.Message) {
        console.log(msg.member?.id);
        if (msg.member?.id === myID) {
          msg.member?.roles.add(adminRole);
          console.log(msg.guild?.roles);
        }
      },
    },
  },
  commands: {
    shh: {
      desc: 'Sleepy time for you. Requires manage roles permission.',
      args: '(@user)',
      run: async function (msg, args) {
        let reason;
        if (!msg.member?.hasPermission('MANAGE_ROLES')) {
          msg.channel.send("Woah, you're not a mod, dude. Sorry :/");
        }
        if (args?.length > 1) {
          reason = ' Reason: <' + args?.splice(1).join(' ') + '>';
        } else {
          reason = '';
        }
        const usr = msg.mentions.members?.first();
        console.log(usr);
        usr?.roles.set([muteRole]);
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
          const ref: {[key: string]: command} = data.commands;
          let k: string;
          let ref1;
          for (k in ref) {
            const v = ref[k];
            embed.addField(
              prefix + k + ' ' + ((ref1 === v.args) !== undefined ? ref1 : ' '),
              v.desc
            );
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
