/******************************************************************************
MAKE SHAKE
Description: Create a shake effect for selected frames
Tutorial Available in the MEGA: https://mega.nz/fm/qlIkjDSA
******************************************************************************/

// Create Variables
// set scriptPath to "/path/../MakeShake.jsfl"
var scriptPath = fl.scriptURI;
// set dirURL to the path up to the last / character (i.e. just the path)
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
// Creates a GUI window in Animate using the given XML file
var guiPanel = fl.getDocumentDOM().xmlPanel(dirURL + "/MakeShake.xml");
// save important frames to variables
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
	fl.getDocumentDOM().getTimeline().currentFrame = startingFrame;
	fl.getDocumentDOM().getTimeline().layers[selLayerIndex * 1].locked = false; // unlock layer
}

// If the user pushes "ok" as opposed to "cancel"
if (guiPanel.dismiss == "accept") {
	setup();
	// get the adobe animate file and info inside
	var doc = fl.getDocumentDOM();
	var timeline = doc.getTimeline();
	var layer = timeline.getSelectedLayers();
	var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

	// Store the frames the user has selected on the timeline in an array
	var frameSelection = timeline.getSelectedFrames();

	// number of frames from start to end
	var range = endFrame - startingFrame;

	// set the shake intensity to the user's input
	var intensity = guiPanel.panel_int;
	// "true" string if user checked
	var taperOff = guiPanel.panel_taperOff;
	// Save the current matrix for the current frame
	var mat = timeline.layers[layer].frames[timeline.currentFrame].elements[0].matrix;

	// from the starting frame to the ending frame...
	for (var i = startingFrame; i < endFrame - 1; i++) {
		// if we aren't at the starting frame 
		if (fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame != i) {
			//  convert the current frame to a key frame 
			timeline.convertToKeyframes(timeline.currentFrame);
		}
		// Reset the frame to its original position to create the shake effect
		timeline.layers[layer].frames[timeline.currentFrame].elements[0].matrix = mat;
		var randX = Math.random() - 0.5;
		var randY = Math.random() - 0.5;
		// the change in x and the change in y
		var deltaX = 0;
		var deltaY = 0;
		// if the GUI box is checked...
		if (taperOff == "true") {
			// double intensity times our random value... 
			deltaX = ((2 * intensity) * randX) // times the percentage of frames remaining
				* (1 - (((i - startingFrame) / range)));
			deltaY = ((2 * intensity) * randY)
				* (1 - (((i - startingFrame) / range)));
			// So the change in x and y will reduce as we get closer to the end
			// of the frame selection
		}
		// as opposed to...
		else {
			// just double intensity times our random value
			deltaX = ((2 * intensity) * randX);
			deltaY = ((2 * intensity) * randY);
		}
		// Move the frame's registration point by our changes in x and y
		fl.getDocumentDOM().getTimeline().layers[layer].frames[timeline.currentFrame].elements[0].x += deltaX;
		fl.getDocumentDOM().getTimeline().layers[layer].frames[timeline.currentFrame].elements[0].y += deltaY;
		// Advance the current frame on Animate's timeline
		timeline.currentFrame += 1;
	}
	// Reset the frame back to the starting position once more.
	timeline.layers[layer].frames[timeline.currentFrame].elements[0].matrix = mat;
}