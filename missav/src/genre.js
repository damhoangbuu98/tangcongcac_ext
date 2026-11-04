load('config.js');
load('common.js');

// Danh mục cố định, sau đó là thể loại trang 1 của /vi/genres (bỏ qua nếu không tải được).
// "Che / không che" = Không che (rò rỉ): chỉ các kiểu sắp xếp của danh mục Không che (rò rỉ), không tải mạng
// (trang thể loại của web không lọc được theo không che).
function execute() {
    var out = [];
    var seen = {};
    var cats = browseCategories();
    for (var i = 0; i < cats.length; i++) {
        seen[cats[i].input] = true;
        out.push({ title: cats[i].title, input: cats[i].input, script: "list.js" });
    }
    if (LEAK_ONLY) return Response.success(out);

    var html = loadPage(SITE_URL + "/genres");
    if (html) {
        var links = Html.parse(html).select("a.text-nord13[href*=\"/genres/\"]");
        for (var j = 0; j < links.size(); j++) {
            var a = links.get(j);
            var link = cleanLink(a.attr("href"));
            var title = a.text().trim();
            if (!title || !link || seen[link]) continue;
            seen[link] = true;
            out.push({ title: title, input: link, script: "list.js" });
        }
    }
    return Response.success(out);
}
