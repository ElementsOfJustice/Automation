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
var tolerance = 6;
var dictionary = [];

var sceneFile = require('./sceneFile.array')

const replace = require('replace-in-file');

function markupLine(dictionaryName, text, type) {

fs.readFile('./emotionEngine/databases/' + type + '/' + dictionaryName + '.txt', 'utf-8', function read(err, data) {
  if (err) {
    return console.log(err);
  } else {

  var allTxt = data.toString()
  dictionary = allTxt.split("\r\n");

  //matchEmotion(dictionary, text);

  var pose = matchEmotion(dictionary, text)

  if (text.includes("think")) {
    writeFile(text, "Thinking")
  } else {
    writeFile(text, pose)
  }

} } ) };

function matchEmotion(dictionary, chkStr) {

var tmpJaccard = new Map();

for (var i = 0; i < dictionary.length; i++) {

  var chkStrScore = sentiment.analyze(chkStr).score
  var baseScore = sentiment.analyze(dictionary[i].split("|||")[0]).score

  console.log(sentiment.analyze(dictionary[i].split("|||")[0]).score +" "+ sentiment.analyze(chkStr).score + " " + jaccardDistance(dictionary[i].split("|||")[0], chkStr) + " " + dictionary[i].split("|||")[0]);
  
  if ((baseScore >= chkStrScore - tolerance) && (baseScore <= chkStrScore + tolerance)) {
    tmpJaccard.set(jaccardDistance(dictionary[i].split("|||")[0], chkStr), dictionary[i].split("|||")[1])
  }
}

return tmpJaccard.get(Math.min(... tmpJaccard.keys()))

};

function writeFile(text, pose) {

 try {
    const results = replace.sync({
      files: 'C:\\Users\\Administrator\\Documents\\GitHub\\Automation\\emotionEngine\\sceneFile.array',
      from: text,
      to: pose + " || " + text,
    });
    console.log('Replacement results:', results);
  }
    catch (error) {
    console.error('Error occurred:', error);
  }

}


for (let i = 0; i < dialogueArray.length; i++) {
  markupLine(speakertagArray[i], dialogueArray[i], 'COURTROOM');
};