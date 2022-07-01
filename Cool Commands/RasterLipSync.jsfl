/******************************************************************************
RASTER LIP SYNC
Description: 
******************************************************************************/

// this script is in testing mode for now
END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;

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

function resetSelection(layer, frame) { // sets selection the desired layer and frame
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true); // select frame on the layer and replace current selection
}

function placeKeyframes(startFrame, layer, lipsyncMap, poseName) {
    var diphthongMap = {};
    var mouthShapeMap = {};
    for (var phonemeStartTime in phonemes) {
        resetSelection(layer, startFrame + Math.round((phonemeStartTime * FRAME_RATE)));
        var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
        if (!isKeyFrame) {
            fl.getDocumentDOM().getTimeline().insertKeyframe(); // this logic will replace extremely short phonemes with the next one   
        }
        resetSelection(layer, startFrame + Math.round((phonemeStartTime * FRAME_RATE)));
        fl.getDocumentDOM().setElementProperty("loop", "loop");
        var phoneme = phonemes[phonemeStartTime][WORD_PHONEME_INDEX].substring(0, 2);
        if (arrayContains(DIPHTHONGS, phoneme, isEqual)) {
            diphthongMap[fl.getDocumentDOM().getTimeline().currentFrame] = phoneme;
            continue;
        }
        var frame = lipsyncMap[poseName][PHONEME_TO_MOUTH_SHAPE[phoneme]] - 1;
        fl.getDocumentDOM().setElementProperty("firstFrame", frame);
        if (arrayContains(SINGLE_FRAME_MOUTH_SHAPES, PHONEME_TO_MOUTH_SHAPE[phoneme], isEqual)) {
            fl.getDocumentDOM().setElementProperty("loop", "single frame"); // set single frame for mouth shapes that only last for one frame
        }
        mouthShapeMap[fl.getDocumentDOM().getTimeline().currentFrame] = PHONEME_TO_MOUTH_SHAPE[phoneme];
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

//MAIN
// input validation
if (fl.getDocumentDOM().getTimeline().getSelectedFrames().length != 3 || fl.getDocumentDOM().getTimeline().getSelectedFrames()[2] - fl.getDocumentDOM().getTimeline().getSelectedFrames()[1] != 1) {
    throw new Error("Invalid selection. Select one frame that denotes the beginning of a character talking (first frame of the voice line audio).")
}
fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; // unlock layer
try {
    fl.runScript(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/")) + "/MasterRasterRigLipsyncs.cfg");
} catch (error) {
    alert("MasterRasterLipsyncs.cfg not found! Browse for and select the MasterRasterLipsyncs.cfg file.");
    var masterRasterLipsyncsPath = fl.browseForFileURL("select");
    fl.runScript(masterRasterLipsyncsPath);
}
var layerName = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].name; // get name of layer
if (!arrayContains(AVAILABLE_CHARACTERS, layerName, isEqual)) {
    throw new Error("Incorrect layer or unsupported character. Selected layer name must be one of the following: " + AVAILABLE_CHARACTERS + ". Currently selected layer is " + layerName + ".");
}
var characterTimeline = fl.getDocumentDOM().selection[0].libraryItem.timeline; // get the timeline of the selected symbol
var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet");
if (xSheetLayerIndex == undefined) {
    xSheetLayerIndex = 0; // assume it's at 0 if somehow it doesn't find it
}
var poseFrame = fl.getDocumentDOM().getElementProperty("firstFrame");
var poseName = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].name;
var availablePoses = getKeys(CHARACTER_NAME_TO_MAP[layerName]);
if (!arrayContains(availablePoses, poseName, stringContains)) {
    throw new Error("Invalid pose. Either: you put the character in the non-talking pose OR you are using an incompatible pose. For incompatbile poses, refer to the Automation Guide for help. Currently set pose is: " + poseName);
}
var cfgPath = fl.browseForFileURL("select"); // get file for specific voice line
fl.runScript(cfgPath);
if(poseName.substring(poseName.lastIndexOf(" ")) != "Talk") {
    poseName = poseName.substring(0, poseName.lastIndexOf(" ")); // if it's passed all other data validation and this line runs, that means the pose is one of Athena's (widget emotion at the end). Get rid of the emotion.
}
//actual execution
placeKeyframes(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().getSelectedLayers(), CHARACTER_NAME_TO_MAP[layerName], poseName);