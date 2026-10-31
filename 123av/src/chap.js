load('config.js');
load('common.js');

// url: link phim (có thể kèm ?ep=<số tập>). Đọc danh sách tập trên trang phim, lấy trang nhúng của tập đó.
// Server 1: track.js gọi API /stream của trang nhúng lấy m3u8 (không ra thì để app tự bắt link).
// Server 2: resolver webview — app vẫn thử bắt link trước, không bắt được thì nhúng trang phát.
function execute(url) {
    var link = cleanLink(url);
    var ep = episodeParam(url);
    var html = loadPage(link);
    if (!html) return loadError(link);
    var eps = parseEpisodes(html);
    if (!eps.length) return Response.error("Không có nguồn phát");

    var chosen = eps[0];
    for (var i = 0; i < eps.length; i++) {
        if (ep && eps[i].number === ep) {
            chosen = eps[i];
            break;
        }
    }
    return Response.success([
        { title: "123AV", data: chosen.url },
        { title: "123AV (web)", data: JSON.stringify({ url: chosen.url, mode: "webview" }) }
    ]);
}
