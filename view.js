//Stop global (scope) pollution
; (function () {

    var revisionCount = 0


    function init() {
        console.log("Initialising")
        getRevisions(function(err, data){
            if(err){
                console.log(err)
            } else {
                revisionCount = data.tileInfo[data.tileInfo.length - 1].end;
                addInterfaceElements()
            }
        })
        
    }

    function addInterfaceElements() {
        button = document.createElement("div")
        button.id = "cma-rev-miner"
        button.classList = "goog-inline-block jfk-button jfk-button-standard docs-titlebar-button"
        button.innerHTML = "Analyse Doc"
        button.addEventListener('click', analyse)
        document.querySelector('.docs-titlebar-buttons').prepend(button)
    }

    function analyse() {
        console.log("Analysing ...")
        getRevisions( function (err, data) {
            if (err) {
                console.log(err)
            } else {
                parseRevisions(data)
            }
        })

        getChanges( function (err, data) {
            if (err) {
                console.log(err)
            } else {
                parseChanges(data.changeLog)
            }
        })
    }

    function parseChanges(data){
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
        element.setAttribute('download', "changes.json");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    function parseRevisions(data) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
        element.setAttribute('download', "revisions.json");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    function getToken() {
        var code = function () {
            document.getElementsByTagName('body')[0].setAttribute("token", _docs_flag_initialData.info_params.token)
        };

        var script = document.createElement('script');
        script.textContent = '(' + code + ')()';
        (document.head || document.documentElement).appendChild(script);
        script.parentNode.removeChild(script);

        return document.body.getAttribute('token')
    }

    function getDocumentID() {
        return location.href.match("((https?:\/\/)?docs\.google\.com\/(.*?\/)*document\/d\/(.*?))\/edit")[4];
    }

    function getHistoryURL() {
        var doc = getDocumentID()
        return getBaseUrl() + doc + "/revisions/tiles?id=" + doc + "&start=1&showDetailedRevisions=false&token=" + getToken()
    }

    function getRevisionCount(){
        return revisionCount
    }

    function getChangeURL() {
        var doc = getDocumentID()
        return getBaseUrl() + doc + "/revisions/load?id=" + doc + "&start=1&end=" + parseInt(('' + getRevisionCount()).replace(/,/g, '')) + "&token=" + getToken()
    }

    function getBaseUrl(){
        var meta = document.querySelector("meta[itemprop='url']").getAttribute("content")
        var reg = meta.match(/^(https:\/\/docs\.google\.com.*?\/document(?:\/u\/\d+)?\/d\/)/)
        return reg[1]
    }

    function getRevisions(cb) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', getHistoryURL());
        xhr.setRequestHeader('x-same-domain', 1);

        xhr.onload = function () {
            if (xhr.status === 200) {
                //var data = JSON.parse(xhr.responseText)

                var res = xhr.responseText
                var tiles = JSON.parse(res.split("\n")[1]);
                cb(null, tiles)
            } else {
                cb("Error " + xhr.status)
            }
        }

        xhr.onerror = function (evt) {
            cb(evt)
        }

        xhr.send(null);
    }

    function getChanges(cb){
        var xhr = new XMLHttpRequest();

        xhr.open('GET', getChangeURL());
        xhr.setRequestHeader('x-same-domain', 1);

        xhr.onload = function () {
            if (xhr.status === 200) {
                //var data = JSON.parse(xhr.responseText)

                var res = xhr.responseText
                var tiles = JSON.parse(res.split("\n")[1]);
                cb(null, tiles)
            } else {
                cb("Error " + xhr.status)
            }
        }

        xhr.onerror = function (evt) {
            cb(evt)
        }

        xhr.send(null);
    }

    init()
})();