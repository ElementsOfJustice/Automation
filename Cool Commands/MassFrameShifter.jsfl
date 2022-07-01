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
var delta = parseInt(prompt("Enter the frames to shift each keyframe by (positive = forward, negatve = backward)"));


for(var i = startingFrame; i < endFrame - 1; i++) {
	if(fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame == i) {
		// select frame at loop index
		doc.getTimeline().setSelectedFrames(i, i+1);
		// Move the frame (the most important line of the script)
		fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].firstFrame += delta;
		// ?? set the last frame property to what it already is ??
		an.getDocumentDOM().setElementProperty('lastFrame', (an.getDocumentDOM().getElementProperty('lastFrame') + delta) * 1);
	}
}