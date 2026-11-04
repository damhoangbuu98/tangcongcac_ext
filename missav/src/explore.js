load('config.js');
load('common.js');

// "Kiểu hiển thị bảng" trong cài đặt (EXPLORE_LAYOUT) → type của section bảng xếp hạng; chữ lạ ⇒ dòng đầu.
var EXPLORE_LAYOUTS = [
    ["Xếp hạng (đánh số)", "ranking"],
    ["Danh sách", "list"],
    ["Lưới", "grid"],
    ["Hàng ngang", "horizontal_list"]
];

function listAction(name, input) {
    return { type: "list", name: name, script: "list.js", input: input };
}

function exploreLayout() {
    for (var i = 0; i < EXPLORE_LAYOUTS.length; i++) {
        if (EXPLORE_LAYOUTS[i][0] === EXPLORE_LAYOUT_NAME) return EXPLORE_LAYOUTS[i][1];
    }
    return EXPLORE_LAYOUTS[0][1];
}

function chipSection(id, title, cats) {
    var chips = [];
    for (var i = 0; i < cats.length; i++) {
        chips.push({ name: cats[i].label, link: "", action: listAction(cats[i].title, cats[i].input) });
    }
    return { id: id, title: title, subtitle: "", type: "chip", items: chips };
}

// Thứ tự: chip "Bảng khác" (các bảng không chọn), chip "Danh mục" (chỉ chế độ Tất cả; chế độ Không che danh mục chính
// là các bảng xếp hạng nên ẩn cho khỏi trùng), rồi bảng đang chọn (EXPLORE_RANK) với cả trang đầu. Chỉ tải một trang.
function execute() {
    var code = sortCode(EXPLORE_RANK_NAME) || DEFAULT_RANK_SORT;
    var ranks = rankCategories();
    var current = null;
    var others = [];
    for (var i = 0; i < ranks.length; i++) {
        if (ranks[i].code === code) {
            current = ranks[i];
        } else {
            others.push(ranks[i]);
        }
    }

    var html = loadPage(current.input);
    var items = html ? parseCards(Html.parse(html), {}) : [];
    if (!items.length) return loadError(current.input);

    var out = [chipSection("other_ranks", "Bảng khác", others)];
    if (!LEAK_ONLY) out.push(chipSection("categories", "Danh mục", browseCategories()));
    out.push({
        id: "rank_" + code,
        title: "Bảng xếp hạng (" + current.label + ")",
        subtitle: "",
        type: exploreLayout(),
        shape: "movie",
        items: items,
        more: listAction(current.title, current.input)
    });
    return Response.success(out);
}
