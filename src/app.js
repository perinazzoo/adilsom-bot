import 'dotenv/config';
import Discord from "discord.js";
import config from './config/defaults';
import lang from './lang/lang';
import qs from 'querystring';
import axios from 'axios';
import api from './services/api';

import { execute, stop, skip, playlist } from './utils/music';
import urlResolver from './utils/music/resolveUrl';
import isInvalidRequest from './utils/music/verification';

const client = new Discord.Client();

const serverData = new Map();
const queue = new Map();

const regions = {
  brazil: 'brazil',
  other: 'other'
}

const types = {
  playlist,
  song: execute
}

client.once("ready", async () => {
  const requestBody = {
    grant_type: 'client_credentials'
  }

  const Authorization = `Basic ${Buffer.from('d121e884b0ef4edeb872348f2af11a53:fd16cd16b6ba45a4bf8626cfda8cd7ff').toString('base64')}`;

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization
    }
  }


  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    qs.stringify(requestBody),
    config
  );

  api.defaults.headers.common['Authorization'] = `${response.data.token_type} ${response.data.access_token}`;

  console.log('done');
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.once('guildCreate', (guild) => {

  let region = regions[guild.region];

  if (!region) {
    region = regions.other;
  }

  serverData.set(guild.id, { region });

  const channel = guild.channels.cache.find((ch) => ch.type === 'text');

  channel.send(lang[serverData.get(guild.id).region].welcomeMessage);
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${config.prefix}play`)) {
    const isInvalid = isInvalidRequest(message);

    if (isInvalid) {
      return message.channel.send(isInvalid);
    }

    const resolved = await urlResolver(message);

    const method = types[resolved.type];

    if (method) {
      method(message, serverQueue, queue, resolved);
    }
    return;
  } else if (message.content.startsWith(`${config.prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${config.prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else {
    message.channel.send(lang['brazil'].notFoundCommand);
  }
});

client.login(process.env.DISCORD_TOKEN);