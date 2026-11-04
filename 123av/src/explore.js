load('config.js');
load('common.js');

// Trang chủ: hàng chip "Bảng khác" (các kiểu sắp xếp không chọn), hàng chip "Danh mục", rồi bảng đang chọn ở ô
// "Bảng xếp hạng Trang chủ" (EXPLORE_RANK) = /vi/all?sort=<mã>, cả trang đầu, kiểu hiển thị theo ô EXPLORE_LAYOUT.
// Mọi bảng gắn type= theo ô "Che / không che" (withListFilters). Chỉ tải một trang.

function listAction(name, input) {
    return { type: "list", name: name, script: "list.js", input: input };
}

function rankUrl(code) {
    return withListFilters(categoryUrl("all?sort=" + code));
}

function otherRankChips(chosen) {
    var chips = [];
    for (var i = 0; i < SORTS.length; i++) {
        if (SORTS[i][0] === chosen[0]) continue;
        chips.push({ name: SORTS[i][1], action: listAction(SORTS[i][1], rankUrl(SORTS[i][0])) });
    }
    return { id: "other_ranks", title: "Bảng khác", type: "chip", items: chips };
}

function categoryChips() {
    var cats = browseCategories();
    var chips = [];
    for (var i = 0; i < cats.length; i++) {
        chips.push({ name: cats[i].title, link: "", action: listAction(cats[i].title, cats[i].input) });
    }
    return { id: "categories", title: "Danh mục", subtitle: "", type: "chip", items: chips };
}

function execute() {
    var chosen = exploreRank();
    var url = rankUrl(chosen[0]);
    var html = loadPage(url);
    if (!html) return loadError(url);
    // App không lọc giúp mục của explore: parseCards đã bỏ mục không tên và trùng link.
    var items = parseCards(Html.parse(html), {});

    var sections = [otherRankChips(chosen), categoryChips()];
    if (items.length) {
        sections.push({
            id: "rank_" + chosen[0],
            title: "Bảng xếp hạng (" + chosen[1] + ")",
            type: exploreLayout(),
            shape: "movie",
            items: items,
            more: listAction(chosen[1], url)
        });
    }
    return Response.success(sections);
}
