var xmlStr1 = ' <dialog title="SFX Placer" buttons="accept, cancel"> <label value="Select a SFX" control="iName"/> <menulist id = "sfxList"> <menupop>';
var xmlStr2 = '	</menupop> </menulist> </dialog>';
var totalSelStr = '';

var layer = fl.getDocumentDOM().getTimeline().getSelectedFrames()[0];
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var itemName = null;
var doFlash = null;
var doShake = null;
var flashRange = 5;

var prefix = "AUDIO/SFX/";
var flashPath = "OTHER ASSETS/Standard_Flash";

var flashOnly = ["sfx-huh", "sfx-high", "sfx-higher", "sfx-highest", "sfx-low", "sfx-lightbulb", "sfx-damage", "sfx-dramaticshock", "sfx-hit1", "sfx-punch", "sfx-punch2", "sfx-shocked", "sfx-shouting", "sfx-stab", "sfx-stab2"];
var shakeOnly = ["sfx-deskslam", "sfx-thud", "sfx-thud2", "sfx-damage", "sfx-dramaticshock", "sfx-hit1", "sfx-punch", "sfx-punch2", "sfx-shocked", "sfx-shouting", "sfx-stab", "sfx-stab2"];
var shakeIgnoreLayer = ["FLASH", "INTERJECTION", "FADE", "GAVEL", "EVIDENCE", "TEXT"];

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


var itemArray = fl.getDocumentDOM().library.items;
for (var i = 0; i < itemArray.length; i++) {
	var itemSelection = fl.getDocumentDOM().library.items[i];
	if (itemSelection.name.indexOf(prefix) === 0) {
		if (itemSelection.itemType == "sound") {
			filteredName = itemSelection.name.substr(prefix.length).replace(/\s\(\d+\)|\.[a-zA-Z]{3}$/g, '');
			selStr = '<menuitem label="' + filteredName + '" selected="false" value="' + itemSelection.name + '"/>';
			totalSelStr = totalSelStr.concat(selStr);
		}
	} else {
		// Do nothing.
	}
}

var guiPanel = fl.xmlPanelFromString(xmlStr1 + totalSelStr + xmlStr2);

