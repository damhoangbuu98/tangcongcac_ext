load('config.js');

// Every episode button is in the title page (grouped by range, newest first); returned oldest first.
function execute(url) {
    url = detailUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let episodes = [];
    let seen = {};
    let buttons = doc.select("a.aim-ep-btn");
    for (let i = buttons.size() - 1; i >= 0; i--) {
        let el = buttons.get(i);
        let href = absoluteUrl(el.attr("href"));
        if (!href || href.indexOf("/xem-phim/") < 0 || seen[href]) continue;
        seen[href] = true;
        let title = el.attr("title") || el.text();
        episodes.push({ name: /^tập\b/i.test(title) ? title : "Tập " + title, url: href });
    }
    if (episodes.length === 0) return Response.error("Phim chưa có tập nào");
    return Response.success(episodes);
}
