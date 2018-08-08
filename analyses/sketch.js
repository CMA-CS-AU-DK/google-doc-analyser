/*jshint esversion: 6 */
'use strict';
const {
    performance
  } = require('perf_hooks');

const analyse = require("./analyse.js");
//const file = "../data/GoogleTestDocument.json"; //4ms
//const file = "../data/ReworkedFramework.json"; //1.14 minute
const file = "../data/Thesislicious.json"; //14 minutes
var analyser = analyse.load(file);

var t0 = performance.now();


var deletes = analyser.getDeleteRevisions(true, 4)
console.log(deletes.length);
var t1 = performance.now();
console.log("Call to getDeleteRevisions took " + (t1 - t0) + " milliseconds. (or " + (t1 - t0)/1000/60 + "minutes)")