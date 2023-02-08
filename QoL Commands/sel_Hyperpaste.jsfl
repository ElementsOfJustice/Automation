/******************************************************************************
HYPERPASTE
Description: Efficient paste function predicated on framearrays and document
data.

!!! Only works with one common element across your selection. Use for RIGS.
******************************************************************************/

NUM_PARAMS = 12;
var startTime = new Date();
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

	for (var i = 0; i < arr.length - 1; i += NUM_PARAMS) {
		result.push(parseInt(arr[i]), parseInt(arr[i + 1]), parseInt(arr[i + 2]), arr[i + 3], arr[i + 4], arr[i + 5], arr[i + 6], arr[i + 7], arr[i + 8], arr[i + 9], arr[i + 10], arr[i + 11]);
	}

	var isFrameEmpty = (arr[arr.length - 1] === "true");

	result.push(isFrameEmpty);
	return result;
}

//this didn't work down below for some fucking reason, so let's do this shit

function pasteInPlace(libPath) {

	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
	fl.getDocumentDOM().swapElement(libPath);

}

//Nonstandard getHash, since we use it between two files, the script name is 
//NOT a part of the hash function.
function getHash(variableName) {
	var hashIndex = variableName;
	return fl.getDocumentDOM().getDataFromDocument(hashIndex);
}

function getEaseCurve(input) {
	curve = [];
	for (var i = 0; i < input.split("|").length; i += 2) {
		var point = { x: parseFloat(input.split("|")[i]), y: parseFloat(input.split("|")[i + 1]) };
		curve.push(point);
	}
	return curve;
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
fl.getDocumentDOM().getTimeline().setSelectedFrames(firstFrame, firstFrame + data[data.length - (NUM_PARAMS + 1)]);
an.getDocumentDOM().getTimeline().clearKeyframes();

//This fucks up everything, don't do this
//fl.getDocumentDOM().getTimeline().clearFrames(firstFrame, lastFrame);
var prevData = [];
for (var i = 0; i < data.length - 1; i += NUM_PARAMS) {

	//If we're a blank keyframe, skip
	if (data[i + 1] == -1) {
		continue;
	}
	var focusedFrame = fl.getDocumentDOM().getTimeline().layers[layer].frames[firstFrame + data[i]]
	//Convert to keyframe and place item
	if (focusedFrame == focusedFrame.startFrzame) {
		//If there is a pre-existing keyframe, select it and add item there.
		fl.getDocumentDOM().getTimeline().setSelectedFrames(firstFrame, firstFrame);
		var libraryPath = data[i + 4];
		var matInfo = data[i + 5];
		if (libraryPath != "" && matInfo != "") {
			pasteInPlace(library, matInfo);
		}
		fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames);
	} else {
		var libraryPath = data[i + 4];
		if (libraryPath != "") {
			fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(firstFrame + data[i]);
			pasteInPlace(libraryPath);
		} else {
			fl.getDocumentDOM().getTimeline().convertToKeyframes(firstFrame + data[i]);
		}
	}

	//i is how many frames into the range we are (0 - index offset from firstFrame of the selection)
	var focusedFrame = fl.getDocumentDOM().getTimeline().layers[layer].frames[firstFrame + data[i]]

	//i+1 is the first frame
	if (!isNaN(data[i + 1]))
		focusedFrame.elements[0].firstFrame = data[i + 1]

	//i+2 is the last frame
	if (!isNaN(data[i + 2]))
		focusedFrame.elements[0].lastFrame = data[i + 2] //(why the fuck does this exist if we do firstFrame?)

	//i+3 is the loop type
	if (data[i + 3] != "" && data[i + 3] != undefined && data[i + 3] != null)
		focusedFrame.elements[0].loop = data[i + 3]
	var tmpMatrix = focusedFrame.elements[0].matrix;
	var matInfo = data[i + 5].split("|")
	tmpMatrix.a = parseFloat(matInfo[0])
	tmpMatrix.b = parseFloat(matInfo[1])
	tmpMatrix.c = parseFloat(matInfo[2])
	tmpMatrix.d = parseFloat(matInfo[3])
	focusedFrame.elements[0].matrix = tmpMatrix;
	focusedFrame.elements[0].x = parseFloat(matInfo[4])
	focusedFrame.elements[0].y = parseFloat(matInfo[5])
	focusedFrame.elements[0].symbolType = data[i + 6];
	focusedFrame.name = data[i + 9];
	focusedFrame.labelType = data[i + 10];
	focusedFrame.elements[0].colorAlphaPercent = parseInt(data[i + 11]);
}
for (var i = 0; i < data.length - 1; i += NUM_PARAMS) {
	var focusedFrame = fl.getDocumentDOM().getTimeline().layers[layer].frames[firstFrame + data[i]];
	if(data[i + 7] == "motion") {
		 fl.getDocumentDOM().getTimeline().createMotionTween(firstFrame + data[i]);
	}
	if (data[i + 8] != "") {
		focusedFrame.setCustomEase("all", getEaseCurve(data[i + 8]));
	}
}

//Backwards sculpt function for blank keyframes
for (var i = data.length - (NUM_PARAMS + 1); i > 0; i -= NUM_PARAMS) {
	//If we're a blank keyframe, work here
	if (data[i + 1] == -1) {
		fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(firstFrame + data[i]);
	}
}
var endTime = new Date();
var timeDiff = endTime - startTime;
timeDiff /= 1000;
var seconds = Math.round(timeDiff);

if (timeDiff < 60) {
	fl.trace("Time Elapsed: " + seconds + " seconds.");
}
if (timeDiff > 60) {
	var minutes = Math.floor(timeDiff / 60);
	var seconds = timeDiff - minutes * 60;
	fl.trace("Time Elapsed: " + minutes + " minutes and " + seconds + " seconds");
}