// Zing MP3 — shared helpers. Every script loads crypto.js then this file on its first lines.
//
// API: https://zingmp3.vn/api/v2/<path>?<params>&ctime=<s>&version=<web build>&sig=<sig>&apiKey=<key>
//   sig = HmacSHA512(path + SHA256(sorted "k=v" of ctime/id/type/page/count/version), secret)
// The keys live in the site's main.min.js. When Zing rotates them the API answers err -104
// ("Incorect signature") and the keys are re-read from that bundle (best effort, cached in localStorage).
// The API also needs the `zmp3_rqid` cookie (err -201 without it): any request to the site sets it.
let BASE_URL = "https://zingmp3.vn";
let ZING_FALLBACK_KEYS = {
    apiKey: "X5BM3w8N7MKozC0B85o4KMlzLZKhV00y",
    secret: "acOrvUS15XRW2o9JksiK1KgQ6Vbds8ZW",
    version: "1.22.4"
};
let ZING_SIG_FIELDS = ["count", "ctime", "id", "page", "type", "version"];
let ZING_KEYS_STORE = "zingmp3_keys";

function zingKeys() {
    try {
        let saved = localStorage.getItem(ZING_KEYS_STORE);
        if (saved) {
            let keys = JSON.parse(saved);
            if (keys && keys.apiKey && keys.secret && keys.version) return keys;
        }
    } catch (error) {
    }
    return ZING_FALLBACK_KEYS;
}

function zingSign(path, params, secret) {
    let raw = "";
    Object.keys(params).sort().forEach(function (key) {
        let value = params[key];
        if (ZING_SIG_FIELDS.indexOf(key) < 0 || value === "" || value === null || value === undefined) return;
        raw += encodeURIComponent(key) + "=" + encodeURIComponent(value);
    });
    let hash = CryptoJS.SHA256(raw).toString(CryptoJS.enc.Hex);
    return CryptoJS.HmacSHA512(path + hash, secret).toString(CryptoJS.enc.Hex);
}

function zingHeaders(cookie) {
    let headers = {
        "User-Agent": UserAgent.chrome(),
        "Referer": BASE_URL + "/",
        "Accept-Language": "vi-VN,vi;q=0.9"
    };
    if (cookie) headers["Cookie"] = cookie;
    return headers;
}

// Requests the home page so the cookie jar gets `zmp3_rqid`; also returns it for an explicit Cookie header.
function zingPrimeCookie() {
    let res = fetch(BASE_URL + "/", { headers: zingHeaders(""), timeout: 20000 });
    let setCookie = "";
    try {
        setCookie = res.header("set-cookie") || "";
    } catch (error) {
        setCookie = (res.headers && (res.headers["set-cookie"] || res.headers["Set-Cookie"])) || "";
    }
    let match = /zmp3_rqid=([^;,\s]+)/.exec(setCookie);
    return match ? "zmp3_rqid=" + match[1] : "";
}

