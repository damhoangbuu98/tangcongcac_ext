load('config.js');
load('common.js');
load('sort.js');
load('censor.js');

// Gắn bộ lọc của cấu hình vào URL trang đầu: sort= của ô "Sắp xếp" trước (sort.js), rồi type= của ô "Che / không che"
// xét trên URL đã gắn sort= (censor.js).
function withListFilters(url) {
    return withCensorFilter(withSortFilter(url));
}

// input: URL, đường dẫn (/vi/new) hoặc tên danh mục (new, recent, hot...) của trang danh sách.
// page: rỗng ở trang đầu, sau đó là URL trang kế lấy từ a[rel=next].
// Trang đầu gắn bộ lọc "Sắp xếp" và "Che / không che" của cấu hình (withListFilters); link trang kế của web giữ sẵn chúng.
function execute(input, page) {
    var raw = String(input || "").trim() || "new";
    var first = (/^https?:\/\//i.test(raw) || raw.charAt(0) === "/") ? absUrl(raw) : categoryUrl(raw);
    return listPage(pageUrl(withListFilters(first), page));
}
