load('config.js');
load('common.js');
load('sort.js');
load('censor.js');

// Trang tìm kiếm nhận filters=uncensored-leak (chế độ Không che: chỉ ra phim rò rỉ) và sort= ("Sắp xếp" trong cài đặt);
// link trang kế (a[rel=next]) giữ cả hai.
function execute(key, page) {
    key = String(key || "").trim();
    if (!key) return Response.success([], "");
    var first = SITE_URL + "/search/" + encodeURIComponent(key);
    if (LEAK_ONLY) first = addQuery(first, "filters", "uncensored-leak");
    return listPage(pageUrl(sortedUrl(first), page));
}
