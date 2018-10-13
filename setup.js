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
    chrome.contextMenus.create({
        "id": "itm2",
        "title": "Analyse Revisions",
        "type": "normal",
        "contexts": ["browser_action"],
        "onclick": analyse
    });
};

function analyse(){
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.create({ url:  "client/analyse.html?tabid="+tabs[0].id}, function(tab){
             
        });
    })
}

function getData(callback){
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { request: "data" }, function (data) {
            var response = {}
            response.title = data.title;
            response.users = data.users;
            response.revisions = []
            for (var i = 0, n = data.revisions.length; i < n; i++) {
                var r = data.revisions[i]
                r = r.slice(0,4)

                
                if(r[0].ty === "mlti"){
                    let ops = []
                    for(var k in r[0].mts){
                        var m = r[0].mts[k];
                        if(m.ty === "mlti"){
                            for(var j in m.mts){
                                var mm = m.mts[j];
                                if((mm.ty === "as" && mm.st === "paragraph") || (mm.ty === "as" && mm.st === "heading") || mm.ty === "ds" || mm.ty === "is"){
                                    
                                    if(mm.hasOwnProperty("sm")){
                                        delete mm["sm"]
                                    }
                                    ops.push(mm)
                                }
                            }
                        } else if((m.ty === "as" && m.st === "paragraph") || (m.ty === "as" && m.st === "heading") || m.ty === "ds" || m.ty === "is"){
                            if(m.hasOwnProperty("sm")){
                                delete m["sm"]
                            }
                            ops.push(m)
                        }
                    }
                    
                    r[0].mts = ops
                }
                response.revisions.push(r)
            }

            callback(response)
        });
    });
}

function download() {
    getData(function(data){
        var blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                filename: data.title + ".json"
        });
    });
}

