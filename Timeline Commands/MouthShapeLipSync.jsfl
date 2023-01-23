/******************************************************************************
MouthShapeLipSync
Description: 
******************************************************************************/

END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;

OFFSET_MAP = {
    "No Talking" : 0,
    "Closed Mouth No Teeth" : 0,
    "Open Mouth Big" : 7,
    "Open Mouth Teeth" : 7,
    "Open Mouth Wide" : 16,
    "Open Mouth Round" : 16,
    "Closed Mouth Teeth" : 1,
    "Ajar Mouth Tongue" : 26,
    "Ajar Mouth Teeth Together" : 21,
    "Ajar Mouth Teeth Seperate" : 3
}

DIPHTHONGS = ["AW", "AY", "OY"];

PHONEME_TO_MOUTH_SHAPE = {
    "AA" : "Open Mouth Big",
    "AE" : "Open Mouth Big",
    "AH" : "Open Mouth Big",
    "AO" : "Open Mouth Big",
    "B"  : "Closed Mouth No Teeth",
    "CH" : "Ajar Mouth Teeth Together",
    "D"  : "Ajar Mouth Teeth Together",
    "DH" : "Ajar Mouth Tongue" ,
    "EH" : "Open Mouth Teeth",
    "ER" : "Open Mouth Round",
    "EY" : "Open Mouth Teeth",
    "F"  : "Closed Mouth Teeth",
    "G"  : "Ajar Mouth Teeth Seperate",
    "HH" : "Ajar Mouth Teeth Seperate",
    "IH" : "Open Mouth Teeth",
    "IY" : "Open Mouth Teeth",
    "JH" : "Ajar Mouth Teeth Together",
    "K"  : "Ajar Mouth Teeth Seperate",
    "L"  : "Ajar Mouth Tongue",
    "M"  : "Closed Mouth No Teeth",
    "N"  : "Ajar Mouth Teeth Together",
    "NG" : "Open Mouth Teeth",
    "OW" : "Open Mouth Round",
    "P"  : "Closed Mouth No Teeth",
    "R"  : "Open Mouth Round",
    "S"  : "Ajar Mouth Teeth Together",
    "SH" : "Ajar Mouth Teeth Together",
    "T"  : "Ajar Mouth Teeth Together",
    "TH" : "Ajar Mouth Tongue" ,
    "UH" : "Open Mouth Round",
    "UW" : "Open Mouth Round",
    "V"  : "Closed Mouth Teeth",
    "W"  : "Open Mouth Round",
    "Y"  : "Open Mouth Teeth",
    "Z"  : "Ajar Mouth Teeth Together",
    "ZH" : "Ajar Mouth Teeth Together",
    ""   : "No Talking",
    "sp" : "No Talking" // this is the unknown word marker
}

DIPHTHONG_ORDERING = {
    "AW" : ["Open Mouth Big", "Open Mouth Round"],
    "AY" : ["Open Mouth Big", "Open Mouth Teeth"],
    "OY" : ["Open Mouth Round", "Open Mouth Teeth"]
}

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

function placeKeyframes(startFrame, layer, lipsyncMap) {
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
        if(PHONEME_TO_MOUTH_SHAPE[phoneme] == "No Talking" && lipsyncMap[PHONEME_TO_MOUTH_SHAPE[phoneme]] === undefined) { // some poses don't have the no talking mouth shape defined
            var frame = lipsyncMap["Closed Mouth No Teeth"];
        } else {
            var frame = lipsyncMap[PHONEME_TO_MOUTH_SHAPE[phoneme]];
        }
        fl.getDocumentDOM().setElementProperty("firstFrame", poseStartFrame + frame);
        fl.getDocumentDOM().setElementProperty("loop", "single frame");
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
            var firstFrame = lipsyncMap[DIPHTHONG_ORDERING[diphthongMap[frame]][i]];
            fl.getDocumentDOM().setElementProperty("firstFrame", poseStartFrame + firstFrame);
            fl.getDocumentDOM().setElementProperty("loop", "single frame");
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
var characterTimeline = fl.getDocumentDOM().selection[0].libraryItem.timeline; // get the timeline of the selected symbol
var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet");
if (xSheetLayerIndex == undefined) {
    xSheetLayerIndex = 0; // assume it's at 0 if somehow it doesn't find it
}
var poseFrame = fl.getDocumentDOM().getElementProperty("firstFrame");
var poseStartFrame = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].startFrame;
fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; // unlock layer
var cfgPath = fl.browseForFileURL("select"); // get file for specific voice line
fl.runScript(cfgPath);
//actual execution
placeKeyframes(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().getSelectedLayers(), OFFSET_MAP, poseStartFrame);