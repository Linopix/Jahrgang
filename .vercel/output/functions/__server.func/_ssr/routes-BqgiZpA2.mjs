import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as DialogOverlay, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as User, c as Plus, d as Minus, f as Disc3, i as Users, l as Play, n as VolumeX, r as Volume2, s as RotateCcw, t as X, u as Pause } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BqgiZpA2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 active:enabled:scale-95", {
	variants: {
		variant: {
			primary: "bg-primary text-primary-fg shadow-border hover:opacity-95",
			secondary: "bg-raised text-fg shadow-border hover:bg-surface",
			ghost: "bg-transparent text-fg hover:bg-raised",
			danger: "bg-danger text-fg hover:opacity-90"
		},
		size: {
			sm: "h-10 rounded-sm px-3.5 text-sm",
			md: "h-12 rounded-md px-5 text-sm",
			lg: "h-14 rounded-lg px-6 text-base",
			icon: "size-12 rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
var Button = (0, import_react.forwardRef)(({ className, variant, size, type = "button", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
	ref,
	type,
	className: cn(buttonVariants({
		variant,
		size
	}), className),
	...props
}));
Button.displayName = "Button";
var sizes = {
	sm: "size-24",
	md: "size-36 sm:size-52",
	lg: "size-56 sm:size-72"
};
function Vinyl({ spinning, size = "md", label = "JAHRGANG", artworkUrl }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative", sizes[size]),
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("vinyl-disc size-full rounded-full", spinning && "vinyl-spin") }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-[28%] overflow-hidden rounded-full bg-card",
				children: artworkUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: artworkUrl,
					alt: "",
					className: "size-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex size-full items-center justify-center px-2 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-[0.65rem] font-medium tracking-[0.18em] text-card-fg uppercase",
						children: label
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgb(0_0_0_/_0.35)]" })
		]
	});
}
var ROWS = [
	[
		"Rock Around the Clock",
		"Bill Haley & His Comets",
		1954
	],
	[
		"Hound Dog",
		"Elvis Presley",
		1956
	],
	[
		"Jailhouse Rock",
		"Elvis Presley",
		1957
	],
	[
		"Johnny B. Goode",
		"Chuck Berry",
		1958
	],
	[
		"What'd I Say",
		"Ray Charles",
		1959
	],
	[
		"The Twist",
		"Chubby Checker",
		1960
	],
	[
		"Stand by Me",
		"Ben E. King",
		1961
	],
	[
		"I Want to Hold Your Hand",
		"The Beatles",
		1963
	],
	[
		"She Loves You",
		"The Beatles",
		1963
	],
	[
		"(I Can't Get No) Satisfaction",
		"The Rolling Stones",
		1965
	],
	[
		"Help!",
		"The Beatles",
		1965
	],
	[
		"My Generation",
		"The Who",
		1965
	],
	[
		"Good Vibrations",
		"The Beach Boys",
		1966
	],
	[
		"Paint It, Black",
		"The Rolling Stones",
		1966
	],
	[
		"Respect",
		"Aretha Franklin",
		1967
	],
	[
		"Light My Fire",
		"The Doors",
		1967
	],
	[
		"A Whiter Shade of Pale",
		"Procol Harum",
		1967
	],
	[
		"Hey Jude",
		"The Beatles",
		1968
	],
	[
		"All Along the Watchtower",
		"Jimi Hendrix",
		1968
	],
	[
		"I Heard It Through the Grapevine",
		"Marvin Gaye",
		1968
	],
	[
		"Whole Lotta Love",
		"Led Zeppelin",
		1969
	],
	[
		"Come Together",
		"The Beatles",
		1969
	],
	[
		"Let It Be",
		"The Beatles",
		1970
	],
	[
		"Your Song",
		"Elton John",
		1970
	],
	[
		"Imagine",
		"John Lennon",
		1971
	],
	[
		"Stairway to Heaven",
		"Led Zeppelin",
		1971
	],
	[
		"Superstition",
		"Stevie Wonder",
		1972
	],
	[
		"Smoke on the Water",
		"Deep Purple",
		1972
	],
	[
		"Angie",
		"The Rolling Stones",
		1973
	],
	[
		"Autobahn",
		"Kraftwerk",
		1974,
		1
	],
	[
		"Bohemian Rhapsody",
		"Queen",
		1975
	],
	[
		"Wish You Were Here",
		"Pink Floyd",
		1975
	],
	[
		"Dancing Queen",
		"ABBA",
		1976
	],
	[
		"Hotel California",
		"Eagles",
		1977
	],
	[
		"Stayin' Alive",
		"Bee Gees",
		1977
	],
	[
		"We Are the Champions",
		"Queen",
		1977
	],
	[
		"Y.M.C.A.",
		"Village People",
		1978
	],
	[
		"Heart of Glass",
		"Blondie",
		1978
	],
	[
		"Another Brick in the Wall, Pt. 2",
		"Pink Floyd",
		1979
	],
	[
		"Don't Stop Believin'",
		"Journey",
		1981
	],
	[
		"In the Air Tonight",
		"Phil Collins",
		1981
	],
	[
		"Tainted Love",
		"Soft Cell",
		1981
	],
	[
		"Da Da Da",
		"Trio",
		1982,
		1
	],
	[
		"Billie Jean",
		"Michael Jackson",
		1983
	],
	[
		"Every Breath You Take",
		"The Police",
		1983
	],
	[
		"99 Luftballons",
		"Nena",
		1983,
		1
	],
	[
		"Sonderzug nach Pankow",
		"Udo Lindenberg",
		1983,
		1
	],
	[
		"Relax",
		"Frankie Goes to Hollywood",
		1983
	],
	[
		"Like a Virgin",
		"Madonna",
		1984
	],
	[
		"When Doves Cry",
		"Prince",
		1984
	],
	[
		"Forever Young",
		"Alphaville",
		1984,
		1
	],
	[
		"Männer",
		"Herbert Grönemeyer",
		1984,
		1
	],
	[
		"Take On Me",
		"a-ha",
		1985
	],
	[
		"Rock Me Amadeus",
		"Falco",
		1985,
		1
	],
	[
		"You're My Heart, You're My Soul",
		"Modern Talking",
		1985,
		1
	],
	[
		"Summer of '69",
		"Bryan Adams",
		1985
	],
	[
		"Livin' on a Prayer",
		"Bon Jovi",
		1986
	],
	[
		"The Final Countdown",
		"Europe",
		1986
	],
	[
		"Walk Like an Egyptian",
		"The Bangles",
		1986
	],
	[
		"Sweet Child o' Mine",
		"Guns N' Roses",
		1987
	],
	[
		"I Wanna Dance with Somebody",
		"Whitney Houston",
		1987
	],
	[
		"Never Gonna Give You Up",
		"Rick Astley",
		1987
	],
	[
		"Freiheit",
		"Westernhagen",
		1987,
		1
	],
	[
		"With or Without You",
		"U2",
		1987
	],
	[
		"Fast Car",
		"Tracy Chapman",
		1988
	],
	[
		"Hier kommt Alex",
		"Die Toten Hosen",
		1988,
		1
	],
	[
		"Like a Prayer",
		"Madonna",
		1989
	],
	[
		"Wind of Change",
		"Scorpions",
		1990,
		1
	],
	[
		"Nothing Compares 2 U",
		"Sinéad O'Connor",
		1990
	],
	[
		"The Power",
		"Snap!",
		1990,
		1
	],
	[
		"Smells Like Teen Spirit",
		"Nirvana",
		1991
	],
	[
		"Black or White",
		"Michael Jackson",
		1991
	],
	[
		"I Will Always Love You",
		"Whitney Houston",
		1992
	],
	[
		"Under the Bridge",
		"Red Hot Chili Peppers",
		1992
	],
	[
		"Killing in the Name",
		"Rage Against the Machine",
		1992
	],
	[
		"What's Up?",
		"4 Non Blondes",
		1993
	],
	[
		"Mr. Vain",
		"Culture Beat",
		1993,
		1
	],
	[
		"Die da!?",
		"Die Fantastischen Vier",
		1993,
		1
	],
	[
		"Linger",
		"The Cranberries",
		1993
	],
	[
		"Zombie",
		"The Cranberries",
		1994
	],
	[
		"Wonderwall",
		"Oasis",
		1995
	],
	[
		"Gangsta's Paradise",
		"Coolio",
		1995
	],
	[
		"You Oughta Know",
		"Alanis Morissette",
		1995
	],
	[
		"Abenteuerland",
		"Pur",
		1995,
		1
	],
	[
		"Wannabe",
		"Spice Girls",
		1996
	],
	[
		"Macarena",
		"Los Del Rio",
		1996
	],
	[
		"Bitter Sweet Symphony",
		"The Verve",
		1997
	],
	[
		"MMMBop",
		"Hanson",
		1997
	],
	[
		"Du Hast",
		"Rammstein",
		1997,
		1
	],
	[
		"Believe",
		"Cher",
		1998
	],
	[
		"...Baby One More Time",
		"Britney Spears",
		1998
	],
	[
		"How Much Is the Fish?",
		"Scooter",
		1998,
		1
	],
	[
		"My Heart Will Go On",
		"Celine Dion",
		1998
	],
	[
		"Californication",
		"Red Hot Chili Peppers",
		1999
	],
	[
		"I Want It That Way",
		"Backstreet Boys",
		1999
	],
	[
		"Smooth",
		"Santana",
		1999
	],
	[
		"The Real Slim Shady",
		"Eminem",
		2e3
	],
	[
		"Yellow",
		"Coldplay",
		2e3
	],
	[
		"Bye Bye Bye",
		"NSYNC",
		2e3
	],
	[
		"Daylight in Your Eyes",
		"No Angels",
		2001,
		1
	],
	[
		"Fallin'",
		"Alicia Keys",
		2001
	],
	[
		"Can't Get You Out of My Head",
		"Kylie Minogue",
		2001
	],
	[
		"Whenever, Wherever",
		"Shakira",
		2001
	],
	[
		"Lose Yourself",
		"Eminem",
		2002
	],
	[
		"The Scientist",
		"Coldplay",
		2002
	],
	[
		"A Thousand Miles",
		"Vanessa Carlton",
		2002
	],
	[
		"Hey Ya!",
		"OutKast",
		2003
	],
	[
		"Crazy in Love",
		"Beyoncé",
		2003
	],
	[
		"In da Club",
		"50 Cent",
		2003
	],
	[
		"Yeah!",
		"Usher",
		2004
	],
	[
		"This Love",
		"Maroon 5",
		2004
	],
	[
		"Perfekte Welle",
		"Juli",
		2004,
		1
	],
	[
		"Boulevard of Broken Dreams",
		"Green Day",
		2004
	],
	[
		"Feel Good Inc.",
		"Gorillaz",
		2005
	],
	[
		"You're Beautiful",
		"James Blunt",
		2005
	],
	[
		"Gold Digger",
		"Kanye West",
		2005
	],
	[
		"Durch den Monsun",
		"Tokio Hotel",
		2005,
		1
	],
	[
		"Nur ein Wort",
		"Wir sind Helden",
		2005,
		1
	],
	[
		"Crazy",
		"Gnarls Barkley",
		2006
	],
	[
		"Hips Don't Lie",
		"Shakira",
		2006
	],
	[
		"Das Beste",
		"Silbermond",
		2006,
		1
	],
	[
		"Umbrella",
		"Rihanna",
		2007
	],
	[
		"Rehab",
		"Amy Winehouse",
		2007
	],
	[
		"Hamma!",
		"Culcha Candela",
		2007,
		1
	],
	[
		"Vom selben Stern",
		"Ich + Ich",
		2007,
		1
	],
	[
		"Viva la Vida",
		"Coldplay",
		2008
	],
	[
		"Poker Face",
		"Lady Gaga",
		2008
	],
	[
		"I Kissed a Girl",
		"Katy Perry",
		2008
	],
	[
		"Haus am See",
		"Peter Fox",
		2008,
		1
	],
	[
		"I Gotta Feeling",
		"The Black Eyed Peas",
		2009
	],
	[
		"Bad Romance",
		"Lady Gaga",
		2009
	],
	[
		"Use Somebody",
		"Kings of Leon",
		2008
	],
	[
		"Rolling in the Deep",
		"Adele",
		2010
	],
	[
		"Satellite",
		"Lena",
		2010,
		1
	],
	[
		"Geboren um zu leben",
		"Unheilig",
		2010,
		1
	],
	[
		"Just the Way You Are",
		"Bruno Mars",
		2010
	],
	[
		"Party Rock Anthem",
		"LMFAO",
		2011
	],
	[
		"Somebody That I Used to Know",
		"Gotye",
		2011
	],
	[
		"Rolling in the Deep",
		"Adele",
		2010
	],
	[
		"Easy",
		"Cro",
		2011,
		1
	],
	[
		"Call Me Maybe",
		"Carly Rae Jepsen",
		2011
	],
	[
		"We Are Young",
		"fun.",
		2011
	],
	[
		"Gangnam Style",
		"PSY",
		2012
	],
	[
		"Somebody That I Used to Know",
		"Gotye",
		2011
	],
	[
		"Diamonds",
		"Rihanna",
		2012
	],
	[
		"Locked Out of Heaven",
		"Bruno Mars",
		2012
	],
	[
		"Get Lucky",
		"Daft Punk",
		2013
	],
	[
		"Happy",
		"Pharrell Williams",
		2013
	],
	[
		"Stolen Dance",
		"Milky Chance",
		2013,
		1
	],
	[
		"Atemlos durch die Nacht",
		"Helene Fischer",
		2013,
		1
	],
	[
		"Willst du",
		"Alligatoah",
		2013,
		1
	],
	[
		"All of Me",
		"John Legend",
		2013
	],
	[
		"Uptown Funk",
		"Mark Ronson",
		2014
	],
	[
		"Shake It Off",
		"Taylor Swift",
		2014
	],
	[
		"Auf uns",
		"Andreas Bourani",
		2014,
		1
	],
	[
		"Chandelier",
		"Sia",
		2014
	],
	[
		"Hello",
		"Adele",
		2015
	],
	[
		"Sorry",
		"Justin Bieber",
		2015
	],
	[
		"See You Again",
		"Wiz Khalifa",
		2015
	],
	[
		"Lieblingsmensch",
		"Namika",
		2015,
		1
	],
	[
		"Chöre",
		"Mark Forster",
		2015,
		1
	],
	[
		"One Dance",
		"Drake",
		2016
	],
	[
		"Cheap Thrills",
		"Sia",
		2016
	],
	[
		"Can't Stop the Feeling!",
		"Justin Timberlake",
		2016
	],
	[
		"Shape of You",
		"Ed Sheeran",
		2017
	],
	[
		"Despacito",
		"Luis Fonsi",
		2017
	],
	[
		"HUMBLE.",
		"Kendrick Lamar",
		2017
	],
	[
		"Musik sein",
		"Wincent Weiss",
		2016,
		1
	],
	[
		"God's Plan",
		"Drake",
		2018
	],
	[
		"Shallow",
		"Lady Gaga",
		2018
	],
	[
		"Old Town Road",
		"Lil Nas X",
		2019
	],
	[
		"bad guy",
		"Billie Eilish",
		2019
	],
	[
		"Blinding Lights",
		"The Weeknd",
		2019
	],
	[
		"Dance Monkey",
		"Tones and I",
		2019
	],
	[
		"Roller",
		"Apache 207",
		2019,
		1
	],
	[
		"Dynamite",
		"BTS",
		2020
	],
	[
		"Watermelon Sugar",
		"Harry Styles",
		2020
	],
	[
		"drivers license",
		"Olivia Rodrigo",
		2021
	],
	[
		"Levitating",
		"Dua Lipa",
		2020
	],
	[
		"Heat Waves",
		"Glass Animals",
		2020
	],
	[
		"Stay",
		"The Kid LAROI",
		2021
	],
	[
		"As It Was",
		"Harry Styles",
		2022
	],
	[
		"Anti-Hero",
		"Taylor Swift",
		2022
	],
	[
		"About Damn Time",
		"Lizzo",
		2022
	],
	[
		"Wildberry Lillet",
		"Nina Chuba",
		2022,
		1
	],
	[
		"Flowers",
		"Miley Cyrus",
		2023
	],
	[
		"Vampire",
		"Olivia Rodrigo",
		2023
	],
	[
		"Lose Control",
		"Teddy Swims",
		2023
	],
	[
		"Espresso",
		"Sabrina Carpenter",
		2024
	],
	[
		"Beautiful Things",
		"Benson Boone",
		2024
	],
	[
		"Fortnight",
		"Taylor Swift",
		2024
	],
	[
		"Die with a Smile",
		"Lady Gaga",
		2024
	]
];
function slug(title, artist, year) {
	return `${artist}-${title}-${year}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
var seen = /* @__PURE__ */ new Set();
var CATALOG = ROWS.flatMap(([title, artist, year, german]) => {
	const id = slug(title, artist, year);
	if (seen.has(id)) return [];
	seen.add(id);
	return [{
		id,
		title,
		artist,
		year,
		german: german === 1
	}];
});
function songsForEra(era) {
	return CATALOG.filter((song) => {
		if (era === "all") return true;
		if (era === "german") return Boolean(song.german);
		if (era === "classic") return song.year <= 1979;
		if (era === "eighties") return song.year >= 1980 && song.year <= 1989;
		if (era === "nineties") return song.year >= 1990 && song.year <= 1999;
		if (era === "two-thousands") return song.year >= 2e3 && song.year <= 2009;
		if (era === "today") return song.year >= 2010;
		return true;
	});
}
function fisherYates(items) {
	const next = items.slice();
	for (let i = next.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const a = next[i];
		const b = next[j];
		if (a === void 0 || b === void 0) continue;
		next[i] = b;
		next[j] = a;
	}
	return next;
}
function canPlace(timeline, index, year) {
	if (index < 0 || index > timeline.length) return false;
	const left = timeline[index - 1];
	const right = timeline[index];
	if (left && year < left.year) return false;
	if (right && year > right.year) return false;
	return true;
}
function insertSong(timeline, index, song) {
	const next = timeline.slice();
	next.splice(index, 0, song);
	return next;
}
function decadeLabel(year) {
	return `${Math.floor(year / 10) * 10}er`;
}
function winner(players, target) {
	return players.find((player) => player.timeline.length >= target) ?? null;
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var resolvePreviews = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("2df0dfe1a846dc2f28b2c6729c76fc68d60aa6292ba063e0c489c46c7bfbaf2b"));
var music = null;
var ctx = null;
var master = null;
var volume = .85;
var muted = false;
function ensureMusic() {
	if (music) return music;
	music = new Audio();
	music.preload = "auto";
	applyVolume();
	return music;
}
function ensureCtx() {
	if (ctx) return ctx;
	ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
	master = ctx.createGain();
	master.connect(ctx.destination);
	applyVolume();
	return ctx;
}
function gainValue() {
	if (muted) return 0;
	return volume * volume;
}
function applyVolume() {
	const g = gainValue();
	if (music) music.volume = g;
	if (master && ctx) master.gain.setTargetAtTime(g, ctx.currentTime, .02);
}
function unlockAudio() {
	ensureMusic();
	const audioCtx = ensureCtx();
	if (audioCtx.state === "suspended") audioCtx.resume();
}
function setMasterVolume(next) {
	volume = Math.min(1, Math.max(0, next));
	applyVolume();
}
function setMuted(next) {
	muted = next;
	applyVolume();
}
function isMuted() {
	return muted;
}
function playPreview(url) {
	const el = ensureMusic();
	if (el.src !== url) el.src = url;
	el.currentTime = 0;
	return el.play();
}
function pausePreview() {
	music?.pause();
}
function stopPreview() {
	if (!music) return;
	music.pause();
	music.removeAttribute("src");
	music.load();
}
function getMusicElement() {
	return ensureMusic();
}
function beep(freq, duration, type, when = 0, gain = .12) {
	const audioCtx = ensureCtx();
	if (!master) return;
	const osc = audioCtx.createOscillator();
	const g = audioCtx.createGain();
	osc.type = type;
	osc.frequency.value = freq;
	const start = audioCtx.currentTime + when;
	g.gain.setValueAtTime(1e-4, start);
	g.gain.exponentialRampToValueAtTime(gain, start + .012);
	g.gain.exponentialRampToValueAtTime(1e-4, start + duration);
	osc.connect(g);
	g.connect(master);
	osc.start(start);
	osc.stop(start + duration + .02);
}
function sfxCorrect() {
	beep(523.25, .14, "triangle", 0, .1);
	beep(659.25, .18, "triangle", .09, .1);
	beep(783.99, .28, "sine", .18, .08);
}
function sfxWrong() {
	beep(196, .22, "sawtooth", 0, .06);
	beep(146.83, .32, "triangle", .08, .08);
}
function sfxPlace() {
	beep(880, .06, "square", 0, .04);
}
function sfxWin() {
	beep(523.25, .16, "triangle", 0, .1);
	beep(659.25, .16, "triangle", .12, .1);
	beep(783.99, .16, "triangle", .24, .1);
	beep(1046.5, .4, "sine", .36, .09);
}
var ERA_LABELS = {
	all: "Alles",
	classic: "Klassiker · bis 1979",
	eighties: "1980er",
	nineties: "1990er",
	"two-thousands": "2000er",
	today: "2010 bis heute",
	german: "Deutsch"
};
var TARGET_OPTIONS = [
	6,
	8,
	10
];
var POOL_SIZE = 40;
function makePlayers(names, starters) {
	return names.map((name, i) => ({
		id: `p-${i}`,
		name: name.trim() || `Spieler ${i + 1}`,
		timeline: starters[i] ? [starters[i]] : [],
		tokens: 2,
		misses: 0
	}));
}
function isOver(players, target, mode) {
	if (winner(players, target)) return true;
	if (mode === "solo" && (players[0]?.misses ?? 0) >= 3) return true;
	return false;
}
var useGame = create((set, get) => ({
	phase: "home",
	mode: "party",
	era: "all",
	target: 8,
	players: [],
	currentPlayerIndex: 0,
	deck: [],
	current: null,
	selectedSlot: null,
	lastResult: null,
	decadeHint: null,
	loadProgress: {
		done: 0,
		total: 1
	},
	loadError: null,
	rulesOpen: false,
	volume: .85,
	muted: false,
	openSetup: (mode) => {
		stopPreview();
		set({
			phase: "setup",
			mode,
			loadError: null,
			current: null,
			lastResult: null
		});
	},
	openHome: () => {
		stopPreview();
		set({
			phase: "home",
			players: [],
			deck: [],
			current: null,
			lastResult: null,
			selectedSlot: null,
			decadeHint: null,
			loadError: null
		});
	},
	setRulesOpen: (open) => set({ rulesOpen: open }),
	startGame: async (config) => {
		unlockAudio();
		set({
			phase: "loading",
			mode: config.mode,
			era: config.era,
			target: config.target,
			loadProgress: {
				done: 0,
				total: POOL_SIZE
			},
			loadError: null
		});
		try {
			const names = config.mode === "solo" ? [config.names[0]?.trim() || "Du"] : config.names.filter((name) => name.trim()).slice(0, 8);
			const playerCount = Math.max(1, names.length);
			const needed = Math.min(POOL_SIZE, playerCount + Math.max(config.target + 4, 10));
			const pool = fisherYates(songsForEra(config.era));
			const resolved = [];
			const seen = /* @__PURE__ */ new Set();
			set({ loadProgress: {
				done: 0,
				total: needed
			} });
			for (let i = 0; i < pool.length && resolved.length < needed; i += 8) {
				const slice = pool.slice(i, i + 8).filter((song) => !seen.has(song.id));
				slice.forEach((song) => seen.add(song.id));
				if (slice.length === 0) continue;
				const results = await resolvePreviews({ data: { queries: slice } });
				for (const result of results) {
					if (!result.previewUrl) continue;
					const song = slice.find((row) => row.id === result.id);
					if (!song) continue;
					resolved.push({
						...song,
						previewUrl: result.previewUrl,
						artworkUrl: result.artworkUrl ?? void 0
					});
				}
				set({ loadProgress: {
					done: Math.min(resolved.length, needed),
					total: needed
				} });
			}
			if (resolved.length < playerCount + 4) {
				set({
					phase: "setup",
					loadError: "Zu wenige Songs mit Vorschau gefunden. Anderes Repertoire wählen oder später nochmal versuchen."
				});
				return;
			}
			const starters = resolved.slice(0, playerCount);
			const deck = resolved.slice(playerCount);
			const players = makePlayers(names, starters);
			const current = deck[0] ?? null;
			set({
				players,
				deck: deck.slice(1),
				current,
				currentPlayerIndex: 0,
				selectedSlot: null,
				lastResult: null,
				decadeHint: null,
				phase: "listen",
				loadProgress: {
					done: resolved.length,
					total: resolved.length
				}
			});
			if (current) playPreview(current.previewUrl);
		} catch {
			set({
				phase: "setup",
				loadError: "Vorschauen konnten nicht geladen werden. Verbindung prüfen und erneut starten."
			});
		}
	},
	selectSlot: (index) => {
		const { phase, current, players, currentPlayerIndex } = get();
		if (phase !== "listen" || !current) return;
		const player = players[currentPlayerIndex];
		if (!player) return;
		if (index < 0 || index > player.timeline.length) return;
		sfxPlace();
		set({ selectedSlot: index });
	},
	confirmPlacement: () => {
		const { phase, current, selectedSlot, players, currentPlayerIndex } = get();
		if (phase !== "listen" || !current || selectedSlot === null) return;
		const player = players[currentPlayerIndex];
		if (!player) return;
		pausePreview();
		const correct = canPlace(player.timeline, selectedSlot, current.year);
		const nextPlayers = players.map((row, i) => {
			if (i !== currentPlayerIndex) return row;
			if (correct) return {
				...row,
				timeline: insertSong(row.timeline, selectedSlot, current)
			};
			return {
				...row,
				misses: row.misses + 1
			};
		});
		if (correct) sfxCorrect();
		else sfxWrong();
		set({
			players: nextPlayers,
			lastResult: {
				correct,
				song: current,
				slot: selectedSlot
			},
			phase: "reveal",
			selectedSlot: null,
			decadeHint: null
		});
	},
	nextTurn: () => {
		const { phase, players, currentPlayerIndex, deck, mode, target, lastResult } = get();
		if (phase !== "reveal") return;
		stopPreview();
		if (isOver(players, target, mode) || deck.length === 0) {
			if (lastResult?.correct && winner(players, target)) sfxWin();
			set({
				phase: "winner",
				current: null
			});
			return;
		}
		const nextIndex = mode === "solo" ? 0 : (currentPlayerIndex + 1) % players.length;
		const current = deck[0] ?? null;
		set({
			currentPlayerIndex: nextIndex,
			deck: deck.slice(1),
			current,
			lastResult: null,
			selectedSlot: null,
			decadeHint: null,
			phase: "listen"
		});
		if (current) playPreview(current.previewUrl);
	},
	useDecade: () => {
		const { current, players, currentPlayerIndex, decadeHint, phase } = get();
		if (phase !== "listen" || !current || decadeHint) return;
		const player = players[currentPlayerIndex];
		if (!player || player.tokens <= 0) return;
		set({
			decadeHint: decadeLabel(current.year),
			players: players.map((row, i) => i === currentPlayerIndex ? {
				...row,
				tokens: row.tokens - 1
			} : row)
		});
	},
	useSkip: () => {
		const { phase, players, currentPlayerIndex, deck, current } = get();
		if (phase !== "listen" || !current || deck.length === 0) return;
		const player = players[currentPlayerIndex];
		if (!player || player.tokens <= 0) return;
		stopPreview();
		const leftover = current;
		const next = deck[0];
		if (!next) return;
		const rest = deck.slice(1);
		set({
			players: players.map((row, i) => i === currentPlayerIndex ? {
				...row,
				tokens: row.tokens - 1
			} : row),
			current: next,
			deck: [...rest, leftover],
			selectedSlot: null,
			decadeHint: null
		});
		playPreview(next.previewUrl);
	},
	replay: () => {
		const { current, phase } = get();
		if (!current || phase !== "listen") return;
		playPreview(current.previewUrl);
	}
}));
function currentPlayer(state) {
	return state.players[state.currentPlayerIndex] ?? null;
}
function HomeScreen() {
	const openSetup = useGame((s) => s.openSetup);
	const setRulesOpen = useGame((s) => s.setRulesOpen);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-between px-5 py-8 sm:py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "stagger-in flex flex-col items-center text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.28em] text-muted uppercase",
						children: "Musik-Zeitspiel"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 font-display text-5xl font-medium tracking-tight text-fg sm:text-7xl",
						children: "Jahrgang"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-md text-pretty text-base text-muted sm:text-lg",
						children: "Hits hören, auf die Zeitlinie legen. Wer die Karten in der richtigen Reihenfolge hat, gewinnt den Abend."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Vinyl, {
					size: "lg",
					spinning: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stagger-in mx-auto flex w-full max-w-sm flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						className: "w-full",
						onClick: () => {
							unlockAudio();
							openSetup("party");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" }), "Partyabend"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						variant: "secondary",
						className: "w-full",
						onClick: () => {
							unlockAudio();
							openSetup("solo");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-4" }), "Alleine spielen"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						variant: "ghost",
						className: "w-full",
						onClick: () => setRulesOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Disc3, { className: "size-4" }), "Spielregeln"]
					})
				]
			})
		]
	});
}
function LoadingScreen() {
	const progress = useGame((s) => s.loadProgress);
	const pct = Math.round(progress.done / Math.max(progress.total, 1) * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col items-center justify-center px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Vinyl, {
				spinning: true,
				size: "md"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-8 font-display text-3xl font-medium text-fg",
				children: "Nadel setzt auf"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-sm text-sm text-muted",
				children: "Songvorschauen werden geladen. Das dauert einen Moment."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 h-1 w-48 overflow-hidden rounded-full bg-raised",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-primary transition-[width] duration-300",
					style: { width: `${pct}%` }
				})
			})
		]
	});
}
function SongCard({ song, hidden, compact, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("relative flex flex-col justify-between overflow-hidden bg-card text-card-fg shadow-lift", compact ? "h-36 w-28 rounded-md p-2.5" : "h-52 w-40 rounded-lg p-3.5", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 top-0 h-1 bg-card-fg/10" }), hidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-[0.65rem] font-medium tracking-[0.22em] text-card-muted uppercase",
				children: "Jahrgang"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-1 items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-12 rounded-full bg-card-fg/10" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[0.7rem] text-card-muted",
				children: "Verdeckt"
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-[0.65rem] font-medium tracking-[0.22em] text-card-muted uppercase",
				children: "Jahr"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("font-display font-medium tabular-nums leading-none tracking-tight text-card-fg", compact ? "text-3xl" : "text-4xl"),
				children: song.year
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("truncate font-medium text-card-fg", compact ? "text-xs" : "text-sm"),
					children: song.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-[0.7rem] text-card-muted",
					children: song.artist
				})]
			})
		] })]
	});
}
function Timeline({ songs, selectedSlot, onSelectSlot, interactive = true }) {
	const slots = songs.length + 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-border" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "flex items-center gap-1 overflow-x-auto px-2 py-2 pb-3 [-ms-overflow-style:none] [scrollbar-width:thin]",
			children: Array.from({ length: slots }, (_, index) => {
				const song = songs[index];
				const selected = selectedSlot === index;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex shrink-0 items-center gap-1",
					children: [interactive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": `Platz ${index + 1} wählen`,
						onClick: () => onSelectSlot?.(index),
						className: cn("flex h-36 w-11 shrink-0 items-center justify-center rounded-sm border border-dashed transition-[background-color,border-color,transform] duration-150", selected ? "border-primary bg-primary/15 text-primary" : "border-border bg-raised/60 text-muted hover:border-primary/50 hover:text-fg"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "size-4",
							strokeWidth: 1.75
						})
					}) : null, song ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SongCard, {
						song,
						compact: true
					}) : null]
				}, `slot-${index}`);
			})
		})]
	});
}
function PlayScreen() {
	const players = useGame((s) => s.players);
	const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
	const current = useGame((s) => s.current);
	const selectedSlot = useGame((s) => s.selectedSlot);
	const decadeHint = useGame((s) => s.decadeHint);
	const target = useGame((s) => s.target);
	const mode = useGame((s) => s.mode);
	const deckLength = useGame((s) => s.deck.length);
	const selectSlot = useGame((s) => s.selectSlot);
	const confirmPlacement = useGame((s) => s.confirmPlacement);
	const useDecade = useGame((s) => s.useDecade);
	const useSkip = useGame((s) => s.useSkip);
	const replay = useGame((s) => s.replay);
	const openHome = useGame((s) => s.openHome);
	const setRulesOpen = useGame((s) => s.setRulesOpen);
	const player = currentPlayer({
		players,
		currentPlayerIndex
	});
	const [playing, setPlaying] = (0, import_react.useState)(true);
	const [muted, setMutedState] = (0, import_react.useState)(isMuted);
	const [progress, setProgress] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const el = getMusicElement();
		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		const onTime = () => {
			if (!el.duration) return;
			setProgress(el.currentTime / el.duration);
		};
		el.addEventListener("play", onPlay);
		el.addEventListener("pause", onPause);
		el.addEventListener("timeupdate", onTime);
		el.addEventListener("ended", onPause);
		return () => {
			el.removeEventListener("play", onPlay);
			el.removeEventListener("pause", onPause);
			el.removeEventListener("timeupdate", onTime);
			el.removeEventListener("ended", onPause);
		};
	}, [current?.id]);
	if (!player || !current) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex h-dvh w-full max-w-5xl flex-col overflow-hidden px-4 pb-[env(safe-area-inset-bottom)] pt-4 sm:px-6 sm:pt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: openHome,
					className: "font-display text-lg tracking-tight text-fg",
					children: "Jahrgang"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 px-2 text-sm text-muted hover:text-fg",
						onClick: () => setRulesOpen(true),
						children: "Regeln"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": muted ? "Ton an" : "Stummschalten",
						className: "flex size-11 items-center justify-center rounded-md text-muted hover:text-fg",
						onClick: () => {
							const next = !muted;
							setMuted(next);
							setMutedState(next);
						},
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
					})]
				})]
			}),
			mode === "party" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-3 flex gap-2 overflow-x-auto pb-1",
				children: players.map((row, i) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: cn("flex min-w-28 shrink-0 flex-col rounded-md px-3 py-2", i === currentPlayerIndex ? "bg-primary text-primary-fg" : "bg-raised text-fg shadow-border"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate text-sm font-medium",
							children: row.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs tabular-nums opacity-70",
							children: [
								row.timeline.length,
								"/",
								target
							]
						})]
					}, row.id);
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted",
				children: [
					"Karten ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular-nums text-fg",
						children: [
							player.timeline.length,
							"/",
							target
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mx-2 text-subtle",
						children: "·"
					}),
					"Fehler ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular-nums text-fg",
						children: [player.misses, "/3"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-3 flex min-h-0 flex-1 flex-col items-center overflow-y-auto text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.22em] text-muted uppercase",
						children: "Am Zug"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-3xl font-medium text-fg sm:text-5xl",
						children: player.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-md text-sm text-muted",
						children: "Höre den Hit und lege ihn auf deine Zeitlinie. Links ist früher, rechts ist später."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Vinyl, {
							spinning: playing,
							artworkUrl: current.artworkUrl,
							size: "md"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 h-1 w-48 overflow-hidden rounded-full bg-raised",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-primary transition-[width] duration-150",
							style: { width: `${Math.round(progress * 100)}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								size: "icon",
								className: "size-11",
								"aria-label": playing ? "Pause" : "Abspielen",
								onClick: () => {
									unlockAudio();
									if (playing) pausePreview();
									else replay();
								},
								children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "ml-0.5 size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								size: "icon",
								className: "size-11",
								"aria-label": "Nochmal",
								onClick: replay,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: 1,
								step: .01,
								defaultValue: .85,
								"aria-label": "Lautstärke",
								className: "hidden h-11 w-24 accent-primary sm:block",
								onChange: (event) => setMasterVolume(Number(event.target.value))
							})
						]
					}),
					decadeHint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 rounded-full bg-raised px-3 py-1.5 text-sm text-fg shadow-border",
						children: ["Jahrzehnt: ", decadeHint]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							size: "sm",
							disabled: player.tokens <= 0 || Boolean(decadeHint),
							onClick: useDecade,
							children: ["Jahrzehnt · ", player.tokens]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							size: "sm",
							disabled: player.tokens <= 0 || deckLength === 0,
							onClick: useSkip,
							children: "Überspringen"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-3 shrink-0 rounded-t-xl bg-surface p-3 shadow-border sm:rounded-xl sm:p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center justify-between px-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs font-medium tracking-[0.18em] text-muted uppercase",
							children: ["Zeitlinie von ", player.name]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-subtle",
							children: "früh → spät"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timeline, {
						songs: player.timeline,
						selectedSlot,
						onSelectSlot: selectSlot
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						className: "mt-3 w-full",
						disabled: selectedSlot === null,
						onClick: confirmPlacement,
						children: "Hier ablegen"
					})
				]
			})
		]
	});
}
function RevealScreen() {
	const lastResult = useGame((s) => s.lastResult);
	const nextTurn = useGame((s) => s.nextTurn);
	const players = useGame((s) => s.players);
	const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
	const mode = useGame((s) => s.mode);
	if (!lastResult) return null;
	const player = players[currentPlayerIndex];
	const nextName = mode === "solo" ? player?.name : players[(currentPlayerIndex + 1) % players.length]?.name;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-5 py-10 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("text-xs font-medium tracking-[0.24em] uppercase", lastResult.correct ? "text-success" : "text-danger"),
				children: lastResult.correct ? "Sitzt" : "Daneben"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl font-medium text-fg",
				children: lastResult.correct ? "Richtig gelegt" : "Falscher Platz"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: lastResult.correct ? "Die Karte bleibt auf der Zeitlinie." : "Die Karte wandert zurück. Nächste Runde."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SongCard, { song: lastResult.song })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 max-w-sm text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg",
						children: lastResult.song.title
					}),
					" · ",
					lastResult.song.artist
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "lg",
				className: "mt-10 w-full max-w-xs",
				onClick: nextTurn,
				children: nextName ? `Weiter · ${nextName}` : "Weiter"
			})
		]
	});
}
var STEPS = [
	{
		n: "01",
		title: "Start",
		body: "Jeder bekommt eine offene Karte. Das ist der Anfang der eigenen Zeitlinie – links früh, rechts spät."
	},
	{
		n: "02",
		title: "Hören",
		body: "Ein neuer Hit spielt. Du siehst weder Titel noch Jahr. Erkennen ist erlaubt, das Jahr musst du einordnen."
	},
	{
		n: "03",
		title: "Legen",
		body: "Tippe den Platz vor, zwischen oder hinter deinen Karten. Du musst nicht das genaue Jahr wissen – nur, ob der Song früher oder später kommt."
	},
	{
		n: "04",
		title: "Aufdecken",
		body: "Stimmt die Lage, bleibt die Karte. Liegt sie falsch, wandert sie weg. Gleiches Jahr darf direkt davor oder danach liegen."
	},
	{
		n: "05",
		title: "Joker",
		body: "Zwei Joker pro Person: Jahrzehnt anzeigen oder den Song überspringen. Wer zuerst das Ziel erreicht, ist der Jahrgang."
	}
];
function RulesDialog({ open, onOpenChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-bg/80" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "fixed inset-x-3 top-1/2 z-50 max-h-[min(36rem,calc(100dvh-2rem))] w-auto max-w-lg -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-5 shadow-lift sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:p-7",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 flex items-start justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-display text-2xl font-medium text-fg",
					children: "So wird gespielt"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "mt-1 text-sm text-muted",
					children: "Wie Hitster, nur ohne Kartenstapel und ohne App-Scan."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						"aria-label": "Schließen",
						className: "size-10 shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "space-y-4",
				children: STEPS.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "grid grid-cols-[auto_1fr] gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-sm tabular-nums text-subtle",
						children: step.n
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium text-fg",
						children: step.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: step.body
					})] })]
				}, step.n))
			})]
		})] })
	});
}
var ERAS = Object.keys(ERA_LABELS);
var PARTY_NAMES = [
	"Alex",
	"Sam",
	"Kim",
	"Jo",
	"Mo",
	"Lee",
	"Nik",
	"Rae"
];
function SetupScreen() {
	const mode = useGame((s) => s.mode);
	const loadError = useGame((s) => s.loadError);
	const startGame = useGame((s) => s.startGame);
	const openHome = useGame((s) => s.openHome);
	const [count, setCount] = (0, import_react.useState)(mode === "solo" ? 1 : 3);
	const [names, setNames] = (0, import_react.useState)(mode === "solo" ? ["Du"] : PARTY_NAMES);
	const [target, setTarget] = (0, import_react.useState)(8);
	const [era, setEra] = (0, import_react.useState)("all");
	const visibleNames = (0, import_react.useMemo)(() => mode === "solo" ? names.slice(0, 1) : names.slice(0, count), [
		mode,
		names,
		count
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: openHome,
				className: "self-start text-sm text-muted transition-colors hover:text-fg",
				children: "Zurück"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 font-display text-4xl font-medium text-fg",
				children: mode === "solo" ? "Solo" : "Partyabend"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: mode === "solo" ? "Drei Fehler, dann ist Schluss. Schaffe das Ziel auf einer Zeitlinie." : "Ein Bildschirm, reihum legen. Der aktuelle Name steht groß – Gerät weitergeben."
			}),
			mode === "party" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium text-fg",
						children: "Spieler"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								size: "icon",
								className: "size-10",
								"aria-label": "Weniger Spieler",
								disabled: count <= 2,
								onClick: () => setCount((n) => Math.max(2, n - 1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-6 text-center tabular-nums",
								children: count
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								size: "icon",
								className: "size-10",
								"aria-label": "Mehr Spieler",
								disabled: count >= 8,
								onClick: () => setCount((n) => Math.min(8, n + 1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
							})
						]
					})]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-6 space-y-2",
				children: visibleNames.map((name, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "sr-only",
						children: ["Name ", i + 1]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: name,
						onChange: (event) => {
							const next = names.slice();
							next[i] = event.target.value;
							setNames(next);
						},
						className: "h-12 w-full rounded-md bg-raised px-4 text-sm text-fg shadow-border outline-none transition-[box-shadow] focus:ring-2 focus:ring-primary/70",
						maxLength: 18
					})]
				}, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium text-fg",
					children: "Ziel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-3 gap-2",
					children: TARGET_OPTIONS.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setTarget(value),
						className: cn("h-12 rounded-md text-sm font-medium transition-colors", target === value ? "bg-primary text-primary-fg" : "bg-raised text-fg shadow-border hover:bg-surface"),
						children: [value, " Karten"]
					}, value))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium text-fg",
					children: "Repertoire"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: ERAS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setEra(id),
						className: cn("h-10 rounded-full px-3.5 text-sm transition-colors", era === id ? "bg-primary text-primary-fg" : "bg-raised text-muted shadow-border hover:text-fg"),
						children: ERA_LABELS[id]
					}, id))
				})]
			}),
			loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 rounded-md bg-danger/15 px-3 py-2 text-sm text-fg",
				children: loadError
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "lg",
				className: "mt-10 w-full",
				onClick: () => void startGame({
					mode,
					names: visibleNames,
					target,
					era
				}),
				children: "Platte auflegen"
			})
		]
	});
}
function WinnerScreen() {
	const players = useGame((s) => s.players);
	const target = useGame((s) => s.target);
	const mode = useGame((s) => s.mode);
	const openSetup = useGame((s) => s.openSetup);
	const openHome = useGame((s) => s.openHome);
	const champ = [...players].sort((a, b) => b.timeline.length - a.timeline.length)[0];
	const soloFailed = mode === "solo" && (champ?.misses ?? 0) >= 3 && (champ?.timeline.length ?? 0) < target;
	const title = soloFailed ? "Platte zu Ende" : champ ? `${champ.name} ist der Jahrgang` : "Ende";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-5 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Vinyl, { size: "sm" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-xs font-medium tracking-[0.24em] text-muted uppercase",
						children: soloFailed ? "Drei Fehler" : "Gewonnen"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl font-medium text-fg sm:text-5xl",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-md text-sm text-muted",
						children: soloFailed ? `${champ?.timeline.length ?? 0} von ${target} Karten. Nochmal auflegen und die Jahre schärfer hören.` : `${champ?.timeline.length ?? 0} Hits in der richtigen Reihenfolge.`
					})
				]
			}),
			champ ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 rounded-xl bg-surface p-4 shadow-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 px-1 text-xs font-medium tracking-[0.18em] text-muted uppercase",
					children: "Zeitlinie"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timeline, {
					songs: champ.timeline,
					selectedSlot: null,
					interactive: false
				})]
			}) : null,
			mode === "party" && players.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-6 space-y-2",
				children: players.slice().sort((a, b) => b.timeline.length - a.timeline.length).map((player) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between rounded-md bg-raised px-4 py-3 text-sm shadow-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium text-fg",
						children: player.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular-nums text-muted",
						children: [
							player.timeline.length,
							"/",
							target
						]
					})]
				}, player.id))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 flex flex-col gap-3 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					className: "flex-1",
					onClick: () => openSetup(mode),
					children: "Nochmal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					variant: "secondary",
					className: "flex-1",
					onClick: openHome,
					children: "Zum Start"
				})]
			})
		]
	});
}
function GameApp() {
	const phase = useGame((s) => s.phase);
	const rulesOpen = useGame((s) => s.rulesOpen);
	const setRulesOpen = useGame((s) => s.setRulesOpen);
	(0, import_react.useEffect)(() => {
		const resume = () => unlockAudio();
		window.addEventListener("pointerdown", resume, { once: true });
		window.addEventListener("keydown", resume, { once: true });
		const onVis = () => {
			if (document.visibilityState === "visible") unlockAudio();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			window.removeEventListener("pointerdown", resume);
			window.removeEventListener("keydown", resume);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		phase === "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeScreen, {}) : null,
		phase === "setup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupScreen, {}) : null,
		phase === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingScreen, {}) : null,
		phase === "listen" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayScreen, {}) : null,
		phase === "reveal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RevealScreen, {}) : null,
		phase === "winner" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinnerScreen, {}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RulesDialog, {
			open: rulesOpen,
			onOpenChange: setRulesOpen
		})
	] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameApp, {});
}
//#endregion
export { Home as component };
