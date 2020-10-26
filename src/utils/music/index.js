import lang from '../../lang/lang';
import ytdl from "ytdl-core-discord";

export async function execute(message, serverQueue, queue, song) {
  const voiceChannel = message.member.voice.channel;
  if (!serverQueue) {
    const queueConstruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueConstruct);

    queueConstruct.songs.push(song);

    try {
      const connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      play(message.guild, queueConstruct.songs[0], queue);
      return;
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      message.channel.send(err);
      return;
    }
  }

  serverQueue.songs.push(song);
  message.channel.send(`**${song.title}** ${lang['brazil'].addedToQueue}`);
}

export async function play(guild, song, queue) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }


  const dispatcher = serverQueue.connection.play(await ytdl(song.url, {
    filter: 'audioonly',
  }), { type: 'opus' })
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0], queue);
    })
    .on("error", error => console.error(error));

  dispatcher.setVolume(serverQueue.volume / 5);
  serverQueue.textChannel.send(`${lang['brazil'].startPlaying} **${song.title}**`);
}

export function stop(message, serverQueue) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.channel.send(lang['brazil'].notInVoiceChannel);
  }
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

export function skip(message, serverQueue) {
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    return message.channel.send(lang['brazil'].notInVoiceChannel);
  }
  if (!serverQueue) {
    return message.channel.send("There is no song that I could skip!");
  }

  serverQueue.connection.dispatcher.end();
}

export async function playlist(message, serverQueue, queue, resolved) {
  const voiceChannel = message.member.voice.channel;

  if (!serverQueue) {
    const queueConstruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueConstruct);

    queueConstruct.songs.push(...resolved.items);

    try {
      const connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      play(message.guild, queueConstruct.songs[0], queue);
      message.channel.send(`${resolved.items.length} ${lang['brazil'].songs.toLowerCase()} ${lang['brazil'].from} playlist **${resolved.title}** ${lang['brazil'].addedToQueuePlural}`);
      return;
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      message.channel.send(err);
      return;
    }
  }

  serverQueue.songs.push(...resolved.items);
  message.channel.send(`${resolved.items.length} ${lang['brazil'].songs.toLowerCase()} ${lang['brazil'].from} playlist **${resolved.title}** ${lang['brazil'].addedToQueuePlural}`);
}
