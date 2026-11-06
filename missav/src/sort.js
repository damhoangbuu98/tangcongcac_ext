// Ô "Sắp xếp" (FILTER_SORT) của cài đặt, chỉ cho script dựng trang danh sách (list.js, search.js): Bộ lọc của app chỉ
// hiện ô này ở tab có script nạp file này. Nạp sau config.js, common.js (dùng addQuery, sortCode).

// App truyền đúng chữ đang chọn. Thiếu thì để rỗng; chữ lạ (kể cả "Mặc định") ⇒ không gắn sort=.
var FILTER_SORT_NAME = "";
try {
    if (typeof FILTER_SORT !== "undefined" && FILTER_SORT) FILTER_SORT_NAME = String(FILTER_SORT).trim();
} catch (error) {
}

// FILTER_SORT cho trang danh sách chưa tự chọn sort; bảng xếp hạng đã có sort= thì giữ.
// Danh mục tự mang thứ tự riêng (Mới cập nhật, Mới phát hành, Hot hôm nay/tuần/tháng): không ghi đè bằng ô "Sắp xếp".
function hasOwnOrder(url) {
    return /\/(new|release|today-hot|weekly-hot|monthly-hot)\/?(?:[?#]|$)/.test(String(url));
}

function sortedUrl(url) {
    return hasOwnOrder(url) ? String(url || "") : addQuery(url, "sort", sortCode(FILTER_SORT_NAME));
}
