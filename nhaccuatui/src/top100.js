load('config.js');

// Every Top 100 playlist (Việt Nam, Âu Mỹ, Châu Á, Không lời), tagged with its area.
function execute(query, page) {
    let groups = nctData("/api/v1/app/playlist/top-100", {});
    if (!groups) return Response.error("Không tải được Top 100");
    let names = { "Vietnam": "Việt Nam", "US-UK": "Âu Mỹ", "Asia": "Châu Á", "Lo-fi": "Không lời" };
    let items = [];
    groups.forEach(function (group) {
        (group.data || []).forEach(function (pl) {
            let item = playlistItem(pl);
            item.tag = names[group.area] || group.area || "";
            items.push(item);
        });
    });
    return Response.success(uniqueItems(items), "");
}
