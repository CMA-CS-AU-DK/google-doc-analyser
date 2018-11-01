var path = window.location.pathname
var jsonFile = path.split("/")[path.split("/").length - 1].replace(".html", "")
var users = revisionData.users
var revisions = revisionData.revisions
var compressInterval = 60000 //seconds between revisions for them to be part of the same flow of work
var information = document.querySelector("#info")

var documentCreated = new Date(revisions[0][1]).toLocaleDateString() + " " + new Date(revisions[0][1]).toLocaleTimeString()
var lastDocumentRevision = new Date(revisions[revisions.length - 1][1]).toLocaleDateString() + " " + new Date(revisions[revisions.length - 1][1]).toLocaleTimeString()
var documentStart = revisions[0][1]
var documentEnd = revisions[revisions.length - 1][1]

var d3Colors = ["#3377aa", "#228833","#ccbb44", "#ee6677","#aa3377"]

/*
    TODO: Document information above the document
    TODO: Timely visualisation above the REVISION navigator
*/

//compression time is not considering sequential aspects of edits --> a b c vs. b c a

setupBaseInformation()

function setupBaseInformation(){
    var base = document.querySelector(".infobar#base")
    base.innerHTML = `<b>Document details</b><br>Title: ${revisionData.title}<br>Authors:`
    console.log(users)
    for(var k in users){
        var index = Object.keys(users).indexOf(k);
        let u = users[k]
        base.innerHTML += `<span style="color:${d3Colors[index]};">${u.name === "" ? "anonymous" : u.name },</span>`
    }
    base.innerHTML += `<br>Total revisions: ${revisions.length}<br>First revision date: ${new Date(documentStart).toLocaleString()}, Last revision date: ${new Date(documentEnd).toLocaleString()}`
    base.innerHTML += `<div id="paragraphDetail"></div>`
}



function compressRevisions(revisions) {

    var revs = []
    var cu

    for (var i = 0, n = revisions.length; i < n; i++) {

        var r = revisions[i];

        if (r[0].ty === "ds" || r[0].ty === "is") {
            if (!cu) {
                cu = {}
                cu.start = r[1]
                cu.user = r[2]

                cu.revs = [r]
                cu.op = r[0].ty
            } else if (cu.user != r[2] || cu.revs[cu.revs.length - 1][1] + compressInterval < r[1] || cu.op !== r[0].ty) {
                cu.end = cu.revs[cu.revs.length - 1][1]
                revs.push(cu)
                cu = {}
                cu.start = r[1]
                cu.user = r[2]
                cu.revs = [r]
                cu.op = r[0].ty
            } else {
                if (r.op == "is") {
                    cu.end = cu.revs[cu.revs.length - 1][1]
                    cu.revs.push(r)
                }

            }
        } else if (r[0].ty === "mlti") {
            var rrevs = mlti(r)

            for (var j = 0, k = rrevs.length; j < k; j++) {
                var rr = rrevs[j]
                if (!cu) {
                    cu = {}
                    cu.start = rr[1]
                    cu.user = rr[2]
                    cu.revs = [rr]
                    cu.op = rr[0].ty
                } else if (cu.user != rr[2] || cu.revs[cu.revs.length - 1][1] + compressInterval < rr[1] || cu.op !== rr[0].ty) {
                    cu.end = cu.revs[cu.revs.length - 1][1]
                    revs.push(cu)
                    cu = {}
                    cu.start = rr[1]
                    cu.user = rr[2]
                    cu.revs = [rr]
                    cu.op = rr[0].ty
                } else {
                    cu.end = cu.revs[cu.revs.length - 1][1]
                    cu.revs.push(rr)
                }
            }
        } else {
            console.log("ignoring revision")
        }

        if (i === n - 1) {
            revs.push(cu)
        }
    }
    return revs
}

