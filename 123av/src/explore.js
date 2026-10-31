load('config.js');
load('common.js');

function listAction(name, input) {
    return { type: "list", name: name, script: "list.js", input: input };
}

function gridSection(id, title, items, input) {
    return {
        id: id, title: title, subtitle: "", type: "grid", shape: "movie", items: items,
        more: listAction(title, input)
    };
}

function categoryChips() {
    var cats = browseCategories();
    var chips = [];
    for (var i = 0; i < cats.length; i++) {
        chips.push({ name: cats[i].label, link: "", action: listAction(cats[i].title, cats[i].input) });
    }
    return { id: "categories", title: "Danh mục", subtitle: "", type: "chip", items: chips };
}

// Các section trang chủ: div.section > div.section__head (h2.section__title + a.section__all) + lưới thẻ phim.
// Section gợi ý (template Alpine, không có link "Xem tất cả") bị bỏ.
function homeSections(doc) {
    var sections = [];
    var heads = doc.select("div.section__head");
    for (var i = 0; i < heads.size(); i++) {
        var head = heads.get(i);
        var more = head.select("a.section__all").attr("href");
        var box = head.parent();
        if (!more || !box) continue;
        var title = head.select(".section__title").text().trim();
        var items = parseCards(box, {});
        if (!title || !items.length) continue;
        sections.push(gridSection("home_" + slugOf(more), title, items, absUrl(more)));
    }
    return sections;
}

// Chế độ chỉ không che: hai lưới của Rò rỉ không che (mới cập nhật, hot hôm nay) và hàng chip các kiểu sắp xếp.
function exploreLeak() {
    var newUrl = leakUrl("recent");
    var hotUrl = leakUrl("today");
    var pages = loadPages([newUrl, hotUrl]);
    var out = [];
    var newItems = pages[0] ? parseCards(Html.parse(pages[0]), {}) : [];
    var hotItems = pages[1] ? parseCards(Html.parse(pages[1]), {}) : [];
    if (newItems.length) out.push(gridSection("leak_new", LEAK_PREFIX + "Mới cập nhật", newItems, newUrl));
    if (hotItems.length) out.push(gridSection("leak_hot", LEAK_PREFIX + "Hot hôm nay", hotItems, hotUrl));
    if (!out.length) return loadError(newUrl);
    out.push(categoryChips());
    return Response.success(out);
}

// Bình thường: các section trang chủ (Mới phát hành, Mới thêm gần đây), chèn "Hot hôm nay" và hàng chip
// sau section đầu.
function execute() {
    if (UNCENSORED_ONLY_ENABLED) return exploreLeak();

    var hotUrl = categoryUrl("all?sort=today");
    var pages = loadPages([SITE_URL, hotUrl]);
    var sections = pages[0] ? homeSections(Html.parse(pages[0])) : [];
    var hotItems = pages[1] ? parseCards(Html.parse(pages[1]), {}) : [];
    if (hotItems.length) {
        sections.splice(Math.min(1, sections.length), 0, gridSection("today_hot", "Hot hôm nay", hotItems, hotUrl));
    }
    if (!sections.length) return loadError(SITE_URL);

    var out = [];
    for (var k = 0; k < sections.length; k++) {
        out.push(sections[k]);
        if (k === Math.min(1, sections.length - 1)) out.push(categoryChips());
    }
    return Response.success(out);
}
