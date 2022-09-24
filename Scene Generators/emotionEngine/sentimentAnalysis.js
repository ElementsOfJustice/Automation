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

var sceneData =
[
  ['dialogue', 's1_001_judge', 'Judge', 'Court is now in session for the trial of Ms. Sweetie Belle. Are the prosecution and defense ready?', 'NONE'],
  ['dialogue', 's1_002_luna', 'Luna', 'The prosecution is indeed ready, Your Honor.', 'NONE'],
  ['dialogue', 's1_003_athena', 'Athena', 'The defense is also ready, Your Honor.', 'NONE'],
  ['dialogue', 's1_004_athena', 'Athena', 'Awed at first And there’s Prosecutor Luna again. It’s strange… Even though I now know her role in all this, I still can’t escape this feeling of intimidation.', 'NONE'],
  ['dialogue', 's1_005_athena', 'Athena', 'I guess it comes with being one of Equestria’s rulers. ', 'NONE'],
  ['dialogue', 's1_006_athena', 'Athena', 'Somewhat worried But like Twilight, I’m also worried about what she has planned. ', 'NONE'],
  ['dialogue', 's1_007_athena', 'Athena', 'I know we’re on the same side, but that doesn’t mean I know how exactly she intends to set Sweetie Belle free.', 'NONE'],
  ['dialogue', 's1_008_judge', 'Judge', 'Grave Yesterday, I expressed sorrow at the fact that more children were involved with this case. ', 'NONE'],
  ['dialogue', 's1_009_judge', 'Judge', 'To think we must add yet another to it… The day exacts a heavy toll on us all.', 'NONE'],
  ['dialogue', 's1_010_judge', 'Judge', 'Nevertheless, I will reiterate my position as a neutral judge presiding over this trial. ', 'NONE'],
  ['dialogue', 's1_011_judge', 'Judge', 'Prosecutor Luna, you may begin with your opening statement, if you would please. ', 'NONE'],
  ['dialogue', 's1_012_luna', 'Luna', 'Of course, Your Honor. I would like to first begin by recontextualizing this entire case. ', 'NONE'],
  ['dialogue', 's1_013_luna', 'Luna', 'Yesterday’s trial, thanks in large part to the efforts of the defense, revealed several key facts. One was that, on the night of Royal Order’s murder…', 'NONE'],
  ['dialogue', 's1_014_luna', 'Luna', 'There was not just one victim, but in fact, two—the original Royal Order and his clone. ', 'NONE'],
  ['dialogue', 's1_015_luna', 'Luna', 'The defense postulated that one of them was killed at a clearing in the middle of the Everfree Forest, and was subsequently brought to the bridge. ', 'NONE'],
  ['dialogue', 's1_016_luna', 'Luna', 'The second one was killed at the Nightmare Moon statue, before being eaten by timberwolves.', 'NONE'],
  ['dialogue', 's1_017_luna', 'Luna', 'This trial will provide us insight to the truth behind that second death. ', 'NONE'],
  ['dialogue', 's1_018_luna', 'Luna', 'The blood test that Ms. Sonata and Detective Private Eye submitted yesterday proved the statue area bore two ponies’ blood. One was Royal Order. But the other…', 'NONE'],
  ['dialogue', 's1_019_luna', 'Luna', 'Was the accused—Ms. Sweetie Belle. The prosecution believes she was involved in this second Royal Order’s death. Her blood, found at the scene, confirms this. ', 'NONE'],
  ['dialogue', 's1_020_athena', 'Athena', 'But it doesn’t confirm that she actually killed him, though—only that she was there at the scene when he died. That’s what we learned at the Detention Center. ', 'NONE'],
  ['dialogue', 's1_021_athena', 'Athena', 'Where is Luna going with this? If this was all she had, surely she wouldn’t call for this trial if she believed Sweetie was innocent. What’s forcing her hoof?', 'NONE'],
  ['dialogue', 's1_022_judge', 'Judge', 'I see… Prosecutor Luna, do you mean to tell the court that you believe the defendant, Ms. Sweetie Belle, murdered Royal Order?', 'NONE'],
  ['dialogue', 's1_023_luna', 'Luna', 'Not quite, Your Honor.', 'NONE'],
  ['dialogue', 's1_024_athena', 'Athena', '?!', 'NONE'],
  ['dialogue', 's1_025_twilight', 'Twilight', '?!', 'NONE'],
  ['dialogue', 's1_026_judge', 'Judge', 'Surprised N-not quite? What do you mean?', 'NONE'],
  ['dialogue', 's1_027_luna', 'Luna', 'To explain that, Your Honor, the prosecution would like to have Private Eye briefly come to the stand. ', 'NONE'],
  ['dialogue', 's1_028_athena', 'Athena', 'Private Eye? Why does she need him?', 'NONE'],
  ['dialogue', 's1_029_judge', 'Judge', 'Very well. The court grants this request.', 'NONE'],
  ['dialogue', 's1_030_luna', 'Luna', 'Detective Eye, please explain to the court how Royal Order was killed at the statue. ', 'NONE'],
  ['dialogue', 's1_031_private eye', 'Private Eye', 'At once, Your Highness. ', 'NONE'],
  ['dialogue', 's1_032_private eye', 'Private Eye', 'While there are still some facts left shrouded in mystery, our current theory attempts to explain the events of that night, at that particular scene.', 'NONE'],
  ['dialogue', 's1_033_private eye', 'Private Eye', 'The victim and defendant were at the statue. Some sort of altercation must have occurred, after which Ms. Sweetie Belle was forced to act.', 'NONE'],
  ['dialogue', 's1_034_judge', 'Judge', 'Forced to act?', 'NONE'],
  ['dialogue', 's1_035_private eye', 'Private Eye', 'We believe that Royal Order attempted to attack Ms. Sweetie Belle. ', 'NONE'],
  ['dialogue', 's1_036_private eye', 'Private Eye', 'However, she must have done something in response, which would have led to how he died—impalement at the statue’s base.', 'NONE'],
  ['dialogue', 's1_037_judge', 'Judge', 'D-do you mean to say that the defendant pushed the victim herself?', 'NONE'],
  ['dialogue', 's1_038_private eye', 'Private Eye', 'Not at all, My Lord. Ms. Sweetie Belle is a filly and much smaller than the victim. She would not have been able to push him on her own.', 'NONE'],
  ['dialogue', 's1_039_judge', 'Judge', 'Then… How do you propose he ended up impaled?', 'NONE'],
  ['dialogue', 's1_040_private eye', 'Private Eye', 'We believe it was because the victim was suffering from weak knees due to the effect of poison joke. ', 'NONE'],
  ['dialogue', 's1_041_private eye', 'Private Eye', 'When Royal Order attacked Ms. Sweetie Belle, she must have instinctively dove for his hooves, in an attempt to trip him. ', 'NONE'],
  ['dialogue', 's1_042_private eye', 'Private Eye', 'He would have naturally stumbled forward, resulting in impalement.', 'NONE'],
  ['dialogue', 's1_043_luna', 'Luna', 'Your Honor, it is this theory that the prosecution will pursue in today’s trial. ', 'NONE'],
  ['dialogue', 's1_044_luna', 'Luna', 'As Detective Eye has now revealed, while Ms. Sweetie Belle was indeed involved in Royal Order’s death, we do not believe she intentionally murdered him.', 'NONE'],
  ['dialogue', 's1_045_luna', 'Luna', 'Definitive Rather, we believe this to be a tragic case of an accidental killing. She DID intentionally trip him, but she did NOT mean to impale him. ', 'NONE'],
  ['dialogue', 's1_046_athena', 'Athena', 'W-WHAT?!', 'NONE'],
  ['dialogue', 's1_047_athena', 'Athena', 'Shocked P-P-Prosecutor Luna! H-how can you make that kind of claim?! That is conjecture at best! ', 'NONE'],
  ['dialogue', 's1_048_luna', 'Luna', 'Ms. Cykes, are you saying you do not believe Ms. Sweetie Belle was responsible?', 'NONE'],
  ['dialogue', 's1_049_athena', 'Athena', 'O-Of course we are! The defense argues Sweetie Belle WASN’T involved in Royal Order’s death in the slightest! Right, Sweetie Belle?', 'NONE'],
  ['dialogue', 's1_050_athena', 'Athena', 'W-What? Sweetie Belle, come on! Tell the court your side of the story!', 'NONE'],
  ['dialogue', 's1_051_twilight', 'Twilight', 'Concerned Sweetie Belle? Why aren’t you answering?', 'NONE'],
  ['dialogue', 's1_052_private eye', 'Private Eye', 'I believe I can explain that, Princess Twilight. You see, ever since yesterday evening, Ms. Sweetie Belle has decided to exercise her right to remain silent.', 'NONE'],
  ['dialogue', 's1_053_twilight', 'Twilight', 'Her right? You mean—she’s acknowledging that—', 'NONE'],
  ['dialogue', 's1_054_athena', 'Athena', 'N-no, I won’t accept that! It’s not true! I KNOW it isn’t!', 'NONE'],
  ['dialogue', 's1_055_luna', 'Luna', 'As resolved as you are, you will need more than mere protests, Golden Pixie.', 'NONE'],
  ['dialogue', 's1_056_athena', 'Athena', 'Annoyed Ooh, boy. I totally missed hearing THAT! ', 'NONE'],
  ['dialogue', 's1_057_athena', 'Athena', 'So, silence again, huh. Is this another thing Luna set up? …Or maybe… someone else?', 'NONE'],
  ['dialogue', 's1_058_judge', 'Judge', 'The defense does bring up a fair point, Prosecutor Luna. Though it is an intriguing theory, it is still just that.', 'NONE'],
  ['dialogue', 's1_059_luna', 'Luna', 'We are aware of that, Your Honor. That is why, in order to substantiate this theory, the prosecution would now like to call two witnesses to the stand.', 'NONE'],
  ['dialogue', 's1_060_luna', 'Luna', 'Witnesses who claim to have seen this unfortunate accident occur right before their very eyes. ', 'NONE'],
  ['dialogue', 's1_061_athena', 'Athena', 'T-Two witnesses? Again?!', 'NONE'],
  ['dialogue', 's1_062_athena', 'Athena', 'Gah! We’ve just started, but already I’ve been blindsided! Rrgh…', 'NONE'],
  ['dialogue', 's1_063_twilight', 'Twilight', 'Reassuring Don’t let it get to you, Athena! ', 'NONE'],
  ['dialogue', 's1_064_athena', 'Athena', 'Huh?', 'NONE'],
  ['dialogue', 's1_065_twilight', 'Twilight', 'Remember what you said earlier. Princess Luna IS on our side. ', 'NONE'],
  ['dialogue', 's1_066_twilight', 'Twilight', 'If she’s making this particular accusation, it’s because she expects us to be able to show it doesn’t hold up to scrutiny. ', 'NONE'],
  ['dialogue', 's1_067_twilight', 'Twilight', 'That means we just have to steady ourselves and keep pressing on.', 'NONE'],
  ['dialogue', 's1_068_athena', 'Athena', 'R-right! ', 'NONE'],
  ['dialogue', 's1_069_judge', 'Judge', 'Very well, then. Detective, you may leave the stand. The court will now hear from the prosecution’s two witnesses. ', 'NONE']
]

const sceneFile = require('./sceneFile.array')
const replace = require('replace-in-file');

function markupLine(dictionaryName, text, posePlacement, type) {

data = fs.readFileSync('Scene Generators/emotionEngine/databases/' + type + '/' + dictionaryName + '.txt', 'utf-8')

  var allTxt = data.toString()
  dictionary = allTxt.split("\r\n");

  var pose = matchEmotion(dictionary, text)

  console.log(dictionaryName, text, pose)

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