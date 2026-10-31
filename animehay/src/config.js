// Shared helpers; every other script pulls this file in on its first line.
// The site moves to a new numbered domain whenever it is blocked (animehay.tv lists the current one).
let BASE_URL = "https://animehay16.site";
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

// Posters come as `https://host//upload/...`.
function absoluteUrl(href) {
    href = String(href || "").trim();
    if (!href) return "";
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.charAt(0) === "/") href = BASE_URL + href;
    return href.replace(/^(https?:\/\/[^\/]+)\/{2,}/, "$1/");
}

function fetchPage(url, referer) {
    let headers = {
        "User-Agent": UserAgent.chrome(),
        "Accept-Language": "vi-VN,vi;q=0.9"
    };
    if (referer) headers["Referer"] = referer;
    return fetch(url, { headers: headers, timeout: 30000 });
}

function parsePage(text) {
    return Html.parse(String(text || "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ""));
}

// Each `.mc` card wraps an episode-badge link inside the title link; parsers close the outer link early,
// so read every field from the card itself.
function parseCards(doc, selector) {
    let items = [];
    let seen = {};
    doc.select(selector || ".movies-list .mc").forEach(function (el) {
        let link = el.select("a.mc__link");
        let href = absoluteUrl(link.attr("href"));
        let name = el.select(".mc__name").text() || link.attr("title");
        if (!href || !name || href.indexOf("/thong-tin-phim/") < 0 || seen[href]) return;
        seen[href] = true;
        let info = [];
        let episodes = el.select(".mc__ep-badge").text();
        // "4/??", "293/293" are episode counts; movies show a runtime ("97 phút").
        if (episodes) info.push(/^\d+\s*\//.test(episodes) ? "Tập " + episodes : episodes);
        let score = el.select(".mc__score").text();
        if (score) info.push(score);
        items.push({
            name: name,
            link: href,
            cover: absoluteUrl(el.select(".mc__poster img").attr("src")),
            description: info.join(" · ")
        });
    });
    return items;
}

// A shared watch link (`/xem-phim/<slug>-tap-N-<id>.html`) opens the title page it links to.
function detailUrl(url) {
    url = normalizeUrl(url);
    if (toPath(url).indexOf("/xem-phim/") !== 0) return url;
    let response = fetchPage(url);
    if (!response.ok) return url;
    let match = /href="((?:https?:\/\/[^"\/]+)?\/thong-tin-phim\/[^"]+\.html)"/.exec(response.text());
    return match ? normalizeUrl(absoluteUrl(match[1])) : url;
}

// Page N of a listing: `/phim-moi-cap-nhap/trang-N.html`, `/the-loai/anime-1/trang-N.html`,
// `/tim-kiem/<keyword>/trang-N.html`, `/loc-phim/<filter>/trang-N.html`.
function pagedUrl(path, page) {
    path = String(path || "").replace(/\/trang-\d+\.html$/, "");
    if (page <= 1) return BASE_URL + path;
    return BASE_URL + path.replace(/\.html$/, "").replace(/\/+$/, "") + "/trang-" + page + ".html";
}
