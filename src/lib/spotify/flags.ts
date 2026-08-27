/**
 * Optional Spotify overlay (login, library pack, Premium playback).
 *
 * Setup: docs/musikdienste.md
 * 1. App at https://developer.spotify.com/dashboard (owner needs Premium)
 * 2. Redirect URIs:
 *    http://localhost:8080/api/spotify/callback
 *    https://jahrgang.vercel.app/api/spotify/callback
 * 3. Env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 *    optional SPOTIFY_REDIRECT_URI, SPOTIFY_MARKET=DE
 * 4. Flip this to true and deploy.
 *
 * Play never depends on this. iTunes/Deezer stay the default pile.
 * Login only adds "Meine Titel" and, with Premium, the Spotify player.
 */
export const SPOTIFY_LIVE = false;
