
chrome.contextMenus.create({
    "id": "itm1",
    "title": "Analyse Document",
    "type": "normal",
    "contexts": ["browser_action"],
    "visible": true,
    "documentUrlPatterns": ["https://docs.google.com/document/*"],
    "onclick":analyse
});


function analyse(details) {
    console.log(details)
    chrome.tabs.query({'active': true, lastFocusedWindow: true}, function (tabs) {

        var url =tabs[0].url;
        var id = tabs[0].id;



        var analysis = chrome.tabs.create({
            "url": "analyse.html?id=" + id
        });
    });
}