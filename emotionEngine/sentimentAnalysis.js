/******************************************************************************
EMOTION ENGINE
Description:
Predictive emotion engine based on pose usage for previous characters in Episode 2-3 onwards.
This code rates the input string with a polar sentimentality score and then fetches similarly-rated
lines from previous episodes within the tolerance limit. It then iterates through all the matched
lines and selects the one with the closest Jaccard distance and returns the pose used.

Less expressive characters need a tight tolerance while more expressive characters need
a higher tolerance.

Issues:
- Needs to be rewritten to integrate smoothly with existing scene generation code.
- Debug mode boolean to print the currently-commented-out code.
******************************************************************************/

const jaccardDistance = require('@extra-string/jaccard-distance');
const Sentiment = require('sentiment');
var fs = require("fs");

var sentiment = new Sentiment();
var tolerance = 1;
var dictionary = [];

var outputArray = new Array;

//Load script of your choice & specify type on l64
var sceneFile = require('./sceneFile.array')

function markupLine(dictionaryName, text, type) {

fs.readFile('./emotionEngine/databases/' + type + '/' + dictionaryName + '.txt', function read(err, data) {
  if (err) {
        
  } else {

  var allTxt = data.toString()
  dictionary = allTxt.split("\r\n");

  matchEmotion(dictionary, text)

} } ) };

function matchEmotion(dictionary, chkStr) {

var tmpJaccard = new Map();

for (var i = 0; i < dictionary.length; i++) {

  var chkStrScore = sentiment.analyze(chkStr).score
  var baseScore = sentiment.analyze(dictionary[i].split("|||")[0]).score

  //console.log(sentiment.analyze(dictionary[i].split("|||")[0]).score +" "+ sentiment.analyze(chkStr).score + " " + jaccardDistance(dictionary[i].split("|||")[0], chkStr) + " " + dictionary[i].split("|||")[0]);
  
  if ((baseScore >= chkStrScore - tolerance) && (baseScore <= chkStrScore + tolerance)) {
    tmpJaccard.set(jaccardDistance(dictionary[i].split("|||")[0], chkStr), dictionary[i].split("|||")[1])
  }
}

  //console.log(Math.min(... tmpJaccard.keys()))
  //console.log("||" + tmpJaccard.get(Math.min(... tmpJaccard.keys())) + "|| " + chkStr)
  
  fs.appendFile('./emotionEngine/emotionEngineOutput.array', "||" + tmpJaccard.get(Math.min(... tmpJaccard.keys())) + "|| " + chkStr + "\r\n", (err) => {
    if (err) {

    } else {
      
    }
  });

  //outputArray.push("||" + tmpJaccard.get(Math.min(... tmpJaccard.keys())) + "|| " + chkStr)

};

for (let i = 0; i < dialogueArray.length; i++) {
  markupLine(speakertagArray[i], dialogueArray[i], 'COURTROOM');
};

console.log(JSON.stringify(outputArray))