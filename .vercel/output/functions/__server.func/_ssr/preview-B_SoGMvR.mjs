import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preview-B_SoGMvR.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function fold(value) {
	return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function scoreMatch(artist, title, year, foundArtist, foundTitle, foundYear) {
	const a = fold(artist);
	const t = fold(title);
	const fa = fold(foundArtist);
	const ft = fold(foundTitle);
	let score = 0;
	if (fa === a) score += 4;
	else if (fa.includes(a) || a.includes(fa)) score += 3;
	if (ft === t) score += 4;
	else if (ft.includes(t) || t.includes(ft)) score += 3;
	if (foundYear !== void 0 && Math.abs(foundYear - year) <= 1) score += 2;
	else if (foundYear !== void 0 && Math.abs(foundYear - year) <= 3) score += 1;
	return score;
}
async function fromItunes(query) {
	const url = `https://itunes.apple.com/search?term=${encodeURIComponent(`${query.artist} ${query.title}`)}&entity=song&limit=8`;
	const res = await fetch(url, { signal: AbortSignal.timeout(8e3) });
	if (!res.ok) return null;
	const best = ((await res.json()).results ?? []).filter((row) => row.previewUrl).map((row) => {
		const year = row.releaseDate ? new Date(row.releaseDate).getFullYear() : void 0;
		return {
			row,
			score: scoreMatch(query.artist, query.title, query.year, row.artistName ?? "", row.trackName ?? "", year)
		};
	}).sort((a, b) => b.score - a.score)[0];
	if (!best || best.score < 5 || !best.row.previewUrl) return null;
	const art = best.row.artworkUrl100?.replace("100x100bb", "400x400bb") ?? null;
	return {
		id: query.id,
		previewUrl: best.row.previewUrl,
		artworkUrl: art
	};
}
async function fromDeezer(query) {
	const url = `https://api.deezer.com/search?q=${encodeURIComponent(`${query.artist} ${query.title}`)}&limit=8`;
	const res = await fetch(url, { signal: AbortSignal.timeout(8e3) });
	if (!res.ok) return null;
	const best = ((await res.json()).data ?? []).filter((row) => row.preview).map((row) => ({
		row,
		score: scoreMatch(query.artist, query.title, query.year, row.artist?.name ?? "", row.title ?? "")
	})).sort((a, b) => b.score - a.score)[0];
	if (!best || best.score < 5 || !best.row.preview) return null;
	return {
		id: query.id,
		previewUrl: best.row.preview,
		artworkUrl: best.row.album?.cover_big ?? best.row.album?.cover_medium ?? null
	};
}
async function resolveOne(query) {
	try {
		const itunes = await fromItunes(query);
		if (itunes?.previewUrl) return itunes;
	} catch {}
	try {
		const deezer = await fromDeezer(query);
		if (deezer?.previewUrl) return deezer;
	} catch {}
	return {
		id: query.id,
		previewUrl: null,
		artworkUrl: null
	};
}
var resolvePreviews_createServerFn_handler = createServerRpc({
	id: "2df0dfe1a846dc2f28b2c6729c76fc68d60aa6292ba063e0c489c46c7bfbaf2b",
	name: "resolvePreviews",
	filename: "src/lib/game/preview.ts"
}, (opts) => resolvePreviews.__executeServer(opts));
var resolvePreviews = createServerFn({ method: "POST" }).validator((data) => data).handler(resolvePreviews_createServerFn_handler, async ({ data }) => {
	const queries = data.queries.slice(0, 24);
	const results = [];
	const concurrency = 6;
	for (let i = 0; i < queries.length; i += concurrency) {
		const batch = queries.slice(i, i + concurrency);
		const resolved = await Promise.all(batch.map(resolveOne));
		results.push(...resolved);
	}
	return results;
});
//#endregion
export { resolvePreviews_createServerFn_handler };
