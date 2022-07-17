END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;
CONSONANT_PHONES = ["M", "N", "NG", "P", "B", "T", "D", "K", "G", "CH", "JH", "S", "Z", "SH", "ZH", "F", "V", "TH", "DH", "HH", "W", "R", "Y", "L"];
VOWEL_PHONES = ["IY", "UW", "IH", "UH", "EY", "OW", "AH", "EH", "AE", "ER", "AA", "AO", "AW", "AY", "OY"];

/*
Function: setup
Variables: none
Description: unlock selected layer so elements can be selected
*/
function setup() {
    fl.showIdleMessage(false);
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; // unlock layer
}

/*
Function: resetSelection
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: sets selection to the desired layer and frame
*/
function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}

function arrayContains(array, element) {
    for (var i = 0; i < array.length; i++) {
        if (element.substring(0, 2) == array[i]) { // strip the stupid dumb crappy stress number (will fix evertyhing plxzzzzzz)
            return true;
        }
    }
    return false;
}

function getKeys(input) { // get array of start times from the words or phonemes
    var arr = [];
    for (var i in input) {
        arr.push(parseFloat(i));
    }
    return arr;
}

function getStartTimes(input) {
    var arr = [];
    for (var i in input) {
        if (input[i][WORD_PHONEME_INDEX] != "") {
            arr.push(fl.getDocumentDOM().getTimeline().currentFrame + Math.round(parseFloat(i) * FRAME_RATE));
        }
    }
    return arr;

}

function getEndTimes(input) {
    var arr = [];
    for (var i in input) {
        if (input[i][WORD_PHONEME_INDEX] != "") {
            arr.push(fl.getDocumentDOM().getTimeline().currentFrame + Math.round(parseFloat(input[i][END_INDEX]) * FRAME_RATE));
        }
    }
    return arr;

}

function getLipSyncFrameArray(words, phonemes) { // helper function to compute where each syllable is in terms of frames
    // Approach 1: each word begins with a syllable, and every consonant followed by a vowel is another syllable
    var syllableFrames = [];
    var wordStartTimeArray = getKeys(words);
    var phonemeStartTimeArray = getKeys(phonemes);
    // god i hate dynamic typing so much i HATE WHEN IT CONSIDERS UNKNOWNS AS STRINGS AND I HAVE TO CALL PARSEFLOAT ON ALL OF IT I HATE IT
    for (var i = 0; i < wordStartTimeArray.length; i++) { // iterate over every word
        var endTime = parseFloat(words[wordStartTimeArray[i]][END_INDEX]);
        var index = 0, indexInInterval = 0;
        for (var phonemeStart in phonemes) {
            if (parseFloat(phonemeStart) >= parseFloat(wordStartTimeArray[i]) && parseFloat(phonemeStart) < endTime) { // phoneme is in the word interval 
                if (indexInInterval == 0) {
                    if (arrayContains(VOWEL_PHONES, phonemes[parseFloat(phonemeStart)][WORD_PHONEME_INDEX])) {
                        syllableFrames.push([Math.round(parseFloat(phonemeStart) * FRAME_RATE), Math.round(parseFloat(phonemes[phonemeStart][END_INDEX]) * FRAME_RATE)]); // if the first syllable of a word is a vowel
                    }
                    indexInInterval++;
                } else if (arrayContains(VOWEL_PHONES, phonemes[parseFloat(phonemeStart)][WORD_PHONEME_INDEX])) {
                    if (index == 0) {
                        continue; // handle edge case (beginning of voice line)
                    }
                    if (arrayContains(CONSONANT_PHONES, phonemes[phonemeStartTimeArray[index - 1]][WORD_PHONEME_INDEX])) {
                        syllableFrames.push([Math.round(parseFloat(phonemeStart) * FRAME_RATE), Math.round(parseFloat(phonemes[phonemeStart][END_INDEX]) * FRAME_RATE)]); // vowel after a consonant is a syllable yessiree (1 frame before to improve accuracy maybe?)
                    }
                }
            }
            index++;
        }
    }
    return syllableFrames;
}

function selectOrMakeKeyframe(layer, frame) {
    resetSelection(layer, frame);
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence,   ke a note of that
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe();
        resetSelection(layer, frame);
    }
}

function getEndOfWordIndex(wordEndTimeArray, frame, distance) {
    for (var i = 0; i < wordEndTimeArray.length; i++) {
        if (wordEndTimeArray[i] > frame && wordEndTimeArray[i] < frame + distance) {
            return i;
        }
    }
    return -1;
}

