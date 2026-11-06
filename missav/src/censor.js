// Ô "Che / không che" (FILTER_CENSOR) của cài đặt cùng danh mục và bảng xếp hạng phụ thuộc nó, chỉ cho script dùng tới
// (explore.js, genre.js, home.js, search.js): Bộ lọc của app chỉ hiện ô này ở tab có script nạp file này.
// Nạp sau config.js, common.js (dùng SORTS, categoryUrl, leakUrl, addQuery).

// FILTER_CENSOR (select, mặc định "Không che (rò rỉ)"): chỉ "Tất cả" mới duyệt như bình thường, chữ lạ ⇒ mặc định.
// Không che: Khám phá, home và Thể loại chỉ lấy danh mục "Không che (rò rỉ)", tìm kiếm thêm filters=uncensored-leak.
var LEAK_ONLY = true;
try {
    if (typeof FILTER_CENSOR !== "undefined" && String(FILTER_CENSOR).trim() === "Tất cả") {
        LEAK_ONLY = false;
    }
} catch (error) {
}

// Danh mục cố định, đường dẫn tính từ SITE_URL (https://missav.ai/vi).
var CATEGORIES = [
    ["new", "Mới cập nhật"],
    ["release", "Mới phát hành"],
    ["today-hot", "Hot hôm nay"],
    ["weekly-hot", "Hot tuần"],
    ["monthly-hot", "Hot tháng"],
    ["uncensored-leak", "Không che (rò rỉ)"],
    ["english-subtitle", "Phụ đề tiếng Anh"],
    ["fc2", "FC2"],
    ["siro", "SIRO"],
    ["luxu", "LUXU"],
    ["gana", "GANA"],
    ["ara", "ARA"],
    ["1pondo", "1pondo"],
    ["caribbeancom", "Caribbeancom"],
    ["heyzo", "HEYZO"],
    ["10musume", "10musume"],
    ["pacopacomama", "Pacopacomama"],
    ["tokyohot", "Tokyo Hot"],
    ["madou", "Madou (Trung Quốc)"],
    ["twav", "AV Đài Loan"],
    ["klive", "Live Hàn Quốc"],
    ["clive", "Live Trung Quốc"]
];
var LEAK_PREFIX = "Không che · ";

// Bảng xếp hạng theo kiểu sắp xếp: chế độ Không che ⇒ danh mục /vi/uncensored-leak; Tất cả ⇒ /vi/new (mọi phim).
function rankUrl(sort) {
    return LEAK_ONLY ? leakUrl(sort) : addQuery(categoryUrl("new"), "sort", sort);
}

// Mọi bảng xếp hạng theo chế độ che: [{ code, title (tên trang danh sách), label (tên ngắn cho chip), input }].
function rankCategories() {
    var out = [];
    for (var i = 0; i < SORTS.length; i++) {
        out.push({
            code: SORTS[i][0],
            title: (LEAK_ONLY ? LEAK_PREFIX : "") + SORTS[i][1],
            label: SORTS[i][1],
            input: rankUrl(SORTS[i][0])
        });
    }
    return out;
}

// Danh mục cho home, Thể loại và hàng chip của Khám phá: [{ title, label (tên ngắn cho chip), input }].
// Chế độ Không che: các kiểu sắp xếp của danh mục Không che (rò rỉ), cũng chính là các bảng xếp hạng.
function browseCategories() {
    if (LEAK_ONLY) return rankCategories();
    var out = [];
    for (var i = 0; i < CATEGORIES.length; i++) {
        out.push({ title: CATEGORIES[i][1], label: CATEGORIES[i][1], input: categoryUrl(CATEGORIES[i][0]) });
    }
    return out;
}
