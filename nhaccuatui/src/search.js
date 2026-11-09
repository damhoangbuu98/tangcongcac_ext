load('config.js');

// Page n: songs (20) + albums / playlists (10); page 1 also lists matching artists.
function execute(query, page) {
    let q = String(query || "").trim();
    if (!q) return Response.success([], "");
    let n = parseInt(page || "1", 10) || 1;

    let songs = nctApi("/api/v1/search/song", { keyword: q, pageindex: n, pagesize: 20, correct: "false" });
    let albums = nctApi("/api/v1/search/album", { keyword: q, pageindex: n, pagesize: 10, correct: "false" });
    let items = [];
    if (songs && songs.code === 0 && songs.data) {
        (songs.data.songs || []).filter(isPlayable).forEach(function (s) { items.push(songItem(s)); });
    }
    if (albums && albums.code === 0 && albums.data) {
        (albums.data.albums || []).forEach(function (pl) { items.push(playlistItem(pl)); });
    }
    if (n === 1) {
        let artists = nctApi("/api/v1/search/artist", { char: q, pageindex: 1, pagesize: 5, correct: "false" });
        if (artists && artists.code === 0) (artists.data || []).forEach(function (a) { items.push(artistItem(a)); });
    }
    let more = !!((songs && songs.loadmore) || (albums && albums.loadmore));
    if (items.length === 0 && n === 1 && songs && songs.code !== 0) return Response.error(nctErrorText(songs, "Không tìm được trên NhacCuaTui"));
    return Response.success(uniqueItems(items), more && items.length ? String(n + 1) : "");
}
