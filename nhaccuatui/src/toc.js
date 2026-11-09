load('config.js');

// The play queue: each entry is one song (url = song page, read by chap.js). VIP-only songs are dropped.
function execute(url) {
    let route = parseRoute(url);
    if (!route) return Response.error("Link NhacCuaTui không hỗ trợ: " + url);

    let songs = [];
    if (route.type === "song") {
        let json = nctApi("/api/v1/song/detail/" + route.key, {});
        if (!json || json.code !== 0 || !json.data) return Response.error(nctErrorText(json, "Không tải được bài hát"));
        if (!isPlayable(json.data)) return Response.error("Bài này chỉ dành cho tài khoản VIP của NhacCuaTui");
        songs = [json.data];
    } else if (route.type === "playlist") {
        let json = nctApi("/api/v1/playlist/detail/" + route.key, {});
        if (!json || json.code !== 0 || !json.data) return Response.error(nctErrorText(json, "Không tải được playlist"));
        songs = json.data.listSong || [];
    } else if (route.type === "chart") {
        let c = nctData("/api/v1/playlist/charts/" + route.key, {});
        if (!c) return Response.error("Không tải được bảng xếp hạng");
        songs = c.items || [];
    } else {
        songs = artistSongs(route.key, 200);
    }

    let seen = {};
    let out = [];
    songs.filter(isPlayable).forEach(function (s) {
        if (seen[s.key]) return;
        seen[s.key] = true;
        out.push(tocEntry(s));
    });
    if (out.length === 0) return Response.error("Không có bài nào nghe được (có thể toàn bài VIP)");
    return Response.success(out);
}
