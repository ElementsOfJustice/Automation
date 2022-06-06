/******************************************************************************
LIP SYNCER
Description:

HOW TO USE THIS SCRIPT: https://www.youtube.com/watch?v=I-YhWTgXB4E
******************************************************************************/

// Create Variables
var scriptPath = fl.scriptURI;
// set dirURL to the path up to the last / character (i.e. just the path)
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
// Creates a GUI window in Animate using the given XML file
var guiPanel = fl.xmlPanelFromString("<dialog title=\"The Lip Syncer\" buttons=\"accept, cancel\">vbox><hbox><label value=\"First Frame of Lip Flap:\" control=\"panel_FF\"/><textbox id=\"panel_FF\" size=\"24\" value=\"\" /></hbox><hbox><label value=\"Duration of Lip Flap:\" control=\"panel_dur\"/><textbox id=\"panel_dur\" size=\"24\" value=\"\" /></hbox></vbox></dialog>");

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

if (guiPanel.dismiss == "accept") {
	var lipFlapLength = parseInt(guiPanel.panel_dur);
	var firstFrameOfLipFlap = parseInt(guiPanel.panel_FF) - 1;


	var keyFrameArr = [];

	for (var i = startingFrame; i < endFrame; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame == i) {
			keyFrameArr.push(i);
			fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].firstFrame = firstFrameOfLipFlap;
			fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].loop = "play once";
		}
	}


	function makeLipFlap(midPointDelta, lengthOffset) {
		timeline.currentFrame += midPointDelta;
		timeline.convertToKeyframes(timeline.currentFrame);
		fl.getDocumentDOM().getTimeline().layers[layer].frames[timeline.currentFrame].elements[0].firstFrame = firstFrameOfLipFlap + (lipFlapLength - lengthOffset);
	}

	for (var i = 0; i < keyFrameArr.length; i++) {
		timeline.currentFrame = keyFrameArr[i];
		var dur = fl.getDocumentDOM().getTimeline().layers[layer].frames[keyFrameArr[i]].duration;
		if (dur > lipFlapLength) {
			timeline.currentFrame += lipFlapLength;
			if (timeline.layers[layer].frames[timeline.currentFrame].startFrame != timeline.currentFrame) {
				timeline.convertToKeyframes(timeline.currentFrame);
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