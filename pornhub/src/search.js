load('config.js');

// Serves the search box (keyword) and every listing tab (input is a site path such as
// "/video?o=cm" or "/video?c=3"). `page` is "" / "1" for the first page, then the number from data2.
function execute(query, page) {
    query = String(query || "").trim();
    let pageNumber = parseInt(page, 10) || 1;

    let url;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        url = BASE_URL + (query.indexOf("http") === 0 ? toPath(query) : query);
    } else {
        if (!query) return Response.success([], "");
        url = BASE_URL + "/video/search?search=" + encodeURIComponent(query).replace(/%20/g, "+");
    }
    if (pageNumber > 1) url += (url.indexOf("?") < 0 ? "?" : "&") + "page=" + pageNumber;

    let response = fetchPage(url);
    // 404 = past the last page, or a keyword with no result: an empty list, not an error.
    if (response.status === 404) return Response.success([], "");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let items = parseVideoList(doc);
    let hasNext = items.length > 0 && doc.select("li.page_next a").size() > 0;
    return Response.success(items, hasNext ? String(pageNumber + 1) : "");
}
