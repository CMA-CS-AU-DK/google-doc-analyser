const fs = require('fs');
const readline = require('readline');
const {
    google
} = require('googleapis');
const fileId = "1YuypXqzyPTn1d111M8LareMUmzwvWPq-kdzJDuUVXJA"
// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const TOKEN_PATH = 'credentials.json';
const https = require('https');
const http = require('http');
const url = require('url');


// Load client secrets from a local file.
fs.readFile('client_secret.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), init);
});

function init(auth){
    downloadRevision(2, auth)
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return callback(err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function queryRevisions(auth){
    
    const drive = google.drive({
        version: 'v3',
        auth
    });

    var request = drive.revisions.list({
        'fileId': fileId
    }, (err, {
        data
    }) => {
        
        var maxRevision = data.revisions[data.revisions.length-1].id
        console.log(maxRevision)
        for(var i = 0; i < maxRevision; i++){
            //getRevision(i, auth)
        }        
        //console.log(data)
    });
}

function downloadRevision(id, auth){

    const drive = google.drive({
        version: 'v3',
        auth
    });

    drive.files.export({
        fileId: fileId,
        mimeType: 'application/json',
        alt: 'media'
    }, (err, result) => {
        
        console.log(result)
    });
   
}


function queryRevision(id){

}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
    const drive = google.drive({
        version: 'v3',
        auth
    });
    drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    }, (err, {
        data
    }) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = data.files;
        if (files.length) {
            console.log('Files:');
            files.map((file) => {
                console.log(`${file.name} (${file.id})`);
            });
        } else {
            console.log('No files found.');
        }
    });
}

function listRevisions(auth) {
    const drive = google.drive({
        version: 'v3',
        auth
    });
    var request = drive.revisions.list({
        'fileId': fileId
    }, (err, {
        data
    }) => {
        var maxRevision = data.revisions[data.revisions.length-1].id
        console.log(maxRevision)
        /*
        for (var i = 0, n = data.revisions.length; i < n; i++) {
            var id = data.revisions[i].id
            inspectRevision(id, auth)
        }*/
        //console.log(data)
    });
}

function getRevision(id, auth) {
    const drive = google.drive({
        version: 'v2',
        auth
    }); //needs to be version 2
    var request = drive.revisions.get({
        'fileId': fileId,
        'revisionId': id
    }, (err, {
        data
    }) => {
        console.log(data)
    });
}

function getFile(auth){
    const drive = google.drive({
        version: 'v2',
        auth
    });
    var request = drive.files.get({
        'fileId': fileId
    }, (err, {
        data
    }) => {
       console.log(data)
    });
}

function inspectRevision(id, auth) {
    //console.log(auth)
    
    //https://www.googleapis.com/drive/v3/files/### FileID ###/revisions/### RevisionID ###?alt=media"
    //console.log(parsedUrl)
    //docs.google.com/document/u/0/d/1YuypXqzyPTn1d111M8LareMUmzwvWPq-kdzJDuUVXJA/export?format=txt&revision=36

    var options = {
        host: "docs.google.com",
        path: "/document/u/0/d/" +fileID+  "/export?format=json&revision=" + id
        //path: "/drive/v3/files/" + fileId + "/revisions/" + id + "?alt=media",
        /*
        headers: {
            Authorization: 'Bearer '+auth.credentials.access_token
        }*/
    }
    
    https.get(options, (resp) => {
        console.log("j")
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            console.log(JSON.parse(data));
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}