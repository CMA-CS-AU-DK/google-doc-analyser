;(function(){

    let url = new URL(window.location)
    let id = url.searchParams.get("id")

    chrome.tabs.sendMessage(parseInt(id), {action: "clone"}, function(response){
    })

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
        analyseRevisions(request)
        return true
    })

    document.addEventListener("DOMContentLoaded", function() {
        var  doc = document.querySelector("#doc")
    });

    function sleep(ms){
        return new Promise(function(resolve){
            setTimeout(function(){
                resolve()
            },ms)
        })
    }

    //First revision sets up the first paragraph <p> to capture inserts. 
    function initialRevision(revision){

        let firstParagraph = document.createElement('p')
        firstParagraph.dataset.si = 1
        firstParagraph.dataset.ei = 1
        firstParagraph.classList = `rev_${1}`
        firstParagraph.innerHTML = `<span class="spacer">&nbsp;</span>`
        doc.appendChild(firstParagraph)
    }

    //TODO fix the index adjustments when a paragraph is added first without a insert -- cf revision #8

    async function analyseRevisions(revisions){
        initialRevision(revisions[0]) 
        for(let i = 1, n = 8; i < n; i++){
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
            await sleep(500);
        }

        function is(revision) {
            let s = revision[0].s;
            let ibi = revision[0].ibi
            let len = s.length
            if(s === "\n") {
                //figure out where to insert it?
                //before
                //split
                
                    let ibi = revision[0].ibi
                    let newParagraph = document.createElement('p')
                    newParagraph.classList = `rev_${revision[3]}`
                    newParagraph.dataset.si = ibi
                    newParagraph.dataset.ei = ibi+1
                    newParagraph.innerHTML = `<span class="spacer">&nbsp;</span>`
                    console.log(newParagraph)

                console.log(revision)
                let paragraphs = doc.querySelectorAll("p")
                for(var i = 0, n = paragraphs.length; i < n; i++){
                    let paragraph = paragraphs[i]
                    let si = parseInt(paragraph.dataset.si)
                    let ei = parseInt(paragraph.dataset.ei)

                    if(ibi === si ){
                        paragraph.before(newParagraph)
                    } else if(ibi === ei){
                        paragraph.after(newParagraph)
                    } else if(ibi < si && ibi < ei) {
                        console.log("somewhere inbetween")
                    } 
            
                }
            } else {

                let children = []
                for(let i = 0; i < s.length; i++){
                    let el = document.createElement("span")
                    el.dataset.si = ibi+i
                    el.classList = `rev_${revision[3]} ins`
                    el.innerHTML = s[i]
                    children.push(el)
                }


                let paragraphs = doc.querySelectorAll("p")
                let insertIndex = paragraphs.length;

                for(let i = 0, n = paragraphs.length; i < n ; i++){
                    let paragraph = paragraphs[i]
                    if(ibi >= parseInt(paragraph.dataset.si) && ibi <= parseInt(paragraph.dataset.ei)){
                        if(ibi === parseInt(paragraph.dataset.si)){
                            for(let j = children.length-1; j >= 0 ;j--){
                                paragraph.prepend(children[j])
                            }
                        } else if(ibi === parseInt(paragraph.dataset.ei)){
                            let spacer= paragraph.querySelector(".spacer")
                            for(let j = 0, k = children.length; j < k ;j++){
                                spacer.before(children[j])
                            }
                        } else {
                        }

                    } else {
                        console.log("what the... ", revision)
                    }
                }

                for(let i = 0, n = paragraphs.length; i < n ; i++){
                    let paragraph = paragraphs[i]
                    paragraph.dataset.si = paragraph.firstChild.dataset.si
                    paragraph.dataset.ei = parseInt(paragraph.childNodes[paragraph.childNodes.length - 2].dataset.si)+1
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
                    console.log("AS")
                    //as(nr)
                }
            }
        }

        function as(revision){
            if(revision[0].st === "paragraph"){
                console.log("paragraph revisions ", revision)
                let paragraphs = doc.querySelectorAll('p')
                let newParagraph = document.createElement('p')
                newParagraph.dataset.si = revision[0].si
                newParagraph.dataset.ei = revision[0].ei
                newParagraph.innerHTML = `<span data-revision="${revision[3]}" class="spacer">&nbsp;</span>`
                //newParagraph.innerHTML = `<span data-revision="${revision[3]}" class="ins">&nbsp;</span></p>`
                //First paragraph
                if(paragraphs.length === 0){
                    console.log("About to insert new paragraph at si 1 - ei 1.");
                    doc.appendChild(newParagraph)
                }

                let offset = 0;
                for(let i = 0, n = paragraphs.length; i < n ; i++ ){
                    let paragraph = paragraphs[i]

                    if(offset != 0){
                        paragraph.dataset.si = parseInt(paragraph.dataset.si) + offset
                        paragraph.dataset.ei = parseInt(paragraph.dataset.ei) + offset
                    }
                    if(revision[0].ei === parseInt(paragraph.dataset.si)){
                        console.log("About to insert paragraph before ", paragraph);
                        doc.insertBefore(newParagraph, paragraph)
                        offset = 1
                    } else if(revision[0].si === parseInt(paragraph.dataset.ei)){
                        doc.append(newParagraph)
                        offset = 1
                    }
                    //Case 1: Insert before -> r.si 

                    //                    if(r[0].si >= p.dataset.si &&  
                }
                // document.
                //how to search for the index and push the others the other way ?
                //we could operate with <ins> and <dels> and the maintain it custom
                //
                // On inserts we need to identify which paragraph something belongs to -- also -- what happens when deleting paragraph?
            }
        }
    }

})()


