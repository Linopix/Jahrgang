import { CATALOG } from "./catalog";
import type { CatalogSong, EraId, Genre, GenreId, MixFilter } from "./types";

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function keyOf(title: string, artist: string) {
  return `${fold(title)}|${fold(artist)}`;
}

const METAL_ARTISTS = new Set(
  [
    "AC/DC",
    "Black Sabbath",
    "Deep Purple",
    "Def Leppard",
    "Guns N' Roses",
    "Linkin Park",
    "Metallica",
    "Rage Against the Machine",
    "Rammstein",
    "Scorpions",
    "Van Halen",
    "Soundgarden",
  ].map(fold),
);

const SOUL_ARTISTS = new Set(
  [
    "Al Green",
    "Alicia Keys",
    "Amy Winehouse",
    "Aretha Franklin",
    "Ben E. King",
    "Beyoncé",
    "Bill Withers",
    "Destiny's Child",
    "Etta James",
    "Fugees",
    "Jamiroquai",
    "James Brown",
    "John Legend",
    "Marvin Gaye",
    "Prince",
    "Ray Charles",
    "Roberta Flack",
    "Silk Sonic",
    "Stevie Wonder",
    "SZA",
    "The Supremes",
    "The Temptations",
    "TLC",
    "Teddy Swims",
    "The Weeknd",
    "Usher",
    "Whitney Houston",
  ].map(fold),
);

const LATIN_ARTISTS = new Set(
  [
    "Bad Bunny",
    "Culcha Candela",
    "Farruko",
    "Karol G",
    "Los Del Rio",
    "Lou Bega",
    "Luis Fonsi",
    "Rema",
    "Ritchie Valens",
    "Santana",
    "Shakira",
    "Tyla",
  ].map(fold),
);

const SCHLAGER_ARTISTS = new Set(
  [
    "Andreas Bourani",
    "Andreas Bourani",
    "Baccara",
    "Drafi Deutscher",
    "DJ Ötzi",
    "Dschinghis Khan",
    "Echt",
    "Helene Fischer",
    "Ich + Ich",
    "Jürgen Drews",
    "Lena",
    "Mark Forster",
    "Matthias Reim",
    "Modern Talking",
    "Namika",
    "No Angels",
    "Pur",
    "Rosenstolz",
    "Silbermond",
    "Udo Jürgens",
    "Unheilig",
    "Wincent Weiss",
  ].map(fold),
);

const INDIE_ARTISTS = new Set(
  [
    "AnnenMayKantereit",
    "Arctic Monkeys",
    "Bastille",
    "Chappell Roan",
    "Djo",
    "Foster the People",
    "Franz Ferdinand",
    "fun.",
    "Glass Animals",
    "Gotye",
    "Hozier",
    "Imagine Dragons",
    "Kings of Leon",
    "Lorde",
    "Milky Chance",
    "Noah Kahan",
    "Passenger",
    "Pixies",
    "R.E.M.",
    "Radiohead",
    "The Cranberries",
    "The Killers",
    "The Strokes",
    "The Verve",
    "The White Stripes",
    "Tracy Chapman",
  ].map(fold),
);

const RAP_ARTISTS = new Set(
  [
    "2Pac",
    "24kGoldn",
    "50 Cent",
    "Alligatoah",
    "Apache 207",
    "Bausa",
    "Bonez MC",
    "Coolio",
    "Cro",
    "DaBaby",
    "Die Fantastischen Vier",
    "Doechii",
    "Doja Cat",
    "Dr. Dre",
    "Drake",
    "Eminem",
    "Future",
    "House of Pain",
    "Jack Harlow",
    "Jay-Z",
    "Juice WRLD",
    "Juju",
    "Kanye West",
    "Kendrick Lamar",
    "Lil Nas X",
    "Macklemore",
    "Marteria",
    "MC Hammer",
    "N.W.A",
    "OutKast",
    "Pashanim",
    "Peter Fox",
    "Post Malone",
    "Public Enemy",
    "Puff Daddy",
    "Roddy Ricch",
    "Run-D.M.C.",
    "Seeed",
    "Shirin David",
    "Sido",
    "Ski Aggu",
    "Snoop Dogg",
    "The Kid LAROI",
    "Travis Scott",
    "Wiz Khalifa",
  ].map(fold),
);

