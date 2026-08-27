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
    "Avenged Sevenfold",
    "Black Sabbath",
    "Bring Me The Horizon",
    "Bullet for My Valentine",
    "Deep Purple",
    "Def Leppard",
    "Dio",
    "Disturbed",
    "Drowning Pool",
    "Evanescence",
    "Ghost",
    "Guns N' Roses",
    "Iron Maiden",
    "Judas Priest",
    "Kiss",
    "Korn",
    "Linkin Park",
    "Metallica",
    "Motörhead",
    "Ozzy Osbourne",
    "Pantera",
    "Papa Roach",
    "Poison",
    "Rage Against the Machine",
    "Rammstein",
    "Scorpions",
    "Skid Row",
    "Slipknot",
    "Soundgarden",
    "System of a Down",
    "Thirty Seconds to Mars",
    "Tool",
    "Van Halen",
    "Volbeat",
    "Warrant",
    "Whitesnake",
  ].map(fold),
);

const SOUL_ARTISTS = new Set(
  [
    "Aaliyah",
    "Al Green",
    "Alicia Keys",
    "Amy Winehouse",
    "Aretha Franklin",
    "Ashanti",
    "Ben E. King",
    "Beyoncé",
    "Bill Withers",
    "Boyz II Men",
    "Brandy",
    "Commodores",
    "Destiny's Child",
    "Earth, Wind & Fire",
    "Etta James",
    "Four Tops",
    "Fugees",
    "Gladys Knight",
    "Isaac Hayes",
    "Jamiroquai",
    "James Brown",
    "Janet Jackson",
    "John Legend",
    "Lauryn Hill",
    "Mariah Carey",
    "Marvin Gaye",
    "Mary J. Blige",
    "Otis Redding",
    "Prince",
    "Ray Charles",
    "Roberta Flack",
    "Sam & Dave",
    "Silk Sonic",
    "Sly and the Family Stone",
    "Stevie Wonder",
    "SZA",
    "The Staple Singers",
    "The Stylistics",
    "The Supremes",
    "The Temptations",
    "TLC",
    "Teddy Swims",
    "The Weeknd",
    "Toni Braxton",
    "Usher",
    "Whitney Houston",
  ].map(fold),
);

const LATIN_ARTISTS = new Set(
  [
    "Anuel AA",
    "Aventura",
    "Bad Bunny",
    "Becky G",
    "Culcha Candela",
    "Daddy Yankee",
    "Enrique Iglesias",
    "Farruko",
    "Gloria Estefan",
    "J Balvin",
    "Kali Uchis",
    "Karol G",
    "Los Del Rio",
    "Lou Bega",
    "Luis Fonsi",
    "Maluma",
    "Nicky Jam",
    "Nio García",
    "Ozuna",
    "Pedro Capó",
    "Pitbull",
    "Rema",
    "Ricky Martin",
    "Ritchie Valens",
    "Santana",
    "Sech",
    "Shakira",
    "Tyla",
  ].map(fold),
);

const SCHLAGER_ARTISTS = new Set(
  [
    "Andreas Bourani",
    "Baccara",
    "DJ Ötzi",
    "Drafi Deutscher",
    "Dschinghis Khan",
    "Echt",
    "Helene Fischer",
    "Howard Carpendale",
    "Ich + Ich",
    "Jennifer Rush",
    "Jürgen Drews",
    "Lena",
    "Marianne Rosenberg",
    "Mark Forster",
    "Matthias Reim",
    "Max Giesinger",
    "Modern Talking",
    "Namika",
    "Nicole",
    "Nino de Angelo",
    "No Angels",
    "Peter Maffay",
    "Pur",
    "Rex Gildo",
    "Roland Kaiser",
    "Rosenstolz",
    "Sarah Connor",
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
    "Bon Iver",
    "Chappell Roan",
    "Djo",
    "Florence + the Machine",
    "Foster the People",
    "Franz Ferdinand",
    "fun.",
    "Glass Animals",
    "Gotye",
    "Hozier",
    "Imagine Dragons",
    "Jack White",
    "Kings of Leon",
    "Lana Del Rey",
    "Lorde",
    "MGMT",
    "Milky Chance",
    "Noah Kahan",
    "Of Monsters and Men",
    "Passenger",
    "Phoenix",
    "Pixies",
    "R.E.M.",
    "Radiohead",
    "Tame Impala",
    "The 1975",
    "The Cranberries",
    "The Killers",
    "The Lumineers",
    "The Shins",
    "The Strokes",
    "The Verve",
    "The White Stripes",
    "Tracy Chapman",
    "Vampire Weekend",
    "alt-J",
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
    "A Boogie wit da Hoodie",
    "B.o.B",
    "Capital Bra",
    "Cardi B",
    "DaBaby",
    "French Montana",
    "Future",
    "Luciano",
    "Nicki Minaj",
    "Pop Smoke",
    "RAF Camora",
    "XXXTentacion",
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

export function songFitsPack(song: CatalogSong, pack: EraId, mix?: MixFilter): boolean {
  if (pack === "likes") return true;
  if (pack === "playlist") return false;
  if (pack === "mix") {
    const { start, end, genre } = mixBounds(mix);
    return song.year >= start && song.year <= end && matchesGenre(song, genre);
  }
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
}

export function songsForPack(pack: EraId, mix?: MixFilter): CatalogSong[] {
  if (pack === "playlist") return CATALOG;
  if (pack === "likes") return [];
  return CATALOG.filter((song) => songFitsPack(song, pack, mix));
}

export function songsForPacks(pack: EraId, extra?: EraId | null, mix?: MixFilter): CatalogSong[] {
  const primary = songsForPack(pack, mix);
  if (!extra || extra === pack || extra === "playlist" || extra === "likes") return primary;
  const seen = new Set(primary.map((song) => song.id));
  return primary.concat(songsForPack(extra, mix).filter((song) => !seen.has(song.id)));
}

export function packSize(pack: EraId, mix?: MixFilter): number {
  if (pack === "playlist") return 0;
  return songsForPack(pack, mix).length;
}
