load('crypto.js');
load('config.js');

// The play queue: each entry is one song (url = song page, read by chap.js). VIP-only songs are dropped.
function execute(url) {
    let route = parseRoute(url);
    if (!route) return Response.error("Link Zing MP3 không hỗ trợ: " + url);

    let songs = [];
    if (route.type === "song") {
        let json = zingApi("/song/get/info", { id: route.id });
        if (json.err !== 0 || !json.data) return Response.error(zingErrorText(json, "Không tải được bài hát"));
        songs = [json.data];
        if (!isPlayable(json.data)) return Response.error("Bài này chỉ dành cho tài khoản VIP của Zing MP3");
    } else if (route.type === "playlist") {
        let json = zingApi("/page/get/playlist", { id: route.id });
        if (json.err !== 0 || !json.data) return Response.error(zingErrorText(json, "Không tải được playlist"));
        songs = (json.data.song && json.data.song.items) || [];
    } else if (route.type === "artist") {
        let a = zingData("/page/get/artist", { alias: route.id });
        if (!a || !a.id) return Response.error("Không tải được nghệ sĩ");
        songs = artistSongs(a.id, 200);
        if (songs.length === 0) {
            (a.sections || []).forEach(function (section) {
                if (section.sectionType === "song") songs = songs.concat(section.items || []);
            });
        }
    } else {
        let chart = chartSongs(route);
        if (!chart) return Response.error("Không tải được bảng xếp hạng");
        songs = chart.items;
    }

    let seen = {};
    let out = [];
    songs.filter(isPlayable).forEach(function (s) {
        if (seen[s.encodeId]) return;
        seen[s.encodeId] = true;
        out.push(tocEntry(s));
    });
    if (out.length === 0) return Response.error("Không có bài nào nghe được (có thể toàn bài VIP)");
    return Response.success(out);
}
