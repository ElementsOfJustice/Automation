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

//TODO: search for the blinking persistent data. If it does not exist, tell the user and quit
var characterName = fl.getDocumentDOM().selection[0].libraryItem.name;
var characterTimeline = fl.getDocumentDOM().selection[0].libraryItem.timeline; // get the timeline of the selected symbol
var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet"); // get the integer index of layer "xSheet"
if (xSheetLayerIndex == undefined) {
    xSheetLayerIndex = 0; // assume it's at 0 if somehow it doesn't find it
}
var poseFrame = fl.getDocumentDOM().getElementProperty("firstFrame"); // get the index in the firstFrame property
// in the character timeline, obtain the name of the pose as it stands on the given frame
var poseName = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].name;
var firstFrameOfBlink = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".blink")[0];
var blinkLength = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".blink")[1];
if (firstFrameOfBlink == undefined || blinkLength == undefined) {
    characterName = characterName.substring(characterName.lastIndexOf("/") + 1);
    firstFrameOfBlink = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".blink")[0];
    blinkLength = fl.getDocumentDOM().getDataFromDocument(characterName + "." + poseName + ".blink")[1];
    if (firstFrameOfBlink == undefined || firstFrameOfBlink == undefined) {
        throw new Error("Blink data not found. Use InsertBlinkData to create it.");
    }
}
selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
fl.getDocumentDOM().setElementProperty("loop", "loop");
fl.getDocumentDOM().setElementProperty("firstFrame", firstFrameOfBlink - 1); // it's one indexed
selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame + blinkLength);
fl.getDocumentDOM().setElementProperty("loop", "single frame");
