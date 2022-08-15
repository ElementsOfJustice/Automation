// store indexes of frames selected by the user
var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
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
var layer = prompt("Enter the layer to parent to.");
if(fl.getDocumentDOM().getTimeline().findLayerIndex(layer) == undefined) {
    throw new Error("Invalid layer name: " + layer);
}
for(var i = startingFrame; i < endFrame - 1; i++) {
	if(fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].startFrame == i) {
		fl.getDocumentDOM().getTimeline().layers[selLayerIndex].setRigParentAtFrame(fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(layer)], i)
	}
}