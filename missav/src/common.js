// Hàm dùng chung. Mỗi script tự nạp config.js rồi common.js (nạp lồng nhau không được mở rộng).
// fetch giữ User-Agent mặc định của app: trùng với WebView, nên cookie Cloudflare (gắn với UA) dùng chung được.

// Danh mục cố định, đường dẫn tính từ SITE_URL (https://missav.ai/vi).
var CATEGORIES = [
    ["new", "Mới cập nhật"],
    ["release", "Mới phát hành"],
    ["today-hot", "Hot hôm nay"],
    ["weekly-hot", "Hot tuần"],
    ["monthly-hot", "Hot tháng"],
    ["uncensored-leak", "Không che (rò rỉ)"],
    ["english-subtitle", "Phụ đề tiếng Anh"],
    ["fc2", "FC2"],
    ["siro", "SIRO"],
    ["luxu", "LUXU"],
    ["gana", "GANA"],
    ["ara", "ARA"],
    ["1pondo", "1pondo"],
    ["caribbeancom", "Caribbeancom"],
    ["heyzo", "HEYZO"],
    ["10musume", "10musume"],
    ["pacopacomama", "Pacopacomama"],
    ["tokyohot", "Tokyo Hot"],
    ["madou", "Madou (Trung Quốc)"],
    ["twav", "AV Đài Loan"],
    ["klive", "Live Hàn Quốc"],
    ["clive", "Live Trung Quốc"]
];

// Các kiểu sắp xếp của danh mục "Không che (rò rỉ)" (/vi/uncensored-leak?sort=...). Tham số filters=uncensored-leak
// chỉ có tác dụng ở trang tìm kiếm, các trang danh sách khác bỏ qua nó, nên chế độ chỉ-không-che dùng danh mục này.
var LEAK_SORTS = [
    ["published_at", "Mới cập nhật"],
    ["released_at", "Mới phát hành"],
    ["today_views", "Hot hôm nay"],
    ["weekly_views", "Hot tuần"],
    ["monthly_views", "Hot tháng"],
    ["views", "Xem nhiều nhất"],
    ["saved", "Lưu nhiều nhất"]
];
var LEAK_PREFIX = "Không che · ";

function categoryUrl(path) {
    return SITE_URL + "/" + path;
}

function leakUrl(sort) {
    return categoryUrl("uncensored-leak") + (sort ? "?sort=" + sort : "");
}

