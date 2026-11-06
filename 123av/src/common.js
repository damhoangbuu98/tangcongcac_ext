// Hàm dùng chung. Mỗi script tự nạp config.js rồi common.js, sau đó sort.js / censor.js nếu dùng tới
// (nạp lồng nhau không được mở rộng).
// fetch giữ User-Agent mặc định của app: trùng với WebView, nên cookie Cloudflare (gắn với UA) dùng chung được.

// Danh mục cố định, đường dẫn tính từ SITE_URL (https://123av.com/vi).
var CATEGORIES = [
    ["new", "Mới phát hành"],
    ["recent", "Mới thêm gần đây"],
    ["hot", "Nổi bật"],
    ["all?sort=today", "Hot hôm nay"],
    ["all?sort=week", "Hot tuần"],
    ["all?sort=month", "Hot tháng"],
    ["uncensored-leaked", "Rò rỉ không che"],
    ["uncensored", "Không kiểm duyệt"],
    ["censored", "Kiểm duyệt"],
    ["tags/siro", "SIRO"],
    ["tags/259luxu", "259LUXU"],
    ["tags/200gana", "200GANA"],
    ["tags/261ara", "261ARA"],
    ["tags/230oreco", "230ORECO"],
    ["tags/390jac", "390JAC"],
    ["tags/prestige-premium", "Prestige Premium"],
    ["makers/fc2", "FC2"],
    ["makers/1pondo", "1Pondo"],
    ["makers/caribbeancom", "Caribbeancom"],
    ["makers/heyzo", "HEYZO"],
    ["makers/10musume", "10Musume"],
    ["makers/pacopacomama", "Pacopacomama"],
    ["makers/tokyo-hot", "Tokyo Hot"],
    ["makers/s-cute", "S-Cute"]
];

// Các kiểu sắp xếp (?sort=...) mà mọi danh sách và tìm kiếm đều nhận. Tên trùng chữ của ô EXPLORE_RANK và FILTER_SORT.
var SORTS = [
    ["recent", "Mới cập nhật"],
    ["release_date", "Mới phát hành"],
    ["hot", "Nổi bật"],
    ["today", "Hot hôm nay"],
    ["week", "Hot tuần"],
    ["month", "Hot tháng"],
    ["views", "Xem nhiều nhất"],
    ["follows", "Theo dõi nhiều nhất"],
    ["longest", "Dài nhất"]
];

// Dòng đầu tiên của bảng có cột nameCol bằng name; không có ⇒ null.
function findByName(table, nameCol, name) {
    for (var i = 0; i < table.length; i++) {
        if (table[i][nameCol] === name) return table[i];
    }
    return null;
}

function categoryUrl(path) {
    return SITE_URL + "/" + path;
}

function hasQueryParam(url, name) {
    return new RegExp("[?&]" + name + "=").test(String(url));
}

function addQueryParam(url, name, value) {
    var u = String(url).replace(/[?&]$/, "");
    return u + (u.indexOf("?") >= 0 ? "&" : "?") + name + "=" + value;
}

// Danh mục cố định cho home, Thể loại và hàng chip của Khám phá: [{ title, input }]. Bộ lọc áp ở list.js.
function browseCategories() {
    var out = [];
    for (var i = 0; i < CATEGORIES.length; i++) {
        out.push({ title: CATEGORIES[i][1], input: categoryUrl(CATEGORIES[i][0]) });
    }
    return out;
}

function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/?#]+)/i);
    return m ? m[1] : BASE_URL;
}

