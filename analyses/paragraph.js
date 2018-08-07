/*jshint esversion: 6 */
'use strict';

const fs = require("fs");
const file = "../data/GoogleTestDocument.json";
//const file = "../data/ReworkedFramework.json";
let data = JSON.parse(fs.readFileSync(file, 'utf8'));
let revs = data.revisions;
let users = data.users;

let paragraphs = [];
let deadParagraphs = [];
let deletedParagraphs = [];
let characters = [];
let ops = []


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
    var ei = rev[0].ei - 1;
    let newParagraph = {
        si: si,
        ei: ei + 1,
        st: r[1],
        et: r[1],
        user: revs[2],
        revisions: [],
        characters: []
    }


    var len = paragraphs.length

    //We push the paragraph when the paragraph array is empty
    // OR when the new paragraph belong in the end.
    if (len === 0 || newParagraph.si >= paragraphs[len - 1].ei) {
        paragraphs.push(newParagraph)
    } else if (newParagraph.si === 0) {
        paragraphs.unshift(newParagraph)

    } else {
        //We need to figure out where to insert the new paragraph and then we need to adjust the indexts
        //We must assume that the paragraph is inserted in order, and then that all the following indexes are changed accordingly
        var index;
        for (var i = 0, n = len - 1; i < n; i++) {
            var paragraph = paragraphs[i]
            var next = paragraphs[i - 1]

            if (newParagraph.si >= paragraph.si && newParagraph.si <= paragraph.ei) {
                console.log("boom in the middle")

                paragraph.ei = newParagraph.si;
                newParagraph.characters = paragraph.characters.slice(newParagraph.si)
                paragraph.characters = paragraph.characters.slice(0, newParagraph.si)
                index = i;
                break;
                //it is in the middle of a paragraph --- we need to split some how.
            } else if (newParagraph.si >= paragraph.ei && newParagraph.si <= next.si) {
                console.log("boom between two paragraphs.")
                //it's between two paragraphs
                index = i;
                break;
            }
        }
        paragraphs.splice(index, 0, newParagraph)
    }
}

function is(rev) {
    var s = rev[0].s;
    var ibi = rev[0].ibi - 1;

    for (var i = 0, n = s.length; i < n; i++) {
        /*
        for (var j = 0, k = paragraphs.length; j < k; j++) {
            var p = paragraphs[j];

            if (ibi + i >= p.si && ibi + i <= p.ei) {
                p.characters.splice(ibi + i, 0, JSON.stringify(s[i]));

                if (s[i] !== "\n") {
                    p.ei++
                } else {
                    p.ei = ibi + s[i].indexOf("\n")
                }
                
            }
        }*/
        characters.splice(ibi + i, 0, s[i])
    }
    analyseParagraphs(rev)
}

function ds(rev) {
    var si = rev[0].si - 1
    var ei = rev[0].ei - 1
    var len = ei - si + 1;

    for (var i = len + si; i > si; i--) {
        /*
        for (var j = 0, k = paragraphs.length; j < k; j++) {
            var p = paragraphs[j];
            if (i >= p.si && i <= p.ei) {
                p.characters.splice(i - 1, 1);
                p.ei--;
            }
        }*/

        characters.splice(i - 1, 1);
    }
    analyseParagraphs(rev)
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
            //as(r)
        }
    }
}

function analyseParagraphs(rev) {
    var str = characters.join('')
    var nps = str.split(/\n|\f/g)

    var len = nps.length

    if (len > paragraphs.length) {
        if (paragraphs.length === 0) {
            var p = {
                si: 0,
                ei: nps[0].length - 1,
                characters: nps[0]//,
                //revisions:[rev]
            }
            paragraphs.push(p)
        } else {
            for (var i = 0; i < len; i++) {
                var p = paragraphs[i];
                if (!p && nps[i] === "") {
                    var sub = nps.slice(0, i);

                    var p = {
                        si: sub.join().length,
                        ei: sub.join().length,
                        characters: ""//,
                        //revisions:[rev]
                    }

                    paragraphs.push(p)
                }
            }
        }

       


    } else if (len < paragraphs.length) {

        var npsStr = ""
        var present = []
        var outlier = nps.filter((np)=>{
            for(var i = 0,)
        });

        for (var i = 0; i < len; i++) {
            var n = nps[j]
            index = array1.indexOf(array2[i]);

            for (var j = 0, k = paragraphs.length; j < k; j++) {
                var p = paragraphs[j];
                if (p.characters === n) {
                    present.push(j)
                }
            }
        }
        /*
        for(var i = 0, n = paragraphs.length -1 ; i < n; i++){
            var p = paragraphs[i];
            
            for(var j = 0; j < len; j++){
                var n = nps[j]
                if(p.characters === n){
                    present.push(j)
                }
            }
        }*/

        console.log(present)

        /*
        if(p && p.characters !== nps[i]){
            
            var delta = nps[i] ? nps[i].length : 0;
            deadParagraphs.push(p)
            if(i !== 0){
                paragraphs[i-1].characters += p.characters
                paragraphs[i-1]
                paragraphs[i-1].ei = p.ei;
            } else {
                console.log(p, " - ", i , " - ", nps[i])
                console.log("wut")
            }
            
            if(delta !== 0){
                for(var j = i+1, k = paragraphs.length -1; j < k; j++){
                    var next = paragraphs[j];
                    next.si += delta;
                    next.ei += delta;
                }
            }
            paragraphs.splice(i,1)
        }*/
        //}
    } else {
        var index = paragraphs.length;
        var delta;
        for (var i = 0; i < len; i++) {
            var npsLen = nps[i].length;

            var parLen = paragraphs[i].characters.length;
            var p = paragraphs[i];
            var delta = npsLen - parLen;

            if (delta !== 0) {

                index = i;
                delta = npsLen - parLen;
                p.ei += delta;
                p.characters = nps[i]
                /*
                var last = p.revisions[p.revisions.length-1]
                //crude test to avoid adding copies (test later please)
                if(last[1] !== rev[1] && last[2] !== rev[2]){
                    p.revisions.push(rev)
                }*/

                for (var j = i + 1, k = paragraphs.length; j < k; j++) {
                    var next = paragraphs[j];
                    next.si += delta;
                    next.ei += delta;
                }
            }
        }
    }
}

//console.log(paragraphs)
//console.log(deadParagraphs)

/*
paragraphs.forEach((para) => {
    var chars = para.characters.join()
    //console.log(para.characters.length)
    delete para.characters
    delete para.user

    console.log(para)
    console.log(chars)

})*/
//console.log(characters.join())