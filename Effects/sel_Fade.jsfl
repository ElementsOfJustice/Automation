var xmlDialogue = '<dialog title="Automatic Fader" buttons="accept, cancel"><label value="Select your fate."/><spacer/><radiogroup id="panel_answer" ><radio label="Scene Fade In" value="panel_sceneFadeIn" /><radio label="Scene Fade Out" value="panel_sceneFadeOut" /><radio label="Transition Fade In" value="panel_smallFadeIn" /><radio label="Transition Fade Out" value="panel_smallFadeOut" /><radio label="Flashback White Fade" value="panel_flashback" /></radiogroup><spacer/><spacer/><spacer/></dialog>'

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
var fadePath = "OTHER ASSETS/Standard_Fade";
var range = null;
var op = null;
var fadeType = null;
var loopType = null;

/*
Function: selectOrMakeKeyframe
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: selects the keyframe if there's one there, or makes one if there isn't
*/
function selectOrMakeKeyframe(layer, frame) {
    resetSelection(layer, frame); // select layer and frame
    // if the current frame isn't the first frame in a frame sequence, make a note of that
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; 
    // if it isn't...
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // keyframe for new position
        resetSelection(layer, frame); // select layer and frame
    }
}

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

var xmlDialogue = '<dialog title="Automatic Fader" buttons="accept, cancel"><label value="Select your fate."/><spacer/><radiogroup id="panel_answer" ><radio label="Scene Fade In" value="panel_sceneFadeIn" /><radio label="Scene Fade Out" value="panel_sceneFadeOut" /><radio label="Transition Fade In" value="panel_smallFadeIn" /><radio label="Transition Fade Out" value="panel_smallFadeOut" /><radio label="Flashback White Fade" value="panel_flashback" /></radiogroup><spacer/><spacer/><spacer/></dialog>'

var theDialog = fl.xmlPanelFromString(xmlDialogue);
var op = null;

if (theDialog.dismiss == "accept") {
	op = theDialog.panel_answer;
	
	if (op == "panel_sceneFadeIn") {
		fadeType = 1;
		range = 21;
		loopType = "loop reverse";
	} else if (op == "panel_sceneFadeOut") {
		fadeType = 1;
		range = 21;
		loopType = "loop";
	} else if (op == "panel_smallFadeIn") {
		fadeType = 23;
		range = 16;
		loopType = "loop reverse";
	} else if (op == "panel_smallFadeOut") {
		fadeType = 23;
		range = 16;
		loopType = "loop";
	} else if (op == "panel_flashback") {
		fadeType = 40;
		range = 32;
		loopType = "loop";
	}

	//If a FADE layer exists, do it there regardless of input selection. If not, use input.
	if (fl.getDocumentDOM().getTimeline().findLayerIndex("FADE") !== undefined) {
		layer = fl.getDocumentDOM().getTimeline().findLayerIndex("FADE")
	}
	
	if (!fl.getDocumentDOM().library.itemExists(fadePath)) {
		throw new Error("Missing file path. Opened file does not have fade symbol at location " + fadePath);
	}

	fl.getDocumentDOM().getTimeline().layers[layer].visible = true;
	fl.getDocumentDOM().getTimeline().layers[layer].locked = false;

	//Select start of selected frames
	selectOrMakeKeyframe(layer, fl.getDocumentDOM().getTimeline().currentFrame)

	//Use a static path for the symbol, cause this will be in every file starting from Case 3
	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(fadePath)]);

	//Aw hell nah, he did NOT just use distribute
	fl.getDocumentDOM().distribute("vertical center", true);
	fl.getDocumentDOM().distribute("horizontal center", true);
	fl.getDocumentDOM().setElementProperty('loop', loopType);

	if (loopType == "loop") {
		fl.getDocumentDOM().setElementProperty('firstFrame', fadeType);
	} else {
		// Reverse handling
		fadeType = (fadeType + range) - 2;
		fl.getDocumentDOM().setElementProperty('firstFrame', fadeType);
		fadeType = fadeType - range;
		fl.getDocumentDOM().setElementProperty('lastFrame', fadeType);
	}

	//Telomere @range frames forwards
	fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(fl.getDocumentDOM().getTimeline().currentFrame + range - 1);

	//Reset Selection
	fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames);

}