// Danh mục cho home, Thể loại và hàng chip của Khám phá: [{ title, label (tên ngắn cho chip), input }].
function browseCategories() {
    var out = [];
    var i;
    if (UNCENSORED_ONLY_ENABLED) {
        for (i = 0; i < LEAK_SORTS.length; i++) {
            out.push({ title: LEAK_PREFIX + LEAK_SORTS[i][1], label: LEAK_SORTS[i][1], input: leakUrl(LEAK_SORTS[i][0]) });
        }
    } else {
        for (i = 0; i < CATEGORIES.length; i++) {
            out.push({ title: CATEGORIES[i][1], label: CATEGORIES[i][1], input: categoryUrl(CATEGORIES[i][0]) });
        }
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

// Bỏ tiền tố dmNNN, query, hash và "/" cuối để mỗi phim chỉ có một link.
function cleanLink(href) {
    var u = absUrl(href);
    if (!u) return "";
    u = u.split("#")[0].split("?")[0];
    u = u.replace(/^(https?:\/\/[^\/]+)\/dm\d+(?=\/)/i, "$1");
    return u.replace(/\/+$/, "");
}

function slugOf(url) {
    var parts = cleanLink(url).split("/");
    return parts[parts.length - 1] || "";
}

// Link dạng /<lang>/<một đoạn> hoặc /<một đoạn> (sau khi bỏ dmNNN). Trong thẻ phim, đó luôn là link phim.
function isItemUrl(href) {
    href = String(href || "").trim();
    if (!href || href.charAt(0) === "#" || /^javascript:/i.test(href)) return false;
    var m = cleanLink(href).match(/^https?:\/\/[^\/]+\/(.*)$/i);
    if (!m) return false;
    var segs = m[1].split("/");
    if (segs.length > 2) return false;
    if (segs.length === 2 && !/^[a-z]{2,3}$/.test(segs[0])) return false;
    return /^[a-z0-9][a-z0-9_.-]*$/i.test(segs[segs.length - 1]);
}

// Đoán link phim khi không nằm trong thẻ phim: mã có "-số"/"_số" (tikb-229, fc2-ppv-123, 082324_01, twav-s01)
// hoặc dạng Tokyo Hot (n1506, ka056). Trang danh sách như /vi/new, /vi/1pondo, /vi/naughty0930 không khớp.
// Cùng luật với "regexp" trong plugin.json.
function isMovieUrl(href) {
    if (!isItemUrl(href)) return false;
    var slug = slugOf(href).toLowerCase();
    return /[-_][a-z]?[0-9]/.test(slug) || /^[a-z]{1,4}[0-9]{3,5}$/.test(slug);
}

function withPage(url, page) {
    var u = String(url).replace(/([?&])page=\d+&?/, "$1").replace(/[?&]$/, "");
    if (!page || String(page) === "1") return u;
    return u + (u.indexOf("?") >= 0 ? "&" : "?") + "page=" + page;
}

// HTML thật của MissAV (không phải trang thử thách Cloudflare, vốn đổi tiêu đề theo ngôn ngữ).
function isSiteHtml(html) {
    return !!html && /og:site_name"\s+content="MissAV"/i.test(html);
}

// Trang đã tải xong tới chân trang (khi đọc DOM từ trình duyệt lúc đang tải dở).
function isCompleteHtml(html) {
    return isSiteHtml(html) && html.indexOf("footerHeading") >= 0;
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

// launch() trả về ngay khi trang thử thách tải xong, nên phải chờ tới khi DOM là trang MissAV đầy đủ
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
    var browser = Engine.newVisibleBrowser("MissAV - xác minh Cloudflare");
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

function metaContent(doc, prop) {
    return doc.select("meta[property=\"" + prop + "\"]").attr("content") || "";
}

function cardDuration(card) {
    var t = card.select("span.absolute.bottom-1.right-1").text().trim();
    if (/^\d+:\d{2}(:\d{2})?$/.test(t)) return t;
    var spans = card.select("span");
    for (var i = 0; i < spans.size(); i++) {
        var s = spans.get(i).text().trim();
        if (/^\d+:\d{2}(:\d{2})?$/.test(s)) return s;
    }
    return "";
}

function cardCover(card, slug) {
    var img = card.select("img").first();
    var src = img ? img.attr("data-src") : "";
    if (!/^https?:\/\//i.test(src) && img) src = img.attr("src");
    if (!/^https?:\/\//i.test(src)) src = COVER_CDN + "/" + slug + "/cover-t.jpg";
    return src;
}

// Đọc các thẻ phim (div.thumbnail) trong root. Bỏ thẻ khung chờ/template của Alpine (href "#", ":href").
function parseCards(root, seen) {
    var items = [];
    seen = seen || {};
    var cards = root.select("div.thumbnail");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var links = card.select("a[href]");
        var href = "";
        for (var j = 0; j < links.size(); j++) {
            var h = links.get(j).attr("href");
            if (isItemUrl(h)) {
                href = h;
                break;
            }
        }
        if (!href) continue;
        var link = cleanLink(href);
        if (seen[link]) continue;

        var slug = slugOf(link);
        var name = card.select("div.my-2 a").text().trim();
        if (!name) name = card.select("img").attr("alt").trim();
        if (!name) continue;
        seen[link] = true;

        var duration = cardDuration(card);
        items.push({
            name: name,
            link: link,
            cover: cardCover(card, slug),
            description: slug.toUpperCase() + (duration ? " • " + duration : ""),
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
