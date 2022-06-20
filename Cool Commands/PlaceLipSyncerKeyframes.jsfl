// TODO: implement something to fix words that start with soft consonants
END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;
CONSONANT_PHONES = ["M", "N", "NG", "P", "B", "T", "D", "K", "G", "CH", "JH", "S", "Z", "SH", "ZH", "F", "V", "TH", "DH", "HH", "W", "R", "Y", "L"];
VOWEL_PHONES = ["IY", "UW", "IH", "UH", "EY", "OW", "AH", "EH", "AE", "ER", "AA", "AO", "AW", "AY", "OY"];

function resetSelection(layer, frame) { // sets selection the desired layer and frame
    fl.getDocumentDOM().selectNone();
    fl.getDocumentDOM().getTimeline().setSelectedLayers(layer * 1);
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select current frame
    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
}

function arrayContains(array, element) {
    for (var i = 0; i < array.length; i++) {
        if (element.substring(0, 2) == array[i]) { // strip the stupid dumb crappy stress number (will fix evertyhing plxzzzzzz)
            return true;
        }
    }
    return false;
}

function getStartTimeArray(input) { // get array of start times from the words or phonemes
    var arr = [];
    for (var i in input) {
        arr.push(i);
    }
    return arr;
}
function getLipSyncFrameArray(words, phonemes) { // helper function to compute where each syllable is in terms of frames
    // Approach 1: each word begins with a syllable, and every consonant followed by a vowel is another syllable
    var syllableFrames = [];
    var wordKeyArray = [];
    for (var wordStart in words) {
        if (words[wordStart][WORD_PHONEME_INDEX] == "") { // nothing is being said, continue
            continue;
        }
        wordKeyArray.push(wordStart);
        // syllableFrames.push(Math.round(wordStart * FRAME_RATE)); // push the frame marking the beginning of a word to the array (it's off by one so + 1)
    }
    var length = wordKeyArray.length;
    var phonemeStartTimeArray = getStartTimeArray(phonemes);
    for (var i = 0; i < length; i++) { // iterate over every word
        var endTime = words[wordKeyArray[i]][END_INDEX];
        var index = 0, indexInInterval = 0;
        for (var phonemeStart in phonemes) {
            if (phonemeStart >= wordKeyArray[i] && phonemeStart < endTime) { // phoneme is in the word interval
                if (indexInInterval == 0) {
                    if (arrayContains(VOWEL_PHONES, phonemes[phonemeStart][WORD_PHONEME_INDEX])) {
                        syllableFrames.push(Math.round(phonemeStart * FRAME_RATE)); // if the first syllable of a word is a vowel
                    } else if (arrayContains(VOWEL_PHONES, phonemes[phonemeStartTimeArray[index + 1]][WORD_PHONEME_INDEX])) {
                        // syllableFrames.push(Math.round(phonemeStart * FRAME_RATE)); // if the first syllable is a consonant with a vowel after it
                    }
                    indexInInterval++;
                    index++;
                    continue;
                } else if (arrayContains(VOWEL_PHONES, phonemes[phonemeStart][WORD_PHONEME_INDEX])) {
                    if (index == 0) {
                        break; // handle edge case (beginning of voice line)
                    }
                    if (arrayContains(CONSONANT_PHONES, phonemes[phonemeStartTimeArray[index - 1]][WORD_PHONEME_INDEX])) {  
                        syllableFrames.push(Math.round(phonemeStart * FRAME_RATE)); // vowel after a consonant is a syllable yessiree
                    }
                }
            }
            index++;
        }
    }
    return syllableFrames;
}

function placeKeyframes(startFrame, layer, keyframeArray) {
    for (var i = 0; i < keyframeArray.length; i++) {
        resetSelection(layer, startFrame + keyframeArray[i]);
        fl.getDocumentDOM().getTimeline().insertKeyframe();
    }
}


alert("Select the voice line's config file.");
var cfgPath = fl.browseForFileURL("select"); // get file
// data validation
fl.runScript(cfgPath);
var layer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
var startFrame = fl.getDocumentDOM().getTimeline().getSelectedFrames()[1];
var keyframeArray = getLipSyncFrameArray(words, phonemes);
placeKeyframes(startFrame, layer, keyframeArray);