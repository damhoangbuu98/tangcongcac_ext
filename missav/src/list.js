load('config.js');
load('common.js');
load('sort.js');

// input: URL, đường dẫn (/vi/new) hoặc tên danh mục (new, today-hot...) của trang danh sách.
// page: rỗng ở trang đầu, sau đó là URL trang kế lấy từ a[rel=next] (đã giữ sort= của trang đầu).
// "Sắp xếp" trong cài đặt (FILTER_SORT) chỉ áp khi URL chưa có sort= (bảng xếp hạng giữ kiểu của nó).
function execute(input, page) {
    var raw = String(input || "").trim() || "new";
    var first = (/^https?:\/\//i.test(raw) || raw.charAt(0) === "/") ? absUrl(raw) : categoryUrl(raw);
    return listPage(pageUrl(sortedUrl(first), page));
}