const ROCK_ARTISTS = new Set(
  [
    "BAP",
    "Bon Jovi",
    "Boston",
    "Bruce Springsteen",
    "Creedence Clearwater Revival",
    "Def Leppard",
    "Die Toten Hosen",
    "Die Ärzte",
    "Dire Straits",
    "Eagles",
    "Europe",
    "Fall Out Boy",
    "Fleetwood Mac",
    "Green Day",
    "Jimi Hendrix",
    "Journey",
    "Led Zeppelin",
    "Lynyrd Skynyrd",
    "My Chemical Romance",
    "Nickelback",
    "Nirvana",
    "Oasis",
    "Pearl Jam",
    "Pink Floyd",
    "Queen",
    "Red Hot Chili Peppers",
    "Scorpions",
    "Sex Pistols",
    "Sportfreunde Stiller",
    "Survivor",
    "The Clash",
    "The Doors",
    "The Knack",
    "The Police",
    "The Rolling Stones",
    "The Who",
    "Tom Petty",
    "Toto",
    "U2",
    "Udo Lindenberg",
    "Westernhagen",
    "Wir sind Helden",
  ].map(fold),
);

const DANCE_ARTISTS = new Set(
  [
    "Avicii",
    "Bee Gees",
    "Boney M.",
    "Charli XCX",
    "Chic",
    "Culture Beat",
    "Culture Club",
    "Daft Punk",
    "Darude",
    "David Guetta",
    "Depeche Mode",
    "Duran Duran",
    "Eiffel 65",
    "Frankie Goes to Hollywood",
    "Gloria Gaynor",
    "Kesha",
    "Kraftwerk",
    "Kylie Minogue",
    "LMFAO",
    "Major Lazer",
    "Mr. President",
    "New Order",
    "O-Zone",
    "PSY",
    "Pharrell Williams",
    "Scooter",
    "Snap!",
    "Soft Cell",
    "Tears for Fears",
    "The Buggles",
    "The Chainsmokers",
    "The Human League",
    "Village People",
    "a-ha",
  ].map(fold),
);

export function inferGenre(artist: string, german?: boolean): Genre {
  const key = fold(artist);
  if (METAL_ARTISTS.has(key)) return "metal";
  if (SOUL_ARTISTS.has(key)) return "soul";
  if (LATIN_ARTISTS.has(key)) return "latin";
  if (SCHLAGER_ARTISTS.has(key)) return "schlager";
  if (INDIE_ARTISTS.has(key)) return "indie";
  if (RAP_ARTISTS.has(key)) return "rap";
  if (ROCK_ARTISTS.has(key)) return "rock";
  if (DANCE_ARTISTS.has(key)) return "dance";
  if (german) return "pop";
  return "pop";
}

