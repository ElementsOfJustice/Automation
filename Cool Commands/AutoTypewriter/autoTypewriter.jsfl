/******************************************************************************
AUTO TYPEWRITER
Description: Automatically creates two different types of typewriter effects
- Date and Time: date and time is displayed at the start of a scene
- Evidence Text: evidence is added to the court record
******************************************************************************/

// Create Variables
// set scriptPath to "/path/../autoTypewriter.jsfl"
var scriptPath = fl.scriptURI;
// set dirURL to the path up to the last / character (i.e. just the path)
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
// Creates a GUI window in Animate using the given XML file
var guiPanel = fl.getDocumentDOM().xmlPanel(dirURL+"/autoTypewriter.xml");

// taking in stuff from the user via GUI textboxes
// a line for the date and time
var str1 = guiPanel.topText;
// and a line for the location
var str2 = guiPanel.bottomText;
// The user takes a guess as to what the approximate character width is in pixels
// one for each line
var approxCharWidth1 = guiPanel.avgCharWidth1;
var approxCharWidth2 = guiPanel.avgCharWidth2;

// The text of the selected radio button (Intro text or evidence text)
var typewriterMode = guiPanel.typewriterMode;

// Use algebra to calculate textbox bounding - one for the dialogue, time, and location
var dialogueBounding = {left:40.05, top:549.5, right:1212.95, bottom:708.95};
var timeBounding = {left:((720-(str1.length*approxCharWidth1))/2), top:560, 
	right:720-((720-str1.length*approxCharWidth1)/2), bottom:620};	// L 435 R 845
var locationBounding = {left:((720-(str2.length*approxCharWidth2))/2), top:620,
	right:720-((720-str2.length*approxCharWidth2)/2), bottom:670};
	
// get the adobe animate file and info inside
var doc = fl.getDocumentDOM();
var timeline = document.getTimeline();
var layers = timeline.layers;
var propertiesLayer = null;
var propertiesTextBox = null;
var layerIndex = 0;
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

// store the index of the library's typewriter sound effect in a variable
var typewriterSFX = doc.library.findItemIndex("sfx-typewriter.wav");
// store the actual sound effect
var typeSFX = doc.library.items[typewriterSFX];

/*
Function: advancePlayhead
Variables: configurableFrameDuration
Description: 
*/
function advancePlayhead(configurableFrameDuration){
	fl.getDocumentDOM().getTimeline().currentFrame 
	= fl.getDocumentDOM().getTimeline().currentFrame + configurableFrameDuration;
	timeline.insertKeyframe(fl.getDocumentDOM().getTimeline().currentFrame);
}

/*
Function: updateI
Variables: a (A String)
		   b (An Index)
Description: returns string 'a' from index 0 to index 'b'
*/
function updateI(a, b) {
	return a.slice(0,b)
}

/*
Function: switchActive
Variables: layerVar (A String, name of a layer)
Description: Change the active layer to the layer of the given name
*/
function switchActive(layerVar) {
	// get the layer index from the name
	layerIndex = timeline.findLayerIndex(layerVar);
		// if the layer doesn't exist...
		if (layerIndex == null) {
			// create a new layer with the given name
			timeline.addNewLayer(layerVar);
			// set the index to that of the new layer
			layerIndex = timeline.findLayerIndex(layerVar);
		}
	//  set the current player to whatever the layerindex is
    timeline.setSelectedLayers(layerIndex*1);
	// Soundman says: "no clue what that does, I put it everywhere for some reason"
    propertiesLayer = layers[layerIndex];
}

/*
Function: typewriterFormat
Variables: none
Description: Sets the formatting for Intro text (AKA, introFormat)
*/
function typewriterFormat(){
	element.setTextAttr("face", "Suburga 2 Semicondensed Regular"); 		//Font
	element.setTextAttr("size", 40);										//Size
	element.setTextAttr("fillColor", 0x00FF33);								//Fill Color
	element.setTextAttr("letterSpacing", 2);								//Letter Spacing
	element.setTextAttr("lineSpacing", 1);									//Line Spacing
}

