;(function() {
  'use strict';

    var serverURL = "http://localhost:5000";

	var $ = jQuery.noConflict();

	var collaborative = collaborative || {};

    // document id (scraped from the document url)
	var docId = null;
    // json information to store authors taken from history json
	var authors = {};
    // number of total revisions for the document
    var numRevisions = 0;
    // the most recent revision on the server 
    var revStartIndex = 1;
    // body of previous revision
    var savedBody = ""

	$.extend(collaborative, {
		init: function() {
            this.injectToken();

            this.renderTestBtn();
            this.addTestBtnListener();

            this.renderSaveBtn();
			this.getDocId();
			this.addSaveBtnListener();

			var that = this;
            this.getHistory(this.buildHistoryUrl(), 1, function(revs) {
            	if (Object.keys(authors).length <= 1) {
            		that.getRegisteredAuthors(function(data) {
            			if (!(that.getUserEmail() in data)) {
	            			that.renderRegisterBtn();
            			}
            		});
                }

                that.enableSaveButton();
            });
		},

        // get the user email from the top right corner of the screen
        getUserEmail: function() {
            return $(".gb_b").text();
        },

        getRegisteredAuthors: function(completion) {
        	$.ajax({
                type: 'GET',
                url: serverURL + "/authors",
                dataType: 'html',

                error: function(request, e) {
                    console.log("Something went wrong");
                },

                success: function(data) {
                    completion(JSON.parse(data));
                }
            });
        },

        // injects the test button into the google docs toolbar
        // (deactivated by default until the history loads)
        renderTestBtn: function() {
            var btnGroup = $('#docs-titlebar-share-client-button').prev();

            $('<div class="goog-inline-block js-collaborative-btn"><div id="testBtn" role="button"class="goog-inline-block jfk-button jfk-button-standard docs-titlebar-button jfk-button-clear-outline" aria-disabled="false" aria-pressed="false" tabindex="0" data-tooltip="Test" aria-label="Test" value="undefined" style="-webkit-user-select: none;">Reconstruct</div><div id="docs-docos-caret" style="display: none" class="docos-enable-new-header"><div class="docs-docos-caret-outer"></div><div class="docs-docos-caret-inner"></div></div></div>').prependTo(btnGroup);
        },

		// injects the save button into the google docs toolbar
        // (deactivated by default until the history loads)
		renderSaveBtn: function() {
        	var btnGroup = $('#docs-titlebar-share-client-button').prev();

            $('<div class="goog-inline-block js-collaborative-btn is-disabled"><div id="saveBtn" role="button"class="goog-inline-block jfk-button jfk-button-standard jfk-button-disabled docs-titlebar-button jfk-button-clear-outline" aria-disabled="true" aria-pressed="false" tabindex="0" data-tooltip="Commit changes as a new revision to collaborative writing server" aria-label="Commit changes as a new revision to collaborative writing server" value="undefined" style="-webkit-user-select: none;">Commit Revision</div><div id="docs-docos-caret" style="display: none" class="docos-enable-new-header"><div class="docs-docos-caret-outer"></div><div class="docs-docos-caret-inner"></div></div></div>').prependTo(btnGroup);
        },

        // injects the register button into the google docs toolbar
        renderRegisterBtn: function() {
            var btnGroup = $('#docs-titlebar-share-client-button').prev();

            $('<div class="goog-inline-block js-collaborative-btn"><div id="registerBtn" role="button"class="goog-inline-block jfk-button jfk-button-action docs-titlebar-button jfk-button-clear-outline" aria-disabled="false" aria-pressed="false" tabindex="0" data-tooltip="Register as a new author" aria-label="Register as a new author" value="undefined" style="-webkit-user-select: none;">Register</div><div id="docs-docos-caret" style="display: none" class="docos-enable-new-header"><div class="docs-docos-caret-outer"></div><div class="docs-docos-caret-inner"></div></div></div>').prependTo(btnGroup);
            $("#registerBtn").css('background', "#4D8FFD");

            this.addRegisterBtnListener();
        },

        // injects a javascript into the body that will execute and make the 
        // google drive accces token accessible as an element of the DOM.
        // The token is inserted dynamically by google docs, so we cannot extract
        // it until the page has already lodaed
        injectToken: function() {
          var code = function() {
            document.getElementsByTagName('body')[0].setAttribute("tok", _docs_flag_initialData.info_params.token)
          };
          var script = document.createElement('script');
          script.textContent = '(' + code + ')()';
          (document.head||document.documentElement).appendChild(script);
          script.parentNode.removeChild(script);
        },

        // adds onclick handler to save revisions button
        addSaveBtnListener: function() {
        	var that = this;

        	$(document).on('click', '#saveBtn', function() {
                that.getRevs(that.getUserEmail(), function(startIdx, body) {
                    that.getHistory(that.buildHistoryUrl(), 1, function(revs) {
                        that.getChangelog(startIdx, revs, function(data, chunck) {
                            that.parseChangelog(data, body, revs, that.getUserEmail(),chunck);
                        });
                    });
                });
            });
        },

        addRegisterBtnListener: function() {
            var that = this;
            $(document).on('click', '#registerBtn', function() {
            	that.getHistory(that.buildHistoryUrl(), 1, function(revs) {
            		var a_ids = Object.keys(authors);

	            	if (a_ids.length == 1) {
		                $.ajax({
		                    type: 'GET',
		                    url: serverURL + "/addAuthor/" + a_ids[0] + "/" + that.getUserEmail(),
		                    dataType: 'html',

	                    error: function(request, e) {
	                        console.log("Something went wrong");
	                    },

	                    success: function(data) {
	                        that.showRegisterButtonMessage("Registration successful!", '#8EC252', 3000, function () {
	                        	$("#registerBtn").remove();
	                        });
	                    }
	                });
	                } else {
	                	that.showRegisterButtonMessage("Too many authors", '#B0171F', 3000, function() {});

	                }
	            });
            });
        },

        addTestBtnListener: function() {
            var that = this;
            $(document).on('click', '#testBtn', function () {
                that.reconstructDocument(30);
            });
        },

        // enable mouse events for the button and change appearance to enabled
        enableSaveButton: function() {
            $('.js-collaborative-btn').removeClass('is-disabled');
            $('#saveBtn').removeClass('jfk-button-disabled');
            $('#saveBtn').attr('aria-disabled', 'false');
        },

        // disable mouse events for the button and change appearance to disabled
        disableSaveButton: function() {
            $('.js-collaborative-btn').addClass('is-disabled');
            $('#saveBtn').addClass('jfk-button-disabled');
            $('#saveBtn').attr('aria-disabled', 'true');
        },

        // changes the save button to `color', changes the text to `message',
        // for `duration' miliseconds before reverting
        showSaveButtonMessage: function(message, color, duration) {
            $("#saveBtn").css('background', color);
            $("#saveBtn").html(message);

            var that = this;

            setInterval(function(){ 

                $("#saveBtn").css('background','');
                $("#saveBtn").html('Commit Revision');
            }, duration);
        },

        showRegisterButtonMessage: function(message, color, duration, completion) {
            $("#registerBtn").css('background', color);
            $("#registerBtn").html(message);

            var that = this;

            setInterval(function(){ 
            	$("#registerBtn").css('background','');
            	completion();
            }, duration);
        },

        // extract the document id from the document url
        getDocId: function() {
    			docId = location.href.match("((https?:\/\/)?docs\.google\.com\/(.*?\/)*document\/d\/(.*?))\/edit")[4];
        },

        // retrieves the previously injected token
        getToken: function() {
          return $('body').attr('tok');
        },

        getEmailForId: function(authorID, completion) {
            var that = this;

            $.ajax({
                type: 'GET',
                url: serverURL + "/author/" + authorID,
                dataType: 'html',

                error: function(request, e) {
                    console.log("Something went wrong");
                },

                success: function(data) {
                    completion(data);
                },

                async:false
            });
        },

        // thresh should be in minutes
        reconstructDocument: function(thresh) {
            // convert from minutes to milliseconds
            thresh = thresh * 60000;

            var that = this;
            var startRev = that.getRevsReconstruct();
            // given an author id and an end revision,
            // send a commit for that author starting from the most recent
            // revision for them on the server the up through `last_rev'
            var sendCommit = function(a_id, start_idx, last_rev) {
                that.getEmailForId(a_id, function(email) {
                    if (email.length == 0) {
                        throw "Author not found on server"
                    }


                    that.getChangelog(start_idx, last_rev, function(data, chunck) {
                        that.parseChangelog(data, "", last_rev, email, chunck);
                    });


                    // that.getRevs(email, function(startIdx, body) {
                    //     that.getChangelog(startIdx, last_rev, function(data, chunck) {
                    //         that.parseChangelog(data, body, last_rev, email, chunck);
                    //     });
                    // });
                });
            }

            that.getHistory(that.buildHistoryUrl(), 1, function(revs) {

                that.getChangelog(startRev, revs - 1, function(log, chunck) {
                    var author_sessions = {};
                    var author_last_log = {};

                    var author_last_commited_rev = {};
                    for (var i = 0; i < log.length; i++) {
                        var rev_num = i + startRev;
                        var timestamp = log[i][1];
                        var a_id = log[i][2];
                        var last_author_rev = 0;
                        if (author_last_log.hasOwnProperty(a_id)) {
                            last_author_rev = author_last_log[a_id];
                        }

                        if (!author_last_commited_rev.hasOwnProperty(a_id)) {
                            author_last_commited_rev[a_id] = startRev;
                        }



                        if (timestamp > last_author_rev) { //check that this is not a change that we've already taken care of TODO: this is wrong! we are comparing timestamp with index
                            author_last_log[a_id] = rev_num;
                            // if we're currently tracking a session for the
                            // author and the time since their last update has
                            // crossed the threshold, act as though they commited
                            // after their last revision

                            var next_rev_exists = false; //if this is the last activity by the autor, we should also commit
                            for (var j = i + 1; j < log.length; j++) { //do a lookahead to see if a commit should be sent  (i.e., if after this session the author will become idle for >threshold)
                                var next_timestamp = log[j][1];
                                var next_a_id = log[j][2];

                                if (a_id == next_a_id) { //same author
                                    next_rev_exists = true;
                                    if (next_timestamp - timestamp > thresh) { //has been idle for a while, commit revision
                                        sendCommit(a_id, author_last_commited_rev[a_id], author_last_log[a_id]+1);
                                        author_last_commited_rev[a_id] = author_last_log[a_id];

                                    }
                                    // else { //same author, but still active
                                    //     timestamp = log[j][1];
                                    //     a_id = log[j][2];
                                    //     author_last_log[a_id] = j;
                                    // }
                                    break;
                                }
                            }
                            if (!next_rev_exists) //this is the last revision by this author. Commit it!
                            {
                                sendCommit(a_id, author_last_commited_rev[a_id], rev_num+1);
                                author_last_commited_rev[a_id] = rev_num;
                            }

                        }
                    }

                });
            });

            // that.getHistory(that.buildHistoryUrl(), 1, function(revs) {
            //     that.getChangelog(1, revs - 1, function(log, chunck) {
            //         var author_sessions = {};
            //         var author_last_log = {};
            //
            //         for (var i = 0; i < log.length; i++) {
            //             var timestamp = log[i][1];
            //             var a_id = log[i][2];
            //
            //             // if we're currently tracking a session for the
            //             // author and the time since their last update has
            //             // crossed the threshold, act as though they commited
            //             // after their last revision
            //             if (author_sessions.hasOwnProperty(a_id)
            //                 && (timestamp - author_sessions[a_id] > thresh))
            //             {
            //
            //                 sendCommit(a_id, author_last_log[a_id]); //commit revisions up until previous edit
            //
            //                 // update the session we were tracking
            //                 author_sessions[a_id] = timestamp;
            //                 author_last_log[a_id] = i;
            //             }
            //             // otherwise, update their session
            //             else {
            //                 author_sessions[a_id] = timestamp;
            //                 author_last_log[a_id] = i;
            //             }
            //         }
            //
            //         // for any authors with remaning open sessions, send commits
            //         for (var a_id in author_sessions) {
            //             if (author_sessions.hasOwnProperty(a_id)) {
            //                 sendCommit(a_id, log.length + 1);
            //             }
            //         }
            //     });
            // });
        },

        // find out how many revisions for the document are already on the server
        getRevs: function(trigger_author, completion) {
            var that = this;

            $.ajax({
                type: 'GET',
                url: serverURL + "/create/" + docId + "/" + trigger_author,
                dataType: 'html',

                error: function(request, e) {
                    console.log("Something went wrong");
                },

                success: function(data) {
                    data = JSON.parse(data);

                    revStartIndex = data["nextIdx"];
                    savedBody = data["text"];
					
                    completion(data["nextIdx"], data["text"]);
                },

                async:false
            });
        },

        // find out how many revisions for the document are already on the server
        getRevsReconstruct: function() {
            var that = this;
            var revStartIndex = 1;
            $.ajax({
                type: 'GET',
                url: serverURL + "/reconstruct/" + docId,
                dataType: 'html',

                error: function(request, e) {
                    console.log("Something went wrong");
                },

                success: function(data) {
                    data = JSON.parse(data);

                    revStartIndex = data["nextIdx"];

                    // completion(data["nextIdx"], data["text"]);
                },

                async:false
            });

            return revStartIndex;
        },

        buildHistoryUrl: function() {
            var token = this.getToken();

            // build the url from the docID and the token
            var base = location.href.match("((https?:\/\/)?docs\.google\.com\/(.*?\/)*document\/d\/(.*?))\/edit")[1];
            var historyUrl = base + "/revisions/history?id=" + docId + "&token=" + token + "&start=1&end=-1&zoom_level=0";

            return historyUrl;
        },

        // test is true if we're just checking to see if the user has edit access
        // false if we actually want to get the revisions
        getHistory: function(historyUrl, attempt, completion) {
            var that = this;

            // get the history json file and parse it if succesful
            $.ajax({
                type: 'GET',
                url: historyUrl,
                dataType: 'html',

                error: function(request, error) {
                    // for some reason, the URL with /d/ in it fails about half of the time and we 
                    // need to run a second attempt with /u/1/d/. If we've already tried both,
                    // then something actually went wrong.
                    if (attempt != 1) {
                        console.log("Something went wrong.");
                    }
                    else if(request.status === 400) {
                        that.getHistory(historyUrl.replace('/d/', '/u/1/d/'), 2, completion);
                    }
                },

                success: function(data) {
                    that.parseHistory(jQuery.parseJSON(data.substring(4)), completion);  
                },

                async:false
            });
        },

        parseHistory: function(raw, completion) {
            // TODO: Check if this has a comma in it when numRevisions > 1000
            // total number of document revisions
            numRevisions = raw[raw.length - 1][raw[raw.length - 1].length - 1][3];

            // if there are no new revs, alert user through the button
            if (numRevisions <= revStartIndex) {
                this.showSaveButtonMessage('No changes to commit!', '#B0171F', 3000);
                return;
            }

            raw = raw[2];

            // store the author name and colors in the authors dict, 
            // indexed by the author id
            for(var i = 0; i < raw.length; i++) {
                var authorId = raw[i][1][0][4];
                authors[authorId] = {name: raw[i][1][0][2], color: raw[i][1][0][3]};
            }

            // once the history is parsed, execute completion closure
            completion(numRevisions);
        },

        getChangelog: function(revStart, revEnd, completion) {
            if(revStart == revEnd) {
                return;
            }
			console.log('rev start');
			console.log(revStart);
			
			console.log('rev end');
			console.log(revEnd);
            var that = this;

            var token = this.getToken();

            // build the url from the docId, token, and total number of revisions
            var base = location.href.match(/^(https:\/\/docs\.google\.com.*?\/document\/d\/)/)[1];
            var url = base + docId + "/revisions/load?id=" + docId + "&start=" + revStart + "&end=" + revEnd + "&token=" + token;

            // get the changelog json file and parse it if succesful
            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'html',

                error: function(request, error) {
                    console.log("Something went wrong");
                },

                success: function(data) {
					//console.log('chuncked json');
					//console.log(jQuery.parseJSON(data.substring(4))["chunkedSnapshot"]);
                    completion(jQuery.parseJSON(data.substring(4))["changelog"], jQuery.parseJSON(data.substring(4))["chunkedSnapshot"]);
                },

                async:false
            });
        },

        getChangelogWithPrev: function(revStart, revEnd, completion) {
            if(revStart == revEnd) {
                return;
            }

            var that = this;

            var token = this.getToken();

            // build the url from the docId, token, and total number of revisions
            var base = location.href.match(/^(https:\/\/docs\.google\.com.*?\/document\/d\/)/)[1];
            var url = base + docId + "/revisions/load?id=" + docId + "&start=" + revStart + "&end=" + revEnd + "&token=" + token;

            // get the changelog json file and parse it if succesful
            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'html',

                error: function(request, error) {
                    console.log("Something went wrong");
                },

                success: function(data) {
                    completion(jQuery.parseJSON(data.substring(4))["changelog"], jQuery.parseJSON(data.substring(4))["chunkedSnapshot"]);
                },

                async:false
            });
        },		

        // builds a list of revisions from the changelog
        parseChangelog: function(log, body, revEnd, trigger_author, chuncked) {
            // keep track of all the authors who contributed to the revision
            var authorIds = new Set();

            // map from author id to list of edit intervals
            var edit_intervals = {};
            edit_intervals['dummy'] = []
            // text of the previous revision
            var prevText = body;
			prevText = "";
			var delDict = {};
			//console.log('chuncked length');
			//console.log(chuncked.length);
            var offset = 0;
			for (var i = 0; i < chuncked.length; i++) {
				for (var j = 0; j<chuncked[i].length;j++)
				{
					//console.log('in chuncked constructions');
					//console.log(chuncked[i][j]);
					var res = this.construct(chuncked[i][j],prevText,offset, delDict, edit_intervals, 'dummy');
					prevText = res[0];
                    delDict = res[2];
				}
			}
			// console.log("text from chuncked")
			// console.log(prevText)

            // offset = 0;
            edit_intervals = {};
            for (var i = 0; i < log.length; i++) {
                var a_id = log[i][2]

                authorIds.add(a_id);

                // if author hasn't been seen before,
                // create an empty list of edit intervals
                if (!edit_intervals.hasOwnProperty(a_id)) {
                    edit_intervals[a_id] = [];
                }

                var result = this.construct(log[i][0], prevText, offset, delDict, edit_intervals,a_id);
                prevText = result[0];
                delDict = result[2];
                // Array.prototype.push.apply(edit_intervals[a_id], result[1]);
                edit_intervals = result[1];
            }

            // combine intervals
            var merged_intervals = {};
            var that = this;

            $.each(edit_intervals, function(idx, value) {
                merged_intervals[idx] = that.combine_intervals(value);
            })

            // send revisions to the server
            this.saveRevision(prevText, trigger_author, revEnd, Array.from(authorIds), merged_intervals);
        },

        // uses the previous text and the current revision command to construct
        // the new document text
        construct: function(command, prev, offset, delDict, edit_intervals, authorId) {
			// var offset = 0;
            var type = command.ty;
            // var edit_intervals = [];
			var text_with_suggestions = "";

            // console.log(delDict);
			//console.log("prev");
			//console.log(prev);
			
			
            // insert string
            if (type === 'is') {
				// console.log(command);
				// console.log(prev);
                var insertBeginIdx = command.ibi;
                var insertString = command.s;
                var endIdx = insertBeginIdx+insertString.length-1;


                prev = prev.slice(0, insertBeginIdx - 1) + insertString + prev.slice(insertBeginIdx - 1, prev.length);
                delDict = this.update_dict_indices(delDict,insertBeginIdx,insertString.length, false);
                edit_intervals = this.update_edit_indices(edit_intervals, insertBeginIdx-1, insertString.length, false);
                edit_intervals[authorId].push([insertBeginIdx - 1, insertBeginIdx + insertString.length - 1]);
                offset = offset + insertString.length;

            } 
			
			else if (type === 'iss') {
				// console.log(command);
				// console.log(prev);
                var insertBeginIdx = command.ibi;
                var insertString = command.s;
				

				//console.log('in iss');
				//console.log(insertString);
				//addDict[insertBeginIdx] = insertString

                prev = prev.slice(0, insertBeginIdx - 1) + insertString + prev.slice(insertBeginIdx - 1, prev.length);
                delDict = this.update_dict_indices(delDict,insertBeginIdx,insertString.length, false);
                edit_intervals = this.update_edit_indices(edit_intervals, insertBeginIdx-1, insertString.length, false);
                edit_intervals[authorId].push([insertBeginIdx - 1, insertBeginIdx + insertString.length - 1]);
                offset = offset + insertString.length;
            }
            // delete string
            else if (type === "ds") {
				// console.log(command);
				// console.log(prev);
                var deleteStartIdx = command.si;
                var deleteEndIdx = command.ei;


                prev = prev.slice(0, deleteStartIdx - 1) + prev.slice(deleteEndIdx, prev.length);

                // offset = offset - (deleteEndIdx-deleteStartIdx+1);
                delDict = this.update_dict_indices(delDict,deleteStartIdx,-(deleteEndIdx-deleteStartIdx+1), true);
                edit_intervals = this.update_edit_indices(edit_intervals, deleteStartIdx-1, -(deleteEndIdx-deleteStartIdx+1), false);
                edit_intervals[authorId].push([deleteStartIdx - 1, deleteEndIdx - 1]);
                offset = offset -(deleteEndIdx-deleteStartIdx+1);
            }
            else if (type === "dss") { //deleting suggested text, don't need to save it!
				// console.log(command);
				//  console.log(prev);
                var deleteStartIdx = command.si;
                var deleteEndIdx = command.ei;


                prev = prev.slice(0, deleteStartIdx - 1) + prev.slice(deleteEndIdx, prev.length);

                // offset = offset - (deleteEndIdx-deleteStartIdx+1);
                delDict = this.update_dict_indices(delDict,deleteStartIdx,-(deleteEndIdx-deleteStartIdx+1), false);
                edit_intervals = this.update_edit_indices(edit_intervals, deleteStartIdx-1, -(deleteEndIdx-deleteStartIdx+1), false);
                edit_intervals[authorId].push([deleteStartIdx - 1, deleteEndIdx - 1]);
                offset = offset -(deleteEndIdx-deleteStartIdx+1);
            }

            else if (type == 'msfd') { //suggesting to delete "committed" text. Need to remember what was there for retrieval
                // console.log(command);
                // console.log(prev);
                var deleteStartIdx = command.si;
                var deleteEndIdx = command.ei;
                var deletedStr = '';
                var deletedContent = prev.slice(deleteStartIdx-1,deleteEndIdx);
                for (var i = 0; i < deleteEndIdx - deleteStartIdx + 1; i++) //replace deleted text with spaces, so indices are maintained.
                {
                    var key = deleteStartIdx+i;
                    if (!(key in delDict)) {
                        delDict[deleteStartIdx+i]=deletedContent[i]; //keep dict of deleted text, character by character, so we don't have to worry about partial words being deleted.
                    }
                    deletedStr = deletedStr+' ';
                }

                edit_intervals[authorId].push([deleteStartIdx - 1, deleteEndIdx - 1]);
                prev = prev.slice(0, deleteStartIdx - 1) +deletedStr+ prev.slice(deleteEndIdx, prev.length);

            }
			//restore suggested deleted content
			else if (type == "usfd") {
				// console.log(command);
				// console.log(prev);
                // console.log(offset);
                var deleteStartIdx = command.si;
                var deleteEndIdx = command.ei;

                var idxWithOffset;
                for (var i = 0;i<deleteEndIdx-deleteStartIdx+1;i++) { //restore suggested deleted text that was brought back to life
                    idxWithOffset = i+deleteStartIdx;
                    if (idxWithOffset in delDict){
                        prev = prev.slice(0, idxWithOffset - 1 ) + delDict[idxWithOffset] + prev.slice(idxWithOffset , prev.length);
                        edit_intervals[authorId].push([deleteStartIdx - 1, deleteEndIdx - 1]);
                        delete delDict[idxWithOffset];
                    }
                }

			}
            // restore revision: not quite handled yet.
            //else if (type == "rvrt") {
				// console.log(command);
				//console.log(prev);
              //  var snapshot = command.snapshot;
               // prev = "";

                //for(var i = 0; i < snapshot.length; i++) {
                  //  var result = this.construct(snapshot[i], prev, offset, delDict);
                   // Array.prototype.push.apply(edit_intervals, result[1]);
                    //prev = result[0];
                //}
            //}
            // multi – loop through the individual revisions in the command
            else if (type === 'mlti') {
				// console.log(command);
				//console.log(prev);
                for (var i = 0; i < command.mts.length; i++) {
                    var result = this.construct(command.mts[i], prev, offset, delDict, edit_intervals, authorId);
                    delDict = result[2];
                    // Array.prototype.push.apply(edit_intervals, result[1]);
                    prev = result[0];
                    offset = result[3];
                    edit_intervals = result[1];
                }
            }

            // note: ignores "as" (alter string?) commands that change non-text 
            // attributes like font color, font size change
            // 
            // console.log('delDict after index update');
            // console.log(delDict);
            return [prev, edit_intervals, delDict];
        },

        update_dict_indices:function (dict, loc, offset, deletePermanent) {
            // if (deletePermanent) {
            //     console.log('really delete');
            // }
            var newDict = {};
            for (var key in dict) {
                var keyInt = parseInt(key);
                if (keyInt>=loc) {
                    if ((keyInt!=loc) | (!deletePermanent)) {
                        newDict[keyInt+offset]=dict[key];
                    }

                }
                else {
                    newDict[key]=dict[key];
                }
            }
            return newDict;

        },

        update_edit_indices:function (edit_dict, loc, offset, deletePermanent) {
            // if (deletePermanent) {
            //     console.log('really delete');
            // }
            //var new_intervals = ;
            var newEditIntervals = {};
            for (var a_id in edit_dict) {
                newEditIntervals[a_id] = [];
                var edit_list = edit_dict[a_id];
                for (var i = 0; i < edit_list.length; i++) {
                    var start_idx = edit_list[i][0];

                    if (start_idx >= loc) {
                        if ((start_idx != loc) | (!deletePermanent)) {
                            newEditIntervals[a_id].push([edit_list[i][0] + offset,edit_list[i][1] + offset]);
                        }

                    }
                    else {
                        newEditIntervals[a_id].push(edit_list[i]);
                    }

                }
            }
            return newEditIntervals;

        },


        // Algorithm from http://www.geeksforgeeks.org/merging-intervals/
        // Takes a list of intervals and returns sorted, merged intervals
        // Merges adjacent intervals (e.g., [28,28] and [29,30] will be 
        // be combined into [28,30])
        combine_intervals: function(intervals) {
            // sort intervals by start index
            intervals.sort(function(fst, snd) {
                return fst[0] - snd[0]
            });

            var stack = [];
            stack.push(intervals[0]);

            for (var i = 1; i < intervals.length; i++) {
                var top = stack[stack.length - 1];

                // -1 allows merging of adjacent intervals
                if (top[1] < intervals[i][0] - 1) {
                    stack.push(intervals[i]);
                } else if (top[1] < intervals[i][1]) {
                    stack[stack.length - 1][1] = intervals[i][1];
                }
            }

            return stack;
        },

        saveRevision: function(text, trigger_author, revEnd, authorIds, edit_intervals) {
            var that = this;

            var json = JSON.stringify({
                "docId": docId,
                "author_info": authors,
                "author_ids": authorIds,
                "num_revs": revEnd,
                "text": text,
                "trigger_author": trigger_author,
                "event_of_trigger": "save",
                "edit_intervals": edit_intervals
            });

            // send author and revision data to the heroku server
            $.ajax({
                type: 'POST',
                url: serverURL + "/save",
                data: json,
                contentType: "application/json; charset=utf-8",
                dataType: "json",

                error: function(request, error) {
                    that.showSaveButtonMessage('Save failed!', '#B0171F', 3000);
                },

                success: function(data) {
                    that.showSaveButtonMessage('Save successful!', '#8EC252', 3000);
                },

                async: false
            });
        }

	});

  collaborative.init();
}());
