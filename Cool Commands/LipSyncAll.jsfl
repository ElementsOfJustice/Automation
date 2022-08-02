END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;
CONSONANT_PHONES = ["M", "N", "NG", "P", "B", "T", "D", "K", "G", "CH", "JH", "S", "Z", "SH", "ZH", "F", "V", "TH", "DH", "HH", "W", "R", "Y", "L"];
VOWEL_PHONES = ["IY", "UW", "IH", "UH", "EY", "OW", "AH", "EH", "AE", "ER", "AA", "AO", "AW", "AY", "OY"];

function setup() {
    fl.showIdleMessage(false);
}

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

function getLipFlapInfo(layer, frame) {
    resetSelection(layer, frame);
    var characterName = fl.getDocumentDOM().selection[0].libraryItem.name;
    var characterTimeline = fl.getDocumentDOM().selection[0].libraryItem.timeline; // get the timeline of the selected symbol
    var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet"); // get the integer index of layer "xSheet"
    if (xSheetLayerIndex == undefined) {
        xSheetLayerIndex = 0; // assume it's at 0 if somehow it doesn't find it
    }
    var poseFrame = fl.getDocumentDOM().getElementProperty("firstFrame"); // get the index in the firstFrame property
    // in the character timeline, obtain the name of the pose as it stands on the given frame
    var poseName = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].name;
    var firstFrameOfLipFlap = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".lipFlap")[0];
    var lipFlapLength = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".lipFlap")[1];
    if (firstFrameOfLipFlap == undefined || lipFlapLength == undefined) { // check to see if data is in the symbol name instead of the full path 
        characterName = characterName.substring(characterName.lastIndexOf("/") + 1);
        firstFrameOfLipFlap = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".lipFlap")[0];
        lipFlapLength = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".lipFlap")[1];
    }
    return [firstFrameOfLipFlap, lipFlapLength]
}



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
    // NEW FEATURE: update lip flap data as this runs to allow for pose changes
    var lipFlapInfo = getLipFlapInfo(layer, frame);
    if (lipFlapInfo[0] != undefined && lipFlapInfo[1] != undefined) {
        firstFrameOfLipFlap = lipFlapInfo[0] - 1;
        lipFlapLength = lipFlapInfo[1];
    } else {
        fl.trace("Pose change at frame " + frame + " has no lip flap data. Your punishment is the console flooding with these messages :)");
    }
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
    var toReturn = [firstFrameOfLipFlap, lipFlapLength];
    var lipFlapInfo = getLipFlapInfo(layer, frame + distance);
    if (lipFlapInfo[0] != undefined && lipFlapInfo[1] != undefined) {
        if (toReturn[0] != lipFlapInfo[0] - 1 || toReturn[1] != lipFlapInfo[1]) { // there's a rogue keyframe during the mouth closing, let's get the lip flap values and clear it
            var currentTimelineKeyframe = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame;
            // If we're already at the start...
            if (fl.getDocumentDOM().getTimeline().currentFrame == currentTimelineKeyframe && fl.getDocumentDOM().getTimeline().currentFrame != 0) {
                // ?? select the start of the previous keyframe ??
                fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[currentTimelineKeyframe - 1].startFrame;
            } else {
                // ?? otherwise just select the current keyframe's starting frame ??
                fl.getDocumentDOM().getTimeline().currentFrame = currentTimelineKeyframe;
            }
            // Select the current frame
            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
            fl.getDocumentDOM().getTimeline().clearKeyframes(); // clear the rogue keyframe
            var currentTimelineFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().currentFrame];
            // advance playhead by the amount of frames left until the next keyframe
            fl.getDocumentDOM().getTimeline().currentFrame += currentTimelineFrame.duration - (fl.getDocumentDOM().getTimeline().currentFrame - currentTimelineFrame.startFrame);
            // Select the current frame
            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        }
        toReturn = [lipFlapInfo[0] - 1, lipFlapInfo[1]]; // return pose that occurs as the mouth is closing

    } else {
        fl.trace("Pose at frame " + frame + " has no lip flap data. Your punishment is the console flooding with these messages (and the pose reverting to the previous one >:] )");
    }
    fl.getDocumentDOM().setElementProperty("firstFrame", toReturn[0] + toReturn[1] - 1); // use new lip flap data for the closed mouth 
    fl.getDocumentDOM().setElementProperty("loop", "single frame");
    return toReturn;
}


