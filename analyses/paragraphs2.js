const file = "../data/GoogleTest.json";
//const file = "../data/ReworkedFramework.json";
const fs = require("fs");
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

let revisions = data.revisions
let paragraphs = []
let characters = ""


for(var i = 0, n = 97; i < n; i++){
    let revision = revisions[i];
    let t = revision[0].ty
    
    if(t === "is"){
        is(revision)
    } else if(t === "ds"){
        ds(revision)
    } else if(t === "mlti") {
        mlti(revision)
    }
}

function is(revision){
    let s = revision[0].s;
    let ibi = revision[0].ibi-1
    characters = stringSplice(characters, ibi, 0, s)
    analyze(revision)
}

function ds(revision){
    let si = revision[0].si-1;
    let ei = revision[0].ei-1;
    let len = ei - si + 1;
    characters = stringSplice(characters, si, len)
    analyze(revision)
}

function mlti(revision){
    
    var mts = revision[0].mts;
    
    for (var i = 0, n = mts.length; i < n; i++) {
     
        let r =  mts[i]   
        
        let nr = [r, revision[1],revision[2],revision[3]]
        if(!r){
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

function analyze(revision){
    
    lines = characters.split(/([&\n])/g);
    lines = lines.filter((l)=>{
        return l //to remove the '' positions
    })
    
    
    var paragraphsLength = paragraphs.length;
    var linesLength = lines.length;

    
    //Remove paragraph
    if(linesLength < paragraphsLength){
        
        for(var i = 0; i < linesLength; i++){
            let l = lines[i]
            let p = paragraphs[i]
            if(p.text === l){
                p.removed = false;
            }
        }
    
        let index;
        for(var i = 0; i < paragraphsLength ; i++){
            let p = paragraphs[i]
            if(!p.hasOwnProperty("removed")){
                index = i;
                if(i){
                    let prev = paragraphs[i-1];
                    
                    prev.text = lines[i-1]
                    prev.ei = prev.si+lines[i-1].length
                }
                
                paragraphs.splice(i, 1)
            } else {
                //we want to remove the flag again for later
                delete p["removed"];
            }

            if(i>index){
                p.si--;
                p.ei--;
            }
        }
        
    //add paragraph
    } else if (linesLength > paragraphsLength){
        if(paragraphsLength === 0){
            let p = {
                si: 0,
                ei: lines[0].length,
                text: lines[0]
            }
            paragraphs.push(p)
        } else {
            
            let first = paragraphs[0]
            let last = paragraphs[paragraphs.length-1]
            var index = revision[0].ibi
            var delta = 0;
            
            if(index <= first.si){
                console.log("append in the beginning")
            } else if(index > last.ei){
                let p;
                if(lines[linesLength-2].indexOf("\f") !== -1){
                    p = {
                        si: last.ei+1,
                        ei: last.ei+lines[linesLength-1].length + lines[linesLength-2].length,
                        text: lines[linesLength-2]+lines[linesLength-1]
                    }
                } else {
                    p = {
                        si: last.ei+1,
                        ei: last.ei+lines[linesLength-1].length,
                        text: lines[linesLength-1]
                    }
                }

                

                
               
                paragraphs.push(p)

            //adding paragraph in the middle  
            } else {
                
                for(var i = 0; i < linesLength ; i++){
                    let p = paragraphs[i]
                    let l = lines[i]
                    
                    
                    if(p && p.text !== l){
                        let delta = l.length
                        let last = paragraphs[i-1]
                        
                        let p = {
                            si: last.ei+1,
                            ei: last.ei+l.length,
                            text: l
                        }
                        paragraphs.splice(i, 0, p)
                        for(var j = i+1; j < paragraphsLength; j++){
                            pp = paragraphs[j]
                            pp.si += delta;
                            pp.ei += delta;
                        }
                        break;
                                          
                    } else if(!p){

                        
                    }
                }
             
                
            }
    
        }
        
    } else {
        
        let paragraph;
        for(var i = 0; i < paragraphsLength ; i++){
            let p = paragraphs[i]
            let l = lines[i]
            let delta = l.length - p.text.length
            
            if(delta){
                
                p.ei = p.si+l.length-1;
                p.text = l
            
                for(var j = i+1; j < paragraphsLength; j++){
                    pp = paragraphs[j]
                    pp.si += delta;
                    pp.ei += delta;
                }
                break;
            }
        }
        //console.log("text was added or removed from a paragraph")
    }
   
}

//https://stackoverflow.com/a/21350614
function stringSplice(str, index, count, add) {
    return str.slice(0, index) + (add || "") + str.slice(index + count);
}


console.log(paragraphs)
console.log(JSON.stringify(characters))
