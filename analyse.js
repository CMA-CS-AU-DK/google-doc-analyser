; (function () {

    /*
        Revision model
        0: revision data
        1: timestamp
        2: user id
        3: revision number
        4: uniquerevision identifier
        5: revision number for that user
    */


    var self = {}

    getData().then((data) => {
        self.data = data
        var btn = document.querySelector('button');
        btn.style.visibility = 'visible'
        btn.addEventListener('click', (e) => {
            download(self.data)
        })

        insertUsers(self.data)
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

    function download(data) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 4)));
        element.setAttribute('download', "revisionsData.json");
        element.style.display = 'none';
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
            .attr("width", width/revisions.length*0.9)
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


    function buildRevisionUserSeries() {

    }


})();






