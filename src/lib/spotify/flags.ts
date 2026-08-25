/**
 * Spotify in the app (login + search + playback).
 *
 * Off until you:
 * 1. Create an app at https://developer.spotify.com/dashboard
 * 2. Add redirect URIs:
 *    http://localhost:8080/api/spotify/callback
 *    https://jahrgang.vercel.app/api/spotify/callback
 * 3. Set env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 *    optional SPOTIFY_REDIRECT_URI, SPOTIFY_MARKET=DE
 * 4. Flip this to true and deploy.
 */
export const SPOTIFY_LIVE = false;
