const fs = require("fs");
const file = "../data/GoogleTestDocument.json";
var data = JSON.parse(fs.readFileSync(file, 'utf8'));
var revs = data.revisions;
var users = data.users;

var paragraphs = []
var characters = []
/*
    paragraph = {
        si: <index of first character>
        ei: <index of paragraph character \n || \f || last character of document>
        user: <paragraph user>
        content: <content of paragraph>
        revisions: [array of revisions]
    }
*/

for (var i = 0, n = 40; i < n; i++) {
    var r = revs[i]
    if (r[0].ty === "is") {
        is(r)
    } else if (r[0].ty === "ds") {
        ds(r)
    } else if (r[0].ty === "mlti") {
        mlti(r)
    }
}


function is(rev) {
    var s = rev[0].s
    var ibi = rev[0].ibi
    

    for (var i = 0, n = s.length; i < n; i++) {
        characters.splice(ibi + i - 1, 0, JSON.stringify(s[i]))
    }

    if(s.indexOf("\n") != -1 || s.indexOf("\f") != -1 //|| paragraphs.length === 0*/){
        
        var p = {
            si: getLastParagraphIndex(ibi),
            ei: ibi+s.length,
            user:rev[2],
            revisions:[rev]
        }
        paragraphs.splice(ibi)
        console.log("this is a paragraph")
        //console.log(JSON.stringify(s))
    }

    console.log(characters.join())
}

function ds(rev) {
    var si = rev[0].si - 1
    var ei = rev[0].ei - 1
    var len = ei - si + 1;

    for (var i = len + si; i > si; i--) {
        characters.splice(i - 1, 1)
    }
}

function mlti(rev) {

    var mts = rev[0].mts;

    for (var i = 0, n = mts.length; i < n; i++) {
       
        var r = [mts[i], rev[1],rev[2],rev[3],rev[4],rev[5],rev[6],rev[7]]
        if (mts[i].ty === "is") {
            is(r)
        } else if (mts[i].ty === "ds") {
            ds(r)
        } else if (mts[i].ty === "mlti") {
            mlti(r)
        }
    }
}

function getLastParagraphIndex(index){
    for(var i = index, n = 0; i > n; i--){
        if(characters[i] === "\n" || characters[i] === "\f"){
            return i
        }
    }

    return 0;
}