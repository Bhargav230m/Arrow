const {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  ComponentType,
  ModalBuilder,
  TextInputStyle,
  TextInputBuilder,
  InteractionCollector,
  InteractionType,
  StringSelectMenuBuilder,
  AttachmentBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const user_backup = require("../../schemas/backup/backup.js");
const random = require("../../functions/generateRandomId.js");
const editReply = require("../../functions/editReply.js");
const config = require("../../emoji.json");
const humanize = require("../../functions/humanize.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server-backup")
    .setDescription("Create a backup of your whole server.")
    .toJSON(),
  testMode: false,
  devOnly: false,
  deleted: false,
  userPermissions: [],
  botPermissions: [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageThreads,
  ],

  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const createBackupButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_backup_button")
        .setLabel("Create Backup")
        .setStyle(ButtonStyle.Primary)
        .setEmoji(config.messageConfig.globalEmojis.security)
    );

    let waitingEmbed = new EmbedBuilder()
      .setAuthor({
        iconURL: interaction.guild.iconURL({ dynamic: true }),
        name: "Backup System",
      })
      .setDescription("We are fetching your backup data, Please wait...")
      .setColor("Yellow");

    await interaction.editReply({ embeds: [waitingEmbed] });
    const data = await user_backup.findOne({ User: interaction.user.id });
    let msg = null;
    let selectMenu = null;

    if (!data || data.BackupData.length === 0) {
      waitingEmbed.data.description =
        "You haven't created a server backup yet!";
      msg = await interaction.editReply({
        embeds: [waitingEmbed],
        components: [createBackupButton],
      });
    } else {
      selectMenu = new StringSelectMenuBuilder({
        max_values: 1,
        min_values: 1,
        custom_id: "backup_select_menu",
      }).addOptions(data.BackupData);

      waitingEmbed.data.description = `We have found a total of ${data.BackupData.length} backup(s)`;
      msg = await interaction.editReply({
        embeds: [waitingEmbed],
        components: [
          new ActionRowBuilder().addComponents(selectMenu),
          createBackupButton,
        ],
      });

      await handleSelectMenu(
        msg,
        interaction,
        client,
        createBackupButton,
        selectMenu
      );
    }

    await handleBackupButton(
      msg,
      interaction,
      client,
      createBackupButton,
      selectMenu,
      waitingEmbed
    );
  },
};

/**
 *
 * @param {Message} msg
 * @param {CommandInteraction} i
 * @param {Client} client
 * @param {ActionRowBuilder} button
 * @param {ActionRowBuilder} selectMenu
 */
async function handleSelectMenu(msg, i, client) {
  const filter = (ian) => i.user.id === ian.user.id; //ian = interaction
  const collector = msg.createMessageComponentCollector({
    filter,
    componentType: ComponentType.StringSelect,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "backup_select_menu") {
      await interaction.deferReply({ ephemeral: true });

      const userData = await user_backup.findOne({ User: i.user.id });
      const index = findIndexOfBackup(interaction, userData);
      const templateToUse = userData.BackupTemplate[index];

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("backup1")
          .setLabel("Use Backup")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("backup2")
          .setLabel("Export Server Data")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("backup3")
          .setLabel("Sync Backup")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("backup4")
          .setLabel("Delete Backup")
          .setStyle(ButtonStyle.Danger)
      );

      const message = await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              iconURL: client.user.displayAvatarURL({ dynamic: true }),
              name: `Backup System`,
            })
            .setTitle("Action Required")
            .setDescription("Please select an action")
            .setTimestamp()
            .setColor("Random")
            .setFooter({ text: "Made with ❤️ by Arrowment developers" }),
        ],
        components: [buttons],
      });

      //Creating another collector for the buttons
      const collector2 = await message.createMessageComponentCollector({
        ComponentType: ComponentType.Button,
      });

      collector2.on("collect", async (int) => {
        await int.deferReply({ ephemeral: true });
        switch (int.customId) {
          case "backup1":
            interaction.editReply({ components: [buttons] });

            await editReply(
              int,
              config.messageConfig.globalEmojis.loading,
              "Using Backup",
              true
            );

            const backupSuccess = await createBackup(templateToUse, int);
            let backMessage = "";
            if (backupSuccess) {
              backMessage = "Successfully used the server backup";
            } else {
              backMessage = "An error occurred while using the server backup";
            }
            await editReply(
              int,
              config.messageConfig.globalEmojis.security,
              backMessage,
              true
            );
            break;
          case "backup4":
            interaction.editReply({
              components: [],
              embeds: [],
              content: "Selected backup was deleted successfully",
            });
            i.editReply({
              components: [],
              embeds: [],
              content: "This Backup panel has been taken down",
            });

            await editReply(
              int,
              config.messageConfig.globalEmojis.loading,
              "Deleting backup..",
              true
            );
            userData.BackupData.splice(index, 1);
            userData.BackupTemplate.splice(index, 1);
            userData.save();

            await editReply(
              int,
              config.messageConfig.globalEmojis.tick,
              "Successfully deleted the backup.",
              true
            );
            break;
          case "backup3":
            await editReply(
              int,
              config.messageConfig.globalEmojis.loading,
              "Syncing backup..",
              true
            );

            //Get the template
            const template = await getServerData(
              int,
              true,
              "Backup",
              `Backup generated ${humanize(Date.now())}`
            );

            //Update and save the data to the database
            userData.BackupTemplate[index] = template;
            userData.save();

            await editReply(
              int,
              config.messageConfig.globalEmojis.tick,
              "Successfully synced backup to the latest data in this guild.",
              true
            );
            break;
          case "backup2":
            buttons.components[1].setDisabled(true);
            await interaction.editReply({ components: [buttons] }); //Disable the export server data button, so users can't abuse it

            await editReply(
              int,
              config.messageConfig.globalEmojis.loading,
              "Exporting...",
              true
            );
            const string = JSON.stringify(templateToUse);
            const stringBuffer = new Buffer.from(string, "utf-8");
            const jsonAttachment = new AttachmentBuilder(stringBuffer, {
              name: random(10) + ".json",
            });

            await int.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Exported Server Data")
                  .setDescription("Successfully exported server data to `JSON`")
                  .setFooter({
                    text: "If any error occurs then it's probably because your server data is too big!",
                  })
                  .setColor("Random")
                  .setTimestamp(),
              ],
              files: [jsonAttachment],
            });
            break;
        }
      });
    }
  });
}

