var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
var interjectionPath = "OTHER ASSETS/INTERJECTION/INTERJECTIONS";
var flashPath = "OTHER ASSETS/Standard_Flash";
var range = 29;
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

var guiPanel = fl.xmlPanelFromString('<dialog title="Interjection Tool" buttons="accept, cancel"> <label value="Select Interjection" control="iName"/> <menulist id = "poseList"> <menupop><menuitem label="Objection" selected="true" value="1"/><menuitem label="Luna Objection" selected="false" value="221"/><menuitem label="Hold It" selected="false" value="45"/><menuitem label="Take That" selected="false" value="89"/><menuitem label="Got It" selected="false" value="133"/><menuitem label="Gotchya" selected="false" value="178"/><menuitem label="Be Still!" selected="false" value="265"/></menupop> </menulist> </dialog>');

if (guiPanel.dismiss == "accept") {
	interjectionType = guiPanel.poseList - 1
	
	if (!fl.getDocumentDOM().library.itemExists(interjectionPath)) {
		throw new Error("Missing file path. Opened file does not have interjection symbol at location " + interjectionPath);
	}

	if (!fl.getDocumentDOM().library.itemExists(flashPath)) {
		throw new Error("Missing file path. Opened file does not have a flash symbol at location " + flashPath);
	}

	fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]].visible = true;
	fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]-1].visible = true;

	fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]].locked = false;
	fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]-1].locked = false;

	//Select start of selected frames
	selectOrMakeKeyframe(layer, selectedFrames[1])

	//Use a static path for the symbol, cause this will be in every file starting from Case 3
	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(interjectionPath)]);

	//Aw hell nah, he did NOT just use distribute
	fl.getDocumentDOM().distribute("vertical center", true);
	fl.getDocumentDOM().distribute("horizontal center", true);
	fl.getDocumentDOM().setElementProperty('firstFrame', interjectionType);

	//Telomere @range frames forwards
	fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(selectedFrames[1] + range - 1);

	//Do the flash
	fl.getDocumentDOM().getTimeline().setSelectedLayers(selectedFrames[0] - 1);

	//Select start of selected frames
	selectOrMakeKeyframe(selectedFrames[0] - 1, selectedFrames[1])
	
	//Use a static path for the symbol, cause this will be in every file starting from Case 3
	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(flashPath)]);

	//Aw hell nah, he did NOT just use distribute
	fl.getDocumentDOM().distribute("vertical center", true);
	fl.getDocumentDOM().distribute("horizontal center", true);
	fl.getDocumentDOM().setElementProperty('firstFrame', interjectionType);

	//Telomere @flashRange frames forwards
	fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(selectedFrames[1] + flashRange - 1);

	//Reset selection
	fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames);

}