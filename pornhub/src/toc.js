load('config.js');

// One video = one episode; chap.js reads the streams from the same page.
function execute(url) {
    return Response.success([{ name: "Video", url: normalizeUrl(url) }]);
}
