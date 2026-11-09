load('config.js');

// Explore = the app home (api/v6/app/home/index) + the Top 100 groups. Rows: banner, Chủ đề chips,
// Bảng xếp hạng, the site's playlist rows (each with "Xem thêm"), Single mới phát hành, Top 100.
function execute() {
    let home = nctData("/api/v6/app/home/index", {});
    if (!home || !home.list) return Response.error("Không tải được trang chủ NhacCuaTui");

    let out = [];
    home.list.forEach(function (section) {
        let child = section.child || [];
        if (!child.length) return;
        let prefix = section.logPrefix || "";
        let title = section.title || section.name || (section.route && section.route.params && section.route.params.name) || "";

        if (prefix === "banner") {
            let items = child.map(function (c) {
                if (c.type === "song") return { name: c.name, cover: c.image, link: songUrl(c.key) };
                if (c.type === "playlist") return { name: c.name, cover: c.image, link: playlistUrl(c.key) };
                return null;
            });
            items = uniqueItems(items);
            if (items.length) out.push({ id: "banner", title: "", type: "banner", items: items });
        } else if (prefix === "topic") {
            let chips = child.filter(function (c) { return c.key && c.name; }).map(function (c) {
                return { name: c.name, cover: c.image, action: { type: "list", name: c.name, script: "topic.js", input: c.key } };
            });
            if (chips.length) out.push({ id: "topic", title: title || "Chủ đề", type: "chip", items: chips });
        } else if (prefix === "charts") {
            let charts = uniqueItems(child.map(chartItem));
            if (charts.length) {
                out.push({
                    id: "charts", title: title || "Bảng xếp hạng", type: "horizontal_list", shape: "square", items: charts,
                    more: { type: "list", name: "Bảng xếp hạng", script: "charts.js", input: "" }
                });
            }
        } else if (prefix === "new_releases_single") {
            let songs = uniqueItems(child.map(function (c) {
                let detail = {};
                try {
                    detail = JSON.parse(c.detail || "{}");
                } catch (error) {
                }
                return { name: c.name || detail.name, cover: bigImage(c.image || detail.image), link: songUrl(c.key || detail.key), description: detail.artistName || c.subName || "" };
            }));
            if (songs.length) out.push({ id: "singles", title: title || "Single mới phát hành", type: "horizontal_list", shape: "square", items: songs });
        } else if (section.route && section.route.type === "topicCustom") {
            let lists = uniqueItems(child.filter(function (c) { return c.type === "playlist"; }).map(function (c) {
                return { name: c.name, cover: bigImage(c.image), link: playlistUrl(c.key), description: c.subName || "" };
            }));
            if (lists.length) {
                out.push({
                    id: "home_" + section.key, title: title, type: "horizontal_list", shape: "square", items: lists,
                    more: { type: "list", name: title, script: "homemore.js", input: String(section.key) }
                });
            }
        }
    });

    let top = nctData("/api/v1/app/playlist/top-100", {}) || [];
    let topItems = [];
    top.forEach(function (group) {
        (group.data || []).forEach(function (pl) { topItems.push(playlistItem(pl)); });
    });
    topItems = uniqueItems(topItems);
    if (topItems.length) {
        out.push({
            id: "top100", title: "Top 100", type: "horizontal_list", shape: "square", items: topItems,
            more: { type: "list", name: "Top 100", script: "top100.js", input: "" }
        });
    }
    return Response.success(out);
}
