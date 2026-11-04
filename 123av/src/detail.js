load('config.js');
load('common.js');

// Đề xuất ở trang Chi tiết: mỗi khối thành chuỗi JSON gọn [{name, link, cover, description}] cho similar.js (không gọi
// mạng lại). Bỏ mục không phải link phim, không tên, trùng link hoặc chính phim đang xem.
function pushSuggest(out, seen, href, name, cover, duration) {
    if (!isMovieUrl(href)) return;
    var link = cleanLink(href);
    name = String(name || "").trim();
    if (!name || seen[link]) return;
    seen[link] = true;
    out.push({
        name: name,
        link: link,
        cover: cover || "",
        description: slugOf(link).toUpperCase() + (duration ? " • " + duration : "")
    });
}

// Ảnh trong style="background-image:url('...')".
function styleImageUrl(style) {
    var m = String(style || "").match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    return m ? absUrl(m[1]) : "";
}

// "Video liên quan" (cột phải): aside.watch-side a.vside, ảnh nằm ở background-image của span.vside__thumb.
function relatedVideos(doc, selfLink) {
    var out = [];
    var seen = {};
    seen[selfLink] = true;
    var links = doc.select("aside.watch-side a.vside[href]");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        pushSuggest(out, seen, a.attr("href"), a.select("span.vside__title").text(),
            styleImageUrl(a.select("span.vside__thumb").attr("style")), a.select("span.vside__dur").text().trim());
    }
    return out;
}

// "Bạn có thể thích": web tải bằng JS từ máy gợi ý riêng, cấu hình nằm ở x-data="recommendation({ base, key, cdn,
// locale, scenario: 'watch-similar', code, count })" của section.rec. Gọi POST <base>/items/<mã>/items?timestamp=&signature=
// với chữ ký = băm(key + timestamp + User-Agent) ⇒ gửi đúng User-Agent đã băm. Lỗi gì cũng chỉ bỏ khối này.
var REC_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
// Hậu tố trường tên phim (title_<hậu tố>) theo locale, như web; locale khác ⇒ en.
var REC_TITLE_SUFFIX = {
    "en": "en", "ja": "ja", "zh-CN": "cn", "zh-TW": "tw", "ko": "ko", "th": "th", "ms": "ms", "vi": "vi", "id": "id",
    "fil": "fil", "hi": "hi", "de": "de", "fr": "fr"
};

function recOption(xd, name) {
    var m = String(xd || "").match(new RegExp("\\b" + name + "\\s*:\\s*'([^']*)'"));
    return m ? m[1] : "";
}

// Băm của web: hash = hash * 31 + mã ký tự (32 bit), in hex không dấu.
function recHash(input) {
    var hash = 0;
    for (var i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return (hash >>> 0).toString(16);
}

function recUserId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
}

// Số giây → h:mm:ss (như nhãn thời lượng trên thẻ phim của web).
function formatDuration(seconds) {
    var n = parseInt(seconds, 10);
    if (!(n > 0)) return "";
    var h = Math.floor(n / 3600);
    var m = Math.floor(n % 3600 / 60);
    var s = n % 60;
    var mm = h ? (m < 10 ? "0" : "") + m : String(m);
    return (h ? h + ":" : "") + mm + ":" + (s < 10 ? "0" : "") + s;
}

// Ảnh bìa: <cdn>/img2/s360/<2 ký tự đầu md5(mã)>/<mã>/cover.jpg; không có Crypto.md5 thì để trống.
function recCover(cdn, lowerCode) {
    if (!cdn || typeof Crypto === "undefined" || !Crypto.md5) return "";
    var hash = "";
    try {
        hash = String(Crypto.md5(lowerCode) || "");
    } catch (e) {
        hash = "";
    }
    return hash ? cdn.replace(/\/+$/, "") + "/img2/s360/" + hash.substring(0, 2) + "/" + lowerCode + "/cover.jpg" : "";
}

