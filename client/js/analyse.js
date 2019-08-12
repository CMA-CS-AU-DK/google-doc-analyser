; (function () {
    
    var documentData;

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
        documentData = request
        generatePage();
        return true;
          
    })

    async function generatePage(){
        var title = document.querySelector('h1')
        title.innerHTML = documentData.title
        var originalDocument = document.querySelector('#document')
        originalDocument.innerHTML = documentData.revisionsText
        console.log(documentData)
    }

    /*
    var url = new URL(location);
    var id = url.searchParams.get("tabid");
    //TODO: store parts of the analysis in local storage to persist across reload
    //TODO: optimise the dom/svg generation -- same algorithm, different output.
    var snaps, revisions, characters, users;
    var documentCreated, lastDocumentRevision;
    var information;
    chrome.tabs.sendMessage(parseInt(id), { request: "data" }, function (data) {
        
        revisions = data.revisions;
        console.log(revisions)
        var result = analyseRevisions(revisions);
        console.log("done")
        /*
        documentCreated = new Date(revisions[0][1]).toLocaleDateString() + " " + new Date(revisions[0][1]).toLocaleTimeString()
        console.log("here2")
        lastDocumentRevision = new Date(revisions[revisions.length - 1][1]).toLocaleDateString() + " " + new Date(revisions[revisions.length - 1][1]).toLocaleTimeString()

        users = data.users;
        console.log(Object.keys(users).length)
        console.log(revisions.length)
        
        console.log("getting data is done")
        var characters = result.characters;
        var deletes = result.deletes
        buildPage(characters, deletes)
        console.log("Build page is done")
        createVisualisation()
        addInteractivity()*/
    //})

    function buildPage(characters, deletes) {
        var paragraphStart = 0
        var page = document.querySelector("#content")
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
                var p = document.createElement("p")
                p.innerHTML = spans.join('')
                page.appendChild(p)
                
            }
        }
    }

    function createVisualisation() {
        var d3Colors = ["#3377aa", "#228833", "#ccbb44", "#ee6677", "#aa3377"];

        var ps = document.querySelectorAll("#content p")

        var paragraphs = []
        for (var i = 0, n = ps.length; i < n; i++) {

            let p = ps[i]
            let pp = {}
            pp.index = i
            pp.revs = []
            pp.top = p.getBoundingClientRect().top - 20
            pp.height = p.getBoundingClientRect().height
            let revmirror = []
            let spans = ps[i].querySelectorAll("span")

            for (var j = 0, k = spans.length; j < k; j++) {
                var el = spans[j]
                let rid = el.dataset.revision
                if (revmirror.indexOf(rid) === -1) {
                    revmirror.push(rid)
                    let r = revisions[rid - 1]
                    pp.revs.push(r)
                }
            }

            if (spans.length !== 0) {
                console.log(pp.revs)
                paragraphs.push(pp)
            }
        }
        
        let height = document.querySelector("#content").scrollHeight, width = 1000;
        let svg = d3.select("#slices").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")

        let x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, width])


        let y = d3.scaleLinear()
            .domain([0, paragraphs.length])
            .range([height, 0])

        for (var i = 0, n = paragraphs.length; i < n; i++) {
            let g = svg.append("g")
                .attr("class", "band")
            g.selectAll("rect")
                .data(paragraphs[i].revs)
                .enter()
                .append("rect")
                .attr("fill", function (d) {
                    var index = Object.keys(users).indexOf(d[2]);
                    return d3Colors[index]
                })
                .attr("x", function (d, j) {
                    
                    return width / paragraphs[i].revs.length * j
                })
                .attr("width", function (d, j) {
                    return width / paragraphs[i].revs.length - 1
                })
                .attr("y", function (d, j) {
                    if(d[0].ty === "ds"){
                        var offset = paragraphs[i].height < 40 ? 7 : 14
                        return paragraphs[i].top + offset
                    } else {
                        return paragraphs[i].top
                    }
                    
                })
                .attr("height", function (d) {
                    var offset = paragraphs[i].height < 40 ? 7 : 14
                    if(d[0].ty === "ds"){
                        
                        return paragraphs[i].height-offset
                    } else {
                        return paragraphs[i].height
                    }
                    
                })
        }
    }

    function addInteractivity(){
        var textPage = document.querySelector("#content")
        var visPage = document.querySelector("#slices")
        textPage.addEventListener("scroll", function(e){
            visPage.scrollTop = textPage.scrollTop
        });

        visPage.addEventListener("scroll", function(e){
            textPage.scrollTop = visPage.scrollTop
        });
    }

    function analyseRevisions(revisions) {

        var characters = []
        var deletes = []

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
        }

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

        return { characters: characters, deletes: deletes }
    }

})()

