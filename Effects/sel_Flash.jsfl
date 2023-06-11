var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
var flashPath = "OTHER ASSETS/Standard_Flash";
var flashRange = 5;

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

if (!fl.getDocumentDOM().library.itemExists(flashPath)) {
	throw new Error("Missing file path. Opened file does not have a flash symbol at location " + flashPath);
}

//If a FLASH layer exists, do it there regardless of input selection. If not, use input.
if (fl.getDocumentDOM().getTimeline().findLayerIndex("FLASH") !== undefined) {
	layer = fl.getDocumentDOM().getTimeline().findLayerIndex("FLASH")
}

fl.getDocumentDOM().getTimeline().layers[layer].visible = true;
fl.getDocumentDOM().getTimeline().layers[layer].locked = false;

//Do the flash
fl.getDocumentDOM().getTimeline().setSelectedLayers(layer[0]);

//Select start of selected frames
selectOrMakeKeyframe(layer, fl.getDocumentDOM().getTimeline().currentFrame)

//Use a static path for the symbol, cause this will be in every file starting from Case 3
fl.getDocumentDOM().addItem({
	x: 0,
	y: 0
}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(flashPath)]);

//Aw hell nah, he did NOT just use distribute
fl.getDocumentDOM().distribute("vertical center", true);
fl.getDocumentDOM().distribute("horizontal center", true);

//Telomere @flashRange frames forwards
fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(fl.getDocumentDOM().getTimeline().currentFrame + flashRange - 1);

//Reset selection
fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames);