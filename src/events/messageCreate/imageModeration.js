//Image Moderation
//A step up from using sighengine for image moderation
//Start the python server to use ImageModeration
//Keep in mind this feature is still in development and inaccuracy might still be relevant

const {
  Client,
  Message,
  EmbedBuilder,
} = require("discord.js");
const config = require("../../emoji.json");
const handleMessageLimiter = require("../../functions/handleMessageLimiter.js");
const ms = require("ms");
const axios = require("axios");

/**
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = async (client, message) => {
  if (message.webhookId || message.author.bot) return;
  if (!message.member.moderatable) return;

  let results = [];

  for await (const attachment of message.attachments.values()) {
    const data = await moderateImage(attachment.url);
    results.push(data);
  }

  results.push(await moderateImage(message.member.displayAvatarURL()))

  const containsUnsafeContent = safeCheck(results);

  if (containsUnsafeContent) {
    if (message.deletable) {
      await message.delete();
    }

    const sendWarning = handleMessageLimiter(client, message, ms("5s"));

    if (sendWarning) {
      const messageToDelete = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Warning")
            .setAuthor({
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
              name: "ChatFilter",
            })
            .setDescription(
              `${message.author} - ${config.messageConfig.globalEmojis.warning} Automod has deleted your message because your avatar or attachments have unsafe content`
            )
            .setTimestamp()
            .setColor("Yellow"),
        ],
      });
      setTimeout(async () => {
        if (messageToDelete.deletable) {
          await messageToDelete.delete();
        }
      }, ms("5s"));
    }
  }
};

/**
 *
 * @param {Array} results
 * @returns {boolean}
 */
function safeCheck(results) {
  for (const value of results) {
    if (value.nudity > 0.5 || value.offensive > 0.7) {
      return true;
    }
  }
  return false;
}

/**
 *
 * @param {string} link
 * @returns {object}
 */
async function moderateImage(link) {
  try {
    const response = await axios.post(
      "http://localhost:3000/image_moderation",
      {
        link: link,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error occurred:",
      error.response ? error.response.data : error.message
    );

    return { nudity: 0, offensive: 0 };
  }
}
