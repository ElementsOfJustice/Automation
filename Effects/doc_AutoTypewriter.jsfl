// constants
TYPEFACE_NAME = "Suburga 2 Semicondensed Regular"; // sometimes it's "Suburga 2 Semicondensed Regular", other times it's "Suburga 2" Swap it if this script isn't working.
FRAMES_BETWEEN_LETTERS = 3;
FRAMES_BETWEEN_WORDS = 6;
TEXT_LAYER_1 = "TEXT";
TEXT_LAYER_2 = "TEXT2";
SFX_LAYER = "sfx_1";
TYPEWRITER_SFX_NAME = "AUDIO/SFX/sfx-typewriter.wav";
AVERAGE_CHARACTER_WIDTH = 20;
SCALE = fl.getDocumentDOM().width / 1280.0;
// a bunch of magic numbers soundman came up with (left and right values of timeBounding and locationBounding don't matter)
var dialogueBounding = {
	left: 40.05 * SCALE,
	top: 549.5 * SCALE,
	right: 1212.95 * SCALE,
	bottom: 708.95 * SCALE
};
var timeBounding = {
	left: 69 * SCALE,
	top: 560 * SCALE,
	right: 420 * SCALE,
	bottom: 620 * SCALE
}; // L 435 R 845
var locationBounding = {
	left: 69 * SCALE,
	top: 620 * SCALE,
	right: 420 * SCALE,
	bottom: 670 * SCALE
};

//UTILITY FUNCTIONS
/*
Function: resetSelection
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: sets selection to the desired layer and frame
*/
function resetSelection(layer, frame) {
	fl.getDocumentDOM().getTimeline().currentFrame = frame;
	// select frame on the layer and replace current selection
	fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}

function typewriterFormat() {
	fl.getDocumentDOM().setElementTextAttr("face", TYPEFACE_NAME);
	fl.getDocumentDOM().setElementProperty('fontRenderingMode', 'standard');
	fl.getDocumentDOM().setElementTextAttr("size", 40 * SCALE);
	fl.getDocumentDOM().setElementTextAttr("fillColor", 0x00FF33);
	fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
	fl.getDocumentDOM().setElementTextAttr("lineSpacing", 1);
	fl.getDocumentDOM().setElementTextAttr("alignment", "left");
	fl.getDocumentDOM().setElementProperty('textType', 'static');
	// fl.getDocumentDOM().setElementProperty('lineType', 'multiline');
	fl.getDocumentDOM().distribute("horizontal center", true);
}

function evidenceFormat() {
	fl.getDocumentDOM().setElementTextAttr("face", TYPEFACE_NAME);
	fl.getDocumentDOM().setElementProperty('fontRenderingMode', 'standard');
	fl.getDocumentDOM().setElementTextAttr("size", 40 * SCALE);
	fl.getDocumentDOM().setElementTextAttr("fillColor", 0x008fff);
	fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
	fl.getDocumentDOM().setElementTextAttr("lineSpacing", 1);
	fl.getDocumentDOM().setElementTextAttr("alignment", "left");
	fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
	fl.getDocumentDOM().setElementProperty('lineType', 'multiline');
	fl.getDocumentDOM().distribute("horizontal center", true);
}

function getAlignment(text, topBounding, bottomBounding) { // creates a textbox of just the right bounding for this purpose (left and right values of initial bounding box don't matter)
	fl.getDocumentDOM().addNewText({
		left: 393.9 * SCALE,
		top: topBounding,
		right: 500 * SCALE,
		bottom: bottomBounding
	});
	fl.getDocumentDOM().setElementProperty('autoExpand', true);
	fl.getDocumentDOM().setElementProperty('textType', 'static');
	fl.getDocumentDOM().setTextString(text);
	typewriterFormat();
	fl.getDocumentDOM().setElementTextAttr("autoExpand", false);
	fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
	var mat = fl.getDocumentDOM().getElementProperty("matrix");
	var width = fl.getDocumentDOM().getElementProperty("width");
	fl.getDocumentDOM().deleteSelection();
	return {
		left: mat.tx,
		right: mat.tx + width,
		top: topBounding,
		bottom: bottomBounding
	};
}

