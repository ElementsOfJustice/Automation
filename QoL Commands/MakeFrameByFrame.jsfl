/******************************************************************************
MAKE FRAME BY FRAME
Description: 

******************************************************************************/

var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];

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

/*
Function: setup
Variables: None
Description: If the user makes a frame selection from right to left instead of 
left to right, the starting frame will be the last frame and the ending frame
will be the first. We need to ensure things are consistent.
*/
function setup() {
    if (startingFrame > endFrame) { // if selection is backwards, fix it
        var temp = endFrame;
        endFrame = startingFrame;
        startingFrame = temp;
    }
    fl.getDocumentDOM().getTimeline().currentFrame = startingFrame;
    fl.getDocumentDOM().getTimeline().layers[selLayerIndex * 1].locked = false; // unlock layer
}

// MAIN
setup();
var interval = prompt("Enter keyframe interval (enter comma separated values (no spaces) to alternate):");
if (interval != null) {
    var droppedFrames = prompt("Enter number of frames to drop on each keyframe (must be negative for reverse):");
}
if (interval != null && droppedFrames != null) {
    interval = interval.split(",");
    var intervalIndex = 0;
    for (var i = startingFrame; i < endFrame; i += parseInt(interval[intervalIndex])) {
        selectOrMakeKeyframe(selLayerIndex, i);
        fl.getDocumentDOM().setElementProperty("firstFrame", fl.getDocumentDOM().getElementProperty("firstFrame") + parseInt(droppedFrames));
        intervalIndex = (intervalIndex == interval.length - 1) ? 0 : intervalIndex + 1; // loop back to start of intervals
    }
}