load('config.js');

function execute() {
    let response = fetchPage(BASE_URL + "/categories");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let genres = [];
    let seen = {};
    doc.select("li.catPic").forEach(function (el) {
        let link = el.select(".categoryTitleWrapper a");
        let path = toPath(link.attr("href"));
        let title = el.select(".categoryTitleWrapper strong").text() || link.attr("alt");
        if (!title || !path || seen[path]) return;
        // Only listings that paginate like /video; "/interactive", "/described-video"... use other layouts.
        let isListing = path.indexOf("/video?") === 0 || path.indexOf("/video/search?") === 0
            || path.indexOf("/categories/") === 0 || path === "/hd";
        if (!isListing) return;
        seen[path] = true;
        genres.push({ title: title, input: path, script: "search.js" });
    });
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại");
    return Response.success(genres);
}