//TODO: Iterate over all the VOX layers, use the sound file names to then lipsync the corresponding stuff.
var confirmExecution = confirm("Confirm: Every voice layer is selected AND the voice layer names match the character layers names (without \"_VOX\")");
var cfgFolderPath = fl.browseForFolderURL("Select CFG files folder");
if (confirmExecution) {
    setup();
    var startTime = new Date();
    var failed = [], noLipFlapData = [];
    var selectedLayers = fl.getDocumentDOM().getTimeline().getSelectedLayers(); // get selected layers
    for (var i = 0; i < selectedLayers.length; i++) {
        resetSelection(selectedLayers[i], 0); // go to first frame of layer
        var numFrames = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames.length; // get length of layer
        while (fl.getDocumentDOM().getTimeline().currentFrame < numFrames - 1) { // iterate over every keyframe
            var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().getFrameProperty("startFrame", fl.getDocumentDOM().getTimeline().currentFrame);
            var soundName = fl.getDocumentDOM().getTimeline().getFrameProperty("soundName", fl.getDocumentDOM().getTimeline().currentFrame);
            if (isKeyFrame && soundName != "") { // for every voice line
                var voiceStartFrame = fl.getDocumentDOM().getTimeline().currentFrame;
                var voiceLayerName = fl.getDocumentDOM().getTimeline().getLayerProperty("name");
                var characterLayerName = voiceLayerName.substring(0, voiceLayerName.lastIndexOf("_"));
                resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName), voiceStartFrame); // select corresponding layer
                fl.getDocumentDOM().getTimeline().setLayerProperty("locked", false); // unlock it
                var cfgFilePath = cfgFolderPath + "/" + soundName.substring(0, soundName.indexOf(".flac")) + ".cfg"; // get the cfg file
                try {
                    fl.runScript(cfgFilePath);
                } catch (error) {
                    failed.push(soundName);
                    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(voiceLayerName), voiceStartFrame);
                    fl.getDocumentDOM().getTimeline().currentFrame += fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration;
                    continue;
                }
                // no errors, let's do this
                var lipFlapInfo = getLipFlapInfo(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
                var firstFrameOfLipFlap = lipFlapInfo[0];
                var lipFlapLength = lipFlapInfo[1];
                if (firstFrameOfLipFlap == undefined || lipFlapLength == undefined) {
                    noLipFlapData.push(soundName);
                    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(voiceLayerName), voiceStartFrame);
                    fl.getDocumentDOM().getTimeline().currentFrame += fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration;
                    continue;
                }
                firstFrameOfLipFlap--; // it's 1 indexed, fix that
                var layer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
                var startFrame = fl.getDocumentDOM().getTimeline().getSelectedFrames()[1];
                var timingArray = getLipSyncFrameArray(words, phonemes);
                var wordStartTimes = getStartTimes(words);
                var wordEndTimes = getEndTimes(words);
                if (words[0][WORD_PHONEME_INDEX] == "") { // if there's silence at the beginning of a line...
                    selectOrMakeKeyframe(layer, startFrame);
                    fl.getDocumentDOM().setElementProperty("loop", "single frame");
                    fl.getDocumentDOM().setElementProperty("firstFrame", firstFrameOfLipFlap - 1);
                }
                for (var k = 0; k < timingArray.length; k++) {
                    // fl.trace(timingArray[i][0] + ", " +  timingArray[i][1]);
                    var distance;
                    if (k != timingArray.length - 1) {
                        distance = timingArray[k + 1][0] - timingArray[k][0];
                    } else {
                        distance = wordEndTimes[wordEndTimes.length - 1] - timingArray[k][0] - startFrame; // last word of voice line
                    }
                    var newInfo = makeLipFlap(firstFrameOfLipFlap, lipFlapLength, distance, layer, startFrame + timingArray[k][0], wordStartTimes, wordEndTimes);
                    firstFrameOfLipFlap = newInfo[0];
                    lipFlapLength = newInfo[1]; // pose changes!!!
                }
                resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(voiceLayerName), voiceStartFrame); // go back to the original voice layer frame
            }
            fl.getDocumentDOM().getTimeline().currentFrame += fl.getDocumentDOM().getTimeline().getFrameProperty("duration"); // go to the next one
        }
    }
    var endTime = new Date();
    var timeDiff = endTime - startTime;
    timeDiff /= 1000;
    var seconds = Math.round(timeDiff);

    if (timeDiff < 60) {
        fl.trace("Time Elapsed: " + seconds + " seconds.");
    }

    if (timeDiff > 60) {
        var minutes = Math.floor(timeDiff / 60);
        var seconds = timeDiff - minutes * 60;
        fl.trace("Time Elapsed: " + minutes + " minutes and " + seconds + " seconds");
    }
    fl.trace("Failed cfg file reads: " + failed);
    fl.trace("No lip flap data: " + noLipFlapData);
}