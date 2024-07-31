// Code from MonDisTech: 2022 - 2023
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("locks channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Select a channel")
        .setRequired(true)
    )
    .toJSON(),
  testMode: false,
  devOnly: false,
  deleted: false,
  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageThreads,
    PermissionFlagsBits.ManageChannels,
  ],

  run: async (client, interaction) => {
    const channel = interaction.options.getChannel("channel");

    const succesEmbed = new EmbedBuilder()
      .setColor(0xd98832)
      .setTitle(":lock: Locked!")
      .setDescription(`Channel succesfully locked.`);

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
      AttachFiles: false,
    });

    await interaction.reply({
      embeds: [succesEmbed],
    });
  },
};
