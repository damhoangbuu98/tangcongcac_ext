// No network here: stream links expire (~7 days), so track.js asks for a fresh one right before playing.
// `url` is the song page (https://www.nhaccuatui.com/song/<key>); it is passed on as the track data.
function execute(url) {
    if (!/\/(song|bai-hat)\//.test(String(url || ""))) return Response.error("Link bài hát không hợp lệ");
    return Response.success([{ title: "NhacCuaTui", data: url }]);
}
