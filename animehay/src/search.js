load('config.js');

// Serves the search box (keyword) and every listing tab (input is a site path such as
// "/phim-moi-cap-nhap" or "/the-loai/anime-1.html"). `page` is "" / "1" for the first page, then the number from data2.
function execute(query, page) {
    query = String(query || "").trim();
    let pageNumber = parseInt(page, 10) || 1;

    let path;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        path = query.indexOf("http") === 0 ? toPath(query) : query;
    } else {
        if (!query) return Response.success([], "");
        path = "/tim-kiem/" + encodeURIComponent(query);
    }

    let response = fetchPage(pagedUrl(path, pageNumber));
    if (response.status === 404) return Response.success([], "");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let items = parseCards(doc);
    let hasNext = items.length > 0 && doc.select("a[href*='/trang-" + (pageNumber + 1) + ".html']").size() > 0;
    return Response.success(items, hasNext ? String(pageNumber + 1) : "");
}