// Re-reads apiKey / secret / version from the web bundle (~3 MB). Returns true when new keys were saved.
function zingRefreshKeys() {
    let home = fetch(BASE_URL + "/", { headers: zingHeaders(""), timeout: 20000 });
    if (!home.ok) return false;
    let bundle = /https:\/\/[^"']+\/zmp3-desktop\/v([0-9.]+)\/static\/js\/main\.min\.js/.exec(home.text());
    if (!bundle) return false;
    let js = fetch(bundle[0], { headers: zingHeaders(""), timeout: 60000 });
    if (!js.ok) return false;
    let keys = /="([A-Za-z0-9]{32})",\w+="([A-Za-z0-9]{32})",\w+=\{publicKey:/.exec(js.text());
    if (!keys) return false;
    let fresh = { apiKey: keys[1], secret: keys[2], version: bundle[1] };
    let current = zingKeys();
    if (fresh.apiKey === current.apiKey && fresh.secret === current.secret && fresh.version === current.version) return false;
    try {
        localStorage.setItem(ZING_KEYS_STORE, JSON.stringify(fresh));
    } catch (error) {
    }
    return true;
}

// Signed GET of /api/v2<path>. Always returns an object { err, msg, data }; err 0 = success.
function zingApi(path, params, retry) {
    retry = retry || {};
    let keys = zingKeys();
    let query = {};
    Object.keys(params || {}).forEach(function (key) {
        let value = params[key];
        if (value !== null && value !== undefined) query[key] = String(value);
    });
    query.ctime = String(Math.floor(Date.now() / 1000));
    query.version = keys.version;
    query.sig = zingSign("/api/v2" + path, query, keys.secret);
    query.apiKey = keys.apiKey;
    let url = BASE_URL + "/api/v2" + path + "?" + Object.keys(query).map(function (key) {
        return encodeURIComponent(key) + "=" + encodeURIComponent(query[key]);
    }).join("&");

    let res = fetch(url, { headers: zingHeaders(retry.cookie || ""), timeout: 30000 });
    if (!res.ok) return { err: -9999, msg: "Không kết nối được Zing MP3 (HTTP " + res.status + ")" };
    let json;
    try {
        json = JSON.parse(res.text());
    } catch (error) {
        return { err: -9998, msg: "Zing MP3 trả dữ liệu lạ" };
    }
    if (json.err === -201 && !retry.primed) {
        let cookie = zingPrimeCookie();
        return zingApi(path, params, { primed: true, cookie: cookie, rekeyed: retry.rekeyed });
    }
    if (json.err === -104 && !retry.rekeyed && zingRefreshKeys()) {
        return zingApi(path, params, { primed: retry.primed, cookie: retry.cookie, rekeyed: true });
    }
    return json;
}

// data of a successful call, or null.
function zingData(path, params) {
    let json = zingApi(path, params);
    if (json && json.err === 0 && json.data) return json.data;
    return null;
}

function zingErrorText(json, fallback) {
    if (!json) return fallback;
    if (json.err === -1150) return "Bài này chỉ dành cho tài khoản VIP của Zing MP3";
    if (json.err === -1023) return "Zing MP3 không còn bài / playlist này";
    return json.msg || fallback;
}

// Zing serves resized covers like .../w165_r1x1_jpeg/cover/... — ask for 600 px so the disc and lock screen stay sharp.
function bigCover(url) {
    return String(url || "").replace(/\/w\d+_r\d+x\d+_(jpeg|webp|png)\//, "/w600_r1x1_jpeg/");
}

function coverOf(obj) {
    if (!obj) return "";
    return bigCover(obj.thumbnailM || obj.thumbnail || obj.thumbnailR || obj.cover || "");
}

function absUrl(link) {
    link = String(link || "");
    if (!link) return "";
    if (link.indexOf("//") === 0) return "https:" + link;
    if (link.charAt(0) === "/") return BASE_URL + link;
    return link;
}

function songUrl(song) {
    if (song.link && song.link.indexOf("/bai-hat/") === 0) return absUrl(song.link);
    return BASE_URL + "/bai-hat/" + (song.alias || "bai-hat") + "/" + song.encodeId + ".html";
}

function playlistUrl(pl) {
    if (pl.link && /^\/(album|playlist)\/[^\/]+\/[A-Za-z0-9]+\.html/.test(pl.link)) return absUrl(pl.link);
    return BASE_URL + "/album/" + (pl.aliasTitle || "album") + "/" + pl.encodeId + ".html";
}

function artistUrl(alias) {
    return BASE_URL + "/nghe-si/" + encodeURIComponent(alias);
}

function artistAlias(artist) {
    if (!artist) return "";
    if (artist.alias) return artist.alias;
    let match = /^\/(?:nghe-si\/)?([^\/?#]+)/.exec(artist.link || "");
    return match ? match[1] : "";
}

// VIP-only songs (streamingStatus 2) never play on a free account and the app reads no lock/pay flag: drop them.
function isPlayable(song) {
    return !!(song && song.encodeId && song.streamingStatus !== 2);
}

function songItem(song) {
    return {
        name: song.title,
        cover: coverOf(song),
        link: songUrl(song),
        description: song.artistsNames || "",
        tag: ""
    };
}

function playlistItem(pl) {
    return {
        name: pl.title,
        cover: coverOf(pl),
        link: playlistUrl(pl),
        description: pl.artistsNames || pl.sortDescription || (pl.isQuickPlay ? pl.description : "") || "",
        tag: pl.isAlbum ? "Album" : ""
    };
}

function artistItem(artist) {
    return {
        name: artist.name,
        cover: coverOf(artist),
        link: artistUrl(artistAlias(artist)),
        description: artist.totalFollow ? (formatCount(artist.totalFollow) + " quan tâm") : "Nghệ sĩ",
        tag: "Nghệ sĩ"
    };
}

function formatCount(n) {
    n = Number(n) || 0;
    if (n >= 1000000) return (Math.round(n / 100000) / 10) + "M";
    if (n >= 1000) return Math.round(n / 1000) + "K";
    return String(n);
}

// Keeps the first item per link (the app de-duplicates list items, explore items it does not).
function uniqueItems(items) {
    let seen = {};
    return items.filter(function (it) {
        if (!it || !it.name || !it.link || seen[it.link]) return false;
        seen[it.link] = true;
        return true;
    });
}

function tocEntry(song) {
    return { name: song.title, url: songUrl(song), description: song.artistsNames || "", lock: false, pay: false };
}

// Routes understood by detail/toc: song, playlist (album/playlist), week chart, realtime chart,
// new-release chart, artist. Returns null for anything else.
function parseRoute(url) {
    let path = String(url || "").replace(/^https?:\/\/[^\/]+/i, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
    let m = /^\/bai-hat\/[^\/]+\/([A-Za-z0-9]+)\.html$/.exec(path);
    if (m) return { type: "song", id: m[1] };
    m = /^\/(?:album|playlist)\/[^\/]+\/([A-Za-z0-9]+)\.html$/.exec(path);
    if (m) return { type: "playlist", id: m[1] };
    m = /^\/zing-chart-tuan\/[^\/]+\/([A-Za-z0-9]+)\.html$/.exec(path);
    if (m) return { type: "week", id: m[1] };
    if (path === "/zing-chart") return { type: "realtime", id: "" };
    if (path === "/moi-phat-hanh") return { type: "newrelease", id: "" };
    m = /^\/nghe-si\/([^\/]+)$/.exec(path);
    if (m) return { type: "artist", id: decodeURIComponent(m[1]) };
    return null;
}

// Songs of an artist (by artist id), paged by `start` (30 per call; Zing hides some, so pages run short).
function artistSongs(artistId, limit) {
    let songs = [];
    let start = 0;
    for (let round = 0; round < 10 && songs.length < limit; round++) {
        let data = zingData("/song/get/list", { id: artistId, type: "artist", start: start, count: 30, sort: "listen" });
        if (!data || !data.items || data.items.length === 0) break;
        data.items.forEach(function (s) { songs.push(s); });
        if (!data.hasMore) break;
        start += 30;
    }
    return songs;
}

function chartTitle(route, data) {
    if (route.type === "realtime") return "#zingchart";
    if (route.type === "newrelease") return "BXH Nhạc Mới";
    let names = { vn: "Việt Nam", us: "US-UK", korea: "K-Pop" };
    let name = names[data && data.country] || "";
    return "Zing Chart tuần" + (name ? " " + name : "");
}

// { data, items } of a chart route, or null.
function chartSongs(route) {
    if (route.type === "realtime") {
        let home = zingData("/page/get/chart-home", {});
        return home && home.RTChart ? { data: home.RTChart, items: home.RTChart.items || [] } : null;
    }
    if (route.type === "newrelease") {
        let chart = zingData("/page/get/newrelease-chart", {});
        return chart ? { data: chart, items: chart.items || [] } : null;
    }
    let week = zingData("/page/get/week-chart", { id: route.id, week: "", year: "" });
    return week ? { data: week, items: week.items || [] } : null;
}
