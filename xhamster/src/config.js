// Shared helpers; every other script pulls this file in on its first line.
let BASE_URL = "https://xhamster.com";
try {
    if (typeof DOMAIN === "string" && DOMAIN.indexOf("http") === 0) {
        BASE_URL = DOMAIN.replace(/\/+$/, "");
    }
} catch (error) {
}

// Stream links carry an expiry; reuse the one found by chap.js only while it is this fresh.
let STREAM_FRESH_MS = 30 * 60 * 1000;

function normalizeUrl(url) {
    url = String(url || "").trim();
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (url.charAt(0) === "/") return BASE_URL + url;
    return url.replace(/^https?:\/\/[^\/?#]+/i, BASE_URL);
}

function toPath(url) {
    return String(url || "").replace(/^https?:\/\/[^\/?#]+/i, "");
}

// Titles in the page state keep HTML entities (`&#039;`, `&amp;`).
function decodeEntities(text) {
    return String(text || "").replace(/&(#x?[0-9a-f]+|amp|quot|apos|lt|gt|nbsp);/gi, function (match, code) {
        let lower = code.toLowerCase();
        if (lower === "amp") return "&";
        if (lower === "quot") return "\"";
        if (lower === "apos") return "'";
        if (lower === "lt") return "<";
        if (lower === "gt") return ">";
        if (lower === "nbsp") return " ";
        let value = lower.charAt(1) === "x" ? parseInt(lower.substring(2), 16) : parseInt(lower.substring(1), 10);
        return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : match;
    }).trim();
}

// Desktop markup is what the selectors and the embedded JSON were checked against.
function fetchPage(url) {
    return fetch(url, {
        headers: {
            "User-Agent": UserAgent.chrome(),
            "Accept-Language": "en-US,en;q=0.9"
        },
        timeout: 30000
    });
}

// Every page ships its state as `window.initials={...};</script>`; slashes inside are escaped,
// so the first `</script>` after the marker closes the JSON.
function parseInitials(text) {
    let match = /window\.initials\s*=\s*/.exec(text);
    if (!match) return null;
    let start = match.index + match[0].length;
    let end = text.indexOf("</script>", start);
    if (end < 0) return null;
    let body = text.substring(start, end).replace(/;\s*$/, "");
    try {
        return JSON.parse(body);
    } catch (error) {
        return null;
    }
}

// Lists live under different keys per page type (layoutPage, searchResult, pagesCategoryComponent...):
// take the longest `videoThumbProps` array anywhere in the state.
function findThumbList(state) {
    let best = [];
    let stack = [state];
    while (stack.length > 0) {
        let node = stack.pop();
        if (!node || typeof node !== "object") continue;
        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) stack.push(node[i]);
            continue;
        }
        for (let key in node) {
            if (!node.hasOwnProperty(key)) continue;
            let value = node[key];
            if (key === "videoThumbProps" && Array.isArray(value) && value.length > best.length) best = value;
            else if (value && typeof value === "object") stack.push(value);
        }
    }
    return best;
}

function formatDuration(seconds) {
    seconds = parseInt(seconds, 10);
    if (!seconds || seconds < 0) return "";
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = seconds % 60;
    let mm = h > 0 && m < 10 ? "0" + m : String(m);
    let ss = s < 10 ? "0" + s : String(s);
    return (h > 0 ? h + ":" : "") + mm + ":" + ss;
}

function formatViews(views) {
    views = parseInt(views, 10);
    if (!views && views !== 0) return "";
    if (views >= 1000000) return (Math.round(views / 100000) / 10) + "M lượt xem";
    if (views >= 1000) return (Math.round(views / 100) / 10) + "K lượt xem";
    return views + " lượt xem";
}

function mapThumb(item) {
    if (!item || !item.pageURL || !item.title) return null;
    if (String(item.pageURL).indexOf("/videos/") < 0) return null;
    let info = [];
    let duration = formatDuration(item.duration);
    if (duration) info.push(duration);
    let views = formatViews(item.views);
    if (views) info.push(views);
    return {
        name: decodeEntities(item.title),
        link: item.pageURL,
        cover: item.thumbURL || item.imageURL || "",
        description: info.join(" · "),
        tag: item.isUHD ? "4K" : ""
    };
}

function mapThumbList(list) {
    let items = [];
    let seen = {};
    for (let i = 0; i < list.length; i++) {
        let item = mapThumb(list[i]);
        if (!item || seen[item.link]) continue;
        seen[item.link] = true;
        items.push(item);
    }
    return items;
}

// --- Stream links -------------------------------------------------------------------------
// Player sources are hex strings: byte 0 = generator id, bytes 1-4 = little-endian seed, the rest
// XOR-ed with the low byte of a 32-bit PRNG. Older pages used base64 "xor_" / "rot13_" strings.
function makeByteGenerator(algo, seed) {
    let s = seed | 0;
    switch (algo) {
        case 1:
            return function () {
                s = (Math.imul(s, 1664525) + 1013904223) | 0;
                return s & 0xff;
            };
        case 2:
            return function () {
                s ^= s << 13;
                s ^= s >>> 17;
                s ^= s << 5;
                return s & 0xff;
            };
        case 3:
            return function () {
                s = (s + 0x9e3779b9) | 0;
                let t = s ^ (s >>> 16);
                t = Math.imul(t, 0x85ebca77);
                t ^= t >>> 13;
                t = Math.imul(t, 0xc2b2ae3d);
                t ^= t >>> 16;
                return t & 0xff;
            };
        case 4:
            return function () {
                s = (s + 0x6d2b79f5) | 0;
                let t = (s << 7) | (s >>> 25);
                t = (t + 0x9e3779b9) | 0;
                t ^= t >>> 11;
                t = Math.imul(t, 0x27d4eb2d);
                return t & 0xff;
            };
        case 5:
            return function () {
                s ^= s << 7;
                s ^= s >>> 9;
                s ^= s << 8;
                s = (s + 0xa5a5a5a5) | 0;
                return s & 0xff;
            };
        case 6:
            return function () {
                s = (Math.imul(s, 0x2c9277b5) + 0xac564b05) | 0;
                let t = s ^ (s >>> 18);
                let shift = (s >>> 27) & 31;
                return (t >>> shift) & 0xff;
            };
        case 7:
            return function () {
                s = (s + 0x9e3779b9) | 0;
                let t = s ^ (s << 5);
                t = Math.imul(t, 0x7feb352d);
                t ^= t >>> 15;
                t = Math.imul(t, 0x846ca68b);
                return t & 0xff;
            };
    }
    return null;
}

function decipherSource(value) {
    value = String(value || "").trim();
    if (!value) return "";
    if (value.indexOf("http") === 0) return value;
    if (/^[0-9a-f]+$/i.test(value) && value.length > 10 && value.length % 2 === 0) {
        let bytes = [];
        for (let i = 0; i < value.length; i += 2) bytes.push(parseInt(value.substr(i, 2), 16));
        let seed = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24);
        let next = makeByteGenerator(bytes[0], seed);
        if (!next) return "";
        let out = "";
        for (let j = 5; j < bytes.length; j++) out += String.fromCharCode(bytes[j] ^ next());
        return out;
    }
    let decoded = "";
    try {
        decoded = atob(value);
    } catch (error) {
        return "";
    }
    let cut = String(decoded || "").indexOf("_");
    if (cut < 0) return "";
    let kind = decoded.substring(0, cut);
    let body = decoded.substring(cut + 1);
    let out = "";
    if (kind === "xor") {
        let key = "xh7999";
        for (let k = 0; k < body.length; k++) out += String.fromCharCode(body.charCodeAt(k) ^ key.charCodeAt(k % key.length));
        return out;
    }
    if (kind === "rot13") {
        return body.replace(/[a-z]/gi, function (c) {
            let base = c <= "Z" ? 65 : 97;
            return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
        });
    }
    return "";
}

function isPlaylistUrl(url) {
    return /^https?:\/\//i.test(url) && url.indexOf(".m3u8") > 0;
}

// h264 HLS only: AV1 does not decode on most iPhones, and the progressive mp4 links answer "Wrong key".
function pickStreams(state) {
    let sources = state && state.xplayerSettings && state.xplayerSettings.sources;
    let out = { primary: "", fallback: "" };
    if (!sources) return out;
    let hls = sources.hls && sources.hls.h264;
    if (hls) {
        out.primary = decipherSource(hls.url);
        out.fallback = decipherSource(hls.fallback);
    }
    let standard = sources.standard && sources.standard.h264;
    if (Array.isArray(standard)) {
        for (let i = 0; i < standard.length; i++) {
            let entry = standard[i] || {};
            if (String(entry.quality) !== "auto") continue;
            if (!isPlaylistUrl(out.primary)) out.primary = decipherSource(entry.url);
            if (!isPlaylistUrl(out.fallback)) out.fallback = decipherSource(entry.fallback);
        }
    }
    if (!isPlaylistUrl(out.primary)) out.primary = "";
    if (!isPlaylistUrl(out.fallback)) out.fallback = "";
    if (out.fallback === out.primary) out.fallback = "";
    return out;
}

// --- Subtitles ----------------------------------------------------------------------------
// `xplayerPluginSettings.subtitles.tracks` = [{label: "Vietnamese (auto-generated)", lang: "vi",
// isOriginal, urls: {vtt}}], often 30+ languages. The app loads only the first entry (on/off button, no
// language menu), so the order decides what is shown: Vietnamese, then the original language, then English.
let SUBTITLE_NAMES = {
    vi: "Tiếng Việt", en: "Tiếng Anh", ja: "Tiếng Nhật", zh: "Tiếng Trung", ko: "Tiếng Hàn",
    th: "Tiếng Thái", fr: "Tiếng Pháp", de: "Tiếng Đức", es: "Tiếng Tây Ban Nha", ru: "Tiếng Nga",
    pt: "Tiếng Bồ Đào Nha", it: "Tiếng Ý", id: "Tiếng Indonesia"
};

function subtitleLabel(track) {
    let name = SUBTITLE_NAMES[String(track.lang || "").toLowerCase()]
        || String(track.label || track.lang || "").replace(/\s*\([^)]*\)\s*$/, "");
    return name + (track.isOriginal ? " (gốc)" : " (tự sinh)");
}

function pickSubtitles(state) {
    let settings = state && state.xplayerPluginSettings && state.xplayerPluginSettings.subtitles;
    let tracks = (settings && settings.tracks) || [];
    let list = [];
    for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i] || {};
        let url = track.urls && track.urls.vtt;
        if (!url || String(url).indexOf("http") !== 0) continue;
        let lang = String(track.lang || "").toLowerCase();
        let rank = lang === "vi" ? 0 : track.isOriginal ? 1 : lang === "en" ? 2 : 3;
        list.push({ rank: rank, order: i, item: { data: url, type: "vtt", label: subtitleLabel(track), language: lang } });
    }
    list.sort(function (a, b) { return a.rank - b.rank || a.order - b.order; });
    return list.map(function (entry) { return entry.item; });
}

// Streams and subtitles of a watch page, read in one request.
function loadMedia(pageUrl) {
    let response = fetchPage(pageUrl);
    if (!response.ok) return null;
    let state = parseInitials(response.text());
    return { streams: pickStreams(state), subtitles: pickSubtitles(state) };
}

function streamHeaders() {
    return {
        "User-Agent": UserAgent.chrome(),
        "Referer": BASE_URL + "/"
    };
}
