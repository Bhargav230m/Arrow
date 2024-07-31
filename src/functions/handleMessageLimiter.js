const { Client, Message } = require("discord.js");

//Converted from c++ --> javascript

/**
 *
 * @param {Client} client
 * @param {Message} message
 * @param {number} total_time
 * @returns {boolean}
 */
function handleMessageLimiter(client, message, total_time) {
  const data = client.messageLimiter.get(message.author.id);

  if (data) {
    const timeSinceLastMessage = Date.now() - data.CreatedTime;

    if (timeSinceLastMessage > total_time) {
      client.messageLimiter.delete(message.author.id);
    } else return false;
  } else {
    const dataToCreate = { CreatedTime: Date.now() };
    client.messageLimiter.set(message.author.id, dataToCreate);
  }

  return true;
}

module.exports = handleMessageLimiter;