function absUrl(href) {
    href = String(href || "").trim();
    if (!href) return "";
    if (/^https?:\/\//i.test(href)) return href;
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return SITE_URL + "/" + href;
}

// Link phim gọn: bỏ query, hash và "/" cuối để mỗi phim chỉ có một link.
function cleanLink(href) {
    var u = absUrl(href);
    if (!u) return "";
    return u.split("#")[0].split("?")[0].replace(/\/+$/, "");
}

function slugOf(url) {
    var parts = cleanLink(url).split("/");
    return parts[parts.length - 1] || "";
}

// Trang phim: /<lang>/v/<mã> hoặc /v/<mã>.
function isMovieUrl(href) {
    href = String(href || "").trim();
    if (!href || href.charAt(0) === "#" || /^javascript:/i.test(href)) return false;
    var m = cleanLink(href).match(/^https?:\/\/[^\/]+\/(.*)$/i);
    if (!m) return false;
    return /^([a-z]{2,3}\/)?v\/[a-z0-9][a-z0-9_.-]*$/i.test(m[1]);
}

function withPage(url, page) {
    var u = String(url).replace(/([?&])page=\d+&?/, "$1").replace(/[?&]$/, "");
    if (!page || String(page) === "1") return u;
    return u + (u.indexOf("?") >= 0 ? "&" : "?") + "page=" + page;
}

// HTML thật của 123AV (không phải trang thử thách Cloudflare, vốn đổi tiêu đề theo ngôn ngữ).
function isSiteHtml(html) {
    return !!html && /og:site_name"\s+content="123AV"/i.test(html);
}

// Trang đã tải xong tới chân trang (khi đọc DOM từ trình duyệt lúc đang tải dở).
function isCompleteHtml(html) {
    return isSiteHtml(html) && html.indexOf("footer__col") >= 0;
}

// Mã hoá khoảng trắng, ký tự ngoài ASCII và ký tự URL không cho phép (giữ nguyên %XX):
// trình duyệt của app crash (URL(string:)!) với URL chưa mã hoá.
function safeUrl(url) {
    return String(url || "").trim().replace(/[^\x21-\x7e]+|[\x22\x3c\x3e\x5c\x5e\x60\x7b\x7c\x7d]/g, function (s) {
        return encodeURIComponent(s);
    });
}

function fetchHtml(url) {
    var res = null;
    try {
        res = fetch(safeUrl(url), {
            headers: { "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8" },
            timeout: 20000
        });
    } catch (e) {
        res = null;
    }
    if (!res || !res.ok) return "";
    var text = "";
    try {
        text = res.text();
    } catch (e) {
        text = "";
    }
    return isSiteHtml(text) ? text : "";
}

function docHtml(doc) {
    if (!doc) return "";
    try {
        return doc.html() || "";
    } catch (e) {
        return "";
    }
}

// launch() trả về ngay khi trang thử thách tải xong, nên phải chờ tới khi DOM là trang 123AV đầy đủ
// (tối đa khoảng 10 + 12 giây).
function browserHtml(browser, url) {
    var html = docHtml(browser.launch(safeUrl(url), 10000));
    for (var i = 0; i < 12 && !isCompleteHtml(html); i++) {
        html = docHtml(browser.html(1000));
    }
    return isSiteHtml(html) ? html : "";
}

// Cloudflare đòi bấm xác minh (trình duyệt ẩn không tự qua): mở trình duyệt hiện cho người dùng bấm, chờ tối đa
// khoảng 90 giây. Cookie vượt Cloudflare nằm trong kho cookie chung của WebView nên các lần sau trình duyệt ẩn
// tự qua. Người dùng đóng trình duyệt thì DOM trả về rỗng (không còn <script>) và dừng chờ.
function verifyHtml(url) {
    if (!CF_VERIFY_ENABLED || typeof Engine.newVisibleBrowser !== "function") return "";
    var browser = Engine.newVisibleBrowser("123AV - xác minh Cloudflare");
    try {
        var html = docHtml(browser.launch(safeUrl(url), 15000));
        var empty = 0;
        for (var i = 0; i < 90 && !isCompleteHtml(html); i++) {
            html = docHtml(browser.html(1000));
            empty = html.indexOf("<script") < 0 ? empty + 1 : 0;
            if (empty >= 5) break;
        }
        return isSiteHtml(html) ? html : "";
    } finally {
        try {
            browser.close();
        } catch (e) {
        }
    }
}

// Tải nhiều trang: thử fetch trước, bị chặn thì dùng một trình duyệt ẩn chung cho các trang còn lại;
// trình duyệt ẩn không qua được thì nhờ người dùng xác minh. Vẫn hỏng thì bỏ các trang sau (tránh chờ vô ích).
function loadPages(urls) {
    var out = [];
    var browser = null;
    var fetchBlocked = false;
    var browserFailed = false;
    try {
        for (var i = 0; i < urls.length; i++) {
            var html = fetchBlocked ? "" : fetchHtml(urls[i]);
            if (!html && !browserFailed) {
                fetchBlocked = true;
                if (!browser) browser = Engine.newBrowser();
                html = browserHtml(browser, urls[i]) || verifyHtml(urls[i]);
                browserFailed = !html;
            }
            out.push(html);
        }
    } finally {
        if (browser) {
            try {
                browser.close();
            } catch (e) {
            }
        }
    }
    return out;
}

function loadPage(url) {
    return loadPages([url])[0];
}

function loadError(url) {
    return Response.error("Không tải được " + url + " (Cloudflare chặn). Thử lại và bấm xác minh trong trình duyệt"
        + " hiện ra; nếu đã tắt \"Xác minh Cloudflare\" trong cài đặt tiện ích thì bật lại.");
}

// Thẻ phim: div.card có a.card__link thật (thẻ template của Alpine chỉ có :href nên bị bỏ).
function parseCards(root, seen) {
    var items = [];
    seen = seen || {};
    var cards = root.select("div.card");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var a = card.select("a.card__link[href]").first();
        var href = a.attr("href");
        if (!isMovieUrl(href)) continue;
        var link = cleanLink(href);
        var name = a.text().trim();
        if (!name || seen[link]) continue;
        seen[link] = true;

        var cover = card.select("img.card__img").attr("src");
        if (!/^https?:\/\//i.test(cover)) cover = absUrl(cover);
        var duration = card.select("span.card__dur").text().trim();
        items.push({
            name: name,
            link: link,
            cover: cover,
            description: slugOf(link).toUpperCase() + (duration ? " • " + duration : ""),
            tag: duration,
            host: BASE_URL
        });
    }
    return items;
}

function nextPageUrl(doc) {
    var href = doc.select("a[rel=next]").attr("href");
    return href ? absUrl(href) : "";
}

// Một trang danh sách phim có phân trang (dùng cho list.js, search.js).
function listPage(url) {
    var html = loadPage(url);
    if (!html) return loadError(url);
    var doc = Html.parse(html);
    return Response.success(parseCards(doc), nextPageUrl(doc));
}

// Token trang kế là URL đầy đủ (lấy từ a[rel=next]); số trang cũng được chấp nhận.
function pageUrl(firstUrl, page) {
    if (page && /^https?:\/\//i.test(page)) return page;
    return withPage(firstUrl, page);
}

// Giải chuỗi JS ('...' có \uXXXX, \\, \/) trước khi JSON.parse.
function jsUnescape(s) {
    return String(s).replace(/\\u([0-9a-fA-F]{4})|\\([\s\S])/g, function (m, hex, ch) {
        return hex ? String.fromCharCode(parseInt(hex, 16)) : ch;
    });
}

// Danh sách tập trên trang phim: x-data="player(JSON.parse('[{number, name, url}]'), ...)", url là trang nhúng
// dạng https://<host>/e/<id>. Không đọc được JSON thì dò link /e/<id> trong HTML.
function parseEpisodes(html) {
    var eps = [];
    var xd = Html.parse(html).select("div.watch__main").attr("x-data");
    var m = String(xd || "").match(/JSON\.parse\('((?:[^'\\]|\\[\s\S])*)'\)/);
    if (m) {
        try {
            var arr = JSON.parse(jsUnescape(m[1]));
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] && /^https?:\/\//i.test(arr[i].url || "")) {
                    eps.push({ number: String(arr[i].number || i + 1), name: String(arr[i].name || i + 1), url: arr[i].url });
                }
            }
        } catch (e) {
            eps = [];
        }
    }
    if (!eps.length) {
        var raw = String(html).replace(/\\+\//g, "/").match(/https?:\/\/[^"'\s\\<>]+\/e\/[A-Za-z0-9_]+/);
        if (raw) eps.push({ number: "1", name: "1", url: raw[0] });
    }
    return eps;
}

function episodeParam(url) {
    var m = String(url || "").match(/[?&]ep=([^&#]+)/);
    return m ? decodeURIComponent(m[1]) : "";
}
