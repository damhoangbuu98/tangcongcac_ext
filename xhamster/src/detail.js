load('config.js');

// Listing path for a tag/category/pornstar/channel/uploader chip under the player.
function chipPath(tag) {
    let path = toPath(tag.url);
    if (!path) return "";
    if (tag.isUser) return path.replace(/\/+$/, "") + "/videos";
    return path;
}

function execute(url) {
    url = normalizeUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let state = parseInitials(response.text());
    let video = state && state.videoModel;
    if (!video || !video.title) return Response.error("Không đọc được thông tin video");
    let entity = state.videoEntity || {};

    let author = video.author && video.author.name ? decodeEntities(video.author.name) : "";
    if (video.channelModel && video.channelModel.name) author = decodeEntities(video.channelModel.name);

    let genres = [];
    let tags = [];
    let seen = {};
    let tagList = (state.videoTagsComponent && state.videoTagsComponent.tags) || [];
    for (let i = 0; i < tagList.length; i++) {
        let tag = tagList[i] || {};
        let path = chipPath(tag);
        if (!tag.name || !path || seen[path]) continue;
        seen[path] = true;
        let chip = { title: decodeEntities(tag.name), input: path, script: "search.js" };
        genres.push(chip);
        if (tag.isTag) tags.push(chip);
    }

    let related = [];
    let relatedProps = state.relatedVideosComponent && state.relatedVideosComponent.videoTabInitialData;
    let relatedList = mapThumbList((relatedProps && relatedProps.videoListProps && relatedProps.videoListProps.videoThumbProps) || []);
    for (let j = 0; j < relatedList.length && j < 24; j++) {
        let item = relatedList[j];
        related.push({ n: item.name, l: item.link, c: item.cover, d: item.description, t: item.tag });
    }

    let info = [];
    let duration = formatDuration(video.duration);
    if (duration) info.push("Thời lượng: " + duration);
    let views = formatViews(video.views);
    if (views) info.push("Lượt xem: " + views.replace(" lượt xem", ""));
    if (video.rating && video.rating.value) info.push("Đánh giá: " + video.rating.value + "%");
    if (entity.dateAgo) info.push("Đăng: " + entity.dateAgo);
    if (author) info.push("Người đăng: " + author);

    let title = decodeEntities(video.title);
    let description = decodeEntities(video.description);
    if (description === title) description = "";

    let result = {
        name: title,
        author: author,
        cover: video.thumbURL || video.previewThumbURL || "",
        description: description || title,
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
