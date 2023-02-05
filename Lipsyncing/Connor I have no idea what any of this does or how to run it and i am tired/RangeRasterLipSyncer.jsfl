/******************************************************************************
RASTER LIP SYNC
Description: 
******************************************************************************/

END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;

function setup() {
    fl.showIdleMessage(false);
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; // unlock layer
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

function placeKeyframes(voiceLineStartFrame, startFrame, layer, lipsyncMap, poseName, endFrame) {
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
            if(PHONEME_TO_MOUTH_SHAPE[phoneme] == "No Talking" && lipsyncMap[poseName][PHONEME_TO_MOUTH_SHAPE[phoneme]] === undefined) { // some poses don't have the no talking mouth shape defined
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

//MAIN
// input validation

// MAIN
var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames(); // this has the format [layer, firstframe, lastframe...]
// data validation
if ((selectedFrames.length != 6 && selectedFrames.length != 9) || selectedFrames[0] != selectedFrames[3]) {
    throw new Error("Invalid selection. Select two or three frames on the same layer: one frame indicating the beginning of a voice line, one indicating when to change poses, and an optional third indicating when to stop.");
}
if (selectedFrames.length == 9 && (selectedFrames[0] != selectedFrames[6] || selectedFrames[3] != selectedFrames[6])) {
    throw new Error("Invalid selection. Select two or three frames on the same layer: one frame indicating the beginning of a voice line, one indicating when to change poses, and an optional third indicating when to stop.");
}
var secondSelectedFrame = fl.getDocumentDOM().getTimeline().layers[selectedFrames[3]].frames[selectedFrames[4]];
var hasThreeSelected = false;
if (selectedFrames.length == 9) {
    hasThreeSelected = true;
}
setup();
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
var characterTimeline = secondSelectedFrame.elements[0].libraryItem.timeline; // get the timeline of the selected symbol
var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet");
if (xSheetLayerIndex == undefined) {
    xSheetLayerIndex = 0; // assume it's at 0 if somehow it doesn't find it
}
var poseFrame = secondSelectedFrame.elements[0].firstFrame;
var poseName = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].name;
var availablePoses = getKeys(CHARACTER_NAME_TO_MAP[layerName]);
if (!arrayContains(availablePoses, poseName, stringContains)) {
    throw new Error("Invalid pose. Either: you put the character in the non-talking pose OR you are using an incompatible pose. For incompatbile poses, refer to the Automation Guide for help. Currently set pose is: " + poseName);
}
var cfgPath = fl.browseForFileURL("select"); // get file for specific voice line
fl.runScript(cfgPath);
if (poseName.substring(poseName.lastIndexOf(" ")) != " Talk") {
    poseName = poseName.substring(0, poseName.lastIndexOf(" ")); // if it's passed all other data validation and this line runs, that means the pose is one of Athena's (widget emotion at the end). Get rid of the emotion.
}
//actual execution
placeKeyframes(selectedFrames[1], selectedFrames[4], fl.getDocumentDOM().getTimeline().getSelectedLayers(), CHARACTER_NAME_TO_MAP[layerName], poseName, selectedFrames[7]);