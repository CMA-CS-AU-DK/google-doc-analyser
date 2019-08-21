; (function () {

    let _url = new URL(window.location)
    let _id = _url.searchParams.get("id")
    let _first = false
    let _title
    let _snapshots
    let _revisions
    let _uiSlider, _uiCounter, _uiCounterMax
    let _document
    let _currentRevision = 0
    let _timer

    chrome.tabs.sendMessage(parseInt(_id), { action: "clone" }, function (response) {
    })

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        console.log(request)
        _document = document.querySelector("#doc")
        _title = request.title
        _revisions = request.changelog
        _snapshots = request.chunkedSnapshot
        _revisionDeltas = new Array(_revisions.length);
        setupUserInterface()
        analyseRevision(_currentRevision)
        return true
    })


    function setupUserInterface() {
        let titleElement = document.querySelector('h1#title')
        titleElement.innerHTML = _title || 'Untitled document'
        _uiSlider = document.querySelector('#controls input[type="range"]')
        _uiSlider.setAttribute("max", _revisions.length)
        _uiCounter = document.querySelector('#controls #count')
        _uiCounterMax = document.querySelector('#controls #total')
        _uiCounterMax.innerHTML = _revisions.length

        let _play = document.querySelector('#controls #play')
        _play.addEventListener('click', function () {
            console.log(_play.value)
            if (_play.innerHTML === "Play") {
                _play.innerHTML = "Pause"
                play()
            } else {
                _play.innerHTML = "Play"
                pause()
            }
        })

        let _prev = document.querySelector('#controls #prev')
        _prev.addEventListener('click', function () {
            pause()
            _currentRevision = _currentRevision != -1 ? _currentRevision - 1 : _currentRevision
            console.log(_currentRevision)
            analyseRevisions(_currentRevision)
            updateUI()
        })

        let _next = document.querySelector('#controls #next')
        _next.addEventListener('click', function () {
            pause()
            _previousRevisionNumber = _currentRevision
            _currentRevision = _currentRevision != _revisions.length - 1 ? _currentRevision + 1 : _currentRevision
            updateUI()
            analyseRevision(_currentRevision)
        })

        _uiSlider.addEventListener('change', function(){
            pause()
            _currentRevision = parseInt(_uiSlider.value)
            analyseRevisions(_currentRevision)
            updateUI()
        })
    }

    function updateUI(){
        _uiSlider.value = _currentRevision
        _uiCounter.innerHTML = _currentRevision
    }

    function play() {
        console.log("play")
        _timer = setInterval(function () {
            _currentRevision = _currentRevision != _revisions.length - 1 ? _currentRevision + 1 : _currentRevision
            updateUI()
            analyseRevision(_currentRevision) 
        }, 1000)
    }

    function pause() {
        clearInterval(_timer)
    }

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
        let paragraphs = _document.querySelectorAll("p")

        if (si === 1) {
            newParagraph.dataset.si = si
            newParagraph.dataset.ei = revision[0].ei
            _document.prepend(newParagraph)
            for (let i = 0, n = paragraphs.length; i < n; i++) {
                paragraphs[i].dataset.si = parseInt(paragraphs[i].dataset.si) + 1
                paragraphs[i].dataset.ei = parseInt(paragraphs[i].dataset.ei) + 1
            }
        } else if (si + 1 >= paragraphs[paragraphs.length - 1].dataset.ei) {
            newParagraph.dataset.si = si + 1 //because the end of line character this revision represents belong to the previous paragraph.
            newParagraph.dataset.ei = revision[0].ei + 1
            _document.append(newParagraph)
        } else {
            let ei = revision[0].ei
            for (let i = 0, n = paragraphs.length; i < n; i++) {
                let paragraph = paragraphs[i]
                let psi = parseInt(paragraph.dataset.si)
                let pei = parseInt(paragraph.dataset.ei)

                if (si > psi && ei < pei) {
                    let oldParagraph = document.createElement('p')
                    oldParagraph.classList = paragraph.classList
                    oldParagraph.dataset.si = paragraph.dataset.si
                    oldParagraph.dataset.ei = si
                    newParagraph.dataset.si = si + 1
                    newParagraph.dataset.ei = pei + 1

                    //This will potentially ignore deletes
                    let pChildren = paragraph.querySelectorAll('span')
                    let insChildren = paragraph.querySelectorAll('span.ins')
                    let splitNode = insChildren[si - psi]
                    let nodeIndex = 0;
                    while ((splitNode = splitNode.previousSibling) != null) {
                        nodeIndex++;
                    }


                    for (let ii = 0, nn = pChildren.length; ii < nn; ii++) {
                        var node = pChildren[ii].cloneNode(true)
                        if (ii < nodeIndex) {
                            oldParagraph.appendChild(node)
                        } else {
                            newParagraph.appendChild(node)
                        }
                    }

                    paragraph.after(newParagraph)
                    paragraph.after(oldParagraph)
                    paragraph.parentNode.removeChild(paragraph)

                    for (let ii = i + 2; ii < n; ii++) {
                        paragraphs[ii].dataset.si = parseInt(paragraphs[ii].dataset.si) + 1
                        paragraphs[ii].dataset.ei = parseInt(paragraphs[ii].dataset.ei) + 1
                    }
                    break
                } else if (ei === psi) {
                    console.log("behind this one")
                } else if (si === pei) {

                    newParagraph.dataset.si = si + 1 //because the end of line character this revision represents belong to the previous paragraph.
                    newParagraph.dataset.ei = revision[0].ei + 1
                    paragraph.after(newParagraph)
                    for (let ii = i + 1; ii < n; ii++) {
                        paragraphs[ii].dataset.si = parseInt(paragraphs[ii].dataset.si) + 1
                        paragraphs[ii].dataset.ei = parseInt(paragraphs[ii].dataset.ei) + 1
                    }
                    break
                }
            }
        }
    }

    function analyseRevisions(endIndex){
        _document.innerHTML = ""
        for(let i = 0; (i <= endIndex && i < _revisions.length ) ; i++){
            analyseRevision(i)
        } 
    }

    function analyseRevision(index) {
        let revision = _revisions[index]
        console.log(revision)
        if (!revision || !revision[0]) {
            return
        }
        let ty = revision[0].ty
        if (ty === "is") {
            is(revision)
        } else if (ty === "ds") {
            ds(revision)
        } else if (ty === "mlti") {
            mlti(revision)
        } else if (ty === "as") {
            console.log("solitaire as revision");
        }
    }

    function is(revision) {
        let s = revision[0].s;
        let ibi = revision[0].ibi
        let len = s.length

        //We will split up inserts into individual characters to handle later deletions without having to do later splits.
        let children = []
        for (let i = 0; i < s.length; i++) {
            let el = document.createElement("span")
            el.classList = `rev_${revision[3]} ins`
            el.innerHTML = s[i]
            children.push(el)
        }

        let paragraphs = _document.querySelectorAll("p")
        //Identify target paragraph for the insert
        for (let i = 0, n = paragraphs.length; i < n; i++) {
            let paragraph = paragraphs[i]

            let si = parseInt(paragraph.dataset.si)
            let ei = parseInt(paragraph.dataset.ei)
            if (ibi >= si && ibi <= ei) {
                //If the paragraph is already  populated, we need to insert it at the right position
                if (paragraph.hasChildNodes()) {
                    //need to fetch only the paragraph spans that are inserts (because the index should ignore deletes)
                    var pchildren = paragraph.querySelectorAll('span.ins')
                    var target = pchildren[ibi - si - 1] //-1 to compensate for Google revision index starting at 1!
                    //if the revision inserts at the beginning of the line, the target will be undefined and we need to preprend it to the paragraph
                    if (!target) {
                        paragraph.prepend(children[0])
                    } else {
                        target.after(children[0])
                    }
                    for (var ii = 1, nn = children.length; ii < nn; ii++) {
                        children[ii - 1].after(children[ii])
                    }
                } else {
                    //Simple insert
                    for (var ii = 0, nn = children.length; ii < nn; ii++) {
                        paragraph.append(children[ii])
                    }
                }
                paragraph.dataset.ei = ei + children.length;

                for (var ii = i + 1; ii < n; ii++) {
                    let nextParagraph = paragraphs[ii]
                    nextParagraph.dataset.si = parseInt(nextParagraph.dataset.si) + children.length
                    nextParagraph.dataset.ei = parseInt(nextParagraph.dataset.ei) + children.length
                }
                break
            }
        }
    }

    function ds(revision) {
        let si = revision[0].si;
        let ei = revision[0].ei;
        let len = si - ei + 1
        let paragraphs = _document.querySelectorAll("p")
        for (let i = 0, n = paragraphs.length; i < n; i++) {
            let paragraph = paragraphs[i]
            let psi = parseInt(paragraph.dataset.si)
            let pei = parseInt(paragraph.dataset.ei)
            if (si >= psi && ei < pei) {
                i
                let children = paragraph.querySelectorAll('span.ins')

                for (let ii = 0; ii < len; ii++) {
                    let child = children[si - psi + ii]
                    child.classList.remove('ins')
                    child.classList.add('del')
                    child.classList.add(`del_rev_${revision[3]}`)
                }

                paragraph.dataset.ei = parseInt(paragraph.dataset.ei) - len

                //We need to fix the index of all paragraphs that follow. 
                for (let ii = i + 1; ii < n; ii++) {
                    let nextParagraph = paragraphs[ii]
                    nextParagraph.dataset.si = parseInt(nextParagraph.dataset.si) - len
                    nextParagraph.dataset.ei = parseInt(nextParagraph.dataset.ei) - len
                }

                break
            } else if (si === pei) {
                var delParagraph = paragraphs[i + 1]
                delParagraph.classList.add('del')
                delParagraph.classList.add(`del_rev_${revision[3]}`)
                //We need to fix the index of all paragraphs that follow. 
                for (let ii = i + 2; ii < n; ii++) {
                    let nextParagraph = paragraphs[ii]
                    nextParagraph.dataset.si = parseInt(nextParagraph.dataset.si) - 1
                    nextParagraph.dataset.ei = parseInt(nextParagraph.dataset.ei) - 1
                }
                break
            } else if (si === psi) {
                console.log("heop")
            }
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

})()


