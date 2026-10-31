load('config.js');

function episodeName(title) {
    title = String(title || "").trim();
    // "120", "1-5", "Full"... → "Tập 120", "Tập 1-5", "Tập Full".
    return /^tập\b/i.test(title) ? title : "Tập " + title;
}

// Episodes newest first in the page; returned oldest first. The track comes from each link's path, not
// from its tab: single-track titles put "Thuyết minh" links under the second tab.
function readEpisodes(doc, selector, slug, into, index) {
    let list = doc.select(selector);
    for (let i = list.size() - 1; i >= 0; i--) {
        let el = list.get(i);
        let parsed = parseEpisodeUrl(el.attr("href"));
        if (!parsed || parsed.slug !== slug) continue;
        let existing = into.byKey[parsed.episode];
        if (existing) {
            // Prefer the "Thuyết minh" link when both tracks have the episode.
            if (existing.vietsub && !parsed.vietsub) {
                existing.vietsub = false;
                existing.url = episodeUrl(slug, parsed.episode, false);
            }
            continue;
        }
        let title = el.attr("title") || el.select(".ep-name").text();
        let entry = { key: parsed.episode, title: title, num: parseFloat(String(title).replace(",", ".")), order: index.next++ };
        entry.vietsub = parsed.vietsub;
        entry.url = episodeUrl(slug, parsed.episode, parsed.vietsub);
        into.byKey[parsed.episode] = entry;
        into.list.push(entry);
    }
}

// The detail page has no episode list: open one watch page (both tracks are listed there).
function execute(url) {
    url = normalizeUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let detail = parsePage(response.text());

    let watch = "";
    detail.select("a.btn-play").forEach(function (el) {
        if (!watch && parseEpisodeUrl(el.attr("href"))) watch = absoluteUrl(el.attr("href"));
    });
    if (!watch) return Response.error("Phim chưa có tập nào");
    let slug = parseEpisodeUrl(watch).slug;

    let watchResponse = fetchPage(watch, url);
    if (!watchResponse.ok) return Response.error("HTTP " + watchResponse.status);
    let doc = parsePage(watchResponse.text());

    let episodes = { list: [], byKey: {} };
    let index = { next: 0 };
    readEpisodes(doc, "#top-comment a.ep-item", slug, episodes, index);
    readEpisodes(doc, "#new-comment a.ep-item", slug, episodes, index);
    if (episodes.list.length === 0) return Response.error("Phim chưa có tập nào");

    episodes.list.sort(function (a, b) {
        let an = isNaN(a.num) ? null : a.num;
        let bn = isNaN(b.num) ? null : b.num;
        if (an !== null && bn !== null && an !== bn) return an - bn;
        return a.order - b.order;
    });
    return Response.success(episodes.list.map(function (entry) {
        return { name: episodeName(entry.title), url: entry.url };
    }));
}
