TYPEFACE_NAME = "Suburga 2 Semicondensed Regular"; // sometimes it's "Suburga 2 Semicondensed Regular", other times it's "Suburga 2" Swap it if this script isn't working.
FRAMES_BETWEEN_LETTERS = 3;
FRAMES_BETWEEN_WORDS = 6;
TEXT_LAYER_1 = "txt1";
TEXT_LAYER_2 = "txt2";
SFX_LAYER = "sfx_1";
TYPEWRITER_SFX_NAME = "AUDIO/SFX/sfx-typewriter.wav";
AVERAGE_CHARACTER_WIDTH = 20;
SCALE = fl.getDocumentDOM().width / 1280.0;

var bounding = { left: 69 * SCALE, top: 560 * SCALE, right: 420 * SCALE, bottom: 620 * SCALE };	// L 435 R 845

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

function getAlignment(text, topBounding, bottomBounding) { // creates a textbox of just the right bounding for this purpose (left and right values of initial bounding box don't matter)
    fl.getDocumentDOM().addNewText({ left: 393.9, top: topBounding, right: 500, bottom: bottomBounding });
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

function typewriterFormat() {
    fl.getDocumentDOM().setElementTextAttr("face", TYPEFACE_NAME);
    fl.getDocumentDOM().setElementProperty('fontRenderingMode', 'standard');
    fl.getDocumentDOM().setElementTextAttr("size", 40 * SCALE);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0xFF6633);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
    fl.getDocumentDOM().setElementTextAttr("lineSpacing", 1);
    fl.getDocumentDOM().setElementTextAttr("alignment", "left");
    fl.getDocumentDOM().setElementProperty('textType', 'static');
    // fl.getDocumentDOM().setElementProperty('lineType', 'multiline');
    fl.getDocumentDOM().distribute("horizontal center", true);
}

function makeTestimonyText(text, bounding, layer, startFrame) {
	var curFrame = startFrame;
	for (var i = 0; i < text.length; i++) {
		var curText = text.slice(0, i + 1); // get the portion of text that should be shown at this frame
		resetSelection(layer, curFrame);
		var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[layer].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of that
		if (!isKeyFrame) {
			fl.getDocumentDOM().getTimeline().insertKeyframe();
			resetSelection(layer, curFrame);
		}
		if (i == 0) {
			fl.getDocumentDOM().addNewText(bounding);
		}
		fl.getDocumentDOM().setTextString(curText);
		typewriterFormat();
		curFrame += 2;
	}
}

// MAIN
var input1 = prompt("Enter testimony name.");
if(input1 != null) {
    makeTestimonyText(input1, bounding, fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame);
}