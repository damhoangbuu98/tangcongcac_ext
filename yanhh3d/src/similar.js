// `input` is the list already read by detail.js (compact JSON), so no request here.
function execute(input) {
    let list = [];
    try {
        list = JSON.parse(input || "[]");
    } catch (error) {
        return Response.success([], "");
    }
    let items = [];
    for (let i = 0; i < list.length; i++) {
        let item = list[i] || {};
        if (!item.n || !item.l) continue;
        items.push({ name: item.n, link: item.l, cover: item.c || "", description: item.d || "" });
    }
    return Response.success(items, "");
}
