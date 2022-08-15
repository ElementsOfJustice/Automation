/******************************************************************************
LIP SYNC ALL
Description: 

Tutorial Available in the MEGA: https://mega.nz/fm/qlIkjDSA
******************************************************************************/

END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;
CONSONANT_PHONES = ["M", "N", "NG", "P", "B", "T", "D", "K", "G", "CH", "JH", "S", "Z", "SH", "ZH", "F", "V", "TH", "DH", "HH", "W", "R", "Y", "L"];
VOWEL_PHONES = ["IY", "UW", "IH", "UH", "EY", "OW", "AH", "EH", "AE", "ER", "AA", "AO", "AW", "AY", "OY"];
// all utils
function setup() {
    fl.showIdleMessage(false);
}
function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}
function selectOrMakeKeyframe(layer, frame) {
    resetSelection(layer, frame);
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence,   ke a note of that
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe();
        resetSelection(layer, frame);
    }
}
function isLipFlapPose(layer, frame) {
    var poseName = getPoseName(layer, frame);
    if (poseName === undefined) {
        return undefined;
    }
    var layerName = fl.getDocumentDOM().getTimeline().getLayerProperty("name");
    if (!arrayContains(AVAILABLE_CHARACTERS, layerName, isEqual)) { // not part of raster characters
        return true;
    }
    if (arrayContains(AVAILABLE_CHARACTERS, layerName, isEqual)) {
        var availablePoses = getKeys(CHARACTER_NAME_TO_MAP[layerName]);
        if (!arrayContains(availablePoses, poseName, isEqual)) { 
            if(!arrayContains(availablePoses, poseName, stringContains)) { 
                return true; // part of raster characters, but not an available pose
            }
        }
    }
    return false;
}
function getPoseName(layer, frame) {
    resetSelection(layer, frame);
    if (fl.getDocumentDOM().selection[0] == undefined) {
        return undefined;
    }
    var characterTimeline = fl.getDocumentDOM().selection[0].libraryItem.timeline; // get the timeline of the selected symbol
    var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet"); // get the integer index of layer "xSheet"
    if (xSheetLayerIndex == undefined) {
        xSheetLayerIndex = 0; // assume it's at 0 if somehow it doesn't find it
    }
    var poseFrame = fl.getDocumentDOM().getElementProperty("firstFrame"); // get the index in the firstFrame property
    // in the character timeline, obtain the name of the pose as it stands on the given frame
    return poseName = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].name;
}

// lip flap lipsync utils

