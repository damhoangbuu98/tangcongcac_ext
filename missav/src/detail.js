load('config.js');
load('common.js');

function formatSeconds(sec) {
    sec = parseInt(sec, 10);
    if (!sec || sec <= 0) return "";
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var mm = (m < 10 ? "0" : "") + m;
    var ss = (s < 10 ? "0" : "") + s;
    return h > 0 ? h + ":" + mm + ":" + ss : m + ":" + ss;
}

function capitalize(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function execute(url) {
    var html = loadPage(url);
    if (!html) return loadError(url);
    var doc = Html.parse(html);
    var slug = slugOf(url);

    var name = doc.select("h1").first().text().trim() || metaContent(doc, "og:title");
    var cover = metaContent(doc, "og:image") || (COVER_CDN + "/" + slug + "/cover-n.jpg");
    var description = doc.select("div.text-secondary.break-all").first().text().trim()
        || metaContent(doc, "og:description");

    // Khối thông tin: mỗi dòng "Nhãn: giá trị"; phân loại link theo đường dẫn, không theo chữ (hoa/thường thất thường).
    var lines = [];
    var rows = doc.select("div.space-y-2 > div.text-secondary");
    for (var i = 0; i < rows.size(); i++) {
        var line = rows.get(i).text().replace(/\s+/g, " ").trim();
        if (line) lines.push(capitalize(line));
    }
    var duration = formatSeconds(metaContent(doc, "og:video:duration"));
    if (duration) lines.splice(Math.min(2, lines.length), 0, "Thời lượng: " + duration);

    var actresses = [];
    var genres = [];
    var others = [];
    var seen = {};
    var links = doc.select("div.space-y-2 a[href]");
    for (var j = 0; j < links.size(); j++) {
        var a = links.get(j);
        var href = a.attr("href");
        var title = a.text().trim();
        var link = cleanLink(href);
        if (!title || !link || seen[link]) continue;
        seen[link] = true;
        var entry = { title: title, input: link, script: "list.js" };
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
        }
    }

    var author = [];
    for (var k = 0; k < actresses.length; k++) author.push(actresses[k].title);

    return Response.success({
        name: name || slug.toUpperCase(),
        cover: cover,
        host: originOf(url),
        author: author.join(", "),
        description: description,
        detail: lines.join("<br>"),
        ongoing: false,
        nsfw: true,
        type: "video",
        format: "series",
        genres: actresses.concat(genres, others)
    });
}