if (guiPanel.dismiss == "accept") {
	itemName = guiPanel.sfxList.substr(prefix.length).replace(/\s\(\d+\)|\.[a-zA-Z]{3}$/g, '');

	if (flashOnly.indexOf(itemName) !== -1 && shakeOnly.indexOf(itemName) !== -1) {
		// Code to run if itemName is in both arr1 and arr2 arrays
		doFlash = true;
		doShake = true;
	} else if (flashOnly.indexOf(itemName) !== -1) {
		// Code to run if itemName is in the arr1 array, but not the arr2 array
		doFlash = true;
		doShake = false;
	} else if (shakeOnly.indexOf(itemName) !== -1) {
		// Code to run if itemName is in the arr2 array, but not the arr1 array
		doFlash = false;
		doShake = true;
	} else {
		// Code to run if itemName is not in either arr1 or arr2 arrays
		doFlash = false;
		doShake = false;
	}

	// If a SFX_1 layer exists, do it there regardless of input selection. If not, use input.
	if (fl.getDocumentDOM().getTimeline().findLayerIndex("SFX_1") !== undefined) {
		layer = fl.getDocumentDOM().getTimeline().findLayerIndex("SFX_1")
	}

	// Warn user if there is no FLASH symbol.
	if (!fl.getDocumentDOM().library.itemExists(flashPath)) {
		throw new Error("Missing file path. Opened file does not have fade symbol at location " + flashPath);
	}

	fl.getDocumentDOM().getTimeline().layers[layer].visible = true;
	fl.getDocumentDOM().getTimeline().layers[layer].locked = false;

	// Select start of selected frames
	selectOrMakeKeyframe(layer, curFrame)

	// Use a static path for the symbol, cause this will be in every file starting from Case 3
	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(guiPanel.sfxList)]);

	// Set sync to stream.
	fl.getDocumentDOM().getTimeline().setFrameProperty('soundSync', 'stream');

	// FLASH warn
	if (fl.getDocumentDOM().getTimeline().findLayerIndex("FLASH") === undefined) {
		alert("You need a layer named FLASH for the SFX tool to auto-flash.");
	}

	// DO FLASH
	if (doFlash && (fl.getDocumentDOM().getTimeline().findLayerIndex("FLASH") !== undefined)) {

		layer = fl.getDocumentDOM().getTimeline().findLayerIndex("FLASH")

		//Select start of selected frames
		selectOrMakeKeyframe(layer, curFrame)

		//Use a static path for the symbol, cause this will be in every file starting from Case 3
		fl.getDocumentDOM().addItem({
			x: 0,
			y: 0
		}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(flashPath)]);

		//Aw hell nah, he did NOT just use distribute
		fl.getDocumentDOM().distribute("vertical center", true);
		fl.getDocumentDOM().distribute("horizontal center", true);

		//Telomere @flashRange frames forwards
		fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(curFrame + flashRange - 1);

	}

	// DO SHAKE
	if (doShake) {

		var range = 10;
		var intensity = 20;
		var taperOff = true;
		var shakeOffsets = [];

		//Reset selection
		fl.getDocumentDOM().getTimeline().currentFrame = curFrame;

		for (var i = startingFrame; i < (startingFrame + range) - 1; i++) {
			var randX = Math.random() - 0.5;
			var randY = Math.random() - 0.5;
			// the change in x and the change in y
			var deltaX = 0;
			var deltaY = 0;
			// if the GUI box is checked...
			if (taperOff == "true") {
				// double intensity times our random value... 
				deltaX = ((2 * intensity) * randX) // times the percentage of frames remaining
				* (1 - (((i - startingFrame) / range)));
				deltaY = ((2 * intensity) * randY) * (1 - (((i - startingFrame) / range)));
				// So the change in x and y will reduce as we get closer to the end
				// of the frame selection
			}
			// as opposed to...
			else {
				// just double intensity times our random value
				deltaX = ((2 * intensity) * randX);
				deltaY = ((2 * intensity) * randY);
			}
			shakeOffsets[i] = [deltaX, deltaY];
		}

		for (var l = 0; l < fl.getDocumentDOM().getTimeline().layers.length; l++) {
			if (fl.getDocumentDOM().getTimeline().layers[l].layerType == "normal" && shakeIgnoreLayer.indexOf(fl.getDocumentDOM().getTimeline().layers[l].name) === -1 && !fl.getDocumentDOM().getTimeline().layers[l].frames[fl.getDocumentDOM().getTimeline().currentFrame].isEmpty) {
				var mat = fl.getDocumentDOM().getTimeline().layers[l].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].matrix;
				fl.getDocumentDOM().getTimeline().layers[l].locked = false; // unlock layer
				// from the starting frame to the ending frame...
				for (var i = startingFrame; i < (startingFrame + range) - 1; i++) {
					// if we aren't at the starting frame 
					if (fl.getDocumentDOM().getTimeline().layers[l].frames[i].startFrame != i) {
						//  convert the current frame to a key frame 
						fl.getDocumentDOM().getTimeline().currentLayer = l;
						fl.getDocumentDOM().getTimeline().convertToKeyframes(fl.getDocumentDOM().getTimeline().currentFrame);
					}
					// Reset the frame to its original position to create the shake effect
					fl.getDocumentDOM().getTimeline().layers[l].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].matrix = mat;
					// Move the frame's registration point by our changes in x and y
					fl.getDocumentDOM().getTimeline().layers[l].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].x += shakeOffsets[i][0];
					fl.getDocumentDOM().getTimeline().layers[l].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].y += shakeOffsets[i][1];
					// Advance the current frame on Animate's timeline
					fl.getDocumentDOM().getTimeline().currentFrame += 1;
				}
				// Reset the frame back to the starting position once more.
				fl.getDocumentDOM().getTimeline().layers[l].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].matrix = mat;

				//Reset selection
				fl.getDocumentDOM().getTimeline().currentFrame = curFrame;
			}
		}
	}

	//Reset selection
	fl.getDocumentDOM().getTimeline().currentFrame = curFrame;

}