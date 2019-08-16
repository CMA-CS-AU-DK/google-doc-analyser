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
        if (revision[3] === 1) {
            let firstParagraph = document.createElement('p')
            firstParagraph.dataset.si = 1
            firstParagraph.dataset.ei = 1
            firstParagraph.classList = `rev_${1}`
            firstParagraph.innerHTML = `<span class="spacer">&nbsp;</span>`
            doc.appendChild(firstParagraph)
        } else {
            let newParagraph = document.createElement('p')
            newParagraph.classList = `rev_${revision[3]}`
            newParagraph.dataset.si = revision[0].si
            newParagraph.dataset.ei = revision[0].ei
            console.log("new ", newParagraph)
            newParagraph.innerHTML = `<span class="spacer">&nbsp;</span>`

            let paragraphs = doc.querySelectorAll("p")
            let insertIndex = paragraphs.length
            let offset = 1 //default is 1 with inserted paragraphs -- split paragraphs (inserting a new in the middle of everything will change this)
            for (var i = 0, n = paragraphs.length; i < n; i++) {
                let paragraph = paragraphs[i]
                let si = parseInt(paragraph.dataset.si)
                let ei = parseInt(paragraph.dataset.ei)

                if (revision[0].si === si) {
                    paragraph.before(newParagraph)
                    insertIndex = i
                } else if (revision[0].si === ei) {
                    paragraph.after(newParagraph)
                    insertIndex = i + 1
                } else if (revision[0].si > si && revision[0].si < ei) {
                    console.log("somewhere inbetween ", revision)
                }
                /*
                if(i >= insertIndex){
                    paragraph.dataset.si = si + offset
                    paragraph.dataset.ei = ei + offset
                }*/
            }

        }
    }

    async function analyseRevisions(revisions) {
        console.log(revisions[8])
        for (let i = 0, n = 9; i < n; i++) {
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
            await sleep(500);
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
            let insertIndex = paragraphs.length;
            let offset = children.length

            for (let i = 0, n = paragraphs.length; i < n; i++) {
                let paragraph = paragraphs[i]
                console.log(paragraph)
                let si = parseInt(paragraph.dataset.si)
                let ei = parseInt(paragraph.dataset.ei)
                if (ibi === si && ibi === ei) {
                    insertIndex = i
                    //first character in new paragraph
                    let spacer = paragraph.querySelector(".spacer")
                    for (let j = 0, k = children.length; j < k; j++) {
                        spacer.before(children[j])
                    }
                } else if(ibi === si){
                    //insert first in paragraph
                } else if(ibi === ei)
                    insertIndex = i
                    if (ibi === si) {
                        for (let j = children.length - 1; j >= 0; j--) {
                            paragraph.prepend(children[j])
                        }
                    } else if (ibi === ei) {
                        l
                    }  else {
                    }

                } else if (ibi > si && doc.lastChild === paragraph) {
                    insertIndex = i
                    let spacer = paragraph.querySelector(".spacer")
                    for (let j = 0, k = children.length; j < k; j++) {
                        spacer.before(children[j])
                    }
                } 

                if (i === insertIndex) {
                    paragraph.dataset.ei = parseInt(paragraph.dataset.si) + paragraph.querySelectorAll("span.ins").length
                    //paragraph.dataset.ei = parseInt(paragraph.dataset.ei) + offset
                } else if (i > insertIndex) {
                    console.log("huh ", paragraph)
                    paragraph.dataset.si = parseInt(paragraph.dataset.si) + offset
                    paragraph.dataset.ei = parseInt(paragraph.dataset.ei) + offset
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


