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
var chkStr = "Some people just want to watch the world burn."
var tolerance = 1;
var dictionary = [];

fs.readFile('./emotionEngine/databases/APOLLO_JUSTICE_Dictionary.txt', function read(err, data) {
  if (err) {
      throw err;
  }

  var allTxt = data.toString()
  dictionary = allTxt.split("\r\n");

  calculateAnswer(dictionary)

});

function calculateAnswer(dictionary) { //the worst function name fucking ever

var tmpJaccard = new Map();

for (var i = 0; i < dictionary.length; i++) {

  var chkStrScore = sentiment.analyze(chkStr).score
  var baseScore = sentiment.analyze(dictionary[i].split("|||")[0]).score

  console.log(sentiment.analyze(dictionary[i].split("|||")[0]).score +" "+ sentiment.analyze(chkStr).score + " " + jaccardDistance(dictionary[i].split("|||")[0], chkStr) + " " + dictionary[i].split("|||")[0]);
  
  if ((baseScore >= chkStrScore - tolerance) && (baseScore <= chkStrScore + tolerance)) {
    tmpJaccard.set(jaccardDistance(dictionary[i].split("|||")[0], chkStr), dictionary[i].split("|||")[1])
  }
}

  //console.log(Math.min(... tmpJaccard.keys()))
  console.log(chkStr + " should have the pose " + tmpJaccard.get(Math.min(... tmpJaccard.keys())) + ".")

}