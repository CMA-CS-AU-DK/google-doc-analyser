//Stop global (scope) pollution
//https://gist.github.com/jellysnake/b28ff43c4aa1f18c0b9c0714f516d2fb
;
(function () {

    var UIContainer, UIAnalyzeButton, UIProgressBar, UIProgressBarStepWidth, DocumentID = getDocumentID(), Token=getToken(), BaseURL=getBaseUrl()

    var documentData = {
        revisionCount:0,
        users:{},
        revisions:[], //Do we want to include this as data as well -- might be a huge object!
        RevisionsText: ""
        //?
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
        UIContainer.setAttribute('style',`user-select:none;position:absolute;top:11px; right:${rightOffset}px;width:180px;height:24px; border:1px solid #666;border-radius:3px;`)
    
        UIProgressBar = document.createElement("DIV")
        UIProgressBar.setAttribute('style','position:absolute; top:0px; left:0px;height:24px; width:0px; background-color: rgba(100,254,100,0.7);')
        

        UIAnalyzeButton = document.createElement("DIV") 
        UIAnalyzeButton.setAttribute('style', 'position:absolute;top:0px; left:0px;line-height:24px; width:180px;height:24px; text-align:center; padding:2px;background-color:transparent;')
        UIAnalyzeButton.innerHTML = "Analyze Document Revisions"
        UIAnalyzeButton.onclick = analyze


        UIContainer.appendChild(UIProgressBar)       
        UIContainer.appendChild(UIAnalyzeButton)
        //Text stages

        //"Fetching document revisions"
        //"Preparing revisions for analysis"
        //"Generating analysis page"

        docsTitlebar.appendChild(UIContainer) 
    }

    function progressChange(msg, pixels){
        //var width = UIProgressBar.getBoundingClientRect().width + pixels
        UIAnalyzeButton.innerHTML=msg
        //UIProgressBar.setAttribute('style',`position:absolute; top:0px; left:0px;height:24px; width:${width}px; background-color: rgba(100,254,100,0.7);`)
    }

    function analyze(){
        UIAnalyzeButton.onclick = undefined //We want to disable the button while we analyse (might replace it with some fancy UI at some point)
        
        progressChange("Fetching metadata", 0)
        fetchRevisionMetadata().then(function(metadata){
            documentData.revisionCount = metadata.tileInfo[metadata.tileInfo.length -1].end
            documentData.users = metadata.userMap
            console.log(documentData.revisionCount) 
            
            var i = 0;

            for(var k in documentData.users){
                var u = documentData.users[k]
                u.id = k
                //we create a shorthand id to minimise the user id size in the final revision data.
                u.short = "u"+i
                i++;
            }

            progressChange("Fetching revisions", 10)
            console.log("Fetching revisions")
            fetchRevisions(documentData.revisionCount).then(function(revisionData){
                    
                
                progressChange("Cleaning revisions", 10)
                console.log("cleaning revisions")
                var revisions = cleanRevisions(revisionData)
                
                progressChange("Analysing revisions", 10)
                console.log("Analysing revisions")
                sendDataToExtension(revisions, "analyze") 
                //var changesAndDeletesArray = analyzeRevisions(revisions)
                //progressChange("Generating output", 0)

                //constructRevisionDOMString(changesAndDeletesArray[0], changesAndDeletesArray[1])
                console.log("done")
            }).catch(function(err){
                console.log(err)
            })
        }).catch(function(err){
            console.log(err)
        })
        
        //UIAnalyzeButton.innerHTML = "Error collecting data!"
        //UIAnalyzeButton.onclick = analyze
        

        
        //UIAnalyzeButton.onclick = analyze

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

    function constructRevisionDOMString(characters, deletes){
        var paragraphStart = 0 
        var timestamp = Date.now()
        var progressStatus = 0
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
                documentData.RevisionsText += spans.join('')
            }
            

            if(i%1000 === 0){
                var progress = Math.floor(i / characters.length)*100
                if(progress > progressStatus){
                    progressChange("Generating output", progress-progressStatus)
                    progressStatus = progress
                }

                var delta = Date.now()-timestamp
                //console.log("Estimated time left: ", delta/100*progress)
                
            }
        }
    }

    function fetchRevisions(count){
        var url = `${BaseURL}${DocumentID}/revisions/load?id=${DocumentID}&start=1&end=${parseInt((''+count).replace(/,g/,''))}&token=${Token}`
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
        console.log(url)
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
        console.log("sending?")
        chrome.runtime.sendMessage({data:data, action:action}, function(response){
        
        
        });
    }   

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
        if(request.action === "progress"){
            progressChange(request.msg, request.tick)   
        }
    })
})();
  
