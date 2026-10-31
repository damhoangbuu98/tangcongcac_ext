load('config.js');

// Serves the search box (keyword) and every listing tab (input is a site path such as
// "/moi-cap-nhat" or "/the-loai/tien-hiep"). `page` is "" / "1" for the first page, then the number from data2.
function execute(query, page) {
    query = String(query || "").trim();
    let pageNumber = parseInt(page, 10) || 1;

    let url;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        url = BASE_URL + (query.indexOf("http") === 0 ? toPath(query) : query);
    } else {
        if (!query) return Response.success([], "");
        url = BASE_URL + "/search?keysearch=" + encodeURIComponent(query).replace(/%20/g, "+");
    }
    if (pageNumber > 1) url += (url.indexOf("?") < 0 ? "?" : "&") + "page=" + pageNumber;

    let response = fetchPage(url);
    if (response.status === 404) return Response.success([], "");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let items = parseCards(doc);
    // Search result pages drop `rel=next`; a full page of 24 means there may be another.
    let hasNext = items.length > 0 && (doc.select("a[rel=next]").size() > 0 || items.length >= 24);
    return Response.success(items, hasNext ? String(pageNumber + 1) : "");
}
