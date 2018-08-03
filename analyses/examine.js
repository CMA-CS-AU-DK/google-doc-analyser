//const fileToAnalyse = "../data/GoogleTestDocument.json";
const fileToAnalyse = "../data/ReworkedFramework.json";
const fs = require("fs");
var data = JSON.parse(fs.readFileSync(fileToAnalyse, 'utf8'));


var revs = data.revisions;
var users = data.users;

var characters = []

for (var i = 0, n = revs.length; i < n; i++) {

    var r = revs[i];

    if(r[0].ty === "is"){
        is(r)
        //get position as ibi
    } else if(r[0].ty === "ds"){
        ds(r)
        //get position as si
    } else if(r[0].ty === "mlti"){
        mlti(r)
        //get position as ibi
    } 
}
function is(rev) {
    var s = rev[0].s;
    var ibi = rev[0].ibi   

    for (var i = 0, n = s.length; i < n; i++) {
        if(s[i] === "\n"){
            //console.log("inserting a space at " + ibi)
            //console.log(JSON.stringify(s[i]))
        }



        characters.splice(ibi + i - 1, 0, s[i])
        
    }
    //addRevisionToChunk(rev, [ibi, ibi +  s.length])
}
var iss = 0;
var noot = 0;
function ds(rev) {
    var si = rev[0].si - 1;
    var ei = rev[0].ei - 1;
    var len = ei - si + 1;
    
   
    if(ei === si || ei < si){
        iss++;
    } else {
        noot++;
    }

    
    for (var i = len + si; i > si; i--) {
        if(characters[i] === "\n"){
            //console.log("deleting a space at " + (i))
            //console.log(JSON.stringify(characters[i]))
        }
        characters.splice(i - 1, 1)
    }
    
    //addRevisionToChunk(rev, [rev[0].si, rev[0].ei]);
}
console.log(iss, noot)

function mlti(rev) {

    var mts = rev[0].mts;
   
    for (var i = 0, n = mts.length; i < n; i++) {
        var r = mts[i]
        var nr = [r, rev[1],rev[2],rev[3],rev[4], rev[5],rev[6],rev[7]]

        if(r.ty === "as" && r.st === "paragraph"){
           //console.log(r.ty, r.si)
        } else if (r.ty === "is") {
            //note -- this can have an as in front of it!
            is(nr)
        } else if (r.ty === "ds") {
            ds(nr)
        } else if (r.ty === "mlti") {
            mlti(nr)
        }
    }
}