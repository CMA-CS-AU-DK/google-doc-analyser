chrome.tabs.onActivated.addListener(function (e) {
    chrome.contextMenus.removeAll();
    chrome.tabs.get(e.tabId, function (tab) {
        if (tab.url.indexOf("docs.google.com/document") > -1) {
            addMenuItems();
        }
    })
})

chrome.tabs.onUpdated.addListener(function (tabId) {
    chrome.contextMenus.removeAll();
    chrome.tabs.get(tabId, function (tab) {
        if (tab.status == "complete" && tab.url.indexOf("docs.google.com/document") > -1) {
            addMenuItems();
        }
    })
});

chrome.windows.onFocusChanged.addListener(function (windowId) {
    chrome.contextMenus.removeAll();
    if (windowId != -1) {
        chrome.windows.get(windowId, { populate: true }, function (info) {
            if (info && info.focused) {
                var tab;
                for (var i = 0, n = info.tabs.length; i < n; i++) {
                    if (info.tabs[i].active) {
                        tab = info.tabs[i];
                        break;
                    }
                }

                if (tab && tab.url.indexOf("docs.google.com/document") > -1) {
                    addMenuItems();
                }
            }
        });
    }
});

function addMenuItems() {
    chrome.contextMenus.removeAll(); //because some of the adding events (onUpdate) will be fired multiple times
    chrome.contextMenus.create({
        "id": "itm1",
        "title": "Download Revisions",
        "type": "normal",
        "contexts": ["browser_action"],
        "onclick": download
    });
};

function download() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { request: "data" }, function (response) {
            var revs = response.revisions;
            for (var i = 0, n = revs.length; i < n; i++) {
                var r = revs[i]
                r = r.slice(0, 6)
                if(r[0].ty === "mlti"){
                    for(var k in r[0].mts){
                        var m = r[0].mts[k]
                        
                        if(m.ty === "mlti"){
                            for(var j in m.mts){
                                var mm = m.mts[j]
                                
                                if(!(mm.ty === "as" && mm.st === "paragraph") && !(mm.ty === "as" && mm.st === "heading") && mm.ty !== "ds" && mm.ty !== "is"){
                                    delete m.mts[j]
                                } else if(mm.hasOwnProperty("sm")){
                                    
                                    delete mm["sm"]
                                }
                            }
                        } else if(!(m.ty === "as" && m.st === "paragraph") && !(m.ty === "as" && m.st === "heading") && m.ty !== "ds" && m.ty !== "is"){
                            delete r[0].mts[k]
                        } else if(m.hasOwnProperty("sm")){
                            delete m["sm"]
                        }
                    }
                }
            }


            var blob = new Blob([JSON.stringify(response, null, 4)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                filename: response.title + ".json"
            });
        });
    });
}

