load('crypto.js');
load('config.js');

// Playlists (then hot songs) of one hub (query = hub id), one page.
function execute(query, page) {
    let id = String(query || "");
    let m = /\/hub\/[^\/]+\/([A-Za-z0-9]+)\.html/.exec(id);
    if (m) id = m[1];
    let hub = zingData("/page/get/hub-detail", { id: id });
    if (!hub || !hub.sections) return Response.error("Không tải được chủ đề");
    let playlists = [];
    let songs = [];
    hub.sections.forEach(function (section) {
        if (section.sectionType === "playlist") {
            (section.items || []).forEach(function (pl) { playlists.push(playlistItem(pl)); });
        } else if (section.sectionType === "song") {
            (section.items || []).filter(isPlayable).forEach(function (s) { songs.push(songItem(s)); });
        }
    });
    return Response.success(uniqueItems(playlists.concat(songs)), "");
}
