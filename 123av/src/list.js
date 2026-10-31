load('config.js');
load('common.js');

// input: URL, đường dẫn (/vi/new) hoặc tên danh mục (new, recent, hot...) của trang danh sách.
// page: rỗng ở trang đầu, sau đó là URL trang kế lấy từ a[rel=next].
function execute(input, page) {
    var raw = String(input || "").trim() || "new";
    var first = (/^https?:\/\//i.test(raw) || raw.charAt(0) === "/") ? absUrl(raw) : categoryUrl(raw);
    return listPage(pageUrl(first, page));
}
