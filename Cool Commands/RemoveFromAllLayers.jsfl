/******************************************************************************
REMOVE FROM ALL LAYERS
Description: Take the number of frames selected by the user on one layer
and remove that number of frames from all layers in the same location.
(This is to prevent desync)
******************************************************************************/

// store frames selected by the user
var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = fl.getDocumentDOM().getTimeline().currentLayer;
var firstFrame = selectedFrames[1];
var lastFrame = selectedFrames[2];
// if the user selected frames from right to left like a weirdo
function setup() {
    if (firstFrame > lastFrame) {
        // switch it so it's normal
        var temp = firstFrame;
        firstFrame = lastFrame;
        lastFrame = temp;
    }
}

setup();
// initialize array
var selectionArray = [];
// for all layers
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
    // add the layer index, the first frame index, and the last frame index to the array
    // essentially expanding the user's selection to all layers
    selectionArray.push(i, firstFrame, lastFrame);
}
// select the frames stored in the for loop.
fl.getDocumentDOM().getTimeline().setSelectedFrames(selectionArray);
// The Line that makes this script different from its counterpart - INSERT to all Layers
// delete selected frames from all layers instead of just what was originally selected
fl.getDocumentDOM().getTimeline().removeFrames();
// set the selection back to the user's original selection
fl.getDocumentDOM().getTimeline().setSelectedFrames([layer, firstFrame, lastFrame]);