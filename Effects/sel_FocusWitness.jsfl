/******************************************************************************
FOCUS WITNESS
Description: For use with multi-witness cross examination. Centers the
selected witness but does not create the slide animation from the previous
wittness to the current witness. For slide animation creation, see the
MakeWitnessPan.jsfl script.

Tutorial Available in the MEGA: https://mega.nz/fm/qlIkjDSA
******************************************************************************/

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

/*
Function: selectOrMakeKeyframe
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: selects the keyframe if there's one there, or makes one if there isn't
*/
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

// main
var selectedLayer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var initX = fl.getDocumentDOM().getElementProperty("x");
fl.getDocumentDOM().align('horizontal center', true);
var deltaX = initX - fl.getDocumentDOM().getElementProperty("x");
for(var l = 0; l < fl.getDocumentDOM().getTimeline().layers.length; l++) {
    if (l != selectedLayer && fl.getDocumentDOM().getTimeline().layers[l].layerType == "normal" && !arrayContains(EXCLUDED_LAYERS, fl.getDocumentDOM().getTimeline().layers[l].name, isEqual) && !fl.getDocumentDOM().getTimeline().layers[l].frames[curFrame].isEmpty) {
        fl.getDocumentDOM().getTimeline().layers[l].locked = false;
        selectOrMakeKeyframe(l, curFrame);
        fl.getDocumentDOM().setElementProperty("x", fl.getDocumentDOM().getElementProperty("x") - deltaX);
    }
}