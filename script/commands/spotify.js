const axios = require('axios');
const { /*downloadTrack2:*/ downloadTrack, downloadAlbum2, search } = require("@nechlophomeriaa/spotifydl");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const path = require("path");

// SpotifyDL Module is very buggy sometimes

async function searchTrack(query, limit) {
  try {
    const searchResult = await search(query, limit);
    const simplifiedResponse = searchResult.items.map((item) => {
      const duration_ms = item.duration_ms;
      const duration_hours = String(Math.floor(duration_ms / 3600000)).padStart(2, '0');
      const duration_minutes = String(Math.floor((duration_ms % 3600000) / 60000)).padStart(2, '0');
      const duration_seconds = String(Math.floor((duration_ms % 60000) / 1000)).padStart(2, '0');
      return {
        track_url: item.external_urls.spotify,
        track_name: item.name,
        artist_names: item.artists.map(artist => artist.name).join(", "),
        duration: `${duration_hours}:${duration_minutes}:${duration_seconds}`,
        thumbnail: item.album.images.reduce((prev, current) => {
          if (current.height > prev.height && current.width > prev.width) {
            return current;
          }
          return prev;
        }, item.album.images[0]).url,
      };
    });

    return simplifiedResponse;
  } catch (error) {
    throw new Error("An error occurred while searching for the track.");
  }
}

async function downloadSong(song) {
  try {
    const downTrack = await downloadTrack(song);
    var dir = path.join(__dirname, "tmp", `${uuid()}.mp3`);
    await fs.writeFileSync(dir, downTrack.audioBuffer);
    const response = {
      status: "success",
      buffer: downTrack.audioBuffer,
      title: downTrack.title,
      artist: downTrack.artists,
      duration: downTrack.duration,
      explicit: downTrack.explicit,
      popularity: downTrack.popularity,
      trackurl: downTrack.url,
      album: {
        name: downTrack.album.name,
        type: downTrack.album.type,
        tracks: downTrack.album.tracks,
        releaseDate: downTrack.album.releasedDate
      },
      thumbnail: downTrack.imageUrl,
      dir
    };
    return response;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while downloading the track.");
  }
}

module.exports = {
  config: {
    name: "spotify",
    aliases: ["music", "play", "sing"],
    description: "Search for songs on Spotify",
    usage: "{pn} <song_name or song_link>",
    author: "Tanvir",
    cooldown: 20,
    category: "media"
  },
  start: async function({ event, api, args, message }) {
    if (!global.tmp.spotify) global.tmp.spotify = new Set();
    const query = args.join(" ");
    let downloadResponse;
    if (!query) {
      return message.reply("⚠ | Please provide a track name or a track link.");
    }
    if (query.match(/^(https:\/\/open\.spotify\.com\/track\/|https:\/\/spotify\.link\/)/i)) {
      try {
        const prmsg = await api.sendMessage(event.chat.id, "✅ | Downloading track...");
        downloadResponse = await downloadSong(query);
        api.sendChatAction(event.chat.id, 'upload_audio')
        api.deleteMessage(event.chat.id, prmsg.message_id);
        await api.sendAudio(event.chat.id, downloadResponse.dir, {
          caption: `• Title: ${downloadResponse.title}\n• Artist: ${downloadResponse.artist}\n• Upload Date: ${downloadResponse.album.releaseDate}\n• Album: ${downloadResponse.album.name}\n• Duration: ${downloadResponse.duration}`,
          title: downloadResponse.title,
          performer: downloadResponse.artist,
          thumb: await axios.get(downloadResponse.thumbnail, { responseType: "arraybuffer" })
        });
      } catch (error) {
        console.error(error);
        message.reply(`Error: ${error?.message || "Occurred"}`);
      }
    } else if (query.match(/^https:\/\/open\.spotify\.com\/(album|playlist)\/[a-zA-Z0-9]+$/)) {
      if (global.tmp.spotify.has(event.from.id)) return await message.reply("You Already have a playlist actively being downloaded. Have patience")
      const prmsg = await api.sendMessage(event.chat.id, "Downloading Playlist. May take a long while");
      global.tmp.spotify.add(event.from.id)
      try {
        const downAlbums = await downloadAlbum2(query)
        api.deleteMessage(event.chat.id, prmsg.message_id);
        const chunkSize = 6;
        const mediaChunks = [];
        for (let i = 0; i < mediaAudio.length; i += chunkSize) {
          mediaChunks.push(mediaAudio.slice(i, i + chunkSize));
        }
        mediaChunks.forEach(chunk => {
          api.sendMediaGroup(event.chat.id, chunk);
        });
      } catch (error) {
        console.error(error);
        message.reply(`Error: ${error?.message || "Occurred"}`);
        if (prmsg.message_id) {
          api.deleteMessage(event.chat.id, prmsg.message_id)
        }
      } finally {
        if (global.tmp.spotify.has(event.from.id)) {
          global.tmp.spotify.delete(event.from.id)
        }
      }
    } else {
      try {
        api.sendChatAction(event.chat.id, 'upload_document');
        const tracks = await searchTrack(query, 4);
        if (tracks.length === 0) {
          return message.reply("⚠ | No tracks found for the given query.");
        }
        const inline_data = tracks.map(track => [
          {
            text: `${track.artist_names} - ${track.track_name}`,
            callback_data: track.track_url
                }
            ]);
        const media = tracks.map(item => ({
          type: "photo",
          media: item.thumbnail,
          performer: item.artist_names,
          title: item.track_name,
          caption: item.track_name
        }));
        const x = await api.sendMediaGroup(event.chat.id, media, {
          disable_notification: true,
          reply_to_message_id: event.message_id
        });

        const sent = await api.sendMessage(
          event.chat.id,
          "Here are your results",
          {
            reply_markup: { inline_keyboard: inline_data },
            disable_notification: true
          }
        );
        global.bot.callback_query.set(sent.message_id, {
          event,
          ctx: sent,
          cmd: this.config.name,
          initials: {
            first: x.message_id,
            second: sent.message_id
          },
          authorMan: event.from.id
        });
      } catch (error) {
        console.error(error);
        message.reply(error.message);
      }
    }
  },
  callback_query: async function({ event, api, ctx, Context, message }) {
    let dir;
    try {
      await api.answerCallbackQuery(ctx.id, { text: Context.authorMan == ctx.from.id ? "Downloading Your Song" : "Authorized" });
      if (Context.authorMan != ctx.from.id) return
      await api.deleteMessage(
        event.chat.id,
        Context.initials.second
      );
      const prmsg = await api.sendMessage(event.chat.id, "✅ | Downloading track...");
      downloadResponse = await downloadSong(ctx.data);
      api.sendChatAction(event.chat.id, 'upload_audio')
      await api.sendAudio(event.chat.id, downloadResponse.dir, {
        caption: `• Title: ${downloadResponse.title}\n• Artist: ${downloadResponse.artist}\n• Upload Date: ${downloadResponse.album.releaseDate}\n• Album: ${downloadResponse.album.name}\n• Duration: ${downloadResponse.duration}`,
        thumb: downloadResponse.thumbnail,
        title: downloadResponse.title,
        performer: downloadResponse.artist
      });
      dir = downloadResponse.dir
      api.deleteMessage(event.chat.id, prmsg.message_id);
    } catch (error) {
      console.error(error);
      api.sendMessage(event.chat.id, `${error?.message || "Exception Occurred"}`);
    } finally {
      if (dir)
        fs.unlinkSync(dir)
    }
  }
};