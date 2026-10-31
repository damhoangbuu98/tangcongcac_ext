load('config.js');
load('common.js');

// Phim một tập (đa số): một mục "Full" với link phim. Nhiều tập: mỗi tập là link phim + "?ep=<số tập>".
// Không tải được trang thì vẫn trả mục "Full" như phim một tập (cùng link, để lịch sử xem không lệch).
function execute(url) {
    var link = cleanLink(url);
    var host = originOf(link);
    var html = loadPage(link);
    var eps = html ? parseEpisodes(html) : [];
    if (eps.length <= 1) return Response.success([{ name: "Full", url: link, host: host }]);

    var out = [];
    for (var i = 0; i < eps.length; i++) {
        out.push({ name: "Tập " + eps[i].name, url: link + "?ep=" + encodeURIComponent(eps[i].number), host: host });
    }
    return Response.success(out);
}
