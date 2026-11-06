// Ô "Sắp xếp" (FILTER_SORT) của cài đặt, chỉ cho script dựng trang danh sách (list.js, search.js): Bộ lọc của app chỉ
// hiện ô này ở tab có script nạp file này. Nạp sau config.js, common.js (dùng configText, findByName, SORTS,
// hasQueryParam, addQueryParam); ô chỉ đọc khi gọi hàm, không đọc lúc nạp file.

// Mã sort của ô "Sắp xếp"; "Mặc định" hoặc chữ lạ ⇒ "" (giữ thứ tự của trang).
function filterSortCode() {
    var found = findByName(SORTS, 1, configText(typeof FILTER_SORT !== "undefined" ? FILTER_SORT : ""));
    return found ? found[0] : "";
}

// Tab tự mang thứ tự riêng (Mới, Gần đây, Nổi bật): ô "Sắp xếp" không ghi đè, nếu không các tab ra giống nhau.
function hasOwnOrder(url) {
    return /\/(new|recent|hot)\/?(?:[?#]|$)/.test(String(url));
}

// Gắn sort= vào URL trang đầu của một danh sách khi ô "Sắp xếp" khác "Mặc định", URL chưa có sort= và không phải tab tự
// mang thứ tự riêng. Link trang kế (a[rel=next]) của web đã mang sẵn tham số này.
function withSortFilter(url) {
    var u = String(url);
    var sort = hasOwnOrder(u) ? "" : filterSortCode();
    if (sort && !hasQueryParam(u, "sort")) u = addQueryParam(u, "sort", sort);
    return u;
}
