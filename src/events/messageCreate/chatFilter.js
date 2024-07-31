//Chat Filter is version 2 of the older filters from the first AutoMod series on GitHub.
//This updated code includes numerous changes and improvements from the last filter.
//Auto Cleanup is supported

const {
  Client,
  Message,
  EmbedBuilder,
  Collection,
  GuildMember,
} = require("discord.js");
const config = require("../../emoji.json");
const handleMessageLimiter = require("../../functions/handleMessageLimiter.js");
const randomId = require("../../functions/generateRandomId.js");
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

  const isCaps = checkForCaps(message.content, 8, 75);
  const containsLinks = checkForLink(message.content);
  const isSpamming = await checkForSpam(
    client.spamData,
    message.author,
    ms("2s")
  );
  const hasBadword = await checkForBadword(client, message.content);
  const hasBadNick = await checkForBadword(
    client,
    message.member.nickname,
  );

  if (hasBadNick) message.member.setNickname(randomId(6));

  const replyMessage = isCaps
    ? "wants you to lower your voice in the chat"
    : containsLinks
    ? "wants you to remove links from your message"
    : isSpamming
    ? "wants you to stop spamming"
    : hasBadword
    ? "wants you to stop sending profane stuff in chat"
    : "has changed your nickname to something that is not profane";

  if (isCaps || containsLinks || isSpamming || hasBadNick || hasBadword) {
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
              `${message.author} - ${config.messageConfig.globalEmojis.warning} Automod ${replyMessage}`
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
 * @param {string} text The text you want to check for caps
 * @param {number} maxLength Minimum number of characters to trigger the if statement
 * @param {number} temperature % between 1-100, This will be the percentage of Uppercase letters in text to trigger the if statement
 * @returns {boolean}
 */
function checkForCaps(text, maxLength, temperature) {
  let uppercaseCount = (text.match(/[A-Z]/g) || []).length;
  let lowercaseCount = (text.match(/[a-z]/g) || []).length;
  let totalLetters = uppercaseCount + lowercaseCount;

  let uppercasePercentage = (uppercaseCount / totalLetters) * 100;

  if (uppercasePercentage > temperature && text.length >= maxLength)
    return true;
  else return false;
}

/**
 *
 * @param {string} text The text you want to check for links
 * @returns {boolean}
 */
function checkForLink(text) {
  const regex =
    /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;
  return regex.test(text);
}

/**
 *
 * @param {Collection} collection
 * @param {GuildMember} user The discord user
 * @param {number} totalTimeBetweenMessages Total time between messages
 */
async function checkForSpam(collection, user, totalTimeBetweenMessages) {
  try {
    const data = collection.get(user.id);

    if (data) {
      const subtractionOfDates = Date.now() - data.LastMessageDate;
      const messageCount = data.MessageCount;

      const deleteCollection = Date.now() - data.CreatedDate;

      let collectionDeletionTime = 10_000;

      if (subtractionOfDates < totalTimeBetweenMessages && messageCount > 5)
        return true;
      else {
        data.MessageCount += 1;
        data.LastMessageDate = Date.now();
      }

      if (deleteCollection > collectionDeletionTime) collection.delete(user.id);
    } else {
      const userData = {
        User: user.id,
        MessageCount: 1,
        CreatedDate: Date.now(),
        LastMessageDate: Date.now(),
      };

      collection.set(user.id, userData);
    }

    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/**
 *
 * @param {Client} client
 * @param {string} text Text to check
 * @param {boolean} useAi If true then function will use ArrowTransformer models to check for profanity
 * @returns
 */
async function checkForBadword(client, text) {
  const regexPattern = new RegExp(
    "\\b(?:" + client.badwords.join("|") + ")\\b"
  );
  return regexPattern.test(text);
}
