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

// UNCENSORED_ONLY (toggle, mặc định bật): Khám phá, home và Thể loại chỉ lấy danh mục "Không che (rò rỉ)".
var UNCENSORED_ONLY_ENABLED = true;
try {
    if (typeof UNCENSORED_ONLY !== "undefined" && String(UNCENSORED_ONLY) === "false") {
        UNCENSORED_ONLY_ENABLED = false;
    }
} catch (error) {
}

var SITE_URL = BASE_URL + "/" + LANG;
var COVER_CDN = "https://fourhoi.com";
var STREAM_CDN = "https://surrit.com";
