/******************************************************************************
								HYPERCOPY

Description: Efficient copy function predicated on framearrays and document
data.

To-Do:
-Maintain the script according to hyperpaste's requirements.

User Disclaimers:
-None
******************************************************************************/

var cLib = fl.configURI + "cLib.jsfl";

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layerInfo = [];
for (var i = 0; i < selectedFrames.length / 3; i++) {
	layerInfo.push([selectedFrames[3 * i], selectedFrames[3 * i + 1], selectedFrames[3 * i + 2]]);
}
var toWrite = [];

function soundAlert() {
	fl.runScript(cLib, "soundAlert");
}

function soundError() {
	fl.runScript(cLib, "soundError");
}

/*
Function: setHash
Variables: variableName, value, type
Description: Sets a variable from document data via a hash. Requires the type of
variable that you are inputting. Acceptable values are "integer", "integerArray", 
"double", "doubleArray", "string", and "byteArray". Reminder that hashes received
between files should not use the file name as a hash identifier, so we use the
common "HYPERCOPY" name between both files.
*/
function setHash(variableName, value, type) {
	var hashIndex = variableName;
	fl.getDocumentDOM().addDataToDocument(hashIndex, type, value);
}

// Process copy data for selected region.
for (var l = 0; l < layerInfo.length; l++) {
	var layer = layerInfo[l][0];
	var firstFrame = layerInfo[l][1];
	var lastFrame = layerInfo[l][2];
	// Unlock the layer
	fl.getDocumentDOM().getTimeline().layers[layer * 1].locked = false;
	//Setup, if selection is backwards, fix it.
	if (firstFrame > lastFrame) {
		var temp = lastFrame;
		lastFrame = firstFrame;
		firstFrame = temp;
	}

	var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
	var curLibraryItem = "";
	for (var i = firstFrame; i < lastFrame; i += (frameArray[i].duration - (i - frameArray[i].startFrame))) { // iterate over all keyframes

		if (frameArray[i] == undefined) {
			soundError();
			throw new Error("You have selected a folder layer. Run again without the folder layer selected.");
		}

		if (i == frameArray[i].startFrame) {

			//If there is content, process it...
			if (frameArray[i].isEmpty == false) {

				if (frameArray[i].elements[0].libraryItem == undefined) {
					soundError();
					throw new Error("Hypercopy only works with symbol-pure selections. You have selected a range of frames that contains something that is not a symbol.");
				}

				symbolIsDifferent = (frameArray[i].elements[0].libraryItem.name != curLibraryItem);
				curLibraryItem = frameArray[i].elements[0].libraryItem.name;

				// Collect data about the current frame.
				var mat = frameArray[i].elements[0].matrix;
				var matString = mat.a + "|" + mat.b + "|" + mat.c + "|" + mat.d + "|" + mat.tx + "|" + mat.ty;
				var libraryPathToWrite = (symbolIsDifferent) ? curLibraryItem : "";
				var symbolType = frameArray[i].elements[0].symbolType;
				var tweenType = frameArray[i].tweenType;
				var tweenEasing = frameArray[i].getCustomEase();
				var tweenEasingStr = "";

				// Add tween easing to the string, if it exists.
				if (tweenEasing !== undefined) {
					for (var k = 0; k < tweenEasing.length; k++) {
						tweenEasingStr += tweenEasing[k].x + "|" + tweenEasing[k].y + "|";
					}
					tweenEasingStr = tweenEasingStr.substring(0, tweenEasingStr.length - 1);
				}

				// Get the frame name and label type, and the alpha of the first symbol in the frame, which is the symbol that is used for the frame's label.
				var frameName = frameArray[i].name;
				var frameLabelType = frameArray[i].labelType;
				var symbolAlpha = frameArray[i].elements[0].colorAlphaPercent;

				// Push in schema order.
				toWrite.push(i - firstFrame, frameArray[i].elements[0].firstFrame, frameArray[i].elements[0].lastFrame, frameArray[i].elements[0].loop, libraryPathToWrite, matString, symbolType, tweenType, tweenEasingStr, frameName, frameLabelType, symbolAlpha);
			} else if (frameArray[i].isEmpty == true) {
				// If there is no content, declare it as a blank keyframe with junk data.
				toWrite.push(i - firstFrame, -1, -1, -1, "", "", "", "", "", "", "", "");
			}
		}
	}
	if (l < layerInfo.length - 1) {
		toWrite.push("¤"); // layer symbol
	}
}

// Save the data to the hash table, so that it can be retrieved later.
var dataString = toWrite.join(',');
setHash("HYPERCOPY", dataString, "string");
soundAlert();