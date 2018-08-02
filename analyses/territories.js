const fileToAnalyse = "../data/GoogleTestDocument.json";
//const fileToAnalyse = "../data/ReworkedFramework.json";
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

var tiles = data.super_revisions;
var revs = data.revisions;
var users = data.users;

var inserts = []


var html = "<html><body>"
//first we do a seperation of users. Since we are interested in territories.
//consideration -- 


var chunks = []

for(var i = 0, n = revs.length; i < n ; i++){
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
    
    addRevisionToChunk(rev, [ibi, ibi +  s.length])
}

function ds(rev) {
    addRevisionToChunk(rev, [rev[0].si, rev[0].ei]);
}

function mlti(rev) {

    var mts = rev[0].mts;
   
    for (var i = 0, n = mts.length; i < n; i++) {
        var r = mts[i]
        var nr = [r, rev[1],rev[2],rev[3],rev[4], rev[5],rev[6],rev[7]]

        if(r.ty === "as" && r.st === "paragraph"){
            var chunk = {
                si: r.si,
                ei: r.ei,
                revisions: []
            }
            
            chunks.splice(r.si - 1, 0, chunk)
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

function addRevisionToChunk(rev, position){
    
    for(var i = 0, n = chunks.length; i < n ; i++){
        var chunk = chunks[i];
        if(position[0] === chunk.si || position[1] === chunk.ei){
            chunk.si = position[0]
            chunk.ei = position[1]
            chunk.revisions.splice(chunk.si-1, 0, rev) 
           
        }
        
    }
}

console.log(chunks)

for(var i = 0, n = chunks.length; i < n ; i++){
    var chunk = chunks[i]
    var el = document.createElement("div")
    console.log(chunk)
    chunk.revisions.forEach((r)=>{
        console.log()
        if(r[0].ty === "is"){
            el.innerHTML += r[0].s
        }
    });

    wrap.appendChild(el)
}

fs.writeFileSync("analysis.html", document.documentElement.outerHTML, 'utf8')


console.log("part 2 over")