function arrayContainsTruncated(array, element) {
    for (var i = 0; i < array.length; i++) {
        if (element.substring(0, 2) == array[i]) { // strip the stupid dumb crappy stress number (will fix evertyhing plxzzzzzz)
            return true;
        }
    }
    return false;
}
function getKeysAsFloats(input) { // get array of start times from the words or phonemes
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
    var wordStartTimeArray = getKeysAsFloats(words);
    var phonemeStartTimeArray = getKeysAsFloats(phonemes);
    // god i hate dynamic typing so much i HATE WHEN IT CONSIDERS UNKNOWNS AS STRINGS AND I HAVE TO CALL PARSEFLOAT ON ALL OF IT I HATE IT
    for (var i = 0; i < wordStartTimeArray.length; i++) { // iterate over every word
        var endTime = parseFloat(words[wordStartTimeArray[i]][END_INDEX]);
        var index = 0, indexInInterval = 0;
        for (var phonemeStart in phonemes) {
            if (parseFloat(phonemeStart) >= parseFloat(wordStartTimeArray[i]) && parseFloat(phonemeStart) < endTime) { // phoneme is in the word interval 
                if (indexInInterval == 0) {
                    if (arrayContainsTruncated(VOWEL_PHONES, phonemes[parseFloat(phonemeStart)][WORD_PHONEME_INDEX])) {
                        syllableFrames.push([Math.round(parseFloat(phonemeStart) * FRAME_RATE), Math.round(parseFloat(phonemes[phonemeStart][END_INDEX]) * FRAME_RATE)]); // if the first syllable of a word is a vowel
                    }
                    indexInInterval++;
                } else if (arrayContainsTruncated(VOWEL_PHONES, phonemes[parseFloat(phonemeStart)][WORD_PHONEME_INDEX])) {
                    if (index == 0) {
                        continue; // handle edge case (beginning of voice line)
                    }
                    if (arrayContainsTruncated(CONSONANT_PHONES, phonemes[phonemeStartTimeArray[index - 1]][WORD_PHONEME_INDEX])) {
                        syllableFrames.push([Math.round(parseFloat(phonemeStart) * FRAME_RATE), Math.round(parseFloat(phonemes[phonemeStart][END_INDEX]) * FRAME_RATE)]); // vowel after a consonant is a syllable yessiree (1 frame before to improve accuracy maybe?)
                    }
                }
            }
            index++;
        }
    }
    return syllableFrames;
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
    var poseName = getPoseName(layer, frame);
    var characterName = fl.getDocumentDOM().selection[0].libraryItem.name;
    var firstFrameOfLipFlap = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".lipFlap")[0];
    var lipFlapLength = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".lipFlap")[1];
    if (firstFrameOfLipFlap == undefined || lipFlapLength == undefined) { // check to see if data is in the symbol name instead of the full path 
        characterName = characterName.substring(characterName.lastIndexOf("/") + 1);
        firstFrameOfLipFlap = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".lipFlap")[0];
        lipFlapLength = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".lipFlap")[1];
    }
    return [firstFrameOfLipFlap, lipFlapLength]
}
// very complex function that makes really accurate lip flaps
function makeLipFlap(firstFrameOfLipFlap, lipFlapLength, distance, layer, frame, wordStartTimes, wordEndTimes) {
    // TODO: make a lip flap such that the mouth is closed at the end of (currentFrame + distance)
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
    } else { // this may be a raster pose!!
        if (!isLipFlapPose(layer, frame)) {
            return -1;
        }
        fl.trace("Pose change at frame " + frame + " (" + getPoseName(layer, frame) + ") has no lip flap data. Your punishment is the console flooding with these messages (and the pose reverting to the previous one >:] )");
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
        selectOrMakeKeyframe(layer, frame + distance); // go to the end of the lip flap
    }
    var toReturn = [firstFrameOfLipFlap, lipFlapLength];
    var lipFlapInfo = getLipFlapInfo(layer, frame + distance);
    if (toReturn[0] != lipFlapInfo[0] - 1 || toReturn[1] != lipFlapInfo[1]) { // there's a rogue keyframe during the mouth closing, let's clear it
        var currentTimelineKeyframe = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame;
        // If we're already at the start...
        if (fl.getDocumentDOM().getTimeline().currentFrame == currentTimelineKeyframe && fl.getDocumentDOM().getTimeline().currentFrame != 0) {
            // select the start of the previous keyframe
            fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[currentTimelineKeyframe - 1].startFrame;
        } else {
            // otherwise just select the current keyframe's starting frame
            fl.getDocumentDOM().getTimeline().currentFrame = currentTimelineKeyframe;
        }
        // Select the current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        fl.getDocumentDOM().getTimeline().clearKeyframes(); // clear the rogue keyframe
        selectOrMakeKeyframe(layer, frame + distance); // return to the end of the lip flap
    }
    if (lipFlapInfo[0] != undefined && lipFlapInfo[1] != undefined) {
        toReturn = [lipFlapInfo[0] - 1, lipFlapInfo[1]]; // return pose that occurs as the mouth is closing
    } else { // this may be a raster pose!!
        if (!isLipFlapPose(layer, frame + distance)) {
            return -1;
        } else {
            fl.trace("Pose at frame " + (frame + distance) + " (" + getPoseName(layer, frame + distance) + ") has no lip flap data. Your punishment is the console flooding with these messages (and the pose reverting to the previous one >:] )");
        }
    }
    fl.getDocumentDOM().setElementProperty("firstFrame", toReturn[0] + toReturn[1] - 1); // use new lip flap data for the closed mouth 
    fl.getDocumentDOM().setElementProperty("loop", "single frame");
    return toReturn;
}
function lipFlapLipSyncHelper(firstFrameOfLipFlap, lipFlapLength, voiceStartFrame, startFrame, endFrame, words, phonemes) { // basically an API for lip flaps
    var layer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
    var timingArray = getLipSyncFrameArray(words, phonemes);
    var wordStartTimes = getStartTimes(words);
    var wordEndTimes = getEndTimes(words);
    for (var k = 0; k < timingArray.length; k++) {
        if (startFrame <= voiceStartFrame + timingArray[k][0] && endFrame > voiceStartFrame + timingArray[k][0]) {
            var distance;
            if (k != timingArray.length - 1) {
                distance = timingArray[k + 1][0] - timingArray[k][0];
            } else {
                distance = wordEndTimes[wordEndTimes.length - 1] - timingArray[k][0] - voiceStartFrame; // last word of voice line
            }
            // makeLipFlap returns -1 if it's a mouth shape pose
            var newInfo = makeLipFlap(firstFrameOfLipFlap, lipFlapLength, distance, layer, voiceStartFrame + timingArray[k][0], wordStartTimes, wordEndTimes);
            if (newInfo == -1) { 
                //do stuff with rasters...
                var duration = fl.getDocumentDOM().getTimeline().getFrameProperty("duration");
                // call rasterLipSyncHelper to sync the mouth shape pose, then move on to the next pose (startFrame += duration)
                rasterLipSyncHelper(voiceStartFrame, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentLayer, CHARACTER_NAME_TO_MAP[fl.getDocumentDOM().getTimeline().getLayerProperty("name")], getPoseName(layer, fl.getDocumentDOM().getTimeline().currentFrame), fl.getDocumentDOM().getTimeline().currentFrame + duration);
                startFrame += duration; // adjust the range accordingly
                continue;
            }
            firstFrameOfLipFlap = newInfo[0];
            lipFlapLength = newInfo[1]; // pose changes!!!
        }
    }
}
// voice line starts with lip flap pose, so sync that
function lipFlapLipSync(noLipFlapData, voiceLayerName, voiceStartFrame, voiceDuration, words, phonemes) {
    var lipFlapInfo = getLipFlapInfo(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
    var firstFrameOfLipFlap = lipFlapInfo[0];
    var lipFlapLength = lipFlapInfo[1];
    if (firstFrameOfLipFlap == undefined || lipFlapLength == undefined) {
        noLipFlapData.push(soundName);
        resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(voiceLayerName), voiceStartFrame);
        return noLipFlapData;
    }
    firstFrameOfLipFlap--; // it's 1 indexed, fix that
    if (words[0][WORD_PHONEME_INDEX] == "") { // if there's silence at the beginning of a line...
        selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().getSelectedLayers(), voiceStartFrame);
        fl.getDocumentDOM().setElementProperty("loop", "single frame");
        fl.getDocumentDOM().setElementProperty("firstFrame", firstFrameOfLipFlap - 1);
    }
    lipFlapLipSyncHelper(firstFrameOfLipFlap, lipFlapLength, voiceStartFrame, voiceStartFrame, voiceStartFrame + voiceDuration, words, phonemes);
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(voiceLayerName), voiceStartFrame); // go back to the original voice layer frame
    return noLipFlapData;
}

