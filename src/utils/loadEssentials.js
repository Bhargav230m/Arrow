const { Client } = require("discord.js");
const fs = require("fs").promises; // Using fs.promises for promise-based fs operations

/**
 * Loads all the essentials which is needed by automod
 * @param {Client} client The client to which all the essentials will be loaded
 */
async function loadEssentials(client) {
  console.log("Loading Essentials");

  try {
    const data = await fs.readFile("src/utils/essentials/badwords.json", "utf8");
    const jsonData = JSON.parse(data);
    client.badwords = jsonData.words;

    console.log("Successfully loaded essentials");
  } catch (err) {
    console.error("Error loading essentials:", err);
  }
}

module.exports = { loadEssentials };