/**
 *
 * @param {CommandInteraction} interaction
 */
function findIndexOfBackup(interaction, data) {
  let index = -1;
  for (let i = 0; i < data.BackupData.length; i++) {
    if (data.BackupData[i].value === interaction.values[0]) {
      index = i;
      break;
    }
  }

  return index;
}

/**
 *
 * @param {Message} msg
 * @param {CommandInteraction} i
 * @param {Client} client
 * @param {ActionRowBuilder} button
 * @param {ActionRowBuilder} selectMenu
 * @param {EmbedBuilder} embed
 */
async function handleBackupButton(msg, i, client, button, selectMenu, embed) {
  const filter = (ian) => i.user.id === ian.user.id; //ian = interaction
  const collector = msg.createMessageComponentCollector({
    filter,
    componentType: ComponentType.Button,
  });

  collector.on("collect", async (interaction) => {
    const backupCreateModal = new ModalBuilder()
      .setCustomId("create_backup_modal")
      .setTitle("Create a Backup");

    const name = new TextInputBuilder()
      .setCustomId("create_backup_modal_name")
      .setLabel("Backup Name")
      .setPlaceholder("My Server Backup :emoji:")
      .setMaxLength(50)
      .setMinLength(5)
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const description = new TextInputBuilder()
      .setCustomId("create_backup_modal_description")
      .setLabel("Backup Description")
      .setPlaceholder("This backup was created on XX-XX-XXXX at XX:XX")
      .setRequired(true)
      .setMaxLength(80)
      .setMinLength(5)
      .setStyle(TextInputStyle.Paragraph);

    const row1 = new ActionRowBuilder().addComponents(name);
    const row2 = new ActionRowBuilder().addComponents(description);

    backupCreateModal.setComponents(row1, row2);
    await interaction.showModal(backupCreateModal);

    const second_collector = new InteractionCollector(client, {
      filter,
      maxComponents: 1,
      interactionType: InteractionType.ModalSubmit,
      channel: interaction.channel,
      guild: interaction.guild,
    });

    second_collector.on("collect", async (int) => {
      if (int.customId === "create_backup_modal") {
        await int.deferReply({ ephemeral: true });

        const backup_name = int.fields.getTextInputValue(
          "create_backup_modal_name"
        );
        const backup_description = int.fields.getTextInputValue(
          "create_backup_modal_description"
        );

        const userData = await user_backup.findOne({ User: int.user.id });

        if (userData && userData.BackupData.length + 1 > 25) {
          return await editReply(
            int,
            config.messageConfig.globalEmojis.cross,
            "You can't create more than 25 backup slots",
            true
          );
        }

        const backupID = random(10);

        const backup_template = await getServerData(
          int,
          true,
          backup_name,
          backup_description
        );

        const backup_data = {
          label: backup_name,
          description: backup_description,
          value: backupID,
        };

        let options = [];

        if (!userData) {
          new user_backup({
            User: int.user.id,
            BackupData: [backup_data],
            BackupTemplate: [backup_template],
          }).save();

          if (!selectMenu) options.push(backup_data);
        } else {
          if (selectMenu) {
            selectMenu.options.push(backup_data);
            options = options.concat(selectMenu.options);
          } else options.push(backup_data);

          userData.BackupData.push(backup_data);
          userData.BackupTemplate.push(backup_template);
          userData.save();
        }

        selectMenu = new StringSelectMenuBuilder({
          max_values: 1,
          min_values: 1,
          custom_id: "backup_select_menu",
        }).addOptions(options);

        embed.data.description = `We have found a total of ${selectMenu?.options.length} backup(s)`;

        await i.editReply({
          embeds: [embed],
          components: [
            new ActionRowBuilder(selectMenu).addComponents(selectMenu),
            button,
          ],
        });

        await editReply(
          int,
          config.messageConfig.globalEmojis.tick,
          "Successfully saved server backup",
          true
        );
      }
    });
  });
}

