
const file = "data/reworked.json";
const folder = "reworked"
//const file = "../data/ReworkedFramework.json";
var l = file.split("/")
var saveName = l[l.length-1].replace(".json","")
const fs = require("fs");
let data = JSON.parse(fs.readFileSync(file, 'utf8'));
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<html><head><link rel="stylesheet" href="../base/style.css"><script src="${saveName}.data.js"></script></head><body><div id="content"></div><script src="../base/main.js"></script></body></html>`);
var document = dom.window.document

var jsData = `var revisionData = ${JSON.stringify(data)}`

if (!fs.existsSync(folder)){
    fs.mkdirSync(folder);
}

var snapshots = analyseData(data)
buildPages(snapshots)


fs.writeFileSync(folder+"/"+saveName+".data.js", jsData)

fs.writeFileSync(folder+"/"+saveName+".html", document.documentElement.outerHTML)

function analyseData(data) {
    let revisions = data.revisions
    let snapshots = []
    characters = ""

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

        characters = stringSplice(characters, ibi, 0, s)
        analyze(revision)
    }

    function ds(revision) {
        let si = revision[0].si - 1;
        let ei = revision[0].ei - 1;
        let len = ei - si + 1;
        characters = stringSplice(characters, si, len)
        analyze(revision)
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

    function analyze(revision) {
        var snapshot = {
            text: characters,
            revision: revision[3]
        }
        snapshots.push(snapshot)
    }

    //https://stackoverflow.com/a/21350614
    function stringSplice(str, index, count, add) {
        return str.slice(0, index) + (add || "") + str.slice(index + count);
    }

    return snapshots;
}

function buildPages(snaps){
    var last = snaps[snaps.length-1]
    var paragraphs = last.text.match(/([^\n]+\n?|\n)/g)
    page = document.querySelector("#content")

    for(var i = 0, n = paragraphs.length; i < n; i++){
        
        var el = document.createElement("p");
        el.innerHTML = paragraphs[i];
       

        page.appendChild(el)
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

  function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i == 0)
          costs[j] = j;
        else {
          if (j > 0) {
            var newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue),
                costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }