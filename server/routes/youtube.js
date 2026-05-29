/**
 * GET /api/youtube/featured
 *
 * Resolves a single "featured" video for the public homepage magazine
 * flipbook, using the server-side YOUTUBE_API_KEY (never exposed to the
 * browser). Configure ONE of the following env vars — checked in priority
 * order:
 *
 *   YOUTUBE_FEATURED_VIDEO_ID     → use this exact video
 *   YOUTUBE_FEATURED_PLAYLIST_ID  → newest item in this playlist
 *   YOUTUBE_CHANNEL_ID            → newest upload on this channel
 *   YOUTUBE_CHANNEL_HANDLE        → newest upload on this @handle
 *
 * The result is cached in-memory (default 6h) so repeated homepage hits
 * don't burn the YouTube Data API quota. Public — no auth required.
 *
 * Response: { videoId, title, description, thumbnail, publishedAt }
 */

const express = require("express");

const API = "https://www.googleapis.com/youtube/v3";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let cache = { at: 0, data: null };

async function yt(path, params) {
  params.set("key", process.env.YOUTUBE_API_KEY);
  const res = await fetch(`${API}/${path}?${params}`);
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message || `YouTube API ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

function bestThumb(snippet, videoId) {
  const t = snippet?.thumbnails || {};
  return (
    t.maxres?.url ||
    t.standard?.url ||
    t.high?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  );
}

async function resolveChannelId() {
  if (process.env.YOUTUBE_CHANNEL_ID) return process.env.YOUTUBE_CHANNEL_ID;
  const handle = process.env.YOUTUBE_CHANNEL_HANDLE;
  if (!handle) return null;
  const data = await yt(
    "channels",
    new URLSearchParams({ part: "id", forHandle: handle.replace(/^@/, "") })
  );
  return data.items?.[0]?.id || null;
}

async function latestFromPlaylist(playlistId) {
  const data = await yt(
    "playlistItems",
    new URLSearchParams({ part: "snippet", maxResults: "1", playlistId })
  );
  const item = data.items?.[0]?.snippet;
  if (!item) return null;
  const videoId = item.resourceId?.videoId;
  return {
    videoId,
    title: item.title,
    description: item.description,
    thumbnail: bestThumb(item, videoId),
    publishedAt: item.publishedAt,
  };
}

async function byVideoId(videoId) {
  const data = await yt(
    "videos",
    new URLSearchParams({ part: "snippet", id: videoId })
  );
  const s = data.items?.[0]?.snippet;
  if (!s) return null;
  return {
    videoId,
    title: s.title,
    description: s.description,
    thumbnail: bestThumb(s, videoId),
    publishedAt: s.publishedAt,
  };
}

async function resolveFeatured() {
  // 1) Exact video
  if (process.env.YOUTUBE_FEATURED_VIDEO_ID) {
    return byVideoId(process.env.YOUTUBE_FEATURED_VIDEO_ID);
  }
  // 2) Explicit playlist
  if (process.env.YOUTUBE_FEATURED_PLAYLIST_ID) {
    return latestFromPlaylist(process.env.YOUTUBE_FEATURED_PLAYLIST_ID);
  }
  // 3) Channel (or handle) → uploads playlist → newest upload
  const channelId = await resolveChannelId();
  if (channelId) {
    const ch = await yt(
      "channels",
      new URLSearchParams({ part: "contentDetails", id: channelId })
    );
    const uploads =
      ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (uploads) return latestFromPlaylist(uploads);
  }
  return null;
}

module.exports = function () {
  const router = express.Router();

  router.get("/featured", async (req, res) => {
    if (!process.env.YOUTUBE_API_KEY) {
      return res
        .status(503)
        .json({ error: "YouTube is not configured on this server." });
    }

    // Serve from cache (unless ?refresh=1)
    const fresh =
      cache.data && Date.now() - cache.at < CACHE_TTL_MS && req.query.refresh !== "1";
    if (fresh) return res.json({ ...cache.data, cached: true });

    try {
      const video = await resolveFeatured();
      if (!video?.videoId) {
        return res.status(404).json({
          error:
            "No featured video found. Set YOUTUBE_FEATURED_VIDEO_ID, " +
            "YOUTUBE_FEATURED_PLAYLIST_ID, YOUTUBE_CHANNEL_ID or " +
            "YOUTUBE_CHANNEL_HANDLE in the server environment.",
        });
      }
      cache = { at: Date.now(), data: video };
      res.json(video);
    } catch (err) {
      console.error("[/api/youtube/featured]", err.message);
      // Fall back to a stale cache entry if we have one
      if (cache.data) return res.json({ ...cache.data, stale: true });
      res.status(502).json({ error: err.message });
    }
  });

  return router;
};
