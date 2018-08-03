
const fs = require("fs");



module.exports.user_revisions = function (file) {
    var data = JSON.parse(fs.readFileSync(file, 'utf8'));
    var revs = data.revisions;
    
    var users = {}
    var us = []
    
    for (var i = 0, n = revs.length; i < n; i++) {
        
        let r = revs[i]
      
        if(!users.hasOwnProperty(r[2])){
            users[r[2]] = {
                u: r[2],
                c: data.users[r[2]].color,
                revisions: [r]
            };
            
        } else {
            users[r[2]].revisions.push(r)
            
        }
    }

    return users;

}