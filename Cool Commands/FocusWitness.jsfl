/******************************************************************************
FOCUS WITNESS
Description: 

Tutorial Available in the MEGA: https://mega.nz/fm/qlIkjDSA
******************************************************************************/

BACKGROUND_LAYER_NAME = "BACKGROUNDS";

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

/*
Function: makeBackgroundKeyframe
Variables: None
Description: Make a keyframe on the background layer
*/
function makeBackgroundKeyframe() {
    var witnessX = fl.getDocumentDOM().getElementProperty("x"); // get the number contained in the x property
    // reset the selection
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), fl.getDocumentDOM().getTimeline().currentFrame);
    // is the current frame the starting frame of the keyframe?
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of that
    // if it isn't...
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // keyframe for new position
        // reset the selectionX
        resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), fl.getDocumentDOM().getTimeline().currentFrame);
    }
    // is the specified layer locked?
    var isLocked = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked;
    // if it is...
    if (isLocked) {
        // unlock layer
        fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; 
        // reset the selection
        resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), fl.getDocumentDOM().getTimeline().currentFrame);
    }
    // set background x to make the sum it and the witness x 0, thereby centering the witness!
    fl.getDocumentDOM().setElementProperty("x", Math.round(-1 * witnessX)); 
    // reset lock status
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = isLocked; 
}

/*
>>>MAIN<<<
Description: 
Documentation for getRigParentAtFrame function
https://github.com/AdobeDocs/developers-animatesdk-docs/blob/master/Layer_Parenting_Object/layerParenting1.md
*/
// save the indexes of the selected layers
var selectedLayer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
// if... (see error)
if (fl.getDocumentDOM().getTimeline().layers[selectedLayer].getRigParentAtFrame(fl.getDocumentDOM().getTimeline().currentFrame) == undefined || fl.getDocumentDOM().getTimeline().layers[selectedLayer].getRigParentAtFrame(fl.getDocumentDOM().getTimeline().currentFrame).name != BACKGROUND_LAYER_NAME) {
    throw new Error("Character layer is not parented to the background layer (or the background layer is not named " + BACKGROUND_LAYER_NAME + ").");
}
// unlock character layer
fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; 
makeBackgroundKeyframe();