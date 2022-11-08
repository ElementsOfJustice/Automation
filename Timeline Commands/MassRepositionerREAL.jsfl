/******************************************************************************
MASS FRAME SHIFTER
Description: Shift selected frames by a number of frames specified by the user.
******************************************************************************/

// store document object and other objects in the doc
var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

// store indexes of frames selected by the user
var frameSelection = timeline.getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];

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
    fl.getDocumentDOM().getTimeline().layers[selLayerIndex * 1].locked = false; // unlock layer
}

setup();
// prompt the user for a number of frames to shift by
// var X = parseFloat(prompt("Enter the X coordinate to set to"));
// var Y = parseFloat(prompt("Enter the Y coordinate to set to"));


for (var i = startingFrame; i < endFrame - 1; i++) {
    if (fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame == i) {
        // Move the frame (the most important line of the script)
        // set the last frame property to what it already is plus the frames to shift by
        fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].x = 2346.8;
        fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].y = -335.95;
    }
}