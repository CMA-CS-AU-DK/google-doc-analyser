//const fileToAnalyse = "../data/GoogleTestDocument.json";
const fileToAnalyse = "../data/ReworkedFramework.json";
const fs = require("fs");
var data = JSON.parse(fs.readFileSync(fileToAnalyse, 'utf8'));

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const DOM = new JSDOM(`<!DOCTYPE html><body></body></html>`);
var document = DOM.window.document
var wrap = document.createElement("div")
wrap.setAttribute("style", "margin:50px;white-space: pre-wrap;")
wrap.id = "document";
document.body.appendChild(wrap)

var wrap2 = document.createElement("div")
wrap2.setAttribute("style", "margin:50px;white-space: pre-wrap;")
wrap2.id = "document2";
document.body.appendChild(wrap2)

//console.log(document.documentElement.outerHTML)


var revs = data.revisions;
var users = data.users;

var html = "<html><body>"
//first we do a seperation of users. Since we are interested in territories.
//consideration -- 

var inserts = []
var deletes = []

for (var i = 0, n = revs.length; i < n; i++) {
    var r = revs[i]
    if (r[0].ty === "is") {
        is(r)
    } else if (r[0].ty === "ds") {
        ds(r)
    } else if (r[0].ty === "mlti") {
        mlti(r)
    }
}


function is(rev, time, user, id) {

    var s = rev[0] ? rev[0].s : rev.s;
    var ibi = rev[0] ? rev[0].ibi : rev.ibi;

    time = rev[0] ? rev[1] : time;
    user = rev[0] ? rev[2] : user;
    id = rev[0] ? rev[3] : id;

    for (var i = 0, n = s.length; i < n; i++) {


        var obj = {
            index: ibi + i,
            time: time,
            user: user,
            id: id,
            txt: s[i]
        }


        inserts.splice(ibi + i - 1, 0, obj)

    }
}

function ds(rev, time, user, id) {
    var si = rev[0] ? rev[0].si - 1 : rev.si - 1;
    var ei = rev[0] ? rev[0].ei - 1 : rev.ei - 1;
    var len = ei - si + 1;

    time = rev[0] ? rev[1] : time;
    user = rev[0] ? rev[2] : user;
    id = rev[0] ? rev[3] : id;



    
    for (var i = len + si; i > si; i--) {
        var obj = inserts[i - 1]
        obj.deleted = true;
        obj.delTime = time;
        obj.delUser = user;
        obj.delId = id;
        deletes.splice(i - 1, 0, obj)
        inserts.splice(i - 1, 1)

    }
}

function mlti(rev, time, user, id) {

    var mts = rev[0] ? rev[0].mts : rev.mts;
    time = rev[0] ? rev[1] : time;
    user = rev[0] ? rev[2] : user;
    id = rev[0] ? rev[3] : id;

    for (var i = 0, n = mts.length; i < n; i++) {
        var r = mts[i]
        if (r.ty === "is") {
            //note -- this can have an as in front of it!

            is(r, time, user, id)
        } else if (r.ty === "ds") {
            ds(r, time, user, id)
        } else if (r.ty === "mlti") {
            mlti(r, time, user, id)
        }
    }
}


console.log("part 1 over")
var currentElement, currentRevision
for (var i = 0, n = inserts.length; i < n; i++) {
    var r = inserts[i]
    //wrap.innerHTML += r.txt;

    if (!currentElement) {
        currentElement = document.createElement("span");
        currentElement.id = "r_" + r.id
        currentElement.innerHTML = r.txt;
        currentElement.style.color = users[r.user].color
        currentRevision = r.id

    } else {


        if (r.id != currentRevision) {
            wrap.appendChild(currentElement)
            currentElement = document.createElement("span");
            currentElement.classList = "revision"
            currentElement.id = "r_" + r.id
            currentElement.innerHTML = r.txt;
            currentElement.style.color = users[r.user].color
            currentRevision = r.id
        } else {
            currentElement.innerHTML += r.txt;
        }

        /*
        for (var j = 0, k = deletes.length; j < k; j++) {
            var d = deletes[j]
            if (d.index === i && d.delUser != d.id) {
                wrap.appendChild(currentElement)
                currentElement = document.createElement("span");
                currentElement.classList = "del"
                currentElement.id = "r_" + d.delId
                currentElement.innerHTML = "·";
                currentElement.style.color = users[d.user].color
                wrap.appendChild(currentElement)
                currentElement = null
                break;
            }
        }*/

        //we want to terminate, right :)
        if (i === n - 1) {
            wrap.appendChild(currentElement)
        }


    }
}


fs.writeFileSync("analysis.html", document.documentElement.outerHTML, 'utf8')


console.log("part 2 over")





