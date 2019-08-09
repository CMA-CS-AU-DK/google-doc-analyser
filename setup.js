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

    function analyzeRevisions(revisions){
            console.log("Analysis start", Date.now())
            var characters = []
            var deletes = []
            var timestamp = Date.now()
            var progressStatus = 0
            for (var i = 0, n = revisions.length; i < n; i++) {
                let revision = revisions[i];
                let t = revision[0].ty

                if (t === "is") {
                    is(revision)
                } else if (t === "ds") {
                    ds(revision)
                } else if (t === "mlti") {
                    mlti(revision)
                }

                
                //if(i%500 === 0){
                    
                //  var progress = Math.floor(i / revisions.length * 100)
                //  var step = Math.floor((progress-progressStatus)/2)
                //  if(progress > progressStatus && step !== 0){
                        // console.log("step ",step) 
                //      progressChange("Generating output", step)
                //      progressStatus = progressStatus + step
                //  }

                //  var delta = Date.now()-timestamp
                    //console.log("Estimated time left: ", (delta/progress)*(100 - progress))
                
                //}
            }
       console.log("analysis end", Date.now()-timestamp)
       return [characters, deletes]

       function is(revision) {
            let s = revision[0].s;
            let ibi = revision[0].ibi - 1
            for (var j = 0, m = s.length; j < m; j++) {
                var c = {
                    c: s[j],
                    r: revision[3]
                }
                characters.splice(ibi + j, 0, c)
            }
        }

        function ds(revision) {
            let si = revision[0].si - 1;
            let ei = revision[0].ei - 1;
            let len = ei - si + 1;
            var dels = characters.splice(si, len)
            for (var j = 0, m = dels.length; j < m; j++) {
                var d = dels[j]
                d.d = revision[3]
                deletes.push(d)
            }
        }

        function mlti(revision) {
            var mts = revision[0].mts;
            for (var i = 0, n = mts.length; i < n; i++) {

                let r = mts[i]

                let nr = [r, revision[1], revision[2], revision[3]]
                if (!r) {
                    continue;
                }

                if (r.ty === "is") {
                    is(nr)
                } else if (r.ty === "ds") {
                    ds(nr)
                } else if (r.ty === "mlti") {
                    mlti(nr)
                }
            }
        }
    }

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    console.log("hep")
    if(request.action === "analyze"){
        analyzeRevisions(request.data)
    }
    
})

function sendMessageToPage(){
                    //find sender?
}
