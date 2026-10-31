load('config.js');

// Listing path for a chip under the player; uploader/pornstar pages list their videos under /videos.
function chipPath(href) {
    let path = toPath(href);
    if (/^\/(pornstar|model|channels)\/[^\/?#]+\/?$/.test(path)) return path.replace(/\/+$/, "") + "/videos";
    if (/^\/users\/[^\/?#]+\/?$/.test(path)) return path.replace(/\/+$/, "") + "/videos/public";
    return path;
}

function execute(url) {
    url = normalizeUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let text = response.text();
    let doc = parsePage(text);
    let flashvars = extractFlashvars(text) || {};

    let name = doc.select("h1.title span.inlineFree").text() || doc.select("meta[property='og:title']").attr("content");
    if (!name) return Response.error("Không đọc được thông tin video (có thể video đã bị gỡ)");
    let cover = flashvars.image_url || doc.select("meta[property='og:image']").attr("content");

    // Models sit in a badges wrapper, channels are a direct link; both carry `bolded`.
    let uploader = doc.select(".video-detailed-info .userInfo .usernameWrap a.bolded");
    let author = uploader.text();

    let genres = [];
    let tags = [];
    let seen = {};
    function addChip(title, href, list) {
        let path = chipPath(href);
        if (!title || !path || seen[path]) return;
        seen[path] = true;
        let chip = { title: title, input: path, script: "search.js" };
        genres.push(chip);
        if (list) list.push(chip);
    }
    if (author) addChip(author, uploader.attr("href"));
    doc.select("a[data-label=pornstar]").forEach(function (el) { addChip(el.text(), el.attr("href")); });
    doc.select(".categoriesWrapper a.item").forEach(function (el) { addChip(el.text(), el.attr("href")); });
    doc.select(".tagsWrapper a.item").forEach(function (el) { addChip(el.text(), el.attr("href"), tags); });

    let related = [];
    let relatedList = parseVideoList(doc, "#relatedVideosListing li.pcVideoListItem");
    for (let i = 0; i < relatedList.length && i < 24; i++) {
        let item = relatedList[i];
        related.push({ n: item.name, l: item.link, c: item.cover, d: item.description });
    }

    let info = [];
    let seconds = parseInt(flashvars.video_duration, 10);
    if (seconds > 0) {
        let minutes = Math.floor(seconds / 60);
        let rest = seconds % 60;
        info.push("Thời lượng: " + minutes + ":" + (rest < 10 ? "0" + rest : rest));
    }
    let views = doc.select(".ratingInfo .views .count").text();
    if (views) info.push("Lượt xem: " + views);
    let added = doc.select(".ratingInfo .videoInfo").text();
    if (added) info.push("Đăng: " + added);
    if (author) info.push("Người đăng: " + author);

    let result = {
        name: name,
        author: author,
        cover: cover,
        description: name,
        detail: info.join("<br>"),
        url: url,
        type: "video",
        format: "series",
        ongoing: false,
        nsfw: true,
        locale: "en",
        genres: genres,
        tags: tags
    };
    if (related.length > 0) {
        result.suggests = [{ title: "Video liên quan", input: JSON.stringify(related), script: "similar.js" }];
    }
    return Response.success(result);
}
