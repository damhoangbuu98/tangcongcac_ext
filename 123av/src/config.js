// Domain gốc, đổi được trong cài đặt (DOMAIN). Chấp nhận cả dạng có ngôn ngữ như https://123av.com/vi:
// lấy origin làm BASE_URL, đoạn ngôn ngữ cuối (vi, en, ja...) làm LANG.
var BASE_URL = "https://123av.com";
var LANG = "vi";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        var _domainMatch = String(DOMAIN).trim().match(/^(https?:\/\/[^\/?#]+)([^?#]*)/i);
        if (_domainMatch) {
            BASE_URL = _domainMatch[1];
            var _segs = (_domainMatch[2] || "").split("/");
            for (var _i = _segs.length - 1; _i >= 0; _i--) {
                if (/^[a-z]{2,3}$/.test(_segs[_i])) {
                    LANG = _segs[_i];
                    break;
                }
            }
        }
    }
} catch (error) {
}

// CF_VERIFY (toggle): trình duyệt ẩn không qua được Cloudflare thì mở trình duyệt hiện để người dùng tự xác minh.
var CF_VERIFY_ENABLED = true;
try {
    if (typeof CF_VERIFY !== "undefined" && String(CF_VERIFY) === "false") {
        CF_VERIFY_ENABLED = false;
    }
} catch (error) {
}

// Các ô chọn (select): giữ nguyên chữ đã chọn, common.js đổi ra mã (chữ lạ hoặc thiếu ⇒ mặc định).
// EXPLORE_RANK: bảng xếp hạng ở tab Trang chủ; EXPLORE_LAYOUT: kiểu hiển thị bảng đó;
// FILTER_SORT: sắp xếp mọi danh sách và tìm kiếm; FILTER_CENSOR: che / không che của mọi danh sách (tìm kiếm bỏ qua).
function configText(value) {
    return value == null ? "" : String(value).trim();
}

var EXPLORE_RANK_TEXT = "";
var EXPLORE_LAYOUT_TEXT = "";
var FILTER_SORT_TEXT = "";
var FILTER_CENSOR_TEXT = "";
try {
    EXPLORE_RANK_TEXT = configText(typeof EXPLORE_RANK !== "undefined" ? EXPLORE_RANK : "");
    EXPLORE_LAYOUT_TEXT = configText(typeof EXPLORE_LAYOUT !== "undefined" ? EXPLORE_LAYOUT : "");
    FILTER_SORT_TEXT = configText(typeof FILTER_SORT !== "undefined" ? FILTER_SORT : "");
    FILTER_CENSOR_TEXT = configText(typeof FILTER_CENSOR !== "undefined" ? FILTER_CENSOR : "");
} catch (error) {
}

var SITE_URL = BASE_URL + "/" + LANG;
