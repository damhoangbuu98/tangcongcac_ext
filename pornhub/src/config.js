// Shared helpers; every other script pulls this file in on its first line.
let BASE_URL = "https://www.pornhub.com";
try {
    if (typeof DOMAIN === "string" && DOMAIN.indexOf("http") === 0) {
        BASE_URL = DOMAIN.replace(/\/+$/, "");
    }
} catch (error) {
}

// HLS links expire about 2 h after the page was served; reuse chap.js's link only while it is this fresh.
let STREAM_FRESH_MS = 30 * 60 * 1000;

// Only these lists hold the page's own results; the header menus repeat the same 2 "hottest" videos everywhere.
let LIST_SELECTOR = "#videoSearchResult li.pcVideoListItem, #videoCategory li.pcVideoListItem, "
    + "#mostRecentVideosSection li.pcVideoListItem, #showAllChanelVideos li.pcVideoListItem, "
    + "#moreData li.pcVideoListItem";

function normalizeUrl(url) {
    url = String(url || "").trim();
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (url.charAt(0) === "/") return BASE_URL + url;
    return url.replace(/^https?:\/\/[^\/?#]+/i, BASE_URL);
}

function toPath(url) {
    return String(url || "").replace(/^https?:\/\/[^\/?#]+/i, "");
}

// Desktop markup is what the selectors were checked against (the app's default UA is iPhone Safari).
function fetchPage(url) {
    return fetch(url, {
        headers: {
            "User-Agent": UserAgent.chrome(),
            "Accept-Language": "en-US,en;q=0.9"
        },
        timeout: 30000
    });
}

// Pages are ~1.5 MB, half of it inline scripts/styles/icons; dropping them first halves the DOM parse.
function parsePage(text) {
    return Html.parse(String(text || "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ""));
}

function absoluteUrl(href) {
    href = String(href || "").trim();
    if (!href) return "";
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return href;
}

function pickCover(img) {
    let names = ["data-mediumthumb", "data-image", "data-src", "src"];
    for (let i = 0; i < names.length; i++) {
        let value = img.attr(names[i]);
        if (value && value.indexOf("data:") !== 0) return absoluteUrl(value);
    }
    return "";
}

function mapVideoItem(el) {
    let anchor = el.select("a.linkVideoThumb");
    if (anchor.size() === 0) anchor = el.select("a[href*=viewkey]");
    let href = anchor.attr("href");
    if (!href || href.indexOf("viewkey=") < 0) return null;
    let name = anchor.attr("title") || el.select("span.title a").text();
    if (!name) return null;

    let info = [];
    let duration = el.select("var.duration").text();
    if (duration) info.push(duration);
    let views = el.select("span.views var").text();
    if (views) info.push(views + " lượt xem");
    return {
        name: name,
        link: absoluteUrl(href),
        cover: pickCover(el.select("img")),
        description: info.join(" · ")
    };
}

function parseVideoList(doc, selector) {
    let items = [];
    let seen = {};
    doc.select(selector || LIST_SELECTOR).forEach(function (el) {
        let item = mapVideoItem(el);
        if (!item || seen[item.link]) return;
        seen[item.link] = true;
        items.push(item);
    });
    return items;
}

// --- Player data --------------------------------------------------------------------------
// `var flashvars_<id> = {...};` is plain JSON; scan to its closing brace (strings may hold braces).
function extractFlashvars(text) {
    let match = /var\s+flashvars_\d+\s*=\s*\{/.exec(text);
    if (!match) return null;
    let start = match.index + match[0].length - 1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
        let c = text.charAt(i);
        if (inString) {
            if (escaped) escaped = false;
            else if (c === "\\") escaped = true;
            else if (c === "\"") inString = false;
            continue;
        }
        if (c === "\"") inString = true;
        else if (c === "{") depth++;
        else if (c === "}") {
            depth--;
            if (depth === 0) {
                try {
                    return JSON.parse(text.substring(start, i + 1));
                } catch (error) {
                    return null;
                }
            }
        }
    }
    return null;
}

// HLS only: the mp4 entry points at get_media, which needs the session cookie and serves throttled files.
function hlsSources(flashvars) {
    let list = (flashvars && flashvars.mediaDefinitions) || [];
    let sources = [];
    let seen = {};
    for (let i = 0; i < list.length; i++) {
        let entry = list[i] || {};
        let url = String(entry.videoUrl || "");
        if (entry.format !== "hls" || url.indexOf("http") !== 0) continue;
        let quality = parseInt(entry.quality, 10) || 0;
        if (seen[quality]) continue;
        seen[quality] = true;
        sources.push({ quality: quality, url: url });
    }
    sources.sort(function (a, b) { return b.quality - a.quality; });
    return sources;
}

// The wanted quality, else the best one below it, else the lowest available.
function pickQuality(sources, quality) {
    if (sources.length === 0) return "";
    for (let i = 0; i < sources.length; i++) {
        if (sources[i].quality <= quality) return sources[i].url;
    }
    return sources[sources.length - 1].url;
}

function viewKey(url) {
    let match = /[?&]viewkey=([A-Za-z0-9]+)/.exec(String(url || ""));
    return match ? match[1] : "";
}

// The CDN answers 404/410 for segments without a Referer.
function streamHeaders() {
    return {
        "User-Agent": UserAgent.chrome(),
        "Referer": BASE_URL + "/"
    };
}
