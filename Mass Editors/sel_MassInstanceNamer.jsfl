var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];
function setup() {
	if (startingFrame > endFrame) { // if selection is backwards, fix it
		var temp = endFrame;
		endFrame = startingFrame;
		startingFrame = temp;
	}
	fl.getDocumentDOM().getTimeline().layers[selLayerIndex * 1].locked = false; // unlock layer
}
setup();
var name = prompt("Enter instance name:");
var delta = 0;
	for (var i = startingFrame; i < endFrame - 1; i++) {
		if (!fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].isEmpty && fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].startFrame == i) {
			// Move the frame (the most important line of the script)
			fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].elements[0].name = name;
		}
	}