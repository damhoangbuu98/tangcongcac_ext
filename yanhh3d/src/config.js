// Shared helpers; every other script pulls this file in on its first line.
let BASE_URL = "https://yanhh3d.plus";
try {
    if (typeof DOMAIN === "string" && DOMAIN.indexOf("http") === 0) {
        BASE_URL = DOMAIN.replace(/\/+$/, "");
    }
} catch (error) {
}

function normalizeUrl(url) {
    url = String(url || "").trim();
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (url.charAt(0) === "/") return BASE_URL + url;
    return url.replace(/^https?:\/\/[^\/?#]+/i, BASE_URL);
}

function toPath(url) {
    return String(url || "").replace(/^https?:\/\/[^\/?#]+/i, "");
}

function absoluteUrl(href) {
    href = String(href || "").trim();
    if (!href) return "";
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return href;
}

function fetchPage(url, referer) {
    let headers = {
        "User-Agent": UserAgent.chrome(),
        "Accept-Language": "vi-VN,vi;q=0.9"
    };
    if (referer) headers["Referer"] = referer;
    return fetch(url, { headers: headers, timeout: 30000 });
}

// Watch pages are ~400 KB, mostly inline scripts and the sidebar; parsing without scripts is much lighter.
function parsePage(text) {
    return Html.parse(String(text || "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ""));
}

// `.flw-item` cards are the page's own list; the "Bảng xếp hạng" sidebar uses `.item-top` and is skipped.
function parseCards(doc, selector) {
    let items = [];
    let seen = {};
    doc.select(selector || ".flw-item").forEach(function (el) {
        let link = el.select(".film-name a");
        let href = absoluteUrl(link.attr("href") || el.select("a.film-poster-ahref").attr("href"));
        let name = link.attr("title") || link.text();
        if (!href || !name || seen[href]) return;
        seen[href] = true;
        let img = el.select("img.film-poster-img");
        let info = [];
        let progress = el.select(".tick-rate").text();
        if (progress) info.push(progress);
        let kind = el.select(".tick-item").text();
        if (kind) info.push(kind);
        items.push({
            name: name,
            link: href,
            cover: absoluteUrl(img.attr("data-src") || img.attr("src")),
            description: info.join(" · ")
        });
    });
    return items;
}

// Episode URLs: `/<slug>/tap-<n>` is the "Thuyết minh" track, `/sever2/<slug>/tap-<n>` the "Vietsub" one.
function parseEpisodeUrl(url) {
    let match = /^\/(sever2\/)?([^\/?#]+)\/(tap-[^\/?#]+)/.exec(toPath(url));
    if (!match) return null;
    return { vietsub: !!match[1], slug: match[2], episode: match[3] };
}

// A shared watch link (`/slug/tap-3`, `/sever2/slug/tap-3`) opens the title page instead.
function seriesUrl(url) {
    url = normalizeUrl(url);
    let parsed = parseEpisodeUrl(url);
    return parsed ? BASE_URL + "/" + parsed.slug : url;
}

function episodeUrl(slug, episode, vietsub) {
    return BASE_URL + (vietsub ? "/sever2/" : "/") + slug + "/" + episode;
}

function versionName(vietsub) {
    return vietsub ? "Vietsub" : "Thuyết minh";
}

// Server buttons of a watch page, best first. Kinds:
// - fb: proxy page holding a progressive Facebook CDN mp4 (h264 + aac): the one source verified to play natively.
// - obf: player page whose base64 `data-obf` names a plain m3u8; its segments are TS behind a fake PNG header.
// - embed: player page; its playlist is `/file/<id>/master.m3u8`, same disguised segments.
// - auto: third-party embed (Dailymotion...) left to the app's page sniffer.
// Trailers (facebook.com/plugins) and Abyss/Hydrax (blocked by Vietnamese ISPs) are skipped.
function readServers(doc) {
    let servers = [];
    doc.select("#list_sv a.btn3dsv").forEach(function (el) {
        let src = String(el.attr("data-src") || "").trim();
        let label = el.text() || el.attr("name");
        if (src.indexOf("http") !== 0) return;
        let kind = "";
        if (/facebook\.com\/plugins\//.test(src) || /abyss|hydrax/i.test(src)) return;
        if (src.indexOf("/play-fb") > 0) kind = "fb";
        else if (/\/embed\/[^\/?#]+/.test(src) && src.indexOf("dailymotion") < 0) kind = "embed";
        else if (/\.m3u8(\?|$)/.test(src)) kind = "obf";
        else kind = "auto";
        servers.push({ kind: kind, label: label, src: src });
    });
    let rank = { fb: 0, obf: 1, embed: 2, auto: 3 };
    servers.sort(function (a, b) { return rank[a.kind] - rank[b.kind]; });
    return servers;
}
