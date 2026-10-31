load('config.js');

function execute(url) {
    url = seriesUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let name = doc.select("h1.film-name").text();
    if (!name) return Response.error("Không đọc được thông tin phim");
    let img = doc.select(".anisc-poster img.film-poster-img");

    let info = [];
    let status = "";
    doc.select(".anisc-info .item").forEach(function (el) {
        let head = el.select(".item-head").text().replace(/:\s*$/, "");
        if (!head || head === "Thể loại") return;
        let value = el.select(".name").text() || el.select("a").text();
        if (!value) return;
        if (head === "Trạng thái") status = value;
        info.push(head + ": " + value);
    });

    let genres = [];
    let seen = {};
    doc.select(".anisc-info a.genre").forEach(function (el) {
        let path = toPath(absoluteUrl(el.attr("href")));
        if (!el.text() || !path || seen[path]) return;
        seen[path] = true;
        genres.push({ title: el.text(), input: path, script: "search.js" });
    });

    let suggests = [];
    let parts = [];
    doc.select(".os-list a.os-item").forEach(function (el) {
        let link = absoluteUrl(el.attr("href"));
        if (!link || link === url) return;
        parts.push({ n: el.attr("title") || el.select(".title").text(), l: link, d: el.select(".title").text() });
    });
    if (parts.length > 0) suggests.push({ title: "Phần liên quan", input: JSON.stringify(parts), script: "similar.js" });
    let related = parseCards(doc).slice(0, 24).map(function (item) {
        return { n: item.name, l: item.link, c: item.cover, d: item.description };
    });
    if (related.length > 0) suggests.push({ title: "Có thể bạn thích", input: JSON.stringify(related), script: "similar.js" });

    return Response.success({
        name: name,
        author: "",
        cover: absoluteUrl(img.attr("data-src") || img.attr("src")),
        description: doc.select(".film-description .text").text() || name,
        detail: info.join("<br>"),
        url: url,
        type: "video",
        format: "series",
        ongoing: status.indexOf("Hoàn") < 0,
        nsfw: false,
        locale: "vi",
        genres: genres,
        suggests: suggests
    });
}
