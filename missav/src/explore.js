load('config.js');
load('common.js');

// Tên tiếng Việt theo trang "Hơn" của section (trang chủ /vi để "Recent update" bằng tiếng Anh).
var SECTION_TITLES = {
    "new": "Mới cập nhật",
    "release": "Mới phát hành",
    "fc2": "Không kiểm duyệt",
    "today-hot": "Hot hôm nay"
};

function listAction(name, input) {
    return { type: "list", name: name, script: "list.js", input: input };
}

function moreLinkOf(header) {
    var links = header.select("a[href]");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href");
        if (!href || href.charAt(0) === "#" || /^javascript:/i.test(href)) continue;
        var link = cleanLink(href);
        if (originOf(link) !== originOf(SITE_URL) || isMovieUrl(link)) continue;
        return link;
    }
    return "";
}

// Mỗi section trang chủ: h2 nằm trong div.flex-1.min-w-0 của header; khung chứa header và lưới thẻ phim
// là cha của header. Điều kiện min-w-0 loại h2 của chân trang/hộp đăng nhập (cha của chúng bao cả trang).
function homeSections(doc) {
    var sections = [];
    var heads = doc.select("h2");
    for (var i = 0; i < heads.size(); i++) {
        var h2 = heads.get(i);
        var inner = h2.parent();
        if (!inner || !inner.hasClass("min-w-0")) continue;
        var header = inner.parent();
        var box = header ? header.parent() : null;
        if (!box) continue;
        var items = parseCards(box, {});
        if (!items.length) continue;
        var more = moreLinkOf(header);
        var title = h2.text().trim();
        var key = more ? slugOf(more) : "";
        if (SECTION_TITLES[key]) title = SECTION_TITLES[key];
        if (!title) continue;
        sections.push({
            key: key,
            id: "home_" + (key || i),
            title: title,
            subtitle: "",
            type: more ? "grid" : "horizontal_list",
            shape: "movie",
            items: items,
            more: more ? listAction(title, more) : null
        });
    }
    return sections;
}

function categoryChips() {
    var cats = browseCategories();
    var chips = [];
    for (var i = 0; i < cats.length; i++) {
        chips.push({ name: cats[i].label, link: "", action: listAction(cats[i].title, cats[i].input) });
    }
    return { id: "categories", title: "Danh mục", subtitle: "", type: "chip", items: chips };
}

function gridSection(id, title, items, input) {
    return {
        id: id, title: title, subtitle: "", type: "grid", shape: "movie", items: items,
        more: listAction(title, input)
    };
}

// Chế độ chỉ không che: hai lưới từ /vi/uncensored-leak (mới cập nhật, hot hôm nay) và hàng chip các kiểu sắp xếp.
function exploreLeak() {
    var newUrl = leakUrl("published_at");
    var hotUrl = leakUrl("today_views");
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

function execute() {
    if (UNCENSORED_ONLY_ENABLED) return exploreLeak();

    var hotUrl = categoryUrl("today-hot");
    var pages = loadPages([SITE_URL, hotUrl]);
    var sections = pages[0] ? homeSections(Html.parse(pages[0])) : [];

    // Thứ tự: Mới cập nhật, Hot hôm nay, Danh mục, rồi các section còn lại theo trang chủ.
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].key === "new") {
            sections.unshift(sections.splice(i, 1)[0]);
            break;
        }
    }
    var hotItems = pages[1] ? parseCards(Html.parse(pages[1]), {}) : [];
    if (hotItems.length) {
        var hot = gridSection("today_hot", SECTION_TITLES["today-hot"], hotItems, hotUrl);
        hot.key = "today-hot";
        sections.splice(sections.length && sections[0].key === "new" ? 1 : 0, 0, hot);
    }

    if (!sections.length) return loadError(SITE_URL);

    var out = [];
    for (var k = 0; k < sections.length; k++) {
        var s = sections[k];
        var section = { id: s.id, title: s.title, subtitle: s.subtitle, type: s.type, shape: s.shape, items: s.items };
        if (s.more) section.more = s.more;
        out.push(section);
        if (k === Math.min(1, sections.length - 1)) out.push(categoryChips());
    }
    return Response.success(out);
}
