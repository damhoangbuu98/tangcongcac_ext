load('crypto.js');
load('config.js');

// One song ⇒ format "audio"; playlist / album / chart / artist ⇒ format "album" (toc.js lists the songs).
// The first `suggests` group is what the app plays next when the album ends (Tự phát bài gợi ý):
// song ⇒ "Bài gợi ý", playlist ⇒ "Playlist liên quan", chart ⇒ Top 100, artist ⇒ similar artists.
function execute(url) {
    let route = parseRoute(url);
    if (!route) return Response.error("Link Zing MP3 không hỗ trợ: " + url);

    if (route.type === "song") {
        let json = zingApi("/song/get/info", { id: route.id });
        if (json.err !== 0 || !json.data) return Response.error(zingErrorText(json, "Không tải được bài hát"));
        let s = json.data;
        let album = s.album && s.album.title ? "Album: " + s.album.title : "";
        return Response.success(result({
            name: s.title,
            author: s.artistsNames || "",
            cover: coverOf(s),
            description: album,
            detail: s.streamingStatus === 2 ? "Bài chỉ dành cho tài khoản VIP" : "",
            url: url,
            format: "audio",
            ongoing: false,
            genres: artistChips(s.artists),
            suggests: [
                { title: "Bài gợi ý", input: s.encodeId || route.id, script: "suggest.js" },
                { title: "Playlist liên quan", input: "song:" + (s.encodeId || route.id), script: "related.js" }
            ]
        }));
    }

    if (route.type === "playlist") {
        let json = zingApi("/page/get/playlist", { id: route.id });
        if (json.err !== 0 || !json.data) return Response.error(zingErrorText(json, "Không tải được playlist"));
        let p = json.data;
        let songs = (p.song && p.song.items) || [];
        let playable = songs.filter(isPlayable).length;
        let hidden = songs.length - playable;
        return Response.success(result({
            name: p.title,
            author: p.artistsNames || p.userName || "Zing MP3",
            cover: coverOf(p),
            description: p.sortDescription || p.description || "",
            detail: playable + " bài" + (hidden > 0 ? " · ẩn " + hidden + " bài chỉ dành cho VIP" : ""),
            url: url,
            format: "album",
            ongoing: false,
            genres: artistChips(p.artists),
            suggests: [
                { title: "Playlist liên quan", input: "playlist:" + route.id, script: "related.js" }
            ]
        }));
    }

    if (route.type === "artist") {
        let a = zingData("/page/get/artist", { alias: route.id });
        if (!a || !a.id) return Response.error("Không tải được nghệ sĩ");
        return Response.success(result({
            name: a.name,
            author: a.name,
            cover: coverOf(a),
            description: String(a.sortBiography || a.biography || "").replace(/<br\s*\/?>/gi, "\n"),
            detail: a.totalFollow ? formatCount(a.totalFollow) + " người quan tâm" : "",
            url: url,
            format: "album",
            ongoing: true,
            genres: [{ title: "Album & đĩa đơn", input: route.id, script: "artist.js" }],
            suggests: [
                { title: "Nghệ sĩ tương tự", input: "artist:" + route.id, script: "related.js" },
                { title: "Album & đĩa đơn", input: route.id, script: "artist.js" }
            ]
        }));
    }

    // Charts.
    let chart = chartSongs(route);
    if (!chart) return Response.error("Không tải được bảng xếp hạng");
    let first = chart.items[0];
    return Response.success(result({
        name: chartTitle(route, chart.data),
        author: "Zing MP3",
        cover: route.type === "week" ? (chart.data.cover || coverOf(first)) : coverOf(first),
        description: route.type === "week" && chart.data.startDate ? "Tuần " + chart.data.week + " (" + chart.data.startDate + " – " + chart.data.endDate + ")" : "",
        detail: chart.items.filter(isPlayable).length + " bài",
        url: url,
        format: "album",
        ongoing: true,
        genres: [],
        suggests: [
            { title: "Top 100", input: "", script: "top100.js" }
        ]
    }));
}

function artistChips(artists) {
    return (artists || []).filter(function (a) { return artistAlias(a); }).map(function (a) {
        return { title: a.name, input: artistAlias(a), script: "artist.js" };
    });
}

function result(fields) {
    fields.type = "audio";
    fields.locale = "vi";
    fields.nsfw = false;
    fields.tags = [];
    fields.comments = [];
    return fields;
}
