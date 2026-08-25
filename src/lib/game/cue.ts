export type SearchLink = {
  id: string;
  label: string;
  href: string;
};

export function trackSearchLinks(title: string, artist: string): SearchLink[] {
  const q = `${artist} ${title}`.trim();
  const enc = encodeURIComponent(q);
  return [
    { id: "spotify", label: "Spotify", href: `https://open.spotify.com/search/${enc}` },
    { id: "apple", label: "Apple Music", href: `https://music.apple.com/de/search?term=${enc}` },
    { id: "youtube", label: "YouTube", href: `https://www.youtube.com/results?search_query=${enc}` },
    { id: "deezer", label: "Deezer", href: `https://www.deezer.com/search/${enc}` },
  ];
}
