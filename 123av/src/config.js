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

// Các ô chọn (select): giữ nguyên chữ đã chọn, đổi ra mã ở hàm dùng tới nó (chữ lạ hoặc thiếu ⇒ mặc định).
// Không đọc ở đây mà ở file dùng tới chúng, vì Bộ lọc của app chỉ hiện ô mà script của tab (cùng các file nó nạp)
// nhắc tới. EXPLORE_RANK: bảng xếp hạng ở tab Trang chủ, EXPLORE_LAYOUT: kiểu hiển thị bảng đó (explore.js);
// FILTER_SORT: sắp xếp mọi danh sách và tìm kiếm (sort.js); FILTER_CENSOR: che / không che của mọi danh sách,
// tìm kiếm bỏ qua (censor.js).
function configText(value) {
    return value == null ? "" : String(value).trim();
}

var SITE_URL = BASE_URL + "/" + LANG;
