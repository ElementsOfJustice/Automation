TYPEFACE_NAME = "Suburga 2"; // sometimes it's "Suburga 2 Semicondensed Regular", other times it's "Suburga 2" Swap it if this script isn't working.
FRAMES_BETWEEN_LETTERS = 3;
FRAMES_BETWEEN_WORDS = 6;
TEXT_LAYER_1 = "txt1";
TEXT_LAYER_2 = "txt2";
SFX_LAYER = "sfx_1";
TYPEWRITER_SFX_NAME = "sfx-typewriter.wav";
AVERAGE_CHARACTER_WIDTH = 20;


var bounding = { left: 69, top: 560, right: 420, bottom: 620 };	// L 435 R 845

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
    fl.getDocumentDOM().setElementTextAttr("size", 40);
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
        curFrame += 2;
    }
}

// MAIN
var input1 = prompt("Enter testimony name.");
if(input1 != null) {
    makeTestimonyText(input1, bounding, TEXT_LAYER_1, 0);
}