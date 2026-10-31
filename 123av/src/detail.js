load('config.js');
load('common.js');

function execute(url) {
    var link = cleanLink(url);
    var html = loadPage(link);
    if (!html) return loadError(link);
    var doc = Html.parse(html);

    var name = doc.select("h1.watch__title").text().trim() || doc.select("title").text().replace(/\s*—\s*123AV\s*$/, "").trim();
    var style = doc.select("div.player").attr("style");
    var coverMatch = String(style || "").match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    var cover = coverMatch ? absUrl(coverMatch[1]) : "";
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
        genres: actresses.concat(genres, others)
    });
}
