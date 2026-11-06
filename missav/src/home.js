load('config.js');
load('common.js');
load('censor.js');

// Dùng khi app không hỗ trợ explore (có explore thì app bỏ qua home).
function execute() {
    var cats = browseCategories();
    var tabs = [];
    for (var i = 0; i < cats.length; i++) {
        tabs.push({ title: cats[i].title, input: cats[i].input, script: "list.js" });
    }
    return Response.success(tabs);
}
