load('config.js');
load('common.js');

// Mỗi phim là một tập; không cần tải trang.
function execute(url) {
    var link = cleanLink(url);
    return Response.success([{ name: "Full", url: link, host: originOf(link) }]);
}
