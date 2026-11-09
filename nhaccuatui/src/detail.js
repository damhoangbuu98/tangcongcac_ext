load('config.js');

// One song ⇒ format "audio"; playlist / album / chart / artist ⇒ format "album" (toc.js lists the songs).
// The first `suggests` group is what the app plays next when the album ends (Tự phát bài gợi ý):
// song ⇒ "Bài gợi ý", playlist ⇒ "Playlist liên quan", chart ⇒ other charts, artist ⇒ albums / playlists.
function execute(url) {
    let route = parseRoute(url);
    if (!route) return Response.error("Link NhacCuaTui không hỗ trợ: " + url);

    if (route.type === "song") {
        let json = nctApi("/api/v1/song/detail/" + route.key, {});
        if (!json || json.code !== 0 || !json.data) return Response.error(nctErrorText(json, "Không tải được bài hát"));
        let s = json.data;
        let album = (s.album && s.album.length && s.album[0].name) ? "Album: " + s.album[0].name : "";
        return Response.success(result({
            name: s.name,
            author: s.artistName || "",
            cover: bigImage(s.image || s.artistImage),
            description: album,
            detail: [s.genreName, isPlayable(s) ? "" : "Bài chỉ dành cho tài khoản VIP"].filter(function (x) { return x; }).join(" · "),
            url: url,
            format: "audio",
            ongoing: false,
            genres: artistChips(s.artist),
            suggests: [
                { title: "Bài gợi ý", input: s.key || route.key, script: "suggest.js" },
                { title: "Playlist của nghệ sĩ", input: "artist:" + (s.artistId || "").split(",")[0], script: "related.js" }
            ]
        }));
    }

    if (route.type === "playlist") {
        let json = nctApi("/api/v1/playlist/detail/" + route.key, {});
        if (!json || json.code !== 0 || !json.data) return Response.error(nctErrorText(json, "Không tải được playlist"));
        let p = json.data;
        let songs = p.listSong || [];
        let playable = songs.filter(isPlayable).length;
        let hidden = songs.length - playable;
        return Response.success(result({
            name: p.name,
            author: p.artistName || p.userCreated || "NhacCuaTui",
            cover: bigImage(p.image),
            description: stripHtml(p.description),
            detail: playable + " bài" + (hidden > 0 ? " · ẩn " + hidden + " bài chỉ dành cho VIP" : ""),
            url: url,
            format: "album",
            ongoing: false,
            genres: artistChips(p.listArtist),
            suggests: [
                { title: "Playlist liên quan", input: "playlist:" + route.key, script: "related.js" }
            ]
        }));
    }

    if (route.type === "chart") {
        let c = nctData("/api/v1/playlist/charts/" + route.key, {});
        if (!c) return Response.error("Không tải được bảng xếp hạng");
        return Response.success(result({
            name: c.title || c.titleDetail || c.name,
            author: "NhacCuaTui",
            cover: bigImage(c.image),
            description: c.name || "",
            detail: (c.items || []).filter(isPlayable).length + " bài",
            url: url,
            format: "album",
            ongoing: true,
            genres: [],
            suggests: [
                { title: "Bảng xếp hạng khác", input: "", script: "charts.js" }
            ]
        }));
    }

    let a = nctData("/api/v2/search/artist/detail/" + route.key, { songSize: 1 });
    if (!a) return Response.error("Không tải được nghệ sĩ");
    return Response.success(result({
        name: a.name,
        author: a.name,
        cover: bigImage(a.image),
        description: stripHtml(a.description),
        detail: [a.national, a.totalSong ? a.totalSong + " bài" : "", a.totalFollow ? a.totalFollow + " quan tâm" : ""].filter(function (x) { return x; }).join(" · "),
        url: url,
        format: "album",
        ongoing: true,
        genres: [{ title: "Album & playlist", input: route.key, script: "artist.js" }],
        suggests: [
            { title: "Album & playlist", input: "artist:" + route.key, script: "related.js" }
        ]
    }));
}

function artistChips(artists) {
    if (!artists) return [];
    if (!(artists instanceof Array)) artists = [artists];
    return artists.filter(function (a) { return a && a.key && a.name; }).map(function (a) {
        return { title: a.name, input: String(a.key), script: "artist.js" };
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
