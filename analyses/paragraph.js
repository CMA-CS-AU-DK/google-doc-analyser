/*jshint esversion: 6 */
'use strict';

const fs = require("fs");
const file = "../data/GoogleTestDocument.json";
let data = JSON.parse(fs.readFileSync(file, 'utf8'));
let revs = data.revisions;
let users = data.users;

let paragraphs = [];
let deadParagraphs = [];
let characters = [];

/*
let p = {
    si: 0,
    ei: 0,
    st: null,
    et: null,
    user:revs[0][2],
    revisions:[],
    characters: []
};

paragraphs.push(p)
*/

for (var i = 0, n = revs.length; i < n; i++) {
    var r = revs[i]
    if (r[0].ty === "is") {
        is(r);
    } else if (r[0].ty === "ds") {
        ds(r);
    } else if (r[0].ty === "mlti") {
        mlti(r);
    }
}


function as(rev) {
    //We still need to change the old array of paragraphs -- they have grown in the mean time.
    var si = rev[0].si;
    var ei = rev[0].ei;
    let p = {
        si: si-1,
        ei: ei,
        st: r[1],
        et: r[1],
        user: revs[2],
        revisions: [],
        characters: []
    }
    paragraphs.push(p)

}

function is(rev) {
    var s = rev[0].s;
    var ibi = rev[0].ibi -1;
   
    for (var i = 0, n = s.length; i < n; i++) {
        
        for (var j = 0, k = paragraphs.length; j < k; j++) {
            var p = paragraphs[j];  
           
            if( ibi + i + 1 >= p.si && ibi + i <= p.ei){
                p.characters.splice(ibi + i, 0, JSON.stringify(s[i]));
                if(s[i] !== "\n"){
                    p.ei++
                } else {
                    p.ei-= 2
                }
                
            }
            
            
        
        }
        /*
        paragraph.characters.splice(ibi + i, 0, JSON.stringify(s[i]));
        if(s[i] !== "\n"){
            paragraph.ei++;
        }*/
        
    }

    
    /*
    for (var i = 0, n = s.length; i < n; i++) {

        for (var j = 0, k = paragraphs.length; j < k; j++) {
            var p = paragraphs[j];

            if (ibi >= p.si && ibi + i  <= p.ei) {

                if (s[i].indexOf("\n") !== -1) {
                    console.log(ibi, s.length, p.si, p.ei)
                    console.log("ever in here")
                }
                p.characters.splice(ibi + i, 0, JSON.stringify(s[i]));
                p.ei++;
            }
        }

        characters.splice(ibi + i, 0, JSON.stringify(s[i]));

    }*/
}



function ds(rev) {
    var si = rev[0].si - 1
    var ei = rev[0].ei - 1
    var len = ei - si + 1;

    for (var i = len + si; i > si; i--) {

        //console.log(characters[i-1])



        for (var j = 0, k = paragraphs.length; j < k; j++) {
            var p = paragraphs[j];

            if (i >= p.si && i <= p.ei) {
                
                

                //console.log(p.characters[i-1])    

                //console.log(p.characters[i], i, rev[3])

                p.characters.splice(i - 1, 1);
                p.ei--;
            }
        }

        characters.splice(i - 1, 1);
    }
}

function mlti(rev) {

    var mts = rev[0].mts;

    for (var i = 0, n = mts.length; i < n; i++) {
        var r = [mts[i], rev[1], rev[2], rev[3], rev[4], rev[5], rev[6], rev[7]]

        if (mts[i].ty === "is") {
            is(r)
        } else if (mts[i].ty === "ds") {
            ds(r)
        } else if (mts[i].ty === "mlti") {
            mlti(r)
        } else if (mts[i].ty === "as" && mts[i].st === "paragraph") {
            as(r)
        }
    }
}


paragraphs.forEach((para) => {
    var chars = para.characters.join()
    
    delete para.characters
    delete para.user
    
    console.log(para)
    //console.log(chars)
})
//console.log(characters.join())