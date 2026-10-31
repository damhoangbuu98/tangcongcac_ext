load('config.js');

function execute() {
    let response = fetchPage(BASE_URL + "/");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let genres = [];
    let seen = {};
    doc.select("a[href*='/the-loai/']").forEach(function (el) {
        let path = toPath(absoluteUrl(el.attr("href")));
        let title = el.attr("title") || el.text();
        if (!title || !path || seen[path]) return;
        seen[path] = true;
        genres.push({ title: title, input: path, script: "search.js" });
    });
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại");
    return Response.success(genres);
}