/* 
else if (dur < lipFlapLength && distance > lipFlapLength) { // Case 2: dur < lipFlapLength AND distance > lipFlapLength: use duration of syllable (for pauses between words)
        selectOrMakeKeyframe(layer, frame + Math.floor(dur / 2));
        fl.getDocumentDOM().setElementProperty("firstFrame", firstFrameOfLipFlap + (lipFlapLength - (Math.floor(dur / 2) + dur % 2))); // set mouth such that it ends at the end of the keyframe
        selectOrMakeKeyframe(layer, frame + dur);
*/
function makeLipFlap(firstFrameOfLipFlap, lipFlapLength, distance, layer, frame, wordStartTimes, wordEndTimes) {
    // TODO: make a lip flap such that the mouth is closed at the end of (currentFrame + dur)
    var endOfWordIndex = getEndOfWordIndex(wordEndTimes, frame, distance);
    if (endOfWordIndex != -1) {
        if (endOfWordIndex != (wordStartTimes.length - 1) && wordEndTimes[endOfWordIndex] != wordStartTimes[endOfWordIndex + 1]) {
            // If and only if there is a pause between words, use the end of the word as the distance marker
            distance = wordEndTimes[endOfWordIndex] - frame;
        }
    }
    selectOrMakeKeyframe(layer, frame);
    fl.getDocumentDOM().setElementProperty("firstFrame", firstFrameOfLipFlap); // first frame of lip flap
    fl.getDocumentDOM().setElementProperty("loop", "loop");
    if (distance <= lipFlapLength) {
        selectOrMakeKeyframe(layer, frame + Math.floor(distance / 2));
        fl.getDocumentDOM().setElementProperty("firstFrame", firstFrameOfLipFlap + (lipFlapLength - (Math.floor(distance / 2) + distance % 2))); // set mouth such that it ends at the end of the keyframe
        selectOrMakeKeyframe(layer, frame + distance);
    } else if (distance > lipFlapLength) { // distance > lipFlapLength: use distance and stillframe the largest mouth
        selectOrMakeKeyframe(layer, frame + Math.floor(lipFlapLength / 2)); // go to where the mouth is largest
        fl.getDocumentDOM().setElementProperty("loop", "single frame");
        fl.getDocumentDOM().setElementProperty("firstFrame", firstFrameOfLipFlap + Math.floor(lipFlapLength / 2) - 1);
        selectOrMakeKeyframe(layer, frame + (distance - Math.floor(lipFlapLength / 2) - lipFlapLength % 2) - 1); // go to where the mouth should begin closing
        fl.getDocumentDOM().setElementProperty("loop", "loop");
        selectOrMakeKeyframe(layer, frame + distance);
    }
    fl.getDocumentDOM().setElementProperty("firstFrame", firstFrameOfLipFlap + lipFlapLength - 1);
    fl.getDocumentDOM().setElementProperty("loop", "single frame");
}

// MAIN
setup();
var characterName = fl.getDocumentDOM().selection[0].libraryItem.name;
var characterTimeline = fl.getDocumentDOM().selection[0].libraryItem.timeline; // get the timeline of the selected symbol
var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet"); // get the integer index of layer "xSheet"
if (xSheetLayerIndex == undefined) {
    xSheetLayerIndex = 0; // assume it's at 0 if somehow it doesn't find it
}
var poseFrame = fl.getDocumentDOM().getElementProperty("firstFrame"); // get the index in the firstFrame property
// in the character timeline, obtain the name of the pose as it stands on the given frame
var poseName = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].name;
var firstFrameOfLipFlap = 0, lipFlapLength = 0;
if (fl.getDocumentDOM().documentHasData(characterName + "." + poseName)) {
    firstFrameOfLipFlap = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName)[0];
    lipFlapLength = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName)[1];
}
var guiPanel = fl.xmlPanelFromString("<dialog title=\"The Lip Syncer\" buttons=\"accept, cancel\">vbox><hbox><label value=\"First Frame of Lip Flap:\" control=\"panel_FF\"/><textbox id=\"panel_FF\" size=\"24\" value=\"" + (firstFrameOfLipFlap) + "\" /></hbox><hbox><label value=\"Duration of Lip Flap:\" control=\"panel_dur\"/><textbox id=\"panel_dur\" size=\"24\" value=\"" + (lipFlapLength) + "\" /></hbox></vbox></dialog>");
if (guiPanel.dismiss == "accept") {
    var firstFrameOfLipFlap = parseInt(guiPanel.panel_FF) - 1;
    var lipFlapLength = parseInt(guiPanel.panel_dur);
    //alert("Select the voice line's config file.");
    var cfgPath = fl.browseForFileURL("select"); // get file
    fl.runScript(cfgPath);
    var layer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
    var startFrame = fl.getDocumentDOM().getTimeline().getSelectedFrames()[1];
    var timingArray = getLipSyncFrameArray(words, phonemes);
    var wordStartTimes = getStartTimes(words);
    var wordEndTimes = getEndTimes(words);
    if(words[0][WORD_PHONEME_INDEX] == "") { // if there's silence at the beginning of a line...
        selectOrMakeKeyframe(layer, startFrame);
        fl.getDocumentDOM().setElementProperty("loop", "single frame");
        fl.getDocumentDOM().setElementProperty("firstFrame", firstFrameOfLipFlap - 1);
    }
    for (var i = 0; i < timingArray.length; i++) {
        // fl.trace(timingArray[i][0] + ", " +  timingArray[i][1]);
        var dur = timingArray[i][1] - timingArray[i][0];
        var distance;
        if (i != timingArray.length - 1) {
            distance = timingArray[i + 1][0] - timingArray[i][0];
        } else {
            distance = dur;
        }
        makeLipFlap(firstFrameOfLipFlap, lipFlapLength, distance, layer, startFrame + timingArray[i][0], wordStartTimes, wordEndTimes);
    }
    fl.getDocumentDOM().addDataToDocument(characterName + "." + poseName, "integerArray", [firstFrameOfLipFlap + 1, lipFlapLength]);
}