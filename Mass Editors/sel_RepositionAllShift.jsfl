/******************************************************************************
REPOSITION ALL
Description: 

******************************************************************************/


// store document object and other objects in the doc
var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var originalCurFrame = fl.getDocumentDOM().getTimeline().currentFrame;

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

var selLayer = fl.getDocumentDOM().getTimeline().currentLayer;
var deltaX = parseFloat(prompt("Shift X:")), deltaY = parseFloat(prompt("Shift Y:"));

if (deltaX !== undefined && deltaY !== undefined && !isNaN(deltaX) && !isNaN(deltaY)) {
    var curFrame = startingFrame, numFrames = endFrame + 1;
    while (curFrame < numFrames - 1) {
        if (fl.getDocumentDOM().getTimeline().layers[selLayer].frames[curFrame].elements.length > 0) {
            fl.getDocumentDOM().getTimeline().layers[selLayer].frames[curFrame].elements[0].x += deltaX;
            fl.getDocumentDOM().getTimeline().layers[selLayer].frames[curFrame].elements[0].y += deltaY;
        }
        curFrame += fl.getDocumentDOM().getTimeline().layers[selLayer].frames[curFrame].duration;
    }
}

fl.getDocumentDOM().getTimeline().setSelectedFrames(startingFrame, endFrame); 
fl.getDocumentDOM().getTimeline().currentFrame = originalCurFrame;