function mlti(rev) {
    var revs = []
    var mts = rev[0].mts
    for (var i = 0, n = mts.length; i < n; i++) {

        var r = mts[i]
        let nr = [r, rev[1], rev[2], rev[3]]
        if (nr[0].ty === "ds" || nr[0].ty === "is") {
            revs.push(nr)
        } else if (nr[0].ty === "mlti") {
            revs.concat(mlti(nr))
        }
    }
    return revs
}

buildPageGraph(revisions)
function buildPageGraph() {
    var ps = document.querySelectorAll("#content p")

    var paragraphs = []
    for (var i = 0, n = ps.length; i < n; i++) {

        let p = ps[i]
        let pp = {}
        pp.index = i
        pp.revs = []
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
            paragraphs.push(pp)
        }
    }
    /*
    var page = document.querySelector("#content")
    page.style.height = paragraphs.length*20;
    */
    let height = paragraphs.length * 20, width = 1195, margin = 0;
    let svg = d3.select("#slices").append("svg")
        .attr("width", width + margin)
        .attr("height", height + margin)
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")");


    let x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width - margin])


    let y = d3.scaleLinear()
        .domain([0, paragraphs.length])
        .range([height - margin, 0])

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
                return y(0) - y(i)
            })
            .attr("height", function (d) {
                return height / paragraphs.length - 1
            })
    }

    svg.selectAll("g.band")
        .on("click", (d, j) => {
            var detail = document.querySelector("#paragraphDetail");
            var el = document.querySelector("p.highlight")
            if (el) {
                el.classList.remove("highlight")
                detail.innerHTML = "";
            }
            var index = paragraphs[j].index
            ps[index].classList.toggle("highlight")
            scrollParentToChild(ps[index].parentNode, ps[index])
            
            var info = document.querySelector("#infobox")
            info.innerHTML = ""
            let start = Date.now();
            let end = 0;
            let a = [];
            var rs = paragraphs[j].revs;

            rs.sort(function(a,b){
                return a[1] - b[1]
              });

            for (var i = 0, n = rs.length; i < n; i++) {
                let r = rs[i]
                start = r[1] <= start ? r[1] : start;
                end = r[1] >= end ? r[1] : end;
                var index = Object.keys(users).indexOf(r[2]);
                if(a.indexOf(r[2]) === -1){
                    a.push(r[2])
                }
                info.innerHTML += `<div class="rev" style="color:${d3Colors[index]};">ID:${r[3]} - Date: ${new Date(r[1]).toLocaleString()} User: ${users[r[2]].name !== "" ? users[r[2]].name : "anonymous"} Type: ${r[0].ty}</div>`
            }
            
            detail.innerHTML = `<b>Paragraph details</b><br>Revisions: ${paragraphs[j].revs.length}, Authors: ${a.length}<br>First revision date: ${new Date(start).toLocaleString()}, Last revision date: ${new Date(end).toLocaleString()}`
        })
}

function temporalGraph(revs){
    console.log(revs)
}

function scrollParentToChild(parent, child) {

    // Where is the parent on page
    var parentRect = parent.getBoundingClientRect();
    // What can you see?
    var parentViewableArea = {
        height: parent.clientHeight,
        width: parent.clientWidth
    };

    // Where is the child
    var childRect = child.getBoundingClientRect();
    // Is the child viewable?
    var isViewable = (childRect.top >= parentRect.top) && (childRect.top <= parentRect.top + parentViewableArea.height);

    // if you can't see the child try to scroll parent
    if (!isViewable) {
        // scroll by offset relative to parent
        parent.scrollTop = (childRect.top + parent.scrollTop) - parentRect.top - 100
    }


}


//https://www.garysieling.com/blog/javascript-function-find-overlap-two-strings
function findOverlap(a, b) {
    if (b.length === 0) {
        return "";
    }

    if (a.endsWith(b)) {
        return b;
    }

    if (a.indexOf(b) >= 0) {
        return b;
    }

    return findOverlap(a, b.substring(0, b.length - 1));
}

//https://stackoverflow.com/a/36566052
function similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}