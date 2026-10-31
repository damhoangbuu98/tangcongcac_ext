load('config.js');
load('common.js');

var MAX_GENRES = 150;

// Danh mục cố định, sau đó là thể loại của web (/vi/genres, xếp theo số phim, lấy MAX_GENRES cái đầu).
// Bật "Chỉ duyệt phim rò rỉ không che": danh mục là các kiểu sắp xếp của Rò rỉ không che, thể loại gắn thêm
// bộ lọc type=uncensored-leaked.
function execute() {
    var out = [];
    var seen = {};
    var cats = browseCategories();
    for (var i = 0; i < cats.length; i++) {
        seen[cats[i].input] = true;
        out.push({ title: cats[i].title, input: cats[i].input, script: "list.js" });
    }

    var html = loadPage(SITE_URL + "/genres");
    if (html) {
        var chips = Html.parse(html).select("a.gchip[href]");
        var count = 0;
        for (var j = 0; j < chips.size() && count < MAX_GENRES; j++) {
            var a = chips.get(j);
            var link = cleanLink(a.attr("href"));
            var title = a.select("span.gchip__name").text().trim() || a.text().trim();
            if (!title || !link || link.indexOf("/genres/") < 0) continue;
            var input = UNCENSORED_ONLY_ENABLED ? withLeakFilter(link) : link;
            if (seen[input]) continue;
            seen[input] = true;
            out.push({ title: title, input: input, script: "list.js" });
            count++;
        }
    }
    return Response.success(out);
}
