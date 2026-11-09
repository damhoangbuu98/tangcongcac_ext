// No network here: the stream link expires (~48 h), so track.js asks for it right before playing.
// `url` is the song page (https://zingmp3.vn/bai-hat/<alias>/<id>.html); it is passed on as the track data.
function execute(url) {
    if (!/\/bai-hat\/[^\/]+\/[A-Za-z0-9]+\.html/.test(String(url || ""))) return Response.error("Link bài hát không hợp lệ");
    return Response.success([{ title: "128 kbps", data: url }]);
}
