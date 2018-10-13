; (function () {
    var url = new URL(location);
    var id = url.searchParams.get("tabid");
    
    var snaps, revisions, characters, users;
    var documentCreated, lastDocumentRevision;
    var information;
    chrome.tabs.sendMessage(parseInt(id), { request: "data" }, function (data) {
        revisions = data.revisions;

        documentCreated = new Date(revisions[0][1]).toLocaleDateString() + " " + new Date(revisions[0][1]).toLocaleTimeString()
        lastDocumentRevision = new Date(revisions[revisions.length-1][1]).toLocaleDateString() + " " + new Date(revisions[revisions.length-1][1]).toLocaleTimeString()

        users = data.users;
        snaps = analyseData(data);
        buildPages()
        


        information = document.querySelector("#info")

        information.addEventListener("mouseover", function(e){
            if(e.target.classList.contains("revision")){
                console.log(e.target)
            }
        })
    })

    //TODO FIX PAGES

    function buildPages(){
        var last = snaps[snaps.length-1]
        var paragraphs = last.text.match(/([^\n]+\n?|\n)/g)
        page = document.querySelector("#content")

        for(var i = 0, n = paragraphs.length; i < n; i++){
            
            var el = document.createElement("p");
            el.innerHTML = paragraphs[i];
            el.addEventListener("mouseover", function(e){
                e.target.classList.toggle("highlight")
            })

            el.addEventListener("mouseout", function(e){
                e.target.classList.toggle("highlight")
            })
            el.addEventListener("click", handleClick)

            page.appendChild(el)
        }
    }

    function handleClick(e){
        var txt = e.target.innerHTML;

        var lastRev, snapIndex, paraIndex;
        
        
        var revs = []
        for(var i = snaps.length-1; i > 0; i-- ){
            let s = snaps[i]
            
            var paras = s.text.match(/([^\n]+\n?|\n)/g)
            if(paras.indexOf(txt) !== -1 ){
                lastRev = s.revision;
                snapIndex = i;
                paraIndex = paras.indexOf(txt);
            } else {
                break;
            }
        }

        revs.unshift(lastRev)

        for(var i = snapIndex-1; i > 0; i-- ){
            let s = snaps[i]
            
            var paras = s.text.match(/([^\n]+\n?|\n)/g)
            for(var j = paras.length-1; j > 0; j--){
                var overlap = findOverlap(txt,paras[j]);
                if(overlap && txt.indexOf(overlap) === 0){
                    revs.unshift(s.revision)
                }
            }
        }

        //now we have revisions
        let revisionNumber = revs.length;
        let startDate = revisions[revs[0]][1]
        let endDate = revisions[lastRev][1]
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
    }

    function findSlice(txt, compareText){
        
        while(txt !== compareText || txt.length !== 0){
            txt = txt.slice(0, txt.length-1)
        }
        return txt.length;
    }

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
})()