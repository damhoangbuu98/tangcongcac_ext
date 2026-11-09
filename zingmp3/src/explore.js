load('crypto.js');
load('config.js');

// Explore = one call to page/get/home (the app waits for the whole page, so no per-section scripts).
// Rows: "Có thể bạn thích", "Mới phát hành", #zingchart top 10, chart cards, then the site's playlist rows
// (Top 100 gets a "Xem thêm" to the full Top 100 list).
function execute() {
    let home = zingData("/page/get/home", { page: 1, segmentId: -1, count: 30 });
    if (!home || !home.items) return Response.error("Không tải được trang chủ Zing MP3");

    let picks = [];
    let releases = [];
    let ranking = [];
    let charts = [];
    let rows = [];

    home.items.forEach(function (section) {
        let type = section.sectionType;
        if (type === "quickPlay") {
            picks = (section.items || []).map(playlistItem);
        } else if (type === "new-release") {
            let all = (section.items && section.items.all) || [];
            releases = all.filter(isPlayable).map(songItem);
        } else if (type === "RTChart") {
            ranking = (section.items || []).filter(isPlayable).slice(0, 10).map(songItem);
            let first = (section.items || [])[0];
            charts.push({ name: "#zingchart", cover: coverOf(first), link: BASE_URL + "/zing-chart", description: "BXH thời gian thực" });
        } else if (type === "newReleaseChart") {
            let first = (section.items || [])[0];
            charts.push({ name: "BXH Nhạc Mới", cover: coverOf(first) || section.banner || "", link: BASE_URL + "/moi-phat-hanh", description: "100 bài mới nổi bật" });
        } else if (type === "weekChart") {
            let names = { vn: "Việt Nam", us: "US-UK", korea: "K-Pop" };
            (section.items || []).forEach(function (w) {
                if (!w.link) return;
                charts.push({
                    name: "Tuần " + (names[w.country] || w.country || ""),
                    cover: w.cover || "",
                    link: absUrl(w.link),
                    description: "Zing Chart tuần"
                });
            });
        } else if (type === "playlist" && section.items && section.items.length) {
            let row = {
                id: section.sectionId || ("playlist_" + rows.length),
                title: section.title || "",
                type: "horizontal_list",
                shape: "square",
                items: uniqueItems(section.items.map(playlistItem))
            };
            if (section.sectionId === "h100") {
                row.more = { type: "list", name: "Top 100", script: "top100.js", input: "" };
            }
            rows.push(row);
        }
    });

    let out = [];
    if (picks.length) out.push({ id: "picks", title: "Có thể bạn thích", type: "horizontal_list", shape: "square", items: uniqueItems(picks) });
    if (releases.length) out.push({ id: "new", title: "Mới phát hành", type: "horizontal_list", shape: "square", items: uniqueItems(releases) });
    if (ranking.length) {
        out.push({
            id: "zingchart", title: "#zingchart", type: "ranking", shape: "square", items: uniqueItems(ranking),
            more: { type: "list", name: "#zingchart", script: "chart.js", input: "/zing-chart" }
        });
    }
    if (charts.length) out.push({ id: "charts", title: "Bảng xếp hạng", type: "horizontal_list", shape: "square", items: uniqueItems(charts) });
    rows.forEach(function (row) { if (row.items.length) out.push(row); });
    return Response.success(out);
}
