; (function () {

    let url = new URL(window.location)
    let id = url.searchParams.get("id")

    chrome.tabs.sendMessage(parseInt(id), { action: "clone" }, function (response) {
    })

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        analyseRevisions(request)
        return true
    })

    document.addEventListener("DOMContentLoaded", function () {
        var doc = document.querySelector("#doc")
    });

    function sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve()
            }, ms)
        })
    }




    function insertParagraph(revision) {


        let si = revision[0].si
        let newParagraph = document.createElement('p')
        newParagraph.classList = `rev_${revision[3]}`

        //newParagraph.innerHTML = `<span class="spacer">&nbsp;</span>` //Google Documents always have this, but I don't know if we need it yet

        let paragraphs = doc.querySelectorAll("p")

        if(si === 1){
            newParagraph.dataset.si = si
            newParagraph.dataset.ei = revision[0].ei
            doc.prepend(newParagraph)
            for(let i = 0, n = paragraphs.length; i < n; i++){
                paragraphs[i].dataset.si = parseInt(paragraphs[i].dataset.si) + 1
                paragraphs[i].dataset.ei = parseInt(paragraphs[i].dataset.ei) + 1
            }
        } else if (si+1 >= paragraphs[paragraphs.length-1].dataset.ei){

            newParagraph.dataset.si = si + 1 //because the end of line character this revision represents belong to the previous paragraph.
            newParagraph.dataset.ei = revision[0].ei + 1
            doc.append(newParagraph)
        } else {
            let ei = revision[0].ei
            for(let i = 0, n = paragraphs.length; i < n; i++){
                let paragraph = paragraphs[i]
                let psi = parseInt(paragraph.dataset.si)
                let pei = parseInt(paragraph.dataset.ei)
                    
                if(si > psi && ei < pei){

                    console.log("in the middle")
                } else if (ei === psi){
                    console.log("behind this one")
                } else if(si === pei){
                    console.log("after this one")
                    
                    newParagraph.dataset.si = si + 1 //because the end of line character this revision represents belong to the previous paragraph.
                    newParagraph.dataset.ei = revision[0].ei + 1
                    console.log(paragraph)
                    paragraph.after(newParagraph)
                    for(let j = i+1; j < n; j++){
                       paragraphs[j].dataset.si =  parseInt(paragraphs[j].dataset.si)+1
                       paragraphs[j].dataset.ei =  parseInt(paragraphs[j].dataset.ei)+1
                    }
                } else {
                    continue
                }
                break
            }
        
            //this might not even be a split?
            
            //split string at index [p.si - i-1 + newline][index - p.ei] Recalculate indexes from the first paragraph
            
            //if 
            //insert end of character in place (hidden -- conceptually think it)

            //iterate and fix indexes for the complex cases!

        }
    }

    async function analyseRevisions(revisions) {
        for (let i = 0, n = 30; i < n; i++) {
            let r = revisions[i]
            console.log(r)
            if (!r[0]) {
                continue
            }
            let ty = r[0].ty
            if (ty === "is") {
                is(r)
            } else if (ty === "ds") {
                ds(r)
            } else if (ty === "mlti") {
                mlti(r)
            } else if (ty === "as") {
                console.log("solitaire as revision");
            }
            console.log("---- END ----")
            await sleep(100);
        }

        function is(revision) {
            let s = revision[0].s;
            let ibi = revision[0].ibi
            let len = s.length

            let children = []
            for (let i = 0; i < s.length; i++) {
                let el = document.createElement("span")
                el.classList = `rev_${revision[3]} ins`
                el.innerHTML = s[i]
                children.push(el)
            }


            let paragraphs = doc.querySelectorAll("p")
            
            for (let i = 0, n = paragraphs.length; i < n; i++) {
                let paragraph = paragraphs[i]

                let si = parseInt(paragraph.dataset.si)
                let ei = parseInt(paragraph.dataset.ei)
                if(ibi >= si && ibi <= ei){

                    if(paragraph.hasChildNodes()){
                        var target = paragraph.childNodes[ibi-si-1] //-1 to compensate for Google revision index starting at 1!
                        target.after(children[0])
                        for(var j = 1, k = children.length; j < k; j++){
                            children[j-1].after(children[j])
                        }
                    } else {
                        for(var j = 0, k = children.length; j < k; j++){
                            paragraph.append(children[j])
                        }
                    }
                    paragraph.dataset.ei = ei + children.length;

                    if(i+1 <  n){
                        for(var j = i+1, k = paragraphs.length; j < k ; j++){
                            var newParagraph = paragraphs[j]
                            newParagraph.dataset.si = parseInt(newParagraph.dataset.si) + children.length
                            newParagraph.dataset.ei = parseInt(newParagraph.dataset.ei) + children.length
                        }
                    }
                    
                    break
                }
            }
        }

        function ds(revision) {
            let si = revision[0].si - 1;
            let ei = revision[0].ei - 1;
            let len = ei - si + 1;
        }

        function mlti(revision) {
            var mts = revision[0].mts;
            for (var i = 0, n = mts.length; i < n; i++) {

                let r = mts[i]
                let nr = [r, revision[1], revision[2], revision[3]]
                if (!r) {
                    continue;
                }
                if (r.ty === "is" && r.s !== "\n") {
                    is(nr)
                } else if (r.ty === "ds") {
                    ds(nr)
                } else if (r.ty === "mlti") {
                    mlti(nr)
                } else if (r.ty === "as") {
                    as(nr)
                }
            }
        }

        function as(revision) {
            if (revision[0].st === "paragraph") {
                insertParagraph(revision)
            }
        }
    }

})()


