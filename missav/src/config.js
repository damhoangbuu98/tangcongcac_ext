// Domain gốc, đổi được trong cài đặt (DOMAIN). Chấp nhận cả dạng có tiền tố như https://missav.ai/dm230/vi:
// lấy origin làm BASE_URL, đoạn ngôn ngữ cuối (vi, en, ja...) làm LANG; tiền tố dmNNN bị bỏ vì trang không cần.
var BASE_URL = "https://missav.ai";
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

// Các mục chọn (select) trong cài đặt: app truyền đúng chữ đang chọn. Thiếu thì để rỗng; chữ lạ được đổi về
// mặc định ở nơi dùng (EXPLORE_RANK: Hot hôm nay, EXPLORE_LAYOUT: Xếp hạng (đánh số), FILTER_SORT: Mặc định).
var EXPLORE_RANK_NAME = "";
var EXPLORE_LAYOUT_NAME = "";
var FILTER_SORT_NAME = "";
try {
    if (typeof EXPLORE_RANK !== "undefined" && EXPLORE_RANK) EXPLORE_RANK_NAME = String(EXPLORE_RANK).trim();
    if (typeof EXPLORE_LAYOUT !== "undefined" && EXPLORE_LAYOUT) EXPLORE_LAYOUT_NAME = String(EXPLORE_LAYOUT).trim();
    if (typeof FILTER_SORT !== "undefined" && FILTER_SORT) FILTER_SORT_NAME = String(FILTER_SORT).trim();
} catch (error) {
}

// FILTER_CENSOR (select, mặc định "Không che (rò rỉ)"): chỉ "Tất cả" mới duyệt như bình thường, chữ lạ ⇒ mặc định.
// Không che: Khám phá, home và Thể loại chỉ lấy danh mục "Không che (rò rỉ)", tìm kiếm thêm filters=uncensored-leak.
var LEAK_ONLY = true;
try {
    if (typeof FILTER_CENSOR !== "undefined" && String(FILTER_CENSOR).trim() === "Tất cả") {
        LEAK_ONLY = false;
    }
} catch (error) {
}

var SITE_URL = BASE_URL + "/" + LANG;
var COVER_CDN = "https://fourhoi.com";
var STREAM_CDN = "https://surrit.com";