/*
Function: evidenceFormat
Variables: none
Description: Sets the formatting for evidence text
*/
function evidenceFormat(){
	element.setTextAttr("face", "Suburga 2 Semicondensed Regular");
	element.setTextAttr("size", 40);
	element.setTextAttr("fillColor", 0x008fff);
	element.setTextAttr("letterSpacing", 2);
	element.setTextAttr("lineSpacing", 1);
}

/*
Function: displayIntroText
Variables: text (the text to be displayed)
		   bounding (the bounding to display the text in)
Description: displays intro text within a bounding (for date, time, and location)
*/
function displayIntroText(text,bounding) {
	// for each character in the string...
	for (var i=0; i-1 < text.length; i++) {
		// Switch to the txt layer
		switchActive("txt");
		// stores text up to given index - this gives us the typing effect
		var txtVar = updateI(text, i);

		// Add text within the given bounding
		doc.addNewText(bounding);
		doc.setTextString(txtVar);	// Actually put the text slice in animate
		var element = doc.selection[0]; // set element to the most recently created item
		
		// sets the text attribute to align the text to the left
		doc.setElementTextAttr("alignment", "left");
		// set the text type to dynamic
		fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
		// set the line type to multiline
		fl.getDocumentDOM().setElementProperty('lineType', 'multiline'); 
		// distributes the selected objects by their horizontal centers, using the bounds of the document
		fl.getDocumentDOM().distribute("horizontal center", true);
		element.name = "txt";
		// this will display in "Typewriter Format"
		typewriterFormat();
		
		// if the current index contains a space, wait twice as long
		if (text.charAt(i) == " ") {advancePlayhead(6)}
		// otherwise, wait the normal amount
		else {advancePlayhead(3)}
		
		// Switch the active layer to "sfx_1"
		switchActive("sfx_1");
		
		// add the typing sound effect at the current frame
		timeline.insertBlankKeyframe(fl.getDocumentDOM().getTimeline().currentFrame);
		doc.addItem({x:0,y:0}, typeSFX);
		curFrame.soundSync = "stream";
		
	};
}

// MAIN

// If the user pushes "ok" as opposed to "cancel"
if(guiPanel.dismiss == "accept") {
	// if the user selected the "Intro Text" radio button
	if(typewriterMode == "introText") {

		// DISPLAY DATE AND TIME
		displayIntroText(str1,timeBounding);

		advancePlayhead(6);

		// DISPLAY LOCATION
		displayIntroText(str2,locationBounding);

	};

	// if the user selected the "Evidence Text" radio button
	// note: str2 is not used for evidence text
	if(typewriterMode == "evidenceText") {
		// for each character in the string...
		for (var i=0; i-1 < str1.length; i++) {
			// Switch to the txt layer
			switchActive("txt");
			// stores text up to given index - this gives us the typing effect
			var txtVar = updateI(str1, i);

			// Add text within the given bounding
			doc.addNewText(dialogueBounding);
			doc.setTextString(txtVar);  // Actually put the text slice in animate
			var element = doc.selection[0]; // set element to the most recently created item
			
			// sets the text attribute to align the text to the left
			doc.setElementTextAttr("alignment", "left");
			// set the text type to dynamic
			fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
			// set the line type to multiline
			fl.getDocumentDOM().setElementProperty('lineType', 'multiline'); 
			// distributes the selected objects by their horizontal centers, using the bounds of the document
			fl.getDocumentDOM().distribute("horizontal center", true);
			element.name = "txt";
			// this will display in "Evidence Format"	
			evidenceFormat();
			
			// Random wait times are used to make the typing sound more natural
			var ranNum = Math.floor((Math.random()*3))+1;
				
			if (str1.charAt(i) == " ") {advancePlayhead(ranNum)}
			else {advancePlayhead(ranNum)}
			
			// Switch the active layer to "sfx_1"
			switchActive("sfx_1");
			
			// add the typing sound effect at the current frame
			timeline.insertBlankKeyframe(fl.getDocumentDOM().getTimeline().currentFrame);
			doc.addItem({x:0,y:0}, typeSFX);
			curFrame.soundSync = "stream";
		
		}	
	}	
}