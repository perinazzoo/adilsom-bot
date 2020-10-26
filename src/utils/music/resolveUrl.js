import validUrl from 'valid-url';
import fetch from 'node-fetch';
import ytdl from 'ytdl-core-discord';
import ytpl from 'ytpl';

import api from '../../services/api';

async function urlResolver(message) {
  const [, , ...args] = message.content.split(' ');

  if (validUrl.isUri(args[0])) {
    if (args[0].includes('playlist')) {
      if (args[0].includes('spotify')) {
        const [_, key] = args[0].split('playlist/');

        const playlistKey = key.substring(0, key.indexOf("?"));

        const response = await api.get(`/playlists/${playlistKey}`, {
          params: {
            fields: 'name, tracks.items(track(name, album.artists))'
          }
        });

        const items = await Promise.all(response.data.tracks.items.map(s => {
          const stringFilter = s.track.name.replace('ç', 'c').replace('ã', 'a').replace('á', 'a').replace('à', 'a').replace('õ', 'o').replace('é', 'e');
          const artistsFilter = s.track.album.artists[0].name.replace('ç', 'c').replace('ã', 'a').replace('á', 'a').replace('à', 'a').replace('õ', 'o').replace('é', 'e');
          const searchString = `${stringFilter} - ${artistsFilter}`;

          return search(searchString);
        }));

        return {
          type: 'playlist',
          title: response.data.name,
          items,
        };
      }

      const playlist = await ytpl(args[0]);

      return {
        type: 'playlist',
        title: playlist.title,
        items: playlist.items
      }
    }

    const songInfo = await ytdl.getInfo(args[0]);

    return {
      type: 'song',
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url
    }
  }

  const string = args.join(' ');

  const filteredString = string.replace('ç', 'c').replace('ã', 'a').replace('á', 'a').replace('à', 'a').replace('õ', 'o').replace('é', 'e');

  return await search(filteredString);
}

function extractWindowYtInitialData(html) {
  const json = /window\["ytInitialData"\] = (.*);/gm.exec(html);
  return json ? json[1] : null;
}

function extractYtInitialData(html) {
  const json = /var ytInitialData = (.*);/gm.exec(html);
  return json ? json[1] : null;
}

function extractSearchResults(result) {
  let json = null;
  if (result.includes('window["ytInitialData"]')) json = extractWindowYtInitialData(result);
  else if (result.includes('var ytInitialData =')) json = extractYtInitialData(result);
  else return [];

  if (!json) return [];

  const obj = JSON.parse(json);

  const videoInfo = obj.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0]
    .itemSectionRenderer.contents;
  const [ytVideo] = videoInfo.filter((x) => x.videoRenderer);

  return {
    type: 'song',
    title: ytVideo.videoRenderer.title.runs[0].text,
    url: `https://www.youtube.com/watch?v=${ytVideo.videoRenderer.videoId}`
  }
}

export default async function search(query) {
  const res = await fetch(
    `https://www.youtube.com/results?search_query=${query}&sp=EgIQAQ%253D%253D`,
    {
      headers: {
        'user-agent': ' Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        accept: 'text/html',
        'accept-encoding': 'gzip',
        'accept-language': 'en-US',
      },
    },
  );

  const text = await res.text();

  return extractSearchResults(text);
}

export default urlResolver;
