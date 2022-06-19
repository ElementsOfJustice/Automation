/******************************************************************************
INSERT TO ALL LAYERS
Description: 
******************************************************************************/

// store frames selected by the user
var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = fl.getDocumentDOM().getTimeline().currentLayer;
var firstFrame = selectedFrames[1];
var lastFrame = selectedFrames[2];
// if the user selected frames from right to left like a weirdo
if(firstFrame > lastFrame) {
    // switch it so it's normal
    var temp = firstFrame;
    firstFrame = lastFrame;
    lastFrame = temp;
}
// initialize array
var selectionArray = [];
// for all layers
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
    // add the layer index, the first frame index, and the last frame index to the array
    selectionArray.push(i, firstFrame, lastFrame);
}
// 
fl.getDocumentDOM().getTimeline().setSelectedFrames(selectionArray);
// The Line that makes this script different from its counterpart - REMOVE from all Layers
//
fl.getDocumentDOM().getTimeline().insertFrames();
// set the selection back to the user's original selection
fl.getDocumentDOM().getTimeline().setSelectedFrames([layer, firstFrame, lastFrame]);