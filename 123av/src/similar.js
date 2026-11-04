load('config.js');
load('common.js');

// Đề xuất ở trang Chi tiết ("Bạn có thể thích", "Video liên quan"): input là chuỗi JSON [{name, link, cover, description}]
// do detail.js dựng sẵn, không gọi mạng. Chỉ có một trang: "Xem thêm" gọi lại với trang sau thì trả rỗng.
function execute(input, page) {
    if (page && String(page) !== "1") return Response.success([]);
    var items = [];
    try {
        items = JSON.parse(String(input || ""));
    } catch (e) {
        items = [];
    }
    if (!(items instanceof Array)) items = [];

    var out = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item || !item.name || !item.link) continue;
        out.push({
            name: String(item.name),
            link: String(item.link),
            cover: String(item.cover || ""),
            description: String(item.description || ""),
            host: originOf(item.link)
        });
    }
    return Response.success(out);
}