/**
 *
 * @param {CommandInteraction} interaction
 * @param {Boolean} allowCreate
 * @param {String} name
 * @param {String} description
 * @returns {Promise<[Boolean, String|null, Object|null]>}
 */
async function getServerData(interaction, allowCreate, name, description) {
  const [code, template] = await fetchTemplate(interaction);

  let guildTemplate = null;
  //If template code exits return true indicating yes the template exists, return the template code and return the template data
  if (code) guildTemplate = template;
  else {
    if (allowCreate) {
      //Create a new template if allowCreate is allowed
      await interaction.guild.createTemplate(name, description);
      //Then fetch the newly created template and return that as newTemplate is just the data that shows yes the template was created
      const [_, template2] = await fetchTemplate(interaction);

      guildTemplate = template2;
    }
  }

  return Object(guildTemplate);
}

/**
 *
 * @param {CommandInteraction} interaction
 * @returns {Promise<[String|null, Template|null]>}
 */
async function fetchTemplate(interaction) {
  //Fetch the template
  const serverTemplate = await interaction.guild.fetchTemplates();

  //Get the template code
  const id = serverTemplate.keys().next().value;
  const code = serverTemplate.get(id);

  if (code) await serverTemplate.first().sync(); //Sync the template for the best results

  //Return the stuff
  return [code, serverTemplate];
}

/**
 *
 * @param {any} template
 * @param {CommandInteraction} interaction
 * @returns
 */
async function createBackup(template, interaction) {
  const key = Object.keys(template)[0];
  template = template[key];

  try {
    //Let them know we are creating the channels
    await editReply(
      interaction,
      config.messageConfig.globalEmojis.loading,
      "Backing up your server (This might take time if your server data is large)..",
      false
    );

    const categories = template.serializedGuild.channels.filter(
      (channel) => channel.type === 4 && channel.parent_id === null
    );
    const uncategorised_channel = template.serializedGuild.channels.filter(
      (channel) => channel.type !== 4 && channel.parent_id === null
    );

    uncategorised_channel.forEach((channel) => {
      interaction.guild.channels.create(channel);
    });

    categories.forEach((category) => {
      const categoryId = category.id;
      const categoryChannels = template.serializedGuild.channels.filter(
        (channel) => channel.parent_id === categoryId
      );

      interaction.guild.channels.create(category).then((cg) => {
        categoryChannels.forEach((channel) => {
          channel["parent"] = cg;
          interaction.guild.channels.create(channel, { parent: cg });
        });
      });
    });

    template.serializedGuild.roles.forEach((roleData) => {
      interaction.guild.roles.create(roleData);
    });

    await interaction.guild.setDefaultMessageNotifications(
      template.serializedGuild.default_message_notifications
    );

    await interaction.guild.setAFKTimeout(template.serializedGuild.afk_timeout);

    await interaction.guild.setVerificationLevel(
      template.serializedGuild.verification_level
    );

    await interaction.guild.setExplicitContentFilter(
      template.serializedGuild.explicit_content_filter
    );

    await interaction.guild.setDefaultMessageNotifications(
      template.serializedGuild.default_message_notifications
    );

    await interaction.guild.setName(template.serializedGuild.name);

    await interaction.guild.setIcon(template.serializedGuild.icon_hash);

    await interaction.guild.setPremiumProgressBarEnabled(
      template.serializedGuild.premium_progress_bar_enabled
    );

    await interaction.guild.setSystemChannelFlags(
      template.serializedGuild.system_channel_flags
    );

    await interaction.guild.setPreferredLocale(
      template.serializedGuild.preferred_locale
    );

    return true;
  } catch {
    return false;
  }
}
