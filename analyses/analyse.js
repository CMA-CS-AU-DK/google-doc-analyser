/*jshint esversion: 6 */
'use strict';
const fs = require("fs");

var users, revisions;

module.exports.load = function(file){
    let data = JSON.parse(fs.readFileSync(file, 'utf8'));

    users = data.users;
    revisions = data.revisions;
    return {
        //users: data.users,
        //revisions: data.revisions,
        getDeleteRevisions: function(sortedBySize, count){
            return getDeleted(sortedBySize, count);
        }
    }
}

function getDeleted(sorted, count){
    sorted = sorted || false;
    count = count || -1;
    var inserts = []
    var deletes = []
    iterateRevisions(0, revisions.length, (rev)=>{
        var s = rev[0].s;
        var ibi = rev[0].ibi-1   
    
        var r = {
            si:ibi,
            ei:ibi+s.length,
            text: s,
            user: rev[2],
            revision: rev[3]
        }
 
        for (var i = 0, n = s.length; i < n; i++) {
            var r = {
                si:ibi,
                ei:ibi+1,
                text: s[i],
                user: rev[2],
                revision: rev[3]
            }
            
            inserts.splice(ibi + i - 1, 0, r)
        }
    },(rev)=>{
        var si = rev[0].si - 1;
        var ei = rev[0].ei - 1;
        var len = ei - si + 1;

       
        for (var i = len + si; i > si; i--) {
            var r = inserts[i - 1]
            if(r){
                r.deleteTime = rev[1];
                r.deleteUser = rev[2];
                r.deleteRevision = rev[3];
                deletes.splice(i - 1, 0, r)
                inserts.splice(i - 1, 1)
            }
        }
    })

    for(var i = deletes.length-1; i > 1; i--){    
        var d = deletes[i];
        var dd = deletes[i-1];
        if(d.deleteRevision === dd.deleteRevision){
            dd.text += d.text;
            dd.ei += d.text.length;
            deletes.splice(i,1)
        }    
    }

    if(sorted){
        deletes.sort((a, b)=>{
            return ((a.text.length === b.text.length) ? 0 : ((b.text.length > a.text.length) ? 1 : -1));
        })
    }

    return count === -1 ? deletes : deletes.slice(0, count)
}


function iterateRevisions(startIndex, endIndex, insertFunc, deleteFunc){
    for (var i = startIndex, n = endIndex; i < n; i++) {
        var r = revisions[i];
    
        if(r[0].ty === "is"){
            insertFunc(r)
            //get position as ibi
        } else if(r[0].ty === "ds"){
            deleteFunc(r)
            //get position as si
        } else if(r[0].ty === "mlti"){
            mlti(r)
            //get position as ibi
        } 
    }

    return

    function mlti(rev) {

        var mts = rev[0].mts;
       
        for (var i = 0, n = mts.length; i < n; i++) {
            var r = mts[i]
            var nr = [r, rev[1],rev[2],rev[3],rev[4], rev[5],rev[6],rev[7]]
    
            if(r.ty === "as" && r.st === "paragraph"){
               //console.log(r.ty, r.si)
            } else if (r.ty === "is") {
                //note -- this can have an as in front of it!
                insertFunc(nr)
            } else if (r.ty === "ds") {
                deleteFunc(nr)
            } else if (r.ty === "mlti") {
                mlti(nr)
            }
        }
    }
}