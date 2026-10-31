load('config.js');

// Serves the search box (keyword) and every listing tab (input is a site path such as
// "/newest" or "/categories/amateur"). `page` is "" / "1" for the first page, then the number from data2.
function execute(query, page) {
    query = String(query || "").trim();
    let pageNumber = parseInt(page, 10) || 1;

    let url;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        let path = query.indexOf("http") === 0 ? toPath(query) : query;
        let parts = path.split("?");
        let base = parts[0].replace(/\/+$/, "");
        url = BASE_URL + base + (pageNumber > 1 ? "/" + pageNumber : "") + (parts.length > 1 ? "?" + parts.slice(1).join("?") : "");
    } else {
        if (!query) return Response.success([], "");
        url = BASE_URL + "/search/" + encodeURIComponent(query) + (pageNumber > 1 ? "?page=" + pageNumber : "");
    }

    let response = fetchPage(url);
    // 404 = past the last page, or a keyword with no result: an empty list, not an error.
    if (response.status === 404) return Response.success([], "");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let text = response.text();
    let state = parseInitials(text);
    if (!state) return Response.error("Không đọc được danh sách video");

    let items = mapThumbList(findThumbList(state));
    let next = "";
    if (items.length > 0) {
        let last = /"(?:lastPageNumber|maxPages)":(\d+)/.exec(text);
        if (last) {
            if (pageNumber < parseInt(last[1], 10)) next = String(pageNumber + 1);
        } else if (items.length >= 20) {
            next = String(pageNumber + 1);
        }
    }
    return Response.success(items, next);
}
