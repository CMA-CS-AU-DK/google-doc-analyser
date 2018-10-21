var path = window.location.pathname
var jsonFile = path.split("/")[path.split("/").length - 1].replace(".html", "")
var users = revisionData.users
var revisions = revisionData.revisions

var information = document.querySelector("#info")

var documentCreated = new Date(revisions[0][1]).toLocaleDateString() + " " + new Date(revisions[0][1]).toLocaleTimeString()
var lastDocumentRevision = new Date(revisions[revisions.length-1][1]).toLocaleDateString() + " " + new Date(revisions[revisions.length-1][1]).toLocaleTimeString()

buildPage()
function buildPage() {
    var paragraphs = document.querySelectorAll("#content span")

    for (var i = 0, n = paragraphs.length; i < n; i++) {
        var el = paragraphs[i]

        el.addEventListener("mouseover", function (e) {
            e.target.parentNode.classList.toggle("highlight")
        })

        el.addEventListener("mouseout", function (e) {
            e.target.parentNode.classList.toggle("highlight")
        })
        el.addEventListener("click", handleClick)
    }
}

function handleClick(e) {
    var t = e.target
    if(t.classList.contains("revision")){
        t = t.parentNode
    }
    var revs = JSON.parse(t.dataset.revisions)
    
    /*
    var revisions = revisionData.revisions
    //now we have revisions
    let revisionNumber = revs.length;
    console.log(revisions[revs[0]])
    let startDate = revisions[revs[0]][1]
    let endDate = revisions[revs[revs.length-1]][1]
    let userRevisions = {}
    let copyPaste = false;
    
    html = `Document created: ${documentCreated}<br>Last document revision: ${lastDocumentRevision}<br>Paragraph revisions count: ${revisionNumber}<br>`;
    html += `First revision: ${new Date(startDate).toLocaleDateString() + " " + new Date(startDate).toLocaleTimeString()}<br>Last revision:  ${new Date(endDate).toLocaleDateString() + " " + new Date(endDate).toLocaleTimeString()}<br>`
    
    for(var i = 0, n = revs.length; i < n ; i++){
        let r = revisions[revs[i]];
        html += `<div class="revision" id="r_${revs[i]}" style="color:${users[r[2]].color};">${users[r[2]].name}<br>${new Date(r[1]).toLocaleDateString() + " " + new Date(r[1]).toLocaleTimeString()}</div>`
    }

    information.innerHTML = html;
    
    information.style.display = "block";
    */
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