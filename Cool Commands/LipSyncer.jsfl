// HOW TO USE THIS SCRIPT: https://www.youtube.com/watch?v=I-YhWTgXB4E

var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

var frameSelection = timeline.getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];
var firstFrameGuess = fl.getDocumentDOM().getTimeline().layers[layer].frames[startingFrame].elements[0].firstFrame;
var guiPanel = fl.xmlPanelFromString("<dialog title=\"The Lip Syncer\" buttons=\"accept, cancel\">vbox><hbox><label value=\"First Frame of Lip Flap:\" control=\"panel_FF\"/><textbox id=\"panel_FF\" size=\"24\" value=\"" + (firstFrameGuess + 1) + "\" /></hbox><hbox><label value=\"Duration of Lip Flap:\" control=\"panel_dur\"/><textbox id=\"panel_dur\" size=\"24\" value=\"\" /></hbox></vbox></dialog>");


if (guiPanel.dismiss == "accept") {
	var lipFlapLength = parseInt(guiPanel.panel_dur);
	var firstFrameOfLipFlap = parseInt(guiPanel.panel_FF) - 1;


	var keyFrameArr = [];

	for (var i = startingFrame; i < endFrame; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame == i) {
			keyFrameArr.push(i);
			fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].firstFrame = firstFrameOfLipFlap;
			fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].lastFrame = (firstFrameOfLipFlap + lipFlapLength) - 1;
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