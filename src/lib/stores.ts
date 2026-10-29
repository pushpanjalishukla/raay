import gplay, { type IFnReviewsOptions, type IReviewsItem } from "google-play-scraper";
import type { AppMeta, RawReview, Store } from "./types";

const COUNTRY = "in";
// The library's typings declare `sort` as an enum value instead of the enum object.
const NEWEST = 2 as unknown as IFnReviewsOptions["sort"];

export interface SearchHit {
  id: string;
  store: Store;
  title: string;
  developer: string;
  icon: string;
  rating: number;
}

/** Accepts a package id, numeric App Store id, or a store URL. */
export function parseAppRef(input: string): { store: Store; id: string } | null {
  const s = input.trim();
  const play = s.match(/play\.google\.com\/store\/apps\/details\?(?:.*&)?id=([\w.]+)/);
  if (play) return { store: "play", id: play[1] };
  const ios = s.match(/apps\.apple\.com\/.*\/id(\d+)/);
  if (ios) return { store: "ios", id: ios[1] };
  if (/^\d{6,12}$/.test(s)) return { store: "ios", id: s };
  if (/^[a-zA-Z][\w]*(\.[\w]+)+$/.test(s)) return { store: "play", id: s };
  return null;
}

export async function searchApps(term: string): Promise<SearchHit[]> {
  const [play, ios] = await Promise.allSettled([
    gplay.search({ term, country: COUNTRY, num: 6 }),
    fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${COUNTRY}&entity=software&limit=3`,
    ).then((r) => r.json()),
  ]);
  const hits: SearchHit[] = [];
  if (play.status === "fulfilled") {
    for (const a of play.value) {
      hits.push({
        id: a.appId,
        store: "play",
        title: a.title,
        developer: a.developer,
        icon: a.icon,
        rating: a.score ?? 0,
      });
    }
  }
  if (ios.status === "fulfilled") {
    for (const a of ios.value?.results ?? []) {
      hits.push({
        id: String(a.trackId),
        store: "ios",
        title: a.trackName,
        developer: a.artistName,
        icon: a.artworkUrl100,
        rating: a.averageUserRating ?? 0,
      });
    }
  }
  return hits;
}

export async function fetchApp(
  store: Store,
  id: string,
): Promise<{ app: AppMeta; reviews: RawReview[] }> {
  return store === "play" ? fetchPlay(id) : fetchIos(id);
}

async function fetchPlay(appId: string) {
  const [meta, en, hi] = await Promise.all([
    gplay.app({ appId, country: COUNTRY, lang: "en" }),
    gplay.reviews({ appId, country: COUNTRY, lang: "en", sort: NEWEST, num: 160 }),
    gplay
      .reviews({ appId, country: COUNTRY, lang: "hi", sort: NEWEST, num: 100 })
      .catch(() => ({ data: [] as IReviewsItem[] })),
  ]);
  const seen = new Set<string>();
  const reviews: RawReview[] = [];
  for (const r of [...en.data, ...hi.data]) {
    if (!r.text || seen.has(r.id)) continue;
    seen.add(r.id);
    reviews.push({
      id: r.id,
      rating: r.score,
      text: r.text.slice(0, 600),
      date: new Date(r.date).toISOString(),
      version: r.version || undefined,
      thumbsUp: r.thumbsUp ?? 0,
      replied: Boolean(r.replyText),
    });
  }
  reviews.sort((a, b) => b.date.localeCompare(a.date));
  const app: AppMeta = {
    id: appId,
    store: "play",
    title: meta.title,
    developer: meta.developer,
    icon: meta.icon,
    rating: meta.score ?? 0,
    ratingsCount: meta.ratings ?? 0,
    installs: meta.installs,
    version: meta.version,
    genre: meta.genre,
    url: meta.url,
  };
  return { app, reviews };
}

interface ItunesEntry {
  id: { label: string };
  updated: { label: string };
  "im:rating": { label: string };
  "im:version"?: { label: string };
  title: { label: string };
  content: { label: string };
  "im:voteCount"?: { label: string };
}

async function fetchIos(trackId: string) {
  const lookup = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&country=${COUNTRY}`).then(
    (r) => r.json(),
  );
  const a = lookup?.results?.[0];
  if (!a) throw new Error("App not found on the Indian App Store");
  const pages = await Promise.all(
    [1, 2, 3, 4, 5].map((p) =>
      fetch(
        `https://itunes.apple.com/${COUNTRY}/rss/customerreviews/page=${p}/id=${trackId}/sortby=mostrecent/json`,
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ),
  );
  const reviews: RawReview[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    const entries: ItunesEntry[] = page?.feed?.entry ?? [];
    for (const e of Array.isArray(entries) ? entries : [entries]) {
      if (!e?.content?.label || seen.has(e.id.label)) continue;
      seen.add(e.id.label);
      const title = e.title?.label ?? "";
      reviews.push({
        id: e.id.label,
        rating: Number(e["im:rating"].label),
        text: `${title ? title + ". " : ""}${e.content.label}`.slice(0, 600),
        date: new Date(e.updated.label).toISOString(),
        version: e["im:version"]?.label,
        thumbsUp: Number(e["im:voteCount"]?.label ?? 0),
        replied: false,
      });
    }
  }
  reviews.sort((x, y) => y.date.localeCompare(x.date));
  const app: AppMeta = {
    id: trackId,
    store: "ios",
    title: a.trackName,
    developer: a.artistName,
    icon: a.artworkUrl512 ?? a.artworkUrl100,
    rating: a.averageUserRating ?? 0,
    ratingsCount: a.userRatingCount ?? 0,
    version: a.version,
    genre: a.primaryGenreName,
    url: a.trackViewUrl,
  };
  return { app, reviews };
}
