load('crypto.js');
load('config.js');

// Related lists. query: "song:<id>" / "playlist:<id>" ⇒ the playlists Zing shows under it;
// "artist:<alias>" ⇒ similar artists.
function execute(query, page) {
    let m = /^(song|playlist|artist):(.+)$/.exec(String(query || ""));
    if (!m) return Response.success([], "");
    let kind = m[1];
    let id = m[2];

    if (kind === "artist") {
        let a = zingData("/page/get/artist", { alias: id });
        let items = [];
        ((a && a.sections) || []).forEach(function (section) {
            if (section.sectionType === "artist") (section.items || []).forEach(function (ar) { items.push(artistItem(ar)); });
        });
        return Response.success(uniqueItems(items), "");
    }

    let sections = zingData(kind === "song" ? "/song/get/section-bottom" : "/playlist/get/section-bottom", { id: id }) || [];
    let items = [];
    sections.forEach(function (section) {
        if (section.sectionType === "playlist" || section.sectionType === "playlistOfArtist") {
            (section.items || []).forEach(function (pl) {
                if (pl.encodeId !== id) items.push(playlistItem(pl));
            });
        }
    });
    return Response.success(uniqueItems(items), "");
}
