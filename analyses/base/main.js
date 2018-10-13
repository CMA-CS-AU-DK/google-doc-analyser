var path = window.location.pathname
var jsonFile = path.split("/")[path.split("/").length - 1].replace(".html", "")
var users = revisionData.users
var revisions = revisionData.revisions
function buildPage() {
    var paragraphs = document.querySelectorAll("#content p")

    for (var i = 0, n = paragraphs.length; i < n; i++) {

        var el = paragraphs[i]

        el.addEventListener("mouseover", function (e) {
            e.target.classList.toggle("highlight")
        })

        el.addEventListener("mouseout", function (e) {
            e.target.classList.toggle("highlight")
        })
        el.addEventListener("click", handleClick)
    }
}



function handleClick() {
    console.log("whaat")
}
