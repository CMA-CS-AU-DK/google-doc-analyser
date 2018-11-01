
const file = "data/markgroup/7ReflectionConclusion.json";
const folder = "output/markgrp"

var l = file.split("/")
var saveName = l[l.length - 1].replace(".json", "")
const fs = require("fs");
let data = JSON.parse(fs.readFileSync(file, 'utf8'));
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(`<html><head><link rel="stylesheet" href="../base/style.css"><script src="${saveName}.data.js"></script></head><body><div id="visuals"></div><div id="content" class="page"></div><div id="slices" class="page"></div><script src="../base/main.js"></script></body></html>`);
var document = dom.window.document

//var snapshots = analyseData(data)
console.log("before data")
var result = analyseRevisions(data);
console.log("after data")
var characters = result.characters;
var deletes = result.deletes

var jsData = `var revisionData = ${JSON.stringify(data, null, 4)}`

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
}
page = document.querySelector("#content")
var paragraphStart = 0


//I need to append it to file (appendFileSync method)
var html = `<html><head><link rel="stylesheet" href="../../base/style.css"><script src="${saveName}.data.js"></script><script src="../../base/d3.min.js"></script></head><body><div id="base" class="infobar"></div><div id="detail" class="infobar"></div><div id="content" class="page">`

fs.writeFileSync(folder + "/" + saveName + ".html", html)


for (var i = 0, n = characters.length; i < n; i++) {
    var o = characters[i]
    if (o.character.match(/\n/) || i === n - 1) {
        
        //var el = document.createElement("p")
        var sectionRevisions = [o.revision]
        var spans = []

        for (var j = paragraphStart, k = i; j < k; j++) {
            var oo = characters[j]
            
            if( sectionRevisions.indexOf(oo.revision) === -1){
                sectionRevisions.push(oo.revision)
            }
            
            var oel = `<span class="revision" data-revision="${oo.revision}">${oo.character}</span>`;
            spans.push(oel);
            for (var l = 0, m = deletes.length; l < m; l++) {
                var d = deletes[l]
                if (d.revision === o.revision || (d.revision > o.revision && (j === k - 1 || d.revision < characters[j + 1].revision))) {
                    
                    if( sectionRevisions.indexOf(d.revision) === -1){
                        sectionRevisions.push(d.revision)
                    }

                    if( sectionRevisions.indexOf(d.delete) === -1){
                        sectionRevisions.push(d.delete)
                    }
                    var del = '<span class="revision deleted" data-revision="'+d.delete+'" data-deleted="'+d.revision+'">'+d.character+'</span>';

                    spans.push(del)
                    break;
                }
            }
        }
        
        paragraphStart = i+1
        var fel = `<p>`
        //fs.writeFileSync(folder + "/" + saveName + ".html", html)
        fs.appendFileSync(folder + "/" + saveName + ".html", fel)
        for(var j = 0, k = spans.length; j < k; j++){
            fs.appendFileSync(folder + "/" + saveName + ".html", spans[j])
        }

        fs.appendFileSync(folder + "/" + saveName + ".html", "</p>")
    }
}

var end = '</div><div id="slices" class="page"><div id="infobox"></div></div><script src="../../base/main.js"></script></body></html>'
fs.appendFileSync(folder + "/" + saveName + ".html", end)

fs.writeFileSync(folder + "/" + saveName + ".data.js", jsData)


function analyseRevisions(data) {
    let revisions = data.revisions
    var characters = []
    var deletes = []
    
    for (var i = 0, n = revisions.length; i < n; i++) {
        console.log("Revision " + i + " total: " + n)
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
                character: s[j],
                revision: revision[3]
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
            d.delete = revision[3]
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
