/*
    if(s.indexOf("\n") !== -1 || s.indexOf("\f") !== -1){
        for (var i = 0, n = s.length; i < n; i++) {
            
        }
        console.log("phew")
        var indexes = s.search(/\n/g)
        console.log(indexes)
        console.log("handle it first, yes?")
    }*/
    /*

    for (var i = 0, n = s.length; i < n; i++) {
        /*
        if(s[i].indexOf("\n") !== -1 || s[i].indexOf("\f") !== -1){
            
            for(var j = 0, k = paragraphs.length; j < k; j++){
                var para = paragraphs[j];
                if(ibi >= para.si && ibi + i <= para.ei){
                    para.characters.splice(ibi+i, 0, JSON.stringify(s[i]));
                }
                
            }
            let p = {
                si: ibi+i,
                ei: ibi+i+1,
                st: null,
                et: null,
                user:null,
                revisions:[],
                characters: []
            };
            paragraphs.push(p)
            
        } else {
            for(var j = 0, k = paragraphs.length; j < k; j++){
                var p = paragraphs[j];
                console.log(p.si, p.ei)
                /*
                if(ibi >= p.si && ibi + i <= p.ei){
                    p.characters.splice(ibi+i, 0, JSON.stringify(s[i]));
                    p.ei++;
             }
}*/
        //}
        //characters.splice(ibi + i, 0, JSON.stringify(s[i]));
    //} 