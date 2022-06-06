/*
EMOTION ENGINE
Predictive emotion engine based on pose usage for previous characters in Episode 2-3 onwards.
This code rates the input string with a polar sentimentality score and then fetches similarly-rated
lines from previous episodes within the tolerance limit. It then iterates through all the matched
lines and selects the one with the closest Jaccard distance and returns the pose used.

Less expressive characters need a tight tolerance while more expressive characters need
a higher tolerance.
*/

const jaccardDistance = require('@extra-string/jaccard-distance');
const Sentiment = require('sentiment');

var sentiment = new Sentiment();
var chkStr = "Jared is a writer. And I love him."
var tolerance = 1;

const dictionary = require('./databases/phoenixDatabase.js')

var tmpJaccard = new Map();

for (let [key, value] of dictionary) {

  var chkStrScore = sentiment.analyze(chkStr).score
  var baseScore = sentiment.analyze(`${key}`).score

  //console.log(sentiment.analyze(`${key}`).score +" "+ sentiment.analyze(chkStr).score + " " + jaccardDistance(`${key}`, chkStr) + " " + `${key}`);
  
  if ((baseScore >= chkStrScore - tolerance) && (baseScore <= chkStrScore + tolerance)) {
    tmpJaccard.set(jaccardDistance(`${key}`, chkStr), `${value}`)
  }
}

  //console.log(Math.min(... tmpJaccard.keys()))
  console.log(chkStr + " should have the pose " + tmpJaccard.get(Math.min(... tmpJaccard.keys())) + ".")