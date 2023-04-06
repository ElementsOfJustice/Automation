/******************************************************************************
MAKE WITNESS PAN
Description: For use with multi-witness cross examination. Animates a slide
from one witness to the other.
Tutorial Available in the MEGA: https://mega.nz/fm/qlIkjDSA
******************************************************************************/

//general assumptions
SWIPE_LENGTH = 14;
EXCLUDED_LAYERS = ["TEXT", "TEXTBOX"];

function isEqual(a, b) {
    return a == b;
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

function selectOrMakeKeyframe(layer, frame) {
    resetSelection(layer, frame); // select layer and frame
    // if the current frame isn't the first frame in a frame sequence, make a note of that
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
    // if it isn't...
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // keyframe for new position
        resetSelection(layer, frame); // select layer and frame
    }
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
        // unlock layer
        fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false;
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
    selectOrMakeKeyframe(witnessLayerIndex, startFrame);
    fl.getDocumentDOM().getTimeline().insertFrames(SWIPE_LENGTH - 1, true); // insert frames to all layers
    // resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), startFrame); // select background
    // // if the current frame isn't the first frame in a frame sequence, make a note of that
    // var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; 
    // // if it isn't...
    // if (!isKeyFrame) {
    //     fl.getDocumentDOM().getTimeline().insertKeyframe(); // put keyframe for start of swipe
    // }
    fl.getDocumentDOM().getTimeline().layers[witnessLayerIndex].locked = false; // unlock witness layer
    selectOrMakeKeyframe(witnessLayerIndex, fl.getDocumentDOM().getTimeline().currentFrame); //reset the selection
    var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
    var initX = fl.getDocumentDOM().getElementProperty("x");
    fl.getDocumentDOM().align('horizontal center', true);
    var deltaX = initX - fl.getDocumentDOM().getElementProperty("x");
    for (var l = 0; l < fl.getDocumentDOM().getTimeline().layers.length; l++) {
        if (fl.getDocumentDOM().getTimeline().layers[l].layerType == "normal" && !arrayContains(EXCLUDED_LAYERS, fl.getDocumentDOM().getTimeline().layers[l].name, isEqual) && !fl.getDocumentDOM().getTimeline().layers[l].frames[curFrame].isEmpty) {
            fl.getDocumentDOM().getTimeline().layers[l].locked = false;
            selectOrMakeKeyframe(l, curFrame);
            if (l != selectedLayer)
                fl.getDocumentDOM().setElementProperty("x", fl.getDocumentDOM().getElementProperty("x") - deltaX);
            selectOrMakeKeyframe(l, startFrame);
            fl.getDocumentDOM().getTimeline().createMotionTween(); // create the CLASSIC tween 
            fl.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 11, 0); // set tween to quint ease in out
        }
    }
}


/*
>>>MAIN<<<
Description: 
*/
var selectedLayer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
createTween(selectedLayer);