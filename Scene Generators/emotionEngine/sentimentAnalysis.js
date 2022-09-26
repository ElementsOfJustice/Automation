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
- Debug mode boolean to print the currently-commented-out code.
- I am a fucking moron script kiddie who cannot figure out how to import shit kek
- GOUGE OUT transitional poses as pose suggestion
- Fine-tune pose suggestions

******************************************************************************/

const jaccardDistance = require('@extra-string/jaccard-distance');
const Sentiment = require('sentiment');
var fs = require("fs");

var sentiment = new Sentiment();
var tolerance = 2;
var dictionary = [];

const replace = require('replace-in-file');
// GET CONNOR TO IMPORT IT FFS

var sceneData = 
[
['dialogue', 's1_001_judge', 'Judge', 'Court is back in session for the trial of Ms. Sweetie Belle. I trust that the defendant is ready to testify?', 'NONE'],
['dialogue', 's1_002_sweetie belle', 'Sweetie Belle', 'Yes, Your Honor.', 'NONE'],
['dialogue', 's1_003_judge', 'Judge', 'Before we begin, I would like to ask if either the prosecution or defense have any final objections to the matter. Prosecutor Luna, what say you?', 'NONE'],
['dialogue', 's1_004_athena', 'Athena', '(Having Sweetie Belle testify must have thrown her entire plan for a loop.)', 'NONE'],
['dialogue', 's1_005_judge', 'Judge', 'Prosecutor Luna? You… appear somewhat hesitant.', 'NONE'],
['dialogue', 's1_006_luna', 'Luna', '… Hmm. Those eyes of yours have not dwindled with age, Your Honor. ', 'NONE'],
['dialogue', 's1_007_luna', 'Luna', 'To be perfectly frank, I… am a bit hesitant. I cannot foresee where exactly this testimony will lead us. ', 'NONE'],
['dialogue', 's1_008_athena', 'Athena', 'Prosecutor Luna?', 'NONE'],
['dialogue', 's1_009_luna', 'Luna', 'Yes, Ms. Cykes?', 'NONE'],
['dialogue', 's1_010_athena', 'Athena', 'Do you remember what you told me last night? ', 'NONE'],
['dialogue', 's1_011_luna', 'Luna', 'But, still, I believe you must, if nothing else, trust that, in the end, the truth WILL be found. Never mind what the Lawkeeper has said.', 'NONE'],
['dialogue', 's1_012_athena', 'Athena', 'I know, but… it’s hard, sometimes. Like stumbling around in the dark hoping you’ll find a light switch. Except you don’t know if the room you’re in even has one. ', 'NONE'],
['dialogue', 's1_013_luna', 'Luna', 'Trust is a leap of faith, Athena. That’s all it ever is.', 'NONE'],
['dialogue', 's1_014_luna', 'Luna', '… I do, yes. ', 'NONE'],
['dialogue', 's1_015_athena', 'Athena', 'You trusted me back then. Asked me to find the truth, in any way that I can. Please. Trust me now.', 'NONE'],
['dialogue', 's1_016_luna', 'Luna', '… I shall, then, Ms. Cykes.', 'NONE'],
['dialogue', 's1_017_athena', 'Athena', '(I’d ask you to trust me as well, Sweetie Belle… But I somehow doubt you will.)', 'NONE'],
['dialogue', 's1_018_luna', 'Luna', 'Your Honor, the prosecution is ready to hear the witness’s testimony.', 'NONE'],
['dialogue', 's1_019_athena', 'Athena', 'As is the defense.', 'NONE'],
['dialogue', 's1_020_judge', 'Judge', 'Very well. Witness, you will testify to the court as to your movements on the night of the murder.', 'NONE'],
['dialogue', 's1_021_sweetie belle', 'Sweetie Belle', '…', 'NONE'],
['dialogue', 's1_022_judge', 'Judge', 'My word! I knew those animals were brutes, but I never imagined they’d go so far as to attack a random filly! ', 'NONE'],
['dialogue', 's1_023_judge', 'Judge', 'To think there could be a place so full of danger in this world, let alone one so close to somewhere as idyllic as Ponyville!', 'NONE'],
['dialogue', 's1_024_athena', 'Athena', '(Hmm? What’s up with Prosecutor Luna?)', 'NONE'],
['dialogue', 's1_025_luna', 'Luna', 'It… is indeed fortunate that the bell did not toll for thee, young one.', 'NONE'],
['dialogue', 's1_026_athena', 'Athena', '… ', 'NONE'],
['dialogue', 's1_027_judge', 'Judge', 'In any case, I believe we may now begin the cross-examination. Defense, are you ready?', 'NONE'],
['dialogue', 's1_028_athena', 'Athena', 'You bet, Your Honor!', 'NONE']
];

function markupLine(dictionaryName, text, posePlacement, type) {

data = fs.readFileSync('Scene Generators/emotionEngine/databases/' + type + '/' + dictionaryName + '.txt', 'utf-8')

  var allTxt = data.toString()
  dictionary = allTxt.split("\r\n");

  var pose = matchEmotion(dictionary, text)

  console.log(dictionaryName, text, pose)

  if (pose == undefined) {pose = "UNDEF"}

  writeFile(posePlacement, pose)

};

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

return tmpJaccard.get(Math.min(... tmpJaccard.keys()))

};

function writeFile(text, pose) {

 try {
    const results = replace.sync({
      files: 'C:\\Users\\Administrator\\Documents\\GitHub\\Automation\\Scene Generators\\emotionEngine\\sceneFile.array',
      from: text,
      to: pose
    });
    //console.log('Replacement results:', results);
  }
    catch (error) {
    console.error('Error occurred:', error);
  }

}

for (let i = 0; i < sceneData.length; i++) {
  if (sceneData[i][0] == "dialogue") {
    //console.log(sceneData[i][2], sceneData[i][3])
    markupLine(sceneData[i][2], sceneData[i][3], sceneData[i][4], 'COURTROOM');
  }
};