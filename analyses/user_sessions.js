const fileToAnalyse = "../data/GoogleTestDocument.json";
//const fileToAnalyse = "../data/ReworkedFramework.json";
const D3Node = require("d3-node");
const fs = require("fs");
let ur = require("./user_revisions.js");
let construct = require("./construct.js");
let users = ur.user_revisions(fileToAnalyse)


var user_sessions = [];

for(var u in users){
    var revs = users[u].revisions;
    users[u].sessions = [];
    var session;
    for(var i = 0, n = revs.length; i < n; i++){
        let r = revs[i];

        if (!session) {

            session = {
                id: 0,
                user:u,
                si: findStartIndex(r),
                ei: findEndIndex(r),
                st: r[1],
                et: r[1],
                sr: r[3],
                er: r[3],
                revisions: [r]
            }
        } else {
    
            if (r[1] > (session.et + 1000 * 60 * 15)) { //we define a session as 15 minutes similarly to DocuViz assumption about 15 minutes as a simultanious work interval
                users[u].sessions.push(session)
                session = {
                    id: users[u].sessions.length,
                    user:u,
                    si: findStartIndex(r),
                    ei: findEndIndex(r),
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
            
                var si = findStartIndex(r);
                var ei = findEndIndex(r);
                
                session.si = session.si < si ? session.si : si;
                session.ei = session.ei > ei ? session.ei : ei;
            }
        }
        //we need to push the final revision to the session stack
        if (i === n-1) {
            session.revisions.push(r);
            users[u].sessions.push(session)
        }
    }

}


function findStartIndex(r) {    
    var index;
    if (r[0].ty === "is") {
        index = r[0].ibi
    } else if (r[0].ty === "ds" || r[0].ty === "as") {
        index = r[0].si <= r[0].ei ? r[0].si : r[0].ei;
    } else if (r[0].ty === "mlti") {
        var lowestStartIndex = Number.MAX_VALUE;

        var mts = r[0].mts;
        for (var i = 0, n = 10; i < n; i++) { //we only want to run 10 times, because we risk that the revision is a large copy/paste with potential hundreds of sub revisions
            var rev = mts[i]
            if (rev) { //we need to check it exists
                si = findStartIndex([rev])

                if (si < lowestStartIndex) {
                    lowestStartIndex = si;
                }
            }

        }
        index = lowestStartIndex;
    }
    return index || Number.MAX_VALUE;
}

function findEndIndex(r) {
    var index;
    if (r[0].ty === "is") {
        index = r[0].ibi + r[0].s.length
    } else if (r[0].ty === "ds" || r[0].ty === "as") {
        index = r[0].si > r[0].ei ? r[0].si : r[0].ei;
    } else if (r[0].ty === "mlti") {
        var highestStartIndex = 0;

        var mts = r[0].mts;
        for (var i = 0, n = 10; i < n; i++) { //we only want to run 10 times, because we risk that the revision is a large copy/paste with potential hundreds of sub revisions
            var rev = mts[i]
            if (rev) { //we need to check it exists
                ei = findEndIndex([rev])

                if (ei > highestStartIndex) {
                    highestStartIndex = ei;
                }
            }

        }
        index = highestStartIndex;
    }

    return index || 0;
}

var sessionTimePairs = []
var sessionPlacePairs = []
for(var u in users){
    var sessions = users[u].sessions
    
    
    sessions.forEach((s)=>{
        for(var ou in users){
            if(u != ou){
                var ouSessions = users[ou].sessions;
                ouSessions.forEach((ss)=>{
                    if(sameTime(s, ss)){
                        if(!sessionTimePairs.some((o)=>{
                            
                            var so = o[0];
                            var sso = o[1];

                            return (so.id === s.id && so.user === s.user && sso.id === ss.id && sso.user === ss.user) ||
                            (so.id === ss.id && so.user === ss.user && sso.id === s.id && sso.user === s.user);

                        })){
                            sessionTimePairs.push([s, ss]);
                        }
                    }
                });
            }
        }
    })
}


//construct.construct(fileToAnalyse)

var si = sessionPlacePairs[0][0].sr < sessionPlacePairs[0][1].sr ? sessionPlacePairs[0][0].sr : sessionPlacePairs[0][1].sr;
var ei = sessionPlacePairs[0][0].er > sessionPlacePairs[0][1].er ? sessionPlacePairs[0][0].er : sessionPlacePairs[0][1].er;
var array = sessionPlacePairs[0][0].revisions.concat(sessionPlacePairs[0][1].revisions)



fs.writeFileSync("analysis" + 1 + ".html", construct.construct(fileToAnalyse, si, ei, array), 'utf8');



/*
sessionPlacePairs.forEach((pair)=>{
    construct


})*/



//crude test of same time.
function sameTime(s, ss){
    return ss.et >= s.st && ss.st <= s.et
}

function samePlace(s, ss){
    return ss.ei >= s.si && ss.si <= s.ei
}




/*

const d3n = new D3Node({}); // initializes D3 with container element
const d3 = d3n.d3;
var viewBoxWidth = 800
var viewBoxHeight = 400

//sessions overlapping in space
//sessions overlapping in time
//sessions overlapping in both
var x_min = Number.MAX_VALUE, x_max = 0;
for(var u in users){
    var sessions = users[u].sessions
    for(var i = 0, n = sessions.length; i < n; i++){
        var session = sessions[i]
        x_min = session.st < x_min ? session.st : x_min;
        x_max = session.et >= x_max ? session.et : x_max;
        
        console.log(session.st,session.et, x_max)
    }
}

x = d3.scaleTime()
  .domain([new Date(x_min), new Date(x_max)])
  .range([0, viewBoxWidth])

let svg = d3n.createSVG(viewBoxWidth, viewBoxHeight);
  //Adding the viewbox attribute to make the svg responsive to the parent size 
  //svg.attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight);

for(var u in users){


    /*
    var sessions = users[u].sessions
    svg.append("g").selectAll("rect")
    .data(sessions)
    .enter()
    .append("rect")
    .attr("x", (d)=>{ 
        return x(new Date(d.st))
    })
    .attr("width", (d)=>{
        return viewBoxWidth/x(new Date(d.et)) < 1 ? 5 : x(new Date(d.et))
    })
    .attr("data-user", u)
    .attr("height", ()=>{
        return 40
    })
    .attr("y", (d, i)=>{
        return Object.keys(users).indexOf(u)*50+Object.keys(users).indexOf(u);
    })
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("fill", users[u].c)   */
//}

//fs.writeFileSync('session-collaboration.html', d3n.html());


/*
for(var u in users){
    var sessions = users[u].sessions
    var max = d3.max(d3.values(data));

}*/