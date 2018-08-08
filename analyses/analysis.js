let para = require("./paragraph.js");
const file = "../data/Thesislicious.json";
//const file = "../data/ReworkedFramework.json";
const fs = require("fs");
let data = JSON.parse(fs.readFileSync(file, 'utf8'));


const jsdom = require("jsdom");
const {
    JSDOM
} = jsdom;

let users = data.users;
let revs = data.revisions;

var arr = para.getRevisions(file)
var paragraphs = arr[0]
var deadParagraphs = arr[1]

console.log(paragraphs.length)
/*
var collab = []
var session;
for (var i = 0, n = paragraphs.length; i < n; i++) {
    if(paragraphs[i].characters.length > 10){
        for (var j = 0, k = paragraphs[i].revisions.length; j < k; j++) {
            var rid = paragraphs[i].revisions[j]
            var r = revs[rid];
            if (!session) {
                session = {
                    users: [r[2]],
                    st: r[1],
                    et: r[1],
                    sr: r[3],
                    er: r[3],
                    revisions: [r]
                }
            } else {
    
                if (r[1] > (session.et + 1000 * 60 * 15)) { //we define a session as 15 minutes similarly to DocuViz assumption about 15 minutes as a simultanious work interval
                    if (session.users.length > 1) {
                        collab.push(session)
                    }
    
                    session = {
                        users: [r[2]],
                        st: r[1],
                        et: r[1],
                        sr: r[3],
                        er: r[3],
                        revisions: [r]
                    }
                } else {
                    if (session.users.indexOf(r[2]) === -1) {
                        session.users.push(r[2])
                    }
                    session.et = r[1];
                    session.er = r[3];
                    session.revisions.push(r);
                }
            }
            //we need to push the final revision to the session stack
            if (i === n - 1) {
                session.revisions.push(r);
                if (session.users.length > 1) {
                    var p = {
                        paragraph: paragraphs[i],
                        session:session
                    }
                    collab.push(p)
                }
            }
        }
    }
    }
    for (var j = 0, k = paragraphs[i].revisions.length; j < k; j++) {
        var rid = paragraphs[i].revisions[j]
        var r = revs[rid];
        if (!session) {
            session = {
                users: [r[2]],
                st: r[1],
                et: r[1],
                sr: r[3],
                er: r[3],
                revisions: [r]
            }
        } else {

            if (r[1] > (session.et + 1000 * 60 * 15)) { //we define a session as 15 minutes similarly to DocuViz assumption about 15 minutes as a simultanious work interval
                if (session.users.length > 1) {
                    collab.push(session)
                }

                session = {
                    users: [r[2]],
                    st: r[1],
                    et: r[1],
                    sr: r[3],
                    er: r[3],
                    revisions: [r]
                }
            } else {
                if (session.users.indexOf(r[2]) === -1) {
                    session.users.push(r[2])
                }
                session.et = r[1];
                session.er = r[3];
                session.revisions.push(r);
            }
        }
        //we need to push the final revision to the session stack
        if (i === n - 1) {
            session.revisions.push(r);
            if (session.users.length > 1) {
                var p = {
                    paragraph: paragraphs[i],
                    session:session
                }
                collab.push(p)
            }
        }
    }
}



console.log(collab)
/*

var sessions = []
paragraphs.forEach((p)=>{
    
    var session;
    for(var i = 0, n = p.revisions.length; i < n;i++){
        var rid = p.revisions[i]
        var r = revs[rid];
        if (!session) {

            session = {
                st: r[1],
                et: r[1],
                sr: r[3],
                er: r[3],
                revisions: [r]
            }
        } else {
    
            if (r[1] > (session.et + 1000 * 60 * 15)) { //we define a session as 15 minutes similarly to DocuViz assumption about 15 minutes as a simultanious work interval
                sessions.push(session)
                session = {
                    st: r[1],
                    et: r[1],
                    sr: r[3],
                    er: r[3],
                    revisions: [r]
                }
            } else {
                session.et = r[1];
                session.er = r[3];
                session.revisions.push(r);
            }
        }
        //we need to push the final revision to the session stack
        if (i === n-1) {
            session.revisions.push(r);
            sessions.push(session)
        }
    }
})

var sametimeplace = []

sessions.forEach((s)=>{
    s.users = []
    s.revisions.forEach((r)=>{
        if(s.users.indexOf(r[2]) === -1){
            s.users.push(r[2])
        }
    });
    
    if(s.users.length > 1){
        sametimeplace.push(s)
    }
})

const DOM = new JSDOM(`<!DOCTYPE html><body></body></html>`);
    var document = DOM.window.document
    var wrap = document.createElement("div")
    wrap.setAttribute("style", "margin:50px;white-space: pre-wrap;")
    wrap.id = "document";
    document.body.appendChild(wrap)

    
    
for(var i = 0, n = sametimeplace.length; i < n; i++){
    var session = sametimeplace[i]
    console.log(session.characters)
    



    for(var j = 0, k = session.revisions.length; j < k; j++){

        var r = session.revisions[j]
    }

    //fs.writeFileSync("analysis" + i + ".html", document.documentElement.outerHTML, 'utf8');
}*/