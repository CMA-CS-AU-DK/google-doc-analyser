//Stop global (scope) pollution
//https://gist.github.com/jellysnake/b28ff43c4aa1f18c0b9c0714f516d2fb
;
(function () {

    var UIContainer, UIAnalyzeButton, UIProgressBar, UIProgressBarStepWidth, DocumentID = getDocumentID(), Token=getToken(), BaseURL=getBaseUrl()

    var documentData = {
        revisionCount:0,
        users:{},
        revisions:[], //Do we want to include this as data as well -- might be a huge object!
        revisionsText: "",
        tabID:null,
        title:null
    }

    //we want Google Docs to have loeaded essentials before adding the UI
    setTimeout(function(){
        setupDocumentUI()
    }, 5000)

    function setupDocumentUI(){
        var docsTitlebar = document.querySelector("#docs-titlebar-container")
        var docsTitlebarButtons = docsTitlebar.querySelector(".docs-titlebar-buttons")

        var rightOffset = docsTitlebarButtons.getBoundingClientRect().width + 60
        UIContainer = document.createElement("DIV")
        UIContainer.id = "document-revision-analyser-ui"
        UIContainer.setAttribute('style',`overflow:hidden;user-select:none;position:absolute;top:11px; right:${rightOffset}px;width:180px;height:24px; border:1px solid #666;border-radius:3px;`)
    
        UIProgressBar = document.createElement("DIV")
        UIProgressBar.setAttribute('style','position:absolute; top:0px; left:0px;height:24px; width:0px; background-color: rgba(100,254,100,0.7);')
        

        UIAnalyzeButton = document.createElement("DIV") 
        UIAnalyzeButton.setAttribute('style', 'position:absolute;top:0px; left:0px;line-height:24px; width:180px;height:24px; text-align:center; padding:2px;background-color:transparent;')
        UIAnalyzeButton.innerHTML = "Analyze Document Revisions"
        UIAnalyzeButton.onclick = analyze


        UIContainer.appendChild(UIProgressBar)       
        UIContainer.appendChild(UIAnalyzeButton)

        docsTitlebar.appendChild(UIContainer) 
    }

    function progressChange(msg, pixels){
        var width = UIProgressBar.getBoundingClientRect().width + pixels
        UIAnalyzeButton.innerHTML=msg
        UIProgressBar.setAttribute('style',`position:absolute; top:0px; left:0px;height:24px; width:${width}px; background-color: rgba(100,254,100,0.7);`)
    }

    function resetAnalysis(){
        UIAnalyzeButton.innerHTML = "Analyze document revisions"
        UIProgressBar.setAttribute('style',`position:absolute; top:0px; left:0px;height:24px; width:0px; background-color: rgba(100,254,100,0.7);`)
        UIAnalyzeButton.onclick = analyze
    }

    async function analyzeAsyncWrapper(){
        analyze()
    }


    function analyze(){
        UIAnalyzeButton.onclick = undefined //We want to disable the button while we analyse (might replace it with some fancy UI at some point)
        
        progressChange("Fetching metadata", 10)
        fetchRevisionMetadata().then(function(metadata){
            documentData.revisionCount = metadata.tileInfo[metadata.tileInfo.length -1].end
            documentData.users = metadata.userMap
            documentData.title = document.querySelector("#docs-titlebar .docs-title-input").value
            var i = 0;

            for(var k in documentData.users){
                var u = documentData.users[k]
                u.id = k
                //we create a shorthand id to minimise the user id size in the final revision data.
                u.short = "u"+i
                i++;
            }

            progressChange("Fetching revisions", 0)
            console.log("Fetching revisions")
            fetchRevisions(documentData.revisionCount, true).then(function(revisionData){
                    
                
                progressChange("Cleaning revisions", 10)
                console.log("cleaning revisions")
                var revisions = cleanRevisions(revisionData)
                documentData.revisions = revisions 
                //From now we hand over the processing to the extensions background page
                sendDataToExtension(documentData, "analyze")

                return
            }).catch(function(err){
                console.log(err)
            })
        }).catch(function(err){
            console.log(err)
        })
        
    }


    async function download(){
        
        fetchRevisionMetadata().then(function(metadata){
            documentData.revisionCount = metadata.tileInfo[metadata.tileInfo.length -1].end
            documentData.users = metadata.userMap
            documentData.title = document.querySelector("#docs-titlebar .docs-title-input").value
            var i = 0;

            for(var k in documentData.users){
                var u = documentData.users[k]
                u.id = k
                //we create a shorthand id to minimise the user id size in the final revision data.
                u.short = "u"+i
                i++;
            }

            fetchRevisions(documentData.revisionCount).then(function(revisionData){
                    
                var revisions = cleanRevisions(revisionData)
                documentData.revisions = revisions 
                //From now we hand over the processing to the extensions background page
                sendDataToExtension(documentData, "download")

                return
            }).catch(function(err){
                console.log(err)
            })
        }).catch(function(err){
            console.log(err)
        })
        
    }

    function cleanRevisions(revisionData){

        var revisions = []
        for(var i = 0, n = revisionData.changelog.length; i < n; i++){
                var r = revisionData.changelog[i]
                if(r[0].ty === "null"){
                    continue
                }
                if(r[0].hasOwnProperty("snapshot")){
                    r[0].ty = "mlti"
                    r[0].mts = r[0].snapshot
                    delete r[0].snapshot
                }
                            
                var u = documentData.users[r["2"]]
                if(u && u.hasOwnProperty("short")){
                    r["2"] = u.short
                }
                            
                delete r["4"]
                delete r["5"]
                delete r["6"]
                delete r["7"]

                revisions.push(r)
            }

        return revisions
    }


    async function fetchRevisions(counti, withProgressNotification){
        var revisions = {changelog:[], chunkedSnapshot:[]}
        var steps = Math.floor(count / 10000)+1
        var tick = Math.ceil(50/steps)
        var modolu = count % 10000
        for(var i = 1; i < count-modolu; i+= 10000){
            try {
                var revs = await fetchRevisionSet(i, i+9999)
                revisions.changelog = revisions.changelog.concat(revs.changelog)
                revisions.chunkedSnapshot = revisions.chunkedSnapshot.concat(revs.chunkedSnapshot)
                if(withProgressNotification){
                    progressChange("Fetching revisions", tick)
                }
            } catch(err) {
                console.log(err)
            }
        }

        try {
            var revs = await fetchRevisionSet(i, i+modolu-1)
            revisions.changelog = revisions.changelog.concat(revs.changelog)
            revisions.chunkedSnapshot = revisions.chunkedSnapshot.concat(revs.chunkedSnapshot)

            if(withProgressNotification){
               progressChange("Fetching revisions", tick)
            }
        } catch(err){
            console.log(err)
        }
        
        return revisions
    
    }

    function fetchRevisionSet(start, end){
        var url = `${BaseURL}${DocumentID}/revisions/load?id=${DocumentID}&start=${start}&end=${parseInt((''+end).replace(/,g/,''))}&token=${Token}`
        return fetch(url)
    }


    function fetchRevisionMetadata(){
        var historyURL = BaseURL + DocumentID + "/revisions/tiles?id=" + DocumentID + "&start=1&showDetailedRevisions=false&token=" + Token
        return fetch(historyURL)               
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

    function fetch(url){
        return new Promise(function(resolve, reject){
        
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.setRequestHeader('x-same-domain', 1);

            xhr.onload = function () {
                if (xhr.status === 200) {
                    //var data = JSON.parse(xhr.responseText)
                    var res = xhr.responseText
                    var data = JSON.parse(res.split("\n")[1]);
                    resolve(data)
                } else {
                    reject("Error " + xhr.status)
                }
            }

            xhr.onerror = function (e) {
                reject(e)
            }

            xhr.send(null);

        })
    }

    function sendDataToExtension(data, action){
        chrome.runtime.sendMessage({data:data, action:action}, function(response){});
    }   

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
        if(request.action === "progressTick"){
            progressChange(request.msg, request.tick)   
        }

        if(request.action === "done"){
            progressChange("Done", 50)
            resetAnalysis()
        }

        if(request.action === "analyze"){
            analyzeAsyncWrapper()
        }

        if(request.action === "download"){
            download()
        }

        return true
    })
})();
  
