load('config.js');
load('common.js');

// Tìm kiếm nhận sort= (ô "Sắp xếp") nhưng bỏ qua type=, nên ô "Che / không che" không áp ở đây.
function execute(key, page) {
    key = String(key || "").trim();
    if (!key) return Response.success([], "");
    var first = SITE_URL + "/search?keyword=" + encodeURIComponent(key);
    var sort = filterSortCode();
    if (sort) first = addQueryParam(first, "sort", sort);
    return listPage(pageUrl(first, page));
}
