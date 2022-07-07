/******************************************************************************
MAKE WITNESS PAN
Description: 
******************************************************************************/

//general assumptions
SWIPE_LENGTH = 14;
BACKGROUND_LAYER_NAME = "BACKGROUNDS";

/*
Function: resetSelection
Variables:  
	layer [Integer index of a layer]
    frame [Integer index of a frame]
Description: 
*/
function resetSelection(layer, frame) { // sets selection the desired layer and frame
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true); // select frame on the layer and replace current selection
}

/*
Function: makeBackgroundKeyframe
Variables: None
Description: 
*/
function makeBackgroundKeyframe() {
    var witnessX = fl.getDocumentDOM().getElementProperty("x");
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), fl.getDocumentDOM().getTimeline().currentFrame);
    // if the current frame is the first frame in a frame sequence, make a note of that
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; 
    // If, on the other hand, it isn't...
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // keyframe for new position
        // call the above declared resetSelection function
        resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), fl.getDocumentDOM().getTimeline().currentFrame);
    }
    // layer.locked returns a boolean value. If true, the layer is locked.
    var isLocked = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked;
    // if the layer is locked...
    if (isLocked) {
        fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; // unlock layer
        // call the above declared resetSelection function
        resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), fl.getDocumentDOM().getTimeline().currentFrame);
    }
    fl.getDocumentDOM().setElementProperty("x", Math.round(-1 * witnessX)); // set background x to make the sum it and the witness x 0, thereby centering the witness!
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = isLocked; // reset lock status
}

/*
Function: createTween
Variables:  
	witnessLayerIndex [Integer index of a layer]
Description: 
*/
function createTween(witnessLayerIndex) {
    var startFrame = fl.getDocumentDOM().getTimeline().currentFrame;
    fl.getDocumentDOM().getTimeline().insertFrames(SWIPE_LENGTH - 1, true); // insert frames to all layers
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), startFrame); // select background
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of that
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // put keyframe for start of swipe
    }
    fl.getDocumentDOM().getTimeline().currentFrame += SWIPE_LENGTH;
    resetSelection(witnessLayerIndex, fl.getDocumentDOM().getTimeline().currentFrame);
    makeBackgroundKeyframe();
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), startFrame);
    fl.getDocumentDOM().getTimeline().createMotionTween(); // create the CLASSIC tween 
    fl.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 11, 0); // set tween to quint ease in out
}


/*
>>>MAIN<<<
Description: 
*/
var selectedLayer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
if (fl.getDocumentDOM().getTimeline().layers[selectedLayer].getRigParentAtFrame(fl.getDocumentDOM().getTimeline().currentFrame) == undefined || fl.getDocumentDOM().getTimeline().layers[selectedLayer].getRigParentAtFrame(fl.getDocumentDOM().getTimeline().currentFrame).name != BACKGROUND_LAYER_NAME) {
    throw new Error("Character layer is not parented to the background layer (or the background layer is not named " + BACKGROUND_LAYER_NAME + ").");
}
createTween(selectedLayer);