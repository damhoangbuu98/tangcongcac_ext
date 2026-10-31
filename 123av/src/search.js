load('config.js');
load('common.js');

function execute(key, page) {
    key = String(key || "").trim();
    if (!key) return Response.success([], "");
    var first = SITE_URL + "/search?keyword=" + encodeURIComponent(key);
    return listPage(pageUrl(first, page));
}
