/*jshint esversion: 6 */
'use strict';

const fs = require("fs");


let paragraphs = [{
    si: 0,
    ei: 1,
    characters: "",
    revisions:[]
}];
let deadParagraphs = [];
let deletedParagraphs = [];
let characters = [];




function as(rev) {}

function is(rev) {

    var s = rev[0].s;
    var si = rev[0].ibi - 1;


    for (var i = 0, n = s.length; i < n; i++) {
        characters.splice(si + i, 0, s[i])
    }

    analyseParagraphs(rev)
}

function ds(rev) {

    var si = rev[0].si - 1
    var ei = rev[0].ei - 1
    var len = ei - si + 1;

    for (var i = len + si; i > si; i--) {
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

    var nps = str.split(/\f|\n/g)

    var len = nps.length

    if (len > paragraphs.length) {

        if (paragraphs.length === 0) {
            var p = {
                si: 0,
                ei: nps[0].length - 1,
                characters: nps[0],
                revisions:[rev[3]]
            }
            paragraphs.push(p)
        } else {
            var index = rev[0].ibi - 1

            var p = {
                si: index,
                ei: index,
                characters: "",
                revisions:[rev[3]]
            }

            if (index <= paragraphs[0].si) {
                paragraphs.unshift(p)
            } else if (index >= paragraphs[paragraphs.length - 1].ei) {
                paragraphs.push(p)
            } else {
                //console.log("oh")
                //still need to figure this one out
                /*
                for(var i = 0, n = paragraphs.length; i < n; i++){
                    var p = paragraphs[i];
                    console.log(p)
                }*/

            }
        }
    } else if (len < paragraphs.length) {

        for (var i = 0, n = paragraphs.length; i < n; i++) {
            var p = paragraphs[i];
            if (p.si === rev[0].si - 1) {

                var delta = p.characters.length
                var prev = paragraphs[i - 1]
                if(prev){
                    prev.ei += delta
                    prev.characters+= p.characters;
                    prev.revisions.concat(p.revisions)

                }

                
                for (var j = i + 1, k = paragraphs.length; j < k; j++) {
                    var next = paragraphs[j];

                    next.si -= delta;
                    next.ei -= delta;
                }
                deadParagraphs.push(p)
                paragraphs.splice(i, 1)

                break;
            }
        }
    } else {


        for (var i = 0; i < len; i++) {
            var p = paragraphs[i];
            var delta = nps[i].length - paragraphs[i].characters.length;

            if (delta !== 0) {
                p.characters = nps[i]
            
                p.revisions.push(rev[3])
                p.ei = p.si + p.characters.length - 1;

                for (var j = i + 1, k = paragraphs.length; j < k; j++) {
                    var next = paragraphs[j];
                    next.si += delta;
                    next.ei += delta;
                }
            }
        }



    }
}

module.exports.getRevisions = function(file){
    
        let data = JSON.parse(fs.readFileSync(file, 'utf8'));
        let revs = data.revisions;
        let users = data.users;

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
        console.log("done with analysis")
        return [paragraphs, deadParagraphs]
        

    
}
