load('config.js');
load('common.js');

// Server 1: track.js tự lấy m3u8 từ trang phim (không ra thì để app tự bắt link).
// Server 2: resolver webview — app vẫn thử bắt link trước, không bắt được thì nhúng nguyên trang phim.
function execute(url) {
    var link = cleanLink(url);
    return Response.success([
        { title: "MissAV", data: link },
        { title: "MissAV (web)", data: JSON.stringify({ url: link, mode: "webview" }) }
    ]);
}
