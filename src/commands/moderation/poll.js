// Code from MonDisTech: 2022 - 2023

//Made by Technology Power
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
  } = require("discord.js");
  
  module.exports = {
    premiumOnly: true,
    //Naming the command and adding its description
    data: new SlashCommandBuilder()
      .setName("poll")
      .setDescription("Starts a poll")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      //options
      .addStringOption((option) =>
        option
          .setName("topic")
          .setDescription("Topic of your poll?")
          .setRequired(true)
      )
  
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("Describe your suggestion")
          .setRequired(true)
      ),
  
    //Main command and also defining interaction
  
    run: async (client, interaction) => {
      const { options } = interaction;
      //Fetching all the options
      const suggestion = options.getString("suggestion");
      const description = options.getString("description");
  
      //Builing a embed for the suggestion
      const message = new EmbedBuilder()
        .setAuthor({ name: `Suggestion by ${interaction.user.username}` })
        .setColor("Random")
  
        .setDescription(
          [
            `**Suggestion**\n${suggestion}`, // <- adding suggestion variable to get access to it
            `**Description**\n${description}`, // <- adding description variable to get access to it
          ].join("\n") // <- joining the description using \n
        );
      const messagee = await interaction.reply({
        embeds: [message],
        //Adding fetchReply so we can react to the message
        fetchReply: true,
      });
      // reacting to the message
      await messagee.react("☑️");
      await messagee.react("❌");
    },
  };