// raster lipsync utils

function getKeys(input) { // get array of start times from the words or phonemes
    var arr = [];
    for (var i in input) {
        arr.push(i);
    }
    return arr;
}
function isEqual(a, b) {
    return a == b;
}
function stringContains(a, b) {
    return b.indexOf(a) >= 0;
}
function arrayContains(array, element, compare) {
    for (var i = 0; i < array.length; i++) {
        if (compare(array[i], element)) {
            return true;
        }
    }
    return false;
}
// does mouth shape syncing from startFrame to endFrame in the given poseName
function rasterLipSyncHelper(voiceLineStartFrame, startFrame, layer, lipsyncMap, poseName, endFrame) { 
    var diphthongMap = {};
    var mouthShapeMap = {};
    for (var phonemeStartTime in phonemes) {
        if (startFrame - voiceLineStartFrame <= Math.round((phonemeStartTime * FRAME_RATE)) && (endFrame === undefined || endFrame - voiceLineStartFrame > Math.round((phonemeStartTime * FRAME_RATE)))) {
            resetSelection(layer, voiceLineStartFrame + Math.round((phonemeStartTime * FRAME_RATE)));
            var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
            if (!isKeyFrame) {
                fl.getDocumentDOM().getTimeline().insertKeyframe(); // this logic will replace extremely short phonemes with the next one   
            }
            resetSelection(layer, voiceLineStartFrame + Math.round((phonemeStartTime * FRAME_RATE)));
            fl.getDocumentDOM().setElementProperty("loop", "loop");
            var phoneme = phonemes[phonemeStartTime][WORD_PHONEME_INDEX].substring(0, 2);
            if (arrayContains(DIPHTHONGS, phoneme, isEqual)) {
                diphthongMap[fl.getDocumentDOM().getTimeline().currentFrame] = phoneme;
                continue;
            }
            if (PHONEME_TO_MOUTH_SHAPE[phoneme] == "No Talking" && lipsyncMap[poseName][PHONEME_TO_MOUTH_SHAPE[phoneme]] === undefined) { // some poses don't have the no talking mouth shape defined
                var frame = lipsyncMap[poseName]["Closed Mouth No Teeth"] - 1;
            } else {
                var frame = lipsyncMap[poseName][PHONEME_TO_MOUTH_SHAPE[phoneme]] - 1;
            }
            fl.getDocumentDOM().setElementProperty("firstFrame", frame);
            if (arrayContains(SINGLE_FRAME_MOUTH_SHAPES, PHONEME_TO_MOUTH_SHAPE[phoneme], isEqual)) {
                fl.getDocumentDOM().setElementProperty("loop", "single frame"); // set single frame for mouth shapes that only last for one frame
            }
            mouthShapeMap[fl.getDocumentDOM().getTimeline().currentFrame] = PHONEME_TO_MOUTH_SHAPE[phoneme];
        }
    }
    // handle diphthongs
    for (var frame in diphthongMap) {
        for (var i = 0; i < DIPHTHONG_ORDERING[diphthongMap[frame]].length; i++) { // for each mouth shape in the diphthong
            resetSelection(layer, (parseInt(frame) + i));
            var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of that
            if (frame != fl.getDocumentDOM().getTimeline().currentFrame && isKeyFrame) {
                break; // at the next keyframe, abort mission
            }
            if (!isKeyFrame) {
                fl.getDocumentDOM().getTimeline().insertKeyframe();
                resetSelection(layer, (parseInt(frame) + i));
            }
            var firstFrame = lipsyncMap[poseName][DIPHTHONG_ORDERING[diphthongMap[frame]][i]] - 1;
            fl.getDocumentDOM().setElementProperty("firstFrame", firstFrame);
            mouthShapeMap[fl.getDocumentDOM().getTimeline().currentFrame] = DIPHTHONG_ORDERING[diphthongMap[frame]][i];
            var framesToAdvanceBy = Math.round(fl.getDocumentDOM().getTimeline().layers[layer].frames[frame].duration / DIPHTHONG_ORDERING[diphthongMap[frame]].length);
            fl.getDocumentDOM().getTimeline().currentFrame += (framesToAdvanceBy <= 0) ? 1 : framesToAdvanceBy;
        }
    }
}
// if a voice line starts with a raster mouth shape pose, it runs this function which iterates through each keyframe and if it's a lip flap pose, it calls lipFlapLipSyncHelper and goes to the next pose
function rasterLipSync(noLipFlapData, voiceLayerName, voiceStartFrame, voiceDuration, words, phonemes) {
    while (fl.getDocumentDOM().getTimeline().currentFrame < voiceStartFrame + voiceDuration && fl.getDocumentDOM().getTimeline().currentFrame < fl.getDocumentDOM().getTimeline().getLayerProperty("frames").length - 1) {
        var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
        var duration = fl.getDocumentDOM().getTimeline().getFrameProperty("duration");
        if (isLipFlapPose(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame)) {
            var lipFlapInfo = getLipFlapInfo(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
            var firstFrameOfLipFlap = lipFlapInfo[0];
            var lipFlapLength = lipFlapInfo[1];
            if (firstFrameOfLipFlap != undefined && lipFlapLength != undefined) {
                lipFlapLipSyncHelper(firstFrameOfLipFlap - 1, lipFlapLength, voiceStartFrame, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + duration, words, phonemes);
            } else {
                noLipFlapData.push("Frame " + curFrame);
            }
            selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().currentLayer, curFrame + duration);
            continue;
        }
        var poseName = getPoseName(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame);
        if(poseName == undefined) {
            break; // goes to new character, so we're done here
        }
        if (poseName.substring(poseName.lastIndexOf(" ")) != " Talk") {
            poseName = poseName.substring(0, poseName.lastIndexOf(" ")); // if it's passed all other data validation and this line runs, that means the pose is one of Athena's (widget emotion at the end). Get rid of the emotion.
        }
        rasterLipSyncHelper(voiceStartFrame, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentLayer, CHARACTER_NAME_TO_MAP[fl.getDocumentDOM().getTimeline().getLayerProperty("name")], poseName, fl.getDocumentDOM().getTimeline().currentFrame + duration - 1);
        selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().currentLayer, curFrame + duration);
    }
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(voiceLayerName), voiceStartFrame); // go back to the original voice layer frame
}

