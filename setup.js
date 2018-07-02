

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        "id": "itm1",
        "title": "Analyse Document",
        "type": "normal",
        "contexts": ["browser_action"],
        "visible": true,
        "documentUrlPatterns": ["https://docs.google.com/document/*"],
        "onclick":analyse
    });    
  });


function analyse(details) {
    
    chrome.tabs.query({'active': true, lastFocusedWindow: true}, function (tabs) {
        var url =tabs[0].url; //We need the url to check if the current page is a googel doc
        var id = tabs[0].id; //We need to pass the tab id to the analysis page so we can request data
        if(url.indexOf("docs.google.com/document") > -1 ){
            /*
            chrome.tabs.sendMessage(parseInt(id), {request: "data"}, function(response) {
                console.log("getting response")
                console.log(response);
            });*/
            
            var analysis = chrome.tabs.create({
                "url": "analyse.html?id=" + id
            });
        }
    });
}