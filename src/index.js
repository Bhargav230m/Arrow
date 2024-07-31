//Made by techpowerb, Template provided by TNS. mwah!!!
require("dotenv/config");

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { loadEssentials } = require("./utils/loadEssentials.js");
const eventHandler = require("./handlers/eventHandler");

// Error handlers aka Anti-Crash system
process.on("unhandledRejection", (reason, promise) => {
  console.error("[antiCrash] :: [unhandledRejection]");
  console.log(promise, reason);
});

process.on("uncaughtException", (err, origin) => {
  console.error("[antiCrash] :: [uncaughtException]");
  console.log(err, origin);
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.error("[antiCrash] :: [uncaughtExceptionMonitor]");
  console.log(err, origin);
});

process.on("uncaughtMultipleResolves", (type, promise, reason) => {
  logger.info(`[antiCrash] :: [uncaughtMultipleResolves]`);
  console.log(type, promise, reason);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/**
 * Whats Message limiter?
 * Message Limiter is a feature added in older Automod V2
 * It was mainly used to avoid bot's spammy nature
 * For example if the user is spamming slurs in chat the bot will also spam the channel with warning messages
 * To avoid this message limiter was also added here
 */
client.messageLimiter = new Collection();

client.spamData = new Collection();

async function startBot() {
  try {
    eventHandler(client)
    await loadEssentials(client);

    client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Error loading essentials:", error);
  }
}

startBot();