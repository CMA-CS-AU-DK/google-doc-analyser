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

var colors = ['#b35806', '#e08214', '#fdb863', '#fee0b6', '#d8daeb', '#b2abd2', '#8073ac', '#542788']
var d3Colors = d3["schemePaired"]

/*
    TODO: Document information above the document
    TODO: Timely visualisation above the REVISION navigator
*/

//compression time is not considering sequential aspects of edits --> a b c vs. b c a
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

//all
function analyseRevisions() {
    var paragraphs = document.querySelectorAll("p")
    for (var i = 0, n = paragraphs.length; i < n; i++) {
        var el = paragraphs[i]
        analyseParagraphRevisions(el)
    }

}

function isFirstAuthorTheMainContributer(sec) {
    var revs = JSON.parse(sec.dataset.revisions)
}



function cleanRevisions(revs, compression) {
    var returnRevs = []
    for (var i = 0, n = revs.length; i < n; i++) {

    }
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
    let height = paragraphs.length * 20, width = 800, margin = 0;
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
            var el = document.querySelector("p.highlight")
            if (el) {
                el.classList.remove("highlight")
            }
            var index = paragraphs[j].index
            ps[index].classList.toggle("highlight")

            var info = document.querySelector("#infobox")
            info.innerHTML = `Revisions: ${paragraphs[j].revs.length}`

            for (var i = 0, n = paragraphs[j].revs.length; i < n; i++) {
                let r = paragraphs[j].revs[i]

                info.innerHTML += `<div class="rev">ID:${r[3]} - Date: ${new Date(r[1]).toLocaleString()}<br>User: ${users[r[2]].name !== "" ? users[r[2]].name : "anonymous"} Type: ${r[0].ty}</div>`
            }
            scrollParentToChild(ps[index].parentNode, ps[index])
        })
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

function buildGraph(elementRevisions) {

    let revs = []
    elementRevisions.forEach(function (c) {
        revs.push(revisions[c])
    })

    revs = compressRevisions(revs)

    let height = 150, margin = 40;
    let width = document.querySelector("#vis").getBoundingClientRect().width - 100;

    let svg = d3.select("#vis svg")
    let group = svg.select("g")

    if (!svg.node()) {
        svg = d3.select("#vis").append("svg")
            .attr("width", width + margin)
            .attr("height", height + margin)

        group = svg.append("g")
            .attr("transform", "translate(" + margin + "," + margin + ")");
    }
    group.selectAll("rect").remove()

    let x = d3.scaleTime()
        .domain([d3.min(revs, function (r) {
            return new Date(r.start)
        }), d3.max(revs, function (r) {
            return new Date(r.start)
        })])
        .range([0, width - margin]);

    let b = d3.scaleBand()
        .domain([d3.min(revs, function (r) {
            return r.start
        }), d3.max(revs, function (r) {
            return r.start
        })])
        .range([0, width - margin]);

    let yMin = d3.min(revs, (d) => {
        let l = 0;
        if (d.op === "ds") {
            d.revs.forEach((r) => {
                var len = r[0].si - r[0].ei === 0 ? -1 : r[0].ei - r[0].si
                l += len;
            })
            d.len = l;
        }

        return l
    })

    let yMax = d3.max(revs, (d) => {
        var l = 0;
        if (d.op === "is") {
            d.revs.forEach((r) => {
                l += r[0].s.length
            })
            d.len = l;
        }
        return l
    })

    let y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height - margin, 0])

    group.selectAll("rect")
        .data(revs)
        .enter()
        .append("rect")
        .attr("fill", function (d) {
            return users[d.user].color
        })
        .attr("x", function (d) {
            return x(d.start)
        })
        .attr("width", function (d) {
            return 3
        })
        .attr("y", function (d) {
            let l = y(d.len)
            if (d.len <= 0) {
                l = y(d.len - d.len)
            }

            return l
        })
        .attr("height", function (d) {
            return y(0) - y(Math.abs(d.len))
        });

    var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%dT%H:%M"));;
    var yAxis = d3.axisLeft(y)

    var xGroup = group.select("g.xaxis")
    if (!xGroup.node()) {
        xGroup = group.append("g")
            .attr("class", "xaxis")
            .attr("transform", `translate(0,${height - margin})`)
    }

    xGroup.call(xAxis);

    var yGroup = group.select("g.yaxis")
    if (!yGroup.node()) {
        yGroup = group.append("g")
            .attr("class", "yaxis")
            .attr("transform", `translate(${0},0)`)
    }

    yGroup.call(yAxis)

}

//individual
function analyseParagraphRevisions(sec) {
    var revs = JSON.parse(sec.dataset.revisions)
    //we want plots per data
    var authors = {}

    var start = revs[0][1]
    var end = revs[revs.length - 1][1]

    for (var i = 0, n = revs.length; i < n; i++) {
        let rnr = revs[i] //we add 1 because there is an index ofset in the revision numbering
        var r = revisions[rnr - 1]
        var u = users[r[2]]
        //console.log(r)
    }
}

function handleClick(e) {
    var t = e.target
    if (t.classList.contains("revision")) {
        t = t.parentNode
    }
    var revs = JSON.parse(t.dataset.revisions)
    //buildGraph(revs)
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