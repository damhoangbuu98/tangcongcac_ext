// Ô "Che / không che" (FILTER_CENSOR) của cài đặt, chỉ cho script gắn type= vào danh sách (list.js, explore.js): Bộ lọc
// của app chỉ hiện ô này ở tab có script nạp file này. Tìm kiếm bỏ qua type= nên search.js không nạp.
// Nạp sau config.js, common.js (dùng configText, findByName, hasQueryParam, addQueryParam); ô chỉ đọc khi gọi hàm.

// Ô "Che / không che" → tham số type= của danh sách ("" = không lọc).
var CENSOR_TYPES = [
    ["Tất cả", ""],
    ["Kiểm duyệt", "censored"],
    ["Không kiểm duyệt", "uncensored"],
    ["Rò rỉ không che", "uncensored-leaked"]
];
var DEFAULT_CENSOR = "Rò rỉ không che";

// Chữ lạ hoặc thiếu ⇒ mặc định (Rò rỉ không che).
function filterCensorType() {
    var found = findByName(CENSOR_TYPES, 0, configText(typeof FILTER_CENSOR !== "undefined" ? FILTER_CENSOR : ""))
        || findByName(CENSOR_TYPES, 0, DEFAULT_CENSOR);
    return found[1];
}

// Chính danh mục Kiểm duyệt / Không kiểm duyệt / Rò rỉ không che (/<lang>/censored...): đã là bộ lọc che nên không gắn type=.
function isCensorCategory(url) {
    var m = String(url).match(/^https?:\/\/[^\/]+\/(?:[a-z]{2,3}\/)?([^\/?#]*)\/?(?:[?#]|$)/i);
    return !!m && /^(censored|uncensored|uncensored-leaked)$/i.test(m[1]);
}

// Gắn type= vào URL trang đầu của một danh sách khi ô "Che / không che" khác "Tất cả", URL chưa có type= và không phải
// chính danh mục che / không che. Link trang kế (a[rel=next]) của web đã mang sẵn tham số này.
function withCensorFilter(url) {
    var u = String(url);
    var type = filterCensorType();
    if (type && !hasQueryParam(u, "type") && !isCensorCategory(u)) u = addQueryParam(u, "type", type);
    return u;
}
