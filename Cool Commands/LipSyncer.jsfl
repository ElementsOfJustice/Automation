/******************************************************************************
LIP SYNCER
Description:
HOW TO USE THIS SCRIPT: https://www.youtube.com/watch?v=I-YhWTgXB4E
******************************************************************************/
// Create Variables
var scriptPath = fl.scriptURI;
// Creates a GUI window in Animate using the given XML file
var firstFrameGuess = fl.getDocumentDOM().getTimeline().layers[layer].frames[startingFrame].elements[0].firstFrame;
var guiPanel = fl.xmlPanelFromString("<dialog title=\"The Lip Syncer\" buttons=\"accept, cancel\">vbox><hbox><label value=\"First Frame of Lip Flap:\" control=\"panel_FF\"/><textbox id=\"panel_FF\" size=\"24\" value=\"" + (firstFrameGuess + 1) + "\" /></hbox><hbox><label value=\"Duration of Lip Flap:\" control=\"panel_dur\"/><textbox id=\"panel_dur\" size=\"24\" value=\"\" /></hbox></vbox></dialog>");

// get the adobe animate file and info inside
var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
// Store frames selected by the user
var frameSelection = timeline.getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];
/*
Function: makeLipFlap
Variables:  
	midPointDelta ()
	lengthOffset ()
Description: 
*/
function makeLipFlap(midPointDelta, lengthOffset) {
	timeline.currentFrame += midPointDelta;
	timeline.convertToKeyframes(timeline.currentFrame);
	fl.getDocumentDOM().getTimeline().layers[layer].frames[timeline.currentFrame].elements[0].firstFrame 
		= firstFrameOfLipFlap + (lipFlapLength - lengthOffset);
}
// If the user pushes "ok" as opposed to "cancel"
if (guiPanel.dismiss == "accept") {
	// store user input
	var lipFlapLength = parseInt(guiPanel.panel_dur);
	var firstFrameOfLipFlap = parseInt(guiPanel.panel_FF) - 1; 
	// ?? subtract 1 because the user sees a 1 based index ??
	// create a new array
	var keyFrameArr = [];
	// from the starting frame to the ending frame...
	for (var i = startingFrame; i < endFrame; i++) {
		// if the start frame of the current keyframe is the same as the index frame...
		if (fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame == i) {
			// add the current frame to the key frame array
			keyFrameArr.push(i);
			// note: the elements used here are symbolInstance objects which inherit element properties
			// Set the first frame of the symbol to the first frame of the lip flap
			fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].firstFrame = firstFrameOfLipFlap;
			fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].lastFrame = (firstFrameOfLipFlap + lipFlapLength) - 1;
			// set the loop so it plays once and stops
			fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].loop = "play once";
		}
	}
	// for every key frame...
	for (var i = 0; i < keyFrameArr.length; i++) {
		// move the playhead to the loop's current keyframe
		timeline.currentFrame = keyFrameArr[i];
		// store the duration of the current key frame
		var dur = fl.getDocumentDOM().getTimeline().layers[layer].frames[keyFrameArr[i]].duration;
		// if the keyframe duration is greater than the duration of a lip flap
		if (dur > lipFlapLength) {
			// move the playhead forward by the duration of the lip flap
			// advance playhead by the duration of the lip flap
			timeline.currentFrame += lipFlapLength;
			// if we aren't at the beginning of the keyframe anymore 
			// (?? which honestly should always be the case unless lipFlapLength == 0 ??)
			if (timeline.layers[layer].frames[timeline.currentFrame].startFrame != timeline.currentFrame) {
				// convert the frame at the current playhead to a keyframe
				timeline.convertToKeyframes(timeline.currentFrame);
				// 
				fl.getDocumentDOM().getTimeline().layers[layer].frames[timeline.currentFrame].elements[0].loop = "single frame";
			} else {
				fl.getDocumentDOM().getTimeline().layers[layer].frames[timeline.currentFrame].elements[0].loop = "play once";
			}
			fl.getDocumentDOM().getTimeline().layers[layer].frames[timeline.currentFrame].elements[0].firstFrame = firstFrameOfLipFlap - 1;
			continue;
		} else if (dur == lipFlapLength) {
			continue;
		}
		switch (dur) { // fuck logic i'll do it case by case (not anymore!)
			case 2:
				fl.getDocumentDOM().getTimeline().layers[layer].frames[keyFrameArr[i]].elements[0].firstFrame = firstFrameOfLipFlap + (lipFlapLength - 2);
				break;
			default:
				makeLipFlap(Math.floor(dur / 2), Math.floor(dur / 2) + dur % 2);
				break;
		}
	}
}