

getData()


function getData(){
    var url = new URL(window.location.href);
    var id = url.searchParams.get("id");

    chrome.tabs.sendMessage(parseInt(id), {request: "data"}, function(data) {
            console.log(data)
            addStats(data)
    });
}

function addStats(data){
    var statElement = document.querySelector("#stats")
    var statDivs = statElement.querySelectorAll("div")
    statElement.querySelector("h1").innerHTML = "Document: " + data.title
    statDivs[0].querySelector("span").innerHTML = new Date(data.revisions[0][1]).toUTCString()
    statDivs[1].querySelector("span").innerHTML = "nil"
    statDivs[2].querySelector("span").innerHTML = "nil"
    statDivs[3].querySelector("span").innerHTML = data.revisions.length

    var revisions = document.querySelector("#revisions")
    
    for(var u in data.users){
        var el = document.createElement("div")
        el.classList = "user"
        el.innerHTML = data.users[u].name
        statDivs[4].appendChild(el)
    }

    for(var i = 0, n = data.revisions.length; i < n;i++){
        
        var rev = data.revisions[i]
        var user = data.users[rev[2]].name
        var date = new Date(rev[1]).toUTCString()
        
        var el = document.createElement("div")
        el.classList = "rev"
        el.innerHTML = "Rev " + i + ": " + user + " <br> " + date
        revisions.appendChild(el)
    }
}



