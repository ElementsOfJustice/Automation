BACKGROUND_LAYER_NAME = "BACKGROUNDS";

function makeBackgroundKeyframe() {
    var witnessX = fl.getDocumentDOM().getElementProperty("x");
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), fl.getDocumentDOM().getTimeline().currentFrame);
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of that
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // keyframe for new position
        resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), fl.getDocumentDOM().getTimeline().currentFrame);
    }
    var isLocked = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked;
    if (isLocked) {
        fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; // unlock layer
        resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), fl.getDocumentDOM().getTimeline().currentFrame);
    }
    fl.getDocumentDOM().setElementProperty("x", Math.round(-1 * witnessX)); // set background x to make the sum it and the witness x 0, thereby centering the witness!
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = isLocked; // reset lock status
}

/*
>>>MAIN<<<
Description: 
*/
var selectedLayer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
if (fl.getDocumentDOM().getTimeline().layers[selectedLayer].getRigParentAtFrame(fl.getDocumentDOM().getTimeline().currentFrame) == undefined || fl.getDocumentDOM().getTimeline().layers[selectedLayer].getRigParentAtFrame(fl.getDocumentDOM().getTimeline().currentFrame).name != BACKGROUND_LAYER_NAME) {
    throw new Error("Character layer is not parented to the background layer (or the background layer is not named " + BACKGROUND_LAYER_NAME + ").");
}
makeBackgroundKeyframe();