load('config.js');

// Related lists. query: "playlist:<key>" ⇒ related playlists; "artist:<id>" ⇒ the artist's playlists,
// albums and related albums.
function execute(query, page) {
    let m = /^(playlist|artist):(.+)$/.exec(String(query || ""));
    if (!m) return Response.success([], "");

    if (m[1] === "playlist") {
        let list = nctData("/api/v1/playlist/related/" + m[2], {}) || [];
        let items = list.filter(function (pl) { return pl.key !== m[2]; }).map(playlistItem);
        return Response.success(uniqueItems(items), "");
    }

    let a = nctData("/api/v2/search/artist/detail/" + m[2], { songSize: 1 });
    if (!a) return Response.success([], "");
    let items = [].concat(a.listPlaylist || [], a.listAlbum || [], a.relatedAlbum || []).map(playlistItem);
    return Response.success(uniqueItems(items), "");
}
