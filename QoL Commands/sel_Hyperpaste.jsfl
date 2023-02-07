/******************************************************************************
HYPERPASTE
Description: Efficient paste function predicated on framearrays and document
data.

!!! Only works with one common element across your selection. Use for RIGS.
******************************************************************************/

fl.showIdleMessage(false);

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = selectedFrames[0];
var firstFrame = selectedFrames[1];
var lastFrame = selectedFrames[2];

//ChatGPT wrote this and it was actually perfect first try. Thanks GPT!
//Schindler's decoder ring be like:
function parseString(str) {
	var arr = str.split(',');
	var result = [];

	for (var i = 0; i < arr.length - 8; i += 4) {
		result.push(parseInt(arr[i]), parseInt(arr[i + 1]), parseInt(arr[i + 2]), arr[i + 3]);
	}

	var libraryID = parseInt(arr[arr.length - 8]);
	var matrixA = parseInt(arr[arr.length - 7]);
	var matrixB = parseInt(arr[arr.length - 6]);
	var matrixC = parseInt(arr[arr.length - 5]);
	var matrixD = parseInt(arr[arr.length - 4]);
	var coordX = parseFloat(arr[arr.length - 3]);
	var coordY = parseFloat(arr[arr.length - 2]);

	var isFrameEmpty = (arr[arr.length - 1] === "true");

	result.push(libraryID, matrixA, matrixB, matrixC, matrixD, coordX, coordY, isFrameEmpty);

	return result;
}

//this didn't work down below for some fucking reason, so let's do this shit
var placeOnce = true;

function pasteInPlace(data) {

	if (placeOnce == true) {
		placeOnce = false;

		fl.getDocumentDOM().addItem({
			x: 0,
			y: 0
		}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);

		fl.getDocumentDOM().swapElement(fl.getDocumentDOM().library.items[data[data.length - 8]].name);
	
		//Apply matrix for a paste-in-place effect
		var tmpMatrix = fl.getDocumentDOM().selection[0].matrix;
		tmpMatrix.a = data[data.length - 7]
		tmpMatrix.b = data[data.length - 6]
		tmpMatrix.c = data[data.length - 5]
		tmpMatrix.d = data[data.length - 4]
		tmpMatrix.tx = data[data.length - 3]
		tmpMatrix.ty = data[data.length - 2]

		fl.getDocumentDOM().selection[0].matrix = tmpMatrix;

	}
}

//Nonstandard getHash, since we use it between two files, the script name is 
//NOT a part of the hash function.
function getHash(variableName) {
	var hashIndex = variableName;
	return fl.getDocumentDOM().getDataFromDocument(hashIndex);
}

//Setup
if (firstFrame > lastFrame) { // if selection is backwards, fix it
	var temp = lastFrame;
	lastFrame = firstFrame;
	firstFrame = temp;
}

//Connor, if you continue to write !true and !false into Case 3, I will fucking defenestrate you
fl.getDocumentDOM().getTimeline().layers[layer].locked = false;

//Decode hypercopy data
var data = parseString(getHash("HYPERCOPY"));

//This fucks up everything, don't do this
//fl.getDocumentDOM().getTimeline().clearFrames(firstFrame, lastFrame);

for (var i = 0; i < data.length - 8; i += 4) {

	//If we're a blank keyframe, skip
	if (data[i+1] == -1) {
		continue;
	}
	
	var focusedFrame = fl.getDocumentDOM().getTimeline().layers[layer].frames[firstFrame + data[i]]
	//Convert to keyframe and place item
	if ((fl.getDocumentDOM().getTimeline().layers[layer].frames[firstFrame + data[i]]) == focusedFrame.startFrame) {
		//If there is a pre-existing keyframe, select it and add item there.
		fl.getDocumentDOM().getTimeline().setSelectedFrames(firstFrame, firstFrame);
		pasteInPlace(data);
		fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames);

	} else {
		fl.getDocumentDOM().getTimeline().convertToKeyframes(firstFrame + data[i]);
		pasteInPlace(data);
	}

	//i is how many frames into the range we are (0 - index offset from firstFrame of the selection)
	var focusedFrame = fl.getDocumentDOM().getTimeline().layers[layer].frames[firstFrame + data[i]]

	//i+1 is the first frame
	focusedFrame.elements[0].firstFrame = data[i + 1]

	//i+2 is the last frame
	focusedFrame.elements[0].lastFrame = data[i + 2] //(why the fuck does this exist if we do firstFrame?)

	//i+3 is the loop type
	focusedFrame.elements[0].loop = data[i + 3]
}

//Backwards sculpt function for blank keyframes
for (var i = data.length - 8; i > 0; i -= 4) {

	//If we're a blank keyframe, work here
	if (data[i+1] == -1) {
		fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(firstFrame + data[i]);
	}
}

if (data[data.length - 1] == true) {
	//set frame after selection to be a blank keyframe
	fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(lastFrame);
	fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames);
}