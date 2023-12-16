const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

const API = process.env.API;
const botToken = process.env.BOT_TOKEN;
const channelId = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  checkAndSendEmbed();
  // Check and send message every 60 seconds
  setInterval(checkAndSendEmbed, 60 * 1000);
});

async function checkAndSendEmbed() {
  try {
    const response = await axios.get(API);
    const { stats, perWorkerStats } = response.data;
    const pendingBalanceXMR = (parseInt(stats.balance, 10) / 1e12).toFixed(12);
    const totalPaidXMR = (
      response.data.payments.reduce(
        (acc, payment) => acc + parseInt(payment.amount, 10),
        0,
      ) / 1e12
    ).toFixed(12);
    const lastBlockRewardXMR = (parseInt(stats.last_reward, 10) / 1e12).toFixed(
      12,
    );
    // Function to calculate time elapsed since last share
    function timeSinceLastShare(lastShareTimestamp) {
      const seconds = Math.floor(Date.now() / 1000 - lastShareTimestamp);
      const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
      };

      let result = "";

      for (const [key, value] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / value);

        if (interval > 0) {
          result += `${interval} ${key}${interval === 1 ? "" : "s"} ago`;
          break;
        }
      }

      if (!result) {
        return "a few seconds ago"; // If the time is less than a second
      }

      return result;
    }

    const lastShareTime = timeSinceLastShare(stats.lastShare);
    const embed = new EmbedBuilder()
      .setTitle("₿ XMR Mining Statistics")
      .addFields(
        {
          name: "**Statistics**",
          value: [
            "```",
            `🚀 Total Hashrate: ${stats.hashrate}/s`,
            "```",
            "```",
            `🔗 Last Share: ${lastShareTime}`,
            "```",
            "```",
            `⏳ Pending Balance: ${pendingBalanceXMR} XMR`,
            "```",
            "```",
            `🚫 Last Block Reward: ${lastBlockRewardXMR} XMR`,
            "```",
            "```",
            `💰 Total Paid: ${totalPaidXMR} XMR`,
            "```",
          ].join("\n"),
        },
        {
          name: "**👷 Worker / Rig ID**",
          value:
            "```" +
            perWorkerStats
              .map(
                (worker) =>
                  `${worker.workerId}: ${
                    worker.hashrate
                      ? `${worker.hashrate}/s 💚 Online`
                      : "💔 Offline"
                  }`,
              )
              .join("\n") +
            "```",
        },
        {
          name: "** Next Update **",
          value: ` <t:${Math.floor((Date.now() + 60 * 1000) / 1000)}:R>`,
        },
      )
      .setTimestamp();

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found`);
      return;
    }

    const existingMessage = await channel.messages.fetch({ limit: 1 });
    const botMessage = existingMessage.first();

    if (botMessage) {
      if (!compareEmbeds(botMessage.embeds[0], embed)) {
        botMessage.edit({ embeds: [embed] });
        console.log("Message updated:", embed);
      }
    } else {
      const sentMessage = await channel.send({ embeds: [embed] });
      console.log("Message sent:", embed);
    }
  } catch (error) {
    console.error("Error fetching Monero pool stats:", error.message);
  }
}

function compareEmbeds(embed1, embed2) {
  if (!embed1 || !embed2) {
    return false;
  }
  return JSON.stringify(embed1) === JSON.stringify(embed2);
}

function getWorkerListEmbedField(perWorkerStats) {
  return perWorkerStats
    .map((worker) => `${worker.workerId}: ${worker.hashes} H/s`)
    .join("\n");
}

client.login(botToken);MTE4NTQyNDMxMjcxNTQ1MjQyNg.GAzUu6.1QFN5FtgK6rJK0M0gvutsK9b7OA6UC62Kh7SNY
