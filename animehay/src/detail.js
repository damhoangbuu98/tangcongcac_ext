load('config.js');

function execute(url) {
    url = detailUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let name = doc.select("h1.aim-hero__title").text();
    if (!name) return Response.error("Không đọc được thông tin phim");

    let info = [];
    let altName = doc.select(".aim-hero__alt-name").text();
    if (altName) info.push("Tên khác: " + altName);
    let score = doc.select(".aim-meta-score").text();
    if (score) info.push("Đánh giá: " + score.replace(/^⭐\s*/, ""));
    doc.select(".aim-hero__meta .aim-meta-item").forEach(function (el) {
        let text = el.text().replace(/^[^0-9A-Za-zÀ-ỹ?]+/, "").trim();
        if (text) info.push(text);
    });

    let genres = [];
    let seen = {};
    doc.select(".aim-hero__cates a.aim-cate-chip").forEach(function (el) {
        let path = toPath(absoluteUrl(el.attr("href")));
        if (!el.text() || !path || seen[path]) return;
        seen[path] = true;
        genres.push({ title: el.text(), input: path, script: "search.js" });
    });

    let result = {
        name: name,
        author: "",
        cover: absoluteUrl(doc.select("#aim-poster-img").attr("src") || doc.select(".aim-hero__poster img").attr("src")),
        description: doc.select(".aim-desc__content").text() || name,
        detail: info.join("<br>"),
        url: url,
        type: "video",
        format: "series",
        ongoing: doc.select(".aim-status--done").size() === 0,
        nsfw: false,
        locale: "vi",
        genres: genres
    };
    let similar = parseCards(doc, ".aim-similar .mc").map(function (item) {
        return { n: item.name, l: item.link, c: item.cover, d: item.description };
    });
    if (similar.length > 0) {
        result.suggests = [{ title: "Phim tương tự", input: JSON.stringify(similar), script: "similar.js" }];
    }
    return Response.success(result);
}