function recommendedVideos(doc, selfLink) {
    var xd = doc.select("section.rec").attr("x-data");
    var base = recOption(xd, "base");
    var key = recOption(xd, "key");
    var code = recOption(xd, "code");
    if (!base || !key || !code) return [];
    var cdn = recOption(xd, "cdn");
    var suffix = REC_TITLE_SUFFIX[recOption(xd, "locale")] || "en";
    var countMatch = String(xd).match(/\bcount\s*:\s*(\d+)/);
    var count = countMatch ? parseInt(countMatch[1], 10) : 12;

    var timestamp = String(Math.floor(new Date().getTime() / 1000));
    var url = base.replace(/\/+$/, "") + "/items/" + encodeURIComponent(code.toLowerCase()) + "/items?timestamp=" + timestamp
        + "&signature=" + recHash(key + timestamp + REC_USER_AGENT);
    var data = null;
    try {
        var res = fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "User-Agent": REC_USER_AGENT },
            body: JSON.stringify({ count: count, target_user: recUserId(), included_properties: ["code", "title_" + suffix, "duration"] }),
            timeout: 7000
        });
        if (res && res.ok) data = JSON.parse(res.text());
    } catch (e) {
        data = null;
    }

    var recomms = data && data.recomms instanceof Array ? data.recomms : [];
    var out = [];
    var seen = {};
    seen[selfLink] = true;
    for (var i = 0; i < recomms.length; i++) {
        var item = recomms[i];
        if (!item || !item.code) continue;
        var upper = String(item.code).toUpperCase();
        var lower = upper.toLowerCase();
        pushSuggest(out, seen, SITE_URL + "/v/" + lower, upper + " — " + (item["title_" + suffix] || upper),
            recCover(cdn, lower), formatDuration(item.duration));
    }
    return out;
}

function execute(url) {
    var link = cleanLink(url);
    var html = loadPage(link);
    if (!html) return loadError(link);
    var doc = Html.parse(html);

    var name = doc.select("h1.watch__title").text().trim() || doc.select("title").text().replace(/\s*—\s*123AV\s*$/, "").trim();
    var cover = styleImageUrl(doc.select("div.player").attr("style"));
    var description = doc.select("p.watch__desc-text").text().trim();

    // Bảng thông tin: mỗi dòng dt (nhãn) + dd (chữ hoặc các chip link).
    var lines = [];
    var rows = doc.select("dl.watch__info div.watch__info-row");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var label = row.select("dt").text().trim();
        var chips = row.select("dd a");
        var value = "";
        if (chips.size() > 0) {
            var names = [];
            for (var c = 0; c < chips.size(); c++) names.push(chips.get(c).text().trim());
            value = names.join(", ");
        } else {
            value = row.select("dd").text().trim();
        }
        if (label && value) lines.push(label + ": " + value);
    }

    // Link trong bảng thông tin → danh sách; phân loại theo đường dẫn.
    var actresses = [];
    var genres = [];
    var others = [];
    var seen = {};
    var links = doc.select("dl.watch__info a[href]");
    for (var j = 0; j < links.size(); j++) {
        var a = links.get(j);
        var href = a.attr("href");
        var title = a.text().trim();
        var input = cleanLink(href);
        if (!title || !input || seen[input]) continue;
        seen[input] = true;
        var entry = { title: title, input: input, script: "list.js" };
        if (href.indexOf("/actresses/") >= 0) {
            actresses.push(entry);
        } else if (href.indexOf("/genres/") >= 0) {
            genres.push(entry);
        } else if (href.indexOf("/series/") >= 0) {
            entry.title = "Series: " + title;
            others.push(entry);
        } else if (href.indexOf("/makers/") >= 0) {
            entry.title = "Hãng: " + title;
            others.push(entry);
        } else if (href.indexOf("/tags/") >= 0) {
            entry.title = "Tag: " + title;
            others.push(entry);
        }
    }

    var author = [];
    for (var k = 0; k < actresses.length; k++) author.push(actresses[k].title);

    var suggests = [];
    var recommended = recommendedVideos(doc, link);
    if (recommended.length) suggests.push({ title: "Bạn có thể thích", input: JSON.stringify(recommended), script: "similar.js" });
    var related = relatedVideos(doc, link);
    if (related.length) suggests.push({ title: "Video liên quan", input: JSON.stringify(related), script: "similar.js" });

    return Response.success({
        name: name || slugOf(link).toUpperCase(),
        cover: cover,
        host: originOf(link),
        author: author.join(", "),
        description: description,
        detail: lines.join("<br>"),
        ongoing: false,
        nsfw: true,
        type: "video",
        format: "series",
        genres: actresses.concat(genres, others),
        suggests: suggests
    });
}
