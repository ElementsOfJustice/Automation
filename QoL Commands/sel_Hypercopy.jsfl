/******************************************************************************
HYPERCOPY
Description: Copies frame data and creates a fucko weird array that can
be read and used to paste large amounts of complicated data quickly.

!!! Only works with one common element across your selection. Use for RIGS.
******************************************************************************/

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = selectedFrames[0];
var firstFrame = selectedFrames[1];
var lastFrame = selectedFrames[2];
var toWrite = [];

//Nonstandard setHash, since we use it between two files, the script name is 
//NOT a part of the hash function.
function setHash(variableName, value, type) {
	var hashIndex = variableName;
	fl.getDocumentDOM().addDataToDocument(hashIndex, type, value);
}

//Nonstandard getHash, since we use it between two files, the script name is 
//NOT a part of the hash function.
function getHash(variableName) {
	var hashIndex = variableName;
	return fl.getDocumentDOM().getDataFromDocument(hashIndex);
}

/*
Function: findFirstFrameWithSymbol
Variables: 
	layerIndex	What layer are you searching on
Description: Return the frame number that the first graphic symbol occurs on.
*/

findFirstFrameWithSymbol = function (layerIndex) {
	var frameArray = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames;

	for (var i = firstFrame; i < lastFrame; i++) {
		if (frameArray[i].elements.length > 0 && frameArray[i].elements[0].elementType == "instance" && frameArray[i].elements[0].symbolType == "graphic") {
			return i;
		}
	}

	return -1;
}

//Setup
if (firstFrame > lastFrame) { // if selection is backwards, fix it
	var temp = lastFrame;
	lastFrame = firstFrame;
	firstFrame = temp;
}
fl.getDocumentDOM().getTimeline().layers[layer].locked = false; // unlock layer


var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;


var curLibraryItem = "";
for (var i = firstFrame; i < lastFrame - 1; i += (frameArray[i].duration - (i - frameArray[i].startFrame))) { // iterate over all keyframes
	if (i == frameArray[i].startFrame) {
		if (frameArray[i].isEmpty == false) {
			//if there is content
			symbolIsDifferent = (frameArray[i].elements[0].libraryItem.name != curLibraryItem);
			curLibraryItem = frameArray[i].elements[0].libraryItem.name;
			var mat = frameArray[i].elements[0].matrix;
			var matString = mat.a + "|" + mat.b + "|" + mat.c + "|" + mat.d + "|" + mat.tx + "|" + mat.ty;
			var libraryPathToWrite = (symbolIsDifferent) ? curLibraryItem : "";
			var symbolType = frameArray[i].elements[0].symbolType;
			var tweenType = frameArray[i].tweenType;
			var tweenEasing = frameArray[i].getCustomEase();
			var tweenEasingStr = "";
			if (tweenEasing !== undefined) {
				for (var k = 0; k < tweenEasing.length; k++) {
					tweenEasingStr += tweenEasing[k].x + "|" + tweenEasing[k].y + "|";
				}
				tweenEasingStr = tweenEasingStr.substring(0, tweenEasingStr.length - 1);
			}
			var frameName = frameArray[i].name;
			var frameLabelType = frameArray[i].labelType;
			var symbolAlpha = frameArray[i].elements[0].colorAlphaPercent;
			// SCHEMA: frame, loop startFrame, loop lastFrame, loop type, library path, matrix, symbol type, tween type, tween easing, frame label, label type, alpha
			toWrite.push(i - firstFrame, frameArray[i].elements[0].firstFrame, frameArray[i].elements[0].lastFrame, frameArray[i].elements[0].loop, libraryPathToWrite, matString, symbolType, tweenType, tweenEasingStr, frameName, frameLabelType, symbolAlpha);
		} else if (frameArray[i].isEmpty == true) {
			//blank keyframe
			toWrite.push(i - firstFrame, -1, -1, -1, "", "", "", "", "", "", "", "");
		}
	}
};

var copyItem = fl.getDocumentDOM().getTimeline().layers[layer].frames[findFirstFrameWithSymbol(layer)].elements[0];

/*
		===ARBITRARY DATA STRUCTURE MOMENTO!===

	To decode this horseshit:

	Ignore the last eight elements of the array for now.
	Every first three elements will use parseInt()
	Every fourth element will be a string
	Continue until you reach the last eight elements

	For the last eight elements:
	There in an integer stating the libraryID to copy. Use parseInt().
	There are four integers representing the object's matrix A-D values. Use parseInt().
	Two floats representing the object's coordinants. Use parseFloat().
	A boolean determining whether the frame after the last frame in the selection is empty or not. Use parseBoolean().

*/


//Is the frame after the selection a keyframe?
if (lastFrame + 1 < frameArray.length) {
	var tmpBool = fl.getDocumentDOM().getTimeline().layers[layer].frames[lastFrame].isEmpty
	toWrite.push(tmpBool);
} else {
	toWrite.push(false);
}

//Document data doesn't take a normal array, but it will take a string. It's up to hyperpaste to decode.
var dataString = toWrite.join(',');
//Save to hash HYPERCOPY. As a repeatable function, we don't use checks, we'll let it be overwritten easily.
//fl.trace(dataString);
setHash("HYPERCOPY", dataString, "string");