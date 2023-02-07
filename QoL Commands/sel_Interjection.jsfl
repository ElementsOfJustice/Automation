var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = fl.getDocumentDOM().getTimeline().getSelectedLayers();
var range = 29;
var flashRange = 5;

var guiPanel = fl.xmlPanelFromString('<dialog title="Interjection Tool" buttons="accept, cancel"> <label value="Select Interjection" control="iName"/> <menulist id = "poseList"> <menupop><menuitem label="Objection" selected="true" value="1"/><menuitem label="Luna Objection" selected="false" value="221"/><menuitem label="Hold It" selected="false" value="45"/><menuitem label="Take That" selected="false" value="89"/><menuitem label="Got It" selected="false" value="133"/><menuitem label="Gotchya" selected="false" value="178"/><menuitem label="Be Still!" selected="false" value="265"/></menupop> </menulist> </dialog>');

if (guiPanel.dismiss == "accept") {
	interjectionType = guiPanel.poseList - 1

	//Select start of selected frames
	fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames[1], selectedFrames[1]);

	//Use a static path for the symbol, cause this will be in every file starting from Case 3
	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("OTHER ASSETS/INTERJECTION/INTERJECTIONS")]);

	//Aw hell nah, he did NOT just use distribute
	fl.getDocumentDOM().distribute("vertical center", true);
	fl.getDocumentDOM().distribute("horizontal center", true);
	fl.getDocumentDOM().setElementProperty('firstFrame', interjectionType);

	//Telomere @range frames forwards
	fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(selectedFrames[1] + range - 1);

	//Do the flash
	var layerAbove = selectedFrames[0] - 1;
	fl.getDocumentDOM().getTimeline().setSelectedLayers(layerAbove);
	fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames[1], selectedFrames[1]);
	
	//Use a static path for the symbol, cause this will be in every file starting from Case 3
	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("OTHER ASSETS/Standard_Flash")]);

	//Aw hell nah, he did NOT just use distribute
	fl.getDocumentDOM().distribute("vertical center", true);
	fl.getDocumentDOM().distribute("horizontal center", true);
	fl.getDocumentDOM().setElementProperty('firstFrame', interjectionType);

	//Telomere @flashRange frames forwards
	fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(selectedFrames[1] + flashRange - 1);

	//Reset selection
	fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames);

}