const PARTY = [
  ["Bohemian Rhapsody", "Queen"],
  ["We Will Rock You", "Queen"],
  ["Dancing Queen", "ABBA"],
  ["Y.M.C.A.", "Village People"],
  ["I Will Survive", "Gloria Gaynor"],
  ["99 Luftballons", "Nena"],
  ["Mambo No. 5", "Lou Bega"],
  ["Uptown Funk", "Mark Ronson"],
  ["Can't Stop the Feeling!", "Justin Timberlake"],
  ["I Gotta Feeling", "The Black Eyed Peas"],
  ["Party Rock Anthem", "LMFAO"],
  ["Wake Me Up", "Avicii"],
  ["Mr. Brightside", "The Killers"],
  ["Wonderwall", "Oasis"],
  ["Don't Stop Believin'", "Journey"],
  ["Livin' on a Prayer", "Bon Jovi"],
  ["Sweet Child o' Mine", "Guns N' Roses"],
  ["Smells Like Teen Spirit", "Nirvana"],
  ["Billie Jean", "Michael Jackson"],
  ["Thriller", "Michael Jackson"],
  ["Like a Prayer", "Madonna"],
  ["Take On Me", "a-ha"],
  ["Never Gonna Give You Up", "Rick Astley"],
  ["Macarena", "Los Del Rio"],
  ["Wannabe", "Spice Girls"],
  ["...Baby One More Time", "Britney Spears"],
  ["Hey Ya!", "OutKast"],
  ["Crazy in Love", "Beyoncé"],
  ["Umbrella", "Rihanna"],
  ["Poker Face", "Lady Gaga"],
  ["Bad Romance", "Lady Gaga"],
  ["Rolling in the Deep", "Adele"],
  ["Call Me Maybe", "Carly Rae Jepsen"],
  ["Gangnam Style", "PSY"],
  ["Happy", "Pharrell Williams"],
  ["Shake It Off", "Taylor Swift"],
  ["Despacito", "Luis Fonsi"],
  ["Shape of You", "Ed Sheeran"],
  ["Old Town Road", "Lil Nas X"],
  ["Blinding Lights", "The Weeknd"],
  ["Dance Monkey", "Tones and I"],
  ["As It Was", "Harry Styles"],
  ["Flowers", "Miley Cyrus"],
  ["Espresso", "Sabrina Carpenter"],
  ["Tage wie diese", "Die Toten Hosen"],
  ["Ein Kompliment", "Sportfreunde Stiller"],
  ["Haus am See", "Peter Fox"],
  ["Atemlos durch die Nacht", "Helene Fischer"],
  ["Rock Me Amadeus", "Falco"],
  ["Major Tom (Völlig losgelöst)", "Peter Schilling"],
].map(([title, artist]) => keyOf(title, artist));

const PARTY_SET = new Set(PARTY);

function inKit(song: CatalogSong, kit: Set<string>) {
  return kit.has(keyOf(song.title, song.artist));
}

function matchesGenre(song: CatalogSong, genre: GenreId) {
  if (genre === "all") return true;
  if (genre === "german") return Boolean(song.german);
  return (song.genre ?? inferGenre(song.artist, song.german)) === genre;
}

function mixBounds(mix?: MixFilter) {
  const from = mix?.from ?? 1960;
  const to = mix?.to ?? new Date().getFullYear();
  return {
    start: Math.min(from, to),
    end: Math.max(from, to),
    genre: mix?.genre ?? "all",
  };
}

export function songsForPack(pack: EraId, mix?: MixFilter): CatalogSong[] {
  if (pack === "playlist") return CATALOG;
  if (pack === "mix") {
    const { start, end, genre } = mixBounds(mix);
    return CATALOG.filter(
      (song) => song.year >= start && song.year <= end && matchesGenre(song, genre),
    );
  }
  return CATALOG.filter((song) => {
    switch (pack) {
      case "all":
        return true;
      case "classic":
        return song.year <= 1979;
      case "eighties":
        return song.year >= 1980 && song.year <= 1989;
      case "nineties":
        return song.year >= 1990 && song.year <= 1999;
      case "two-thousands":
        return song.year >= 2000 && song.year <= 2009;
      case "tens":
        return song.year >= 2010 && song.year <= 2019;
      case "today":
        return song.year >= 2020;
      case "german":
        return Boolean(song.german);
      case "pop":
      case "rock":
      case "rap":
      case "dance":
      case "soul":
      case "metal":
      case "indie":
      case "latin":
      case "schlager":
        return matchesGenre(song, pack as GenreId);
      case "party":
        return inKit(song, PARTY_SET);
      case "charts":
        return song.year >= 2015;
      case "rap-charts":
        return matchesGenre(song, "rap") && song.year >= 2015;
      default:
        return true;
    }
  });
}

export function packSize(pack: EraId, mix?: MixFilter): number {
  if (pack === "playlist") return 0;
  return songsForPack(pack, mix).length;
}
