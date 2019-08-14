;(function(){

    let url = new URL(window.location)
    let id = url.searchParams.get("id")
    let doc = document.querySelector("#document") 
    chrome.tabs.sendMessage(parseInt(id), {action: "clone"}, function(response){
    })
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
        console.log(request)
        analyseRevisions(request)
        //console.log("huu")
        return true
    })

    //<span class="goog-inline-block" style="width:7.859375px;height:17.599999999999998px">&nbsp;</span>
    
    async function analyseRevisions(revisions){

        for(let i = 0, n = revisions.length; i < n; i++){
            let r = revisions[i]

            if(!r[0]){
                continue
            }
            let ty = r[0].ty
            if(ty === "is"){
                is(r)
            } else if(ty === "ds"){
                ds(r)
            } else if(ty === "mlti"){
                mlti(r)
            } else if(ty === "as"){
                console.log("solitaire as revision");
            }
            
        }

        function is(revision) {
            let s = revision[0].s;
            let ibi = revision[0].ibi - 1
            for (var j = 0, m = s.length; j < m; j++) {
                var c = {
                    c: s[j],
                    r: revision[3]
                }
            }
        }

        function ds(revision) {
            let si = revision[0].si - 1;
            let ei = revision[0].ei - 1;
            let len = ei - si + 1;

            /*
            for (var j = 0, m = dels.length; j < m; j++) {
                var d = dels[j]
                d.d = revision[3]
            }*/
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
                } else if(r.ty === "as") {
                    as(nr)
                }
            }
        }

        function as(r){
            if(r.st === "paragraph"){
                let el = `<span data-r="${r[3]}">&nbsp;</span>`
                //how to search for the index and push the others the other way ?
                //we could operate with <ins> and <dels> and the maintain it custom?
            }
            console.log(r)
        
        }
    }

})()


