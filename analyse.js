; (function () {

    var self = {}

    //precalculate the visualisation size

    getData().then((data) => {
        self.data = data
        var btn = document.querySelector('button');
        btn.style.visibility = 'visible'
        btn.addEventListener('click', (e) => {
            download(self.data)
        })

        insertUsers(self.data)
        processRevisions(self.data)

        //inspectRevisions(self.data)
        //largeRevisionMap(self.data)
        //buildRevisionTimeline(self.data)

    }).catch((e) => {
        console.log(e)
    })

    function getData() {
        return new Promise((resolve) => {
            var url = new URL(window.location.href);
            var id = url.searchParams.get("id");
            chrome.tabs.sendMessage(parseInt(id), { request: "data" }, function (data) {
                revisionData = data
                resolve(data)
            });
        })
    }

    /*
        Revision model
        0: revision data
        1: timestamp
        2: user id
        3: revision number
        4: uniquerevision identifier
        5: revision number for that user

        defining super revisions (collections of revisions that are meaningfully clustered)

        User change
        Same user but creating a new paragraph

        Distinct opeartions (with intent)
        Copy-paste
        Headline
        
        Other place in document (other paragraph)
        Other time (last edit + threshold)
    */

    function processRevisions(data, temporalDistanceThreshold, indexicalDistanceThreshold, uniqueUsers) {
        return new Promise((resolve) => {
            var superRevisions = []
            var revisions = data.revisions;
            temporalDistanceThreshold = temporalDistanceThreshold || 10000;
            indexicalDistanceThreshold = indexicalDistanceThreshold || 0.2;
            uniqueUsers = uniqueUsers || true;

            var superRevision;
            for (var i = 0, n = revisions.length; i < n; i++) {
                if (!superRevision) {
                    superRevision = {
                        type: null, //define later
                        startIndex: 0,
                        endIndex: null,
                        revisions: [revisions[i]],
                        startTime: revisions[i][1],
                        endTime: null,
                    }
                } else {
                    //If the user is different, it is a new revision
                    if (revisions[i][2] != revisions[i - 1][2]) {
                        superRevision.endIndex = i-1
                        superRevision.endTime = revisions[i-1][1]
                        superRevision.type = "user"
                        superRevisions.push(superRevision)

                        superRevision = {
                            type: null, //define later
                            startIndex: i,
                            endIndex: null,
                            revisions: [revisions[i]],
                            startTime: revisions[i][1],
                            endTime: null,
                        }
                    } else if(detectParagraphChange(revisions[i][0])){
                        superRevision.endIndex = i-1
                        superRevision.endTime = revisions[i-1][1]
                        superRevision.type = "paragraph"
                        superRevisions.push(superRevision)

                        superRevision = {
                            type: null, //define later
                            startIndex: i,
                            endIndex: null,
                            revisions: [revisions[i]],
                            startTime: revisions[i][1],
                            endTime: null,
                        }
                    } else if(detectCopyPasteInsert(revisions[i][0])){
                        superRevision.endIndex = i-1
                        superRevision.endTime = revisions[i-1][1]
                        superRevision.type = "paste"
                        superRevisions.push(superRevision)

                        superRevision = {
                            type: null, //define later
                            startIndex: i,
                            endIndex: null,
                            revisions: [revisions[i]],
                            startTime: revisions[i][1],
                            endTime: null,
                        }
                    } else if(false){
                        //in in headline
                    } else if(false){
                        //has moved paragrap (from previous edit)
                    } else if(false){
                        //has jumped in time
                    } else {
                        superRevision.revisions.push(revisions[i])
                    }
                }
            }
            console.log(revisions.length)
            console.log(superRevisions.length)
        })
    }

    function inspectRevisions(data) {
        var revisions = data.revisions
        for (var i = 0, n = revisions.length; i < n; i++) {
            var rev = revisions[i]
            
            var pos = getLargestCharacterPosition(rev[0])
            console.log(pos)
            if (rev[0].ty === "mlti") {
                
                var mts = rev[0].mts
                for (var j = 0, k = mts.length; j < k; j++) {
                    var mlti_rev = mts[j]
                    
                    if (mlti_rev.st === "text") {
                        //console.log(revisions[i - 1])
                        //console.log(rev)
                        //console.log(revisions[i + 1])
                    }
                }
            }
        }
    }

    function getDocumentLength(data) {
        var revs = data.revisions
        var characters = 0; // ----> document size

        for (var i = 0, n = revs.length; i < n; i++) {
            var details = revs[i][0]
            var c = getLargestCharacterPosition(details)
            if (characters < c) {
                characters = c;
            }
        }

        return characters;
    }

    function detectCopyPasteInsert(revision){
        if(revision.ty === "mlti"){
            var mts = revision.mts
            for(var i = 0, n = mts.length; i < n; i++ ){
                var rev = mts[i]
                if(rev.ty === "mlti"){
                    return detectCopyPasteInsert(rev)
                } else if(mts[i].ty === "as" && mts[i].st === "text" ){
                    return true
                }
            }
        }
        return false;
    }

    function detectParagraphChange(revision){
        if(revision.ty === "mlti"){
            var mts = revision.mts
            for(var i = 0, n = mts.length; i < n; i++ ){
                var rev = mts[i]
                if(rev.ty === "mlti"){
                    return detectParagraphChange(rev)
                } else if(mts[i].ty === "as" && mts[i].st === "paragraph" ){
                    return true
                }
            }
        }
        return false
    }

    function getLargestCharacterPosition(revision, largest) {
        largest = largest || 0

        if (revision.ty === "is") {
            if (revision.ibi > largest) {
                largest = revision.ibi;
            }
        } else if (revision.ty === "ds") {
            if (revision.ei > largest) {
                largest = revision.ei;
            }
        } else if (revision.ty === "mlti") {
            for (var i = 0, n = revision.mts.length; i < n; i++) {
                var c = getLargestCharacterPosition(revision.mts[i], largest)
                if (largest < c) {
                    largest = c
                }
            }
        }
        return largest
    }

    function download(data) {
        var element = document.createElement('a');
        var url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' }));
        element.download = "revisions.json"
        element.href = url

        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    function insertUsers(data) {

        var userList = document.querySelector("#users")

        for (var u in data.users) {
            var el = document.createElement("li")
            el.classList = "user"
            el.id = "u_" + u
            el.innerHTML = '<input type="checkbox" checked="true">' + data.users[u].name
            el.style.color = data.users[u].color
            userList.appendChild(el)
        }
    }

    function largeRevisionMap(data) {
        var documentLength = getDocumentCharacterCount(data)
        var firstRevision = data.revisions[0][1]
        var lastRevision = data.revisions[data.revisions.length - 1][1]

        var revisions = []

        for (var i = 0, n = data.revisions.length; i < n; i++) {
            var rev = data.revisions[i]
            console.log(rev)
            /*
            var obj = {}
            obj.id = rev[4]
            obj.time = rev[1]
            obj.user = rev[2]
            obj.type = rev[0].ty
            obj.length = revisionSize(rev[0]);
            revisions.push(obj)*/
        }

        var svg = d3.select("#documentmap")
        margin = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 50
        },
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom,

            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleTime()
            .domain([new Date(firstRevision), new Date(lastRevision)])
            .range([0, width])

        var y = d3.scaleLinear()
            .domain([0, documentLength])
            .range([0, height]);


    }

    function buildRevisionTimeline(data) {

        var first = data.revisions[0][1]
        var last = data.revisions[data.revisions.length - 1][1]

        var revisions = []

        for (var i = 0, n = data.revisions.length; i < n; i++) {
            var rev = data.revisions[i]
            var obj = {}
            obj.id = rev[4]
            obj.time = rev[1]
            obj.user = rev[2]
            obj.type = rev[0].ty
            obj.length = revisionSize(rev[0]);
            revisions.push(obj)
        }

        function revisionSize(rev) {
            if (rev.ty === "is") {
                return rev.s.length
            } else if (rev.ty === "ds") {
                return rev.ei - rev.si + 1
            } else if (rev.ty === "mlti") {
                var c = 0;
                for (var i = 0, n = rev.mts.length; i < n; i++) {
                    return revisionSize(rev.mts[i])
                }
            } else if (rev.ty === "as") {
                return 1
            } else {
                return 0
            }
        }

        console.log(revisions.length)

        var box = document.querySelector("#timeline").getBoundingClientRect()
        console.log(box)
        var svg = d3.select("#timeline").append("svg").attr("width", box.width).attr("height", box.height),
            margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 50
            },
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom,

            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        console.log(height)
        var parseTime = d3.timeParse("%d-%b-%y");
        console.log(new Date(last))
        var x = d3.scaleTime()
            .domain([new Date(first), new Date(last)])
            .range([0, width])

        var y = d3.scaleLinear()
            .domain([0, 15])
            .range([0, height]);

        g.selectAll(".bar")
            .data(revisions)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("fill", "red")
            .attr("x", function (d) {
                var xpos = x(new Date(d.time))
                return xpos
            })
            .attr("y", function (d) {
                return y(Number(d.length))
            })
            .attr("width", width / revisions.length * 0.9)
            .attr("height", function (d) {
                var yH = height - y(Number(d.length))

                return yH
            })
        /*
        d3.tsv("morley.tsv").then(function (data) {
            x.domain(data.map(function (d) {
                return d.Run;
            }));
            y.domain([0, d3.max(data, function (d) {
                return Number(d.Speed);
            })]);

            g.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))

            g.append("g")
                .call(d3.axisLeft(y))
                .append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", "0.71em")
                .attr("text-anchor", "end")
                .text("Speed");

            g.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function (d) {
                    return x(d.Run);
                })
                .attr("y", function (d) {
                    return y(Number(d.Speed));
                })
                .attr("width", x.bandwidth())
                .attr("height", function (d) {
                    return height - y(Number(d.Speed));
                });
        });*/




    }


    function buildRevisionUserSeries(data) {
        var users = []
        for (var u in data.users) {
            var obj = { id: u, color: data.users[u].color }
            users.push(obj)
        }

        var box = document.querySelector("#timeline").getBoundingClientRect()

        var svg = d3.select("#timeline").append("svg").attr("width", box.width).attr("height", box.height),
            margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 50
            },
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom,

            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear()
            .domain([0, data.revisions.length])
            .range([0, width])

        var y = d3.scaleLinear()
            .domain([0, users.length])
            .range([0, height]);

        g.selectAll(".bar")
            .data(data.revisions)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("fill", function (d) {
                for (var i = 0, n = users.length; i < n; i++) {
                    if (users[i].id === d[2]) {
                        return users[i].color
                    }
                }
            })
            .attr("x", function (d, i) {
                return i
            })
            .attr("y", function (d) {
                for (var i = 0, n = users.length; i < n; i++) {
                    if (users[i].id === d[2]) {
                        return y(i + 1)
                    }
                }
            })
            .attr("width", width / data.revisions.length)
            .attr("height", height / users.length - 1)
    }

})();






