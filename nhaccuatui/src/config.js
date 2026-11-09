// NhacCuaTui — shared helpers. Every script loads this file on its first line.
//
// The new site (2025+) is a client of https://graph.nhaccuatui.com/api/... (JSON, { code: 0, data, total, loadmore }).
// The browser also sends an `X-sign` header computed in WebAssembly; the read-only endpoints used here
// answer without it. If NCT starts enforcing it, every script fails with the API message.
let BASE_URL = "https://www.nhaccuatui.com";
let API_URL = "https://graph.nhaccuatui.com";
let NCT_DEVICE_STORE = "nct_device_id";

function nctDeviceId() {
    let id = "";
    try {
        id = localStorage.getItem(NCT_DEVICE_STORE) || "";
    } catch (error) {
    }
    if (/^[0-9a-f]{16}$/.test(id)) return id;
    id = "";
    for (let i = 0; i < 16; i++) id += "0123456789abcdef".charAt(Math.floor(Math.random() * 16));
    try {
        localStorage.setItem(NCT_DEVICE_STORE, id);
    } catch (error) {
    }
    return id;
}

function nctHeaders(time) {
    let device = nctDeviceId();
    return {
        "User-Agent": UserAgent.chrome(),
        "Origin": BASE_URL,
        "Referer": BASE_URL + "/",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "vi-VN,vi;q=0.9",
        "x-nct-deviceid": device,
        "X-nct-uuid": device,
        "x-nct-time": time,
        "x-nct-language": "vi",
        "X-nct-userid": "0",
        "X-nct-os": "web",
        "x-nct-appid": "6",
        "X-nct-version": "1"
    };
}

// GET API_URL + path. Always returns an object; code 0 = success.
function nctApi(path, params) {
    let time = String(Date.now());
    let query = [];
    Object.keys(params || {}).forEach(function (key) {
        let value = params[key];
        if (value !== null && value !== undefined && value !== "") query.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    });
    query.push("timestamp=" + time);
    let res = fetch(API_URL + path + (path.indexOf("?") >= 0 ? "&" : "?") + query.join("&"), { headers: nctHeaders(time), timeout: 30000 });
    if (!res.ok) return { code: -9999, msg: "Không kết nối được NhacCuaTui (HTTP " + res.status + ")" };
    try {
        return JSON.parse(res.text());
    } catch (error) {
        return { code: -9998, msg: "NhacCuaTui trả dữ liệu lạ" };
    }
}

function nctData(path, params) {
    let json = nctApi(path, params);
    if (json && json.code === 0 && json.data) return json.data;
    return null;
}

function nctErrorText(json, fallback) {
    return (json && json.msg && json.code !== 0) ? fallback + " (" + json.msg + ")" : fallback;
}

// Covers come as ..._300.jpg; the CDN resizes on the fly, 600 px keeps the disc / lock screen sharp.
function bigImage(url) {
    return String(url || "").replace(/_(\d{2,4})\.(jpg|jpeg|png|webp)$/i, "_600.$2");
}

function songUrl(key) {
    return BASE_URL + "/song/" + key;
}

function playlistUrl(key) {
    return BASE_URL + "/playlist/" + key;
}

function chartUrl(key) {
    return BASE_URL + "/chart/" + key;
}

function artistUrl(key) {
    return BASE_URL + "/artist/" + key;
}

// Routes: song, playlist (album too), chart, artist — new paths and the old "<slug>.<KEY>.html" ones.
function parseRoute(url) {
    let path = String(url || "").replace(/^https?:\/\/[^\/]+/i, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
    let m = /^\/(?:song|bai-hat)\/(?:[^\/]*\.)?([A-Za-z0-9_-]{6,})(?:\.html)?$/.exec(path);
    if (m) return { type: "song", key: m[1] };
    m = /^\/(?:playlists|albums)\/[^\/]+\/([A-Za-z0-9_-]{6,})$/.exec(path) ||
        /^\/(?:playlist|album)\/(?:[^\/]*\.)?([A-Za-z0-9_-]{6,})(?:\.html)?$/.exec(path);
    if (m) return { type: "playlist", key: m[1] };
    m = /^\/(?:chart|nct-chart)\/([A-Za-z0-9_-]+)$/.exec(path);
    if (m) return { type: "chart", key: m[1] };
    m = /^\/artist\/(?:[^\/]+\/)?([0-9]+)$/.exec(path);
    if (m) return { type: "artist", key: m[1] };
    return null;
}

// A song is dropped only when NCT lists its streams and every one is VIP-only.
function isPlayable(song) {
    if (!song || !song.key) return false;
    let streams = song.streamURL || [];
    if (!streams.length) return song.statusPlay !== 0;
    return streams.some(function (s) { return s.stream && !s.onlyVIP; });
}

function songItem(song) {
    return {
        name: song.name,
        cover: bigImage(song.image || song.artistImage),
        link: songUrl(song.key),
        description: song.artistName || "",
        tag: ""
    };
}

function playlistItem(pl) {
    return {
        name: pl.name,
        cover: bigImage(pl.image),
        link: playlistUrl(pl.key),
        description: pl.artistName || pl.subName || "",
        tag: pl.isAlbum ? "Album" : ""
    };
}

function artistItem(artist) {
    return {
        name: artist.name,
        cover: bigImage(artist.image),
        link: artistUrl(artist.key),
        description: artist.totalFollow ? artist.totalFollow + " quan tâm" : "Nghệ sĩ",
        tag: "Nghệ sĩ"
    };
}

function chartItem(chart) {
    return {
        name: chart.title || chart.name,
        cover: bigImage(chart.image || chart.cover || ((chart.items || [])[0] || {}).image),
        link: chartUrl(chart.key),
        description: chart.name || "",
        tag: "BXH"
    };
}

function uniqueItems(items) {
    let seen = {};
    return items.filter(function (it) {
        if (!it || !it.name || !it.link || seen[it.link]) return false;
        seen[it.link] = true;
        return true;
    });
}

function tocEntry(song) {
    return { name: song.name, url: songUrl(song.key), description: song.artistName || "", lock: false, pay: false };
}

// Songs of an artist (numeric key), 30 per page.
function artistSongs(key, limit) {
    let songs = [];
    for (let page = 1; page <= 10 && songs.length < limit; page++) {
        let json = nctApi("/api/v1/search/artist/song/" + key, { pageindex: page, pagesize: 30 });
        let list = (json && json.code === 0 && json.data) || [];
        if (!list.length) break;
        songs = songs.concat(list);
        if (!json.loadmore) break;
    }
    return songs;
}

function stripHtml(html) {
    return String(html || "")
        .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;|&rsquo;|&lsquo;/g, "'")
        .replace(/&ugrave;/g, "ù").replace(/&agrave;/g, "à").replace(/&aacute;/g, "á").replace(/&eacute;/g, "é")
        .replace(/&ograve;/g, "ò").replace(/&oacute;/g, "ó").replace(/&igrave;/g, "ì").replace(/&iacute;/g, "í")
        .replace(/&ndash;|&mdash;/g, "–").replace(/&ldquo;|&rdquo;/g, "\"").replace(/\n{3,}/g, "\n\n").trim();
}