// >>MAIN<<
//TODO: Iterate over all the VOX layers, use the sound file names to then lipsync the corresponding stuff.
var confirmExecution = confirm("Confirm: Every voice layer is selected AND the voice layer names match the character layers names (without \"_VOX\")");
if (confirmExecution) {
    setup();
    var cfgFolderPath = fl.browseForFolderURL("Select CFG files folder"); // cfg files need to all be in one folder
    fl.runScript(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/")) + "/MasterRasterRigLipsyncs.cfg");
    fl.runScript(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/")) + "/MasterRasterRigLipsyncs.cfg"); // no clue why, but running this twice fixes everything
    var startTime = new Date();
    var failed = [], noLipFlapData = [];
    var selectedLayers = fl.getDocumentDOM().getTimeline().getSelectedLayers(); // get selected layers
    for (var i = 0; i < selectedLayers.length; i++) { // loop through each voice line layer
        resetSelection(selectedLayers[i], 0); // go to first frame of layer
        var voiceLayerName = fl.getDocumentDOM().getTimeline().getLayerProperty("name"); // used to go to the character layer
        var characterLayerName = voiceLayerName.substring(0, voiceLayerName.lastIndexOf("_")); // sound layer should have _VOX at the end, character layer shouldn't
        if(fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName) == undefined) { // invalid layer setup, skip to next one
            fl.trace("Invalid layer selected: " + voiceLayerName + ". Skipping this layer.");
            continue;
        }
        var numFrames = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames.length; // get length of layer
        while (fl.getDocumentDOM().getTimeline().currentFrame < numFrames - 1) { // iterate over every keyframe
            var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().getFrameProperty("startFrame", fl.getDocumentDOM().getTimeline().currentFrame);
            var soundName = fl.getDocumentDOM().getTimeline().getFrameProperty("soundName", fl.getDocumentDOM().getTimeline().currentFrame); // sound keyframes have a property soundName which is just the sound filename
            if (isKeyFrame && soundName != "") { // for every voice line 
                var voiceStartFrame = fl.getDocumentDOM().getTimeline().currentFrame; // this is essentially an anchor point for all the lipsyncing
                var voiceDuration = fl.getDocumentDOM().getTimeline().getFrameProperty("duration"); // used to move to the next voice line
                resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName), voiceStartFrame); // select corresponding layer
                fl.getDocumentDOM().getTimeline().setLayerProperty("locked", false); // unlock it
                fl.getDocumentDOM().getTimeline().setLayerProperty("viisble", !false); // visible it
                var cfgFilePath = cfgFolderPath + "/" + soundName.substring(0, soundName.indexOf(".flac")) + ".cfg"; // get the cfg file (should have the exact same filename, just different extension)
                try {
                    fl.runScript(cfgFilePath); // run cfg file to load values
                } catch (error) {
                    failed.push(soundName); // if cfg file can't be found or fails for some reason, push that to the failed array
                    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(voiceLayerName), voiceStartFrame); // go back to start of voiceline
                    // go to the next voice line
                    fl.getDocumentDOM().getTimeline().currentFrame += fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration;
                    continue; // continue to the next iteration in the while loop
                }
                // no errors, let's do this
                if (isLipFlapPose(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame) === undefined) { // no pose name, assume it means empty keyframe
                    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(voiceLayerName), voiceStartFrame); // start of voiceline
                    // next voiceline
                    fl.getDocumentDOM().getTimeline().currentFrame += fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration;
                    continue;
                } else if (isLipFlapPose(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame)) {
                    lipFlapLipSync(noLipFlapData, voiceLayerName, voiceStartFrame, voiceDuration, words, phonemes); // if it's a lip flap pose, do lip flap lipsyncing
                } else {
                    rasterLipSync(noLipFlapData, voiceLayerName, voiceStartFrame, voiceDuration, words, phonemes); // if it's a mouth shape pose, do mouth shape lipsyncing
                }
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