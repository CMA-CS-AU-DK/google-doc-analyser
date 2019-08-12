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
        "onclick": downloadFromMenu
    });
    chrome.contextMenus.create({
        "id": "itm2",
        "title": "Analyse Revisions",
        "type": "normal",
        "contexts": ["browser_action"],
        "onclick": analyzeFromMenu
    });
};

function downloadFromMenu(){
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
        var id = tabs[0].id
        chrome.tabs.sendMessage(id, {action:"download"})
    })
}

function analyzeFromMenu(){
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
        var id = tabs[0].id
        chrome.tabs.sendMessage(id, {action:"analyze"})
    })
}


/*
function analyse(){
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.create({ url:  "client/analyse.html?tabid="+tabs[0].id}, function(tab){
             
        });
    })
}*/

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

    //Gonna make this function async since we do not want to block the messaging event loop
    function analyzeRevisions(revisions, tabID, withProgressNotification){
            var characters = []
            var deletes = []
            var progressStep = Math.ceil(revisions.length/50)
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
                
                if(withProgressNotification && i%progressStep  === 0){
                    progressTick("Processing revisions",1, tabID)
                }
            } 
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

    function constructRevisionDOMString(characters, deletes, tabID, withProgressNotification){
        var paragraphStart = 0 
        var DOMstring = ""
        var progressStep = Math.ceil(characters.length/50)
        for (var i = 0, n = characters.length; i < n; i++) {
       
            var o = characters[i]
            if (o.c.match(/\n/) || i === n - 1) {
                
                //var el = document.createElement("p")
                var sectionRevisions = [o.r]
                var spans = []

                for (var j = paragraphStart, k = i; j < k; j++) {
                    var oo = characters[j]
        
                    var oel = `<span class="revision" data-revision="${oo.r}">${oo.c}</span>`;
                    spans.push(oel);

                    for (var l = 0, m = deletes.length; l < m; l++) {
                        var d = deletes[l]
                        if (d.r === o.r || (d.r > o.r && (j === k - 1 || d.r < characters[j + 1].r))) {
                            var del = '<span class="revision deleted" data-revision="' + d.d + '" data-deleted="' + d.r + '">' + d.c + '</span>';
                            spans.push(del)
                            
                            break;
                        }
                    }
                }

                paragraphStart = i + 1
                DOMstring += '<p>'
                DOMstring += spans.join('')
                DOMstring += '</p>'
            }
            

            if(withProgressNotification && i%progressStep  === 0){
                progressTick("Generating analysis",1, tabID)
            }
        }

        return DOMstring
    }

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    
    if(request.action === "analyze"){
        request.data.tabID = sender.tab.id
        analyze(request.data)
    }

    if(request.action === "download"){
        download(request.data)
    }
    return true
})

async function analyze(documentData){

    const [characters, deletes] = analyzeRevisions(documentData.revisions, documentData.tabID, true) 
    documentData.revisionsText = constructRevisionDOMString(characters, deletes, documentData.tabID, true)
    
    chrome.tabs.sendMessage(documentData.tabID, {action:"done"});
    
    chrome.tabs.create({ url:  "client/analyzis.html"}, function(tab){
        setTimeout(function(){
            chrome.tabs.sendMessage(tab.id, documentData)
        }, 500)
        
    });
}

async function download(documentData){

    //we need to do this without the process tick
    const [characters, deletes] = analyzeRevisions(documentData.revisions, documentData.tabID) 
    documentData.revisionsText = constructRevisionDOMString(characters, deletes, documentData.tabID)
    

    var blob = new Blob([JSON.stringify(documentData, null, 4)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        chrome.downloads.download({
            url: url,
            filename: documentData.title + ".json"
    });
}

function progressTick(msg, tick,  tabID){
    chrome.tabs.sendMessage(tabID, {msg:msg, tick:tick, action:"progressTick"})
}