function makeIntroText(text, bounding, layer, startFrame) {
	var curFrame = startFrame;
	resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(layer), 0);
	var ailgnRect = getAlignment(text, bounding.top, bounding.bottom);
	for (var i = 0; i < text.length; i++) {
		var curText = text.slice(0, i + 1); // get the portion of text that should be shown at this frame
		resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(layer), curFrame);
		var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of that
		if (!isKeyFrame) {
			fl.getDocumentDOM().getTimeline().insertKeyframe();
			resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(layer), curFrame);
		}
		if (i == 0) {
			fl.getDocumentDOM().addNewText(bounding);
		}
		resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(layer), curFrame);
		fl.getDocumentDOM().setTextString(curText);
		fl.getDocumentDOM().setTextRectangle(ailgnRect);
		resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(layer), curFrame);
		typewriterFormat();
		if (text.charAt(i) != ' ') {
			resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(SFX_LAYER), curFrame);
			isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of thata
			if (!isKeyFrame) {
				fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
				resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(SFX_LAYER), curFrame);
			}
			fl.getDocumentDOM().addItem({
				x: 0,
				y: 0
			}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(TYPEWRITER_SFX_NAME)]);
			fl.getDocumentDOM().getTimeline().currentFrame.soundSync = "stream";
			curFrame += FRAMES_BETWEEN_LETTERS;
		} else {
			curFrame += FRAMES_BETWEEN_WORDS;
		}
	}
}

function makeEvidenceText(text, bounding, layer, startFrame) {
	var curFrame = startFrame;
	for (var i = 0; i < text.length; i++) {
		var curText = text.slice(0, i + 1); // get the portion of text that should be shown at this frame
		resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(layer), curFrame);
		var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of that
		if (!isKeyFrame) {
			fl.getDocumentDOM().getTimeline().insertKeyframe();
			resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(layer), curFrame);
		}
		if (i == 0) {
			fl.getDocumentDOM().addNewText(bounding);
		}
		fl.getDocumentDOM().setTextString(curText);
		evidenceFormat();
		if (text.charAt(i) != ' ') {
			resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(SFX_LAYER), curFrame);
			isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of thata
			if (!isKeyFrame) {
				fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
				resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(SFX_LAYER), curFrame);
			}
			fl.getDocumentDOM().addItem({
				x: 0,
				y: 0
			}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(TYPEWRITER_SFX_NAME)]);
			fl.getDocumentDOM().getTimeline().currentFrame.soundSync = "stream";
		}
		curFrame += Math.round((Math.random() * 1.65)) + 1;
	}
}

//MAIN
var input1 = prompt("Enter either evidence text or the top part of intro text.");
if (input1 != null) {
	var input2 = prompt("Enter either the bottom part of intro text or nothing (press enter or click OK) for evidence text.", " ");
}

if (input1 != null && input2 != null) {
	if (fl.getDocumentDOM().getTimeline().findLayerIndex(TEXT_LAYER_1) == null) {
		fl.getDocumentDOM().getTimeline().addNewLayer(TEXT_LAYER_1);
	}
	if (fl.getDocumentDOM().getTimeline().findLayerIndex(SFX_LAYER) == null) {
		fl.getDocumentDOM().getTimeline().addNewLayer(SFX_LAYER);
	}
	var cur = fl.getDocumentDOM().getTimeline().currentFrame;
	if (input2 != " ") {
		if (fl.getDocumentDOM().getTimeline().findLayerIndex(TEXT_LAYER_2) == null) {
			fl.getDocumentDOM().getTimeline().addNewLayer(TEXT_LAYER_2);
		}
		//todo: insert frames
		fl.getDocumentDOM().getTimeline().insertFrames(input1.length * 3 + input1.split(" ").length * 3 + input2.length * 3 + input2.split(" ").length * 3, true);
		makeIntroText(input1, timeBounding, TEXT_LAYER_1, cur);
		makeIntroText(input2, locationBounding, TEXT_LAYER_2, fl.getDocumentDOM().getTimeline().currentFrame + (2 * FRAMES_BETWEEN_WORDS));
	} else {
		fl.getDocumentDOM().getTimeline().insertFrames(input1.length * 3 + input1.split(" ").length * 3, true);
		makeEvidenceText(input1, dialogueBounding, TEXT_LAYER_1, cur);
	}
	// fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame + 36;
	// var selectionArray = [];
	// for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
	// 	selectionArray.push(i, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().layers[i].frames.length - 1);
	// }
	// fl.getDocumentDOM().getTimeline().setSelectedFrames(selectionArray);
	// fl.getDocumentDOM().getTimeline().removeFrames();
	// resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(TEXT_LAYER_1), 0);
}

// var input = "Evidence Added to Court Record: lmao gottem you suck at coding words woreds words";
// makeEvidenceText(input, dialogueBounding, TEXT_LAYER_1, 10);
// makeIntroText(input2, locationBounding, TEXT_LAYER_2, fl.getDocumentDOM().getTimeline().currentFrame + (2 * FRAMES_BETWEEN_WORDS));