//Stop global (scope) pollution
//https://gist.github.com/jellysnake/b28ff43c4aa1f18c0b9c0714f516d2fb
;
(function () {

    var UIContainer, DocumentID = getDocumentID(), Token=getToken(), BaseURL=getBaseURL()

    var data = {
        revisionCount:0,
        DOMText: ""
        //?
    }

    //We wait until analysis is initiated to fetch revision count.

    setupDocumentUI()

    function setupDocumentUI(){
        var docsTitlebar = document.querySelector("#docs-titlebar-container")
        var docsTitlebarButtons = docsTitlebar.querySelector(".docs-titlebar-buttons")
        var rightOffset = docsTitlebarButtons.getBoundingClientRect().width + 100
        UIContainer = document.createElement("DIV")
        UIContainer.id = "document-revision-analyser-ui"
        UIContainer.setAttribute('style',`position:absolute;top:11px;line-height:32px;text-align:center; right:${rightOffset}px;width:200px;height:32px; border:1px solid #666;border-radius:3px; padding:2px;`)

        UIAnalyze = document.createElement("DIV")      
        UIAnalyze.innerHTML = "Analyze Document Revisions"
        UIAnalyze.onclick = function(){
            console.log("event")
        }
        UIContainer.appendChild(UIAnalyze)
        //Text stages
        //"Fetching document revisions"
        //"Preparing revisions for analysis"
        //"Generating analysis page"

        docsTitlebar.appendChild(UIContainer)
    
    }

    function analyseRevisions(revs){
        return new Proi
    }

    function fetchRevisions(start, end){
        return new Promise(function(reject, resolve){
            //DO SOMETHING!
        })
    }

    
    function init() {
        console.log("Revision analyser loaded!")
           
        var token = getToken()
        var doc = getDocumentID()
        var base = getBaseUrl()
        var data = {}
        
        data = {}
        data.title = document.querySelector("input.docs-title-input").value
        data.doc = doc

        var historyURL = getHistoryURL(base, doc, token)
        console.log(historyURL)
           
        //First we need to fecth Google Documents revision history to extract the revision count and the user data
        fetch(historyURL, function(err, revs){
            if (err){
                console.log(err)
                return
            }

            count = revs.tileInfo[revs.tileInfo.length - 1].end;
            data.users = {}
            data.revisions = []
            var i = 0;
            
            for(var k in revs.userMap){
                var u = revs.userMap[k]
                u.id = k
                //we create a shorthand id to minimise the user id size in the final revision data.
                u.short = "u"+i
                data.users["u"+i] = u
                i++;
            }

            var revisionURL = getRevisionURL(base, doc, token, count)
            fetch(revisionURL, function(err, changes){
                if (err){
                    console.log(err)
                    return
                }

                console.log(JSON.stringify(changes).length)

                for(var i = 0, n = changes.changelog.length; i < n; i++){
                            var r = changes.changelog[i]
                            if(r[0].ty === "null"){
                                console.log("null type revisions")
                                continue
                            }
                            if(r[0].hasOwnProperty("snapshot")){
                                r[0].ty = "mlti"
                                r[0].mts = r[0].snapshot
                                delete r[0].snapshot
                            }
                            
                            var u = revs.userMap[r["2"]]
                            if(u && u.hasOwnProperty("short")){
                                r["2"] = u.short
                            }
                            
                            delete r["4"]
                            delete r["5"]
                            delete r["6"]
                            delete r["7"]

                            data.revisions.push(r)
                } 
                
                 console.log(JSON.stringify(data.revisions).length)
        
                //         data.revisions = changes.changelog
                        console.log(data)
            

            }) 
        });

        /*
       
                getChanges(function (err, changes) {
                        
                        for(var i = 0, n = changes.length; i < n; i++){
                            var r = changes[i]
                            if(r[0].hasOwnProperty("snapshot")){
                                r[0].ty = "mlti"
                                r[0].mts = r[0].snapshot
                                delete r[0].snapshot
                            }
                            console.log(r["2"])
                            /*
                            var u = revisions.userMap[r["2"]]
                            if(u && u.hasOwnProperty("short")){
                                r["2"] = u.short
                            }
                            
                            delete r["4"]
                            delete r["5"]
                            delete r["6"]
                            delete r["7"] } //console.log((JSON.stringify(changes).length/1000/1000).toFixed(3) + "mb")
                        /*
                        console.log(sizeof(changes[10]))
                        var news = sizeof(changes)
                        console.log(((olds-news)*changes.length)/1000/1000 + "mb")
                        

                        data.revisions = changes
                        console.log(data)
                        console.log("Revisions prepared for analysis")
                    }
                })
            }
        })*/
    }

    //we need a token to interact with the google "API"
    //this is generated by injecting additional code into the page and extracting the post-load token attributte
    function getToken() {
        var code = function () {
            document.getElementsByTagName('body')[0].setAttribute("token", _docs_flag_initialData.info_params.token)
        };

        var script = document.createElement('script');
        script.textContent = '(' + code + ')()';
        (document.head || document.documentElement).appendChild(script);
        script.parentNode.removeChild(script);

        return document.body.getAttribute('token')
    }

    //we extract the document id
    function getDocumentID() {
        return location.href.match("((https?:\/\/)?docs\.google\.com\/(.*?\/)*document\/d\/(.*?))\/edit")[4];
    }

    function getBaseUrl() {
        var meta = document.querySelector("meta[itemprop='url']").getAttribute("content")
        var reg = meta.match(/^(https:\/\/docs\.google\.com.*?\/document(?:\/u\/\d+)?\/d\/)/)
        return reg[1]
    }

    function getHistoryURL(base, doc, token) {
        return base + doc + "/revisions/tiles?id=" + doc + "&start=1&showDetailedRevisions=false&token=" + token
    }

    function getRevisionURL(base, doc, token, count) {
        return base + doc + "/revisions/load?id=" + doc + "&start=1&end=" + parseInt(('' + count).replace(/,/g, '')) + "&token=" + token
    }

    function fetch(url, cb){
        var xhr = new XMLHttpRequest();

        xhr.open('GET', url);
        xhr.setRequestHeader('x-same-domain', 1);

        xhr.onload = function () {
            if (xhr.status === 200) {
                //var data = JSON.parse(xhr.responseText)
                var res = xhr.responseText
                var data = JSON.parse(res.split("\n")[1]);
                cb(null, data)
            } else {
                cb("Error " + xhr.status)
            }
        }

        xhr.onerror = function (evt) {
            cb(evt)
        }

        xhr.send(null);
    }

    chrome.runtime.onMessage.addListener(
        function (msg, sender, sendResponse) {
            if(msg.request === "data"){
                sendResponse(data)
            }
            return true
        }
    );

    //init()
})();
  
