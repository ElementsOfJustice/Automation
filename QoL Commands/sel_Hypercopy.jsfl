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
  
  for (var i = 0; i < frameArray.length; i++) {
    if (frameArray[i].elements.length > 0 && frameArray[i].elements[0].elementType == "instance") {
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

for (var i = firstFrame; i < lastFrame; i += frameArray[i].duration) { // iterate over all keyframes
	if (i == frameArray[i].startFrame) {
		if (frameArray[i].isEmpty == false) {
			//if there is content
			toWrite.push(i - firstFrame, frameArray[i].elements[0].firstFrame, frameArray[i].elements[0].lastFrame, frameArray[i].elements[0].loop);
		} else if (frameArray[i].isEmpty == true) {
			//blank keyframe
			toWrite.push(i - firstFrame, -1, -1, -1);
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

//Push element name
toWrite.push(fl.getDocumentDOM().library.findItemIndex(copyItem.libraryItem.name));

//This is utterly fucking retarded
toWrite.push(copyItem.matrix.a);
toWrite.push(copyItem.matrix.b);
toWrite.push(copyItem.matrix.c);
toWrite.push(copyItem.matrix.d);
toWrite.push(copyItem.matrix.tx);
toWrite.push(copyItem.matrix.ty);

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