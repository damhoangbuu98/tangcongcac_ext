load('config.js');

// One artist as a list (query = numeric artist key): "Tất cả bài hát" (plays every song), playlists,
// albums, then hot songs.
function execute(query, page) {
    let key = String(query || "");
    let route = parseRoute(key);
    if (route && route.type === "artist") key = route.key;
    let a = nctData("/api/v2/search/artist/detail/" + key, { songSize: 30 });
    if (!a) return Response.error("Không tải được nghệ sĩ");

    let items = [{ name: "Tất cả bài hát của " + a.name, cover: bigImage(a.image), link: artistUrl(key), description: a.name, tag: "Nghe hết" }];
    (a.listPlaylist || []).forEach(function (pl) { items.push(playlistItem(pl)); });
    (a.listAlbum || []).forEach(function (pl) {
        let item = playlistItem(pl);
        item.tag = "Album";
        items.push(item);
    });
    (a.listSong || []).filter(isPlayable).forEach(function (s) { items.push(songItem(s)); });
    (a.relatedAlbum || []).forEach(function (pl) { items.push(playlistItem(pl)); });
    return Response.success(uniqueItems(items), "");
}
