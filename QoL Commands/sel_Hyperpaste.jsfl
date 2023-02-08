/******************************************************************************
								HYPERPASTE

Description: Efficient paste function predicated on framearrays and document
data.

To-Do:
-There is lossy tween pasting on tweens that are not linear easing styles.
Solving this is going to be very hard. Defining all polynomial Bezier
functions and mapping the ease style's points to that and correcting them
is a possible approach. This will be a day-waster.

-This is still kind of slow, but infinitely faster than the default method.

-tmp_Dummysymbol dependency, doesn't alert user if it is missing.

-Any possible speedups at all.

User Disclaimers:
-There is lossy tween pasting on tweens that are not linear easing styles.
If you are copy/pasting a tween with a non-linear easing style, it may have
to be redefined manually after a paste.

-The code runs best with the least symbol swaps within your range. This means
copy/pasting with only one common symbol selected between all frames will
yield the fastest load time. A selection constantly switching between
multiple symbols will be the slowest.
******************************************************************************/

NUM_PARAMS = 12;
fl.showIdleMessage(false);

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = selectedFrames[0];
var firstFrame = selectedFrames[1];
var lastFrame = selectedFrames[2];

/*
Function: parseStr
Variables: str
Description: Split the string by comma and store it in an array. Code is naturalized 
to be friendly further on.
*/
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

/*
Function: pasteInPlace
Variables: libPath
Description: Place tmp_Dummysymbol on stage and swap with an element calculated from library path
*/
function pasteInPlace(libPath) {

	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
	fl.getDocumentDOM().swapElement(libPath);

}

/*
Function: getHash
Variables: variableName
Description: Gets a variable from document data via a hash.
*/
function getHash(variableName) {
	var hashIndex = variableName;
	return fl.getDocumentDOM().getDataFromDocument(hashIndex);
}

/*
Function: getEaseCurve
Variables: input
Description: Gets an ease Bezier curve from an input. Is accurate to the hundreths place,
needs to be accurate to the ten-thousands place. This is part of the intractable problem,
moving forwards, this needs some crazy math to be accurate.
*/
function getEaseCurve(input) {
	curve = [];
	for (var i = 0; i < input.split("|").length; i += 2) {
		var point = { x: parseFloat(input.split("|")[i]), y: parseFloat(input.split("|")[i + 1]) };
		curve.push(point);
	}
	return curve;
}

// Setup, reverse selection if it's backwards
if (firstFrame > lastFrame) {
	var temp = lastFrame;
	lastFrame = firstFrame;
	firstFrame = temp;
}

// Unlock the layer
fl.getDocumentDOM().getTimeline().layers[layer].locked = false;

// Decode hypercopy data
var data = parseString(getHash("HYPERCOPY"));
fl.getDocumentDOM().getTimeline().setSelectedFrames(firstFrame, firstFrame + data[data.length - (NUM_PARAMS + 1)]);
an.getDocumentDOM().getTimeline().clearKeyframes();

var prevData = [];

// This next region of code reconstructs the portion of the timeline selected according to the copy data. 
// Takes in a variable number of parameters. At the time of writing, there are currently twelve.

/*
INDEX			PARAMETER
 01		...	 Frame number offset from the start frame of the selection.
 02		...	 The loop startFrame.
 03		...	 The loop lastFrame.
 04		...	 The loop type.
 05		...	 The library path of the symbol being considered.
 06		...	 The transformation matrix of the object. The matrix is a string encoding an array like "a|b|c|d|tx|ty".
 07		...	 The symbol type, either Graphic or MovieClip.
 08		...	 The tween type, if any.
 09		...	 The tween easing. [THIS IS PROBLEMATIC]
 10		...	 The frame name.
 11		...	 The frame label type.
 12		..	 Frame alpha.
*/

for (var i = 0; i < data.length - 1; i += NUM_PARAMS) {

	//If we're a blank keyframe, skip processing.
	if (data[i + 1] == -1) {
		continue;
	}

	var focusedFrame = fl.getDocumentDOM().getTimeline().layers[layer].frames[firstFrame + data[i]]

	//Convert to keyframe and place item (This is never run, clean up this code later)
	if (focusedFrame == focusedFrame.startFrame) {

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

	fl.getDocumentDOM().getTimeline().layers[layer].visible = false;

	// If the next value is a number, it's a frame number, and we'll use it as the second frame.
	var focusedFrame = fl.getDocumentDOM().getTimeline().layers[layer].frames[firstFrame + data[i]]

	// Set the first frame of the focused frame to the next number in the data array.
	if (!isNaN(data[i + 1]))
		focusedFrame.elements[0].firstFrame = data[i + 1]

	if (!isNaN(data[i + 2]))
		focusedFrame.elements[0].lastFrame = data[i + 2]

	if (data[i + 3] != "" && data[i + 3] != undefined && data[i + 3] != null)
		focusedFrame.elements[0].loop = data[i + 3]

	// Get the matrix info array, and split it into its parts.
	var tmpMatrix = focusedFrame.elements[0].matrix;
	var matInfo = data[i + 5].split("|")

	// Parse the matrix
	tmpMatrix.a = parseFloat(matInfo[0])
	tmpMatrix.b = parseFloat(matInfo[1])
	tmpMatrix.c = parseFloat(matInfo[2])
	tmpMatrix.d = parseFloat(matInfo[3])

	// Update the matrix of the focused element to the one from the copy data, and update the position of the element to the one from the copy data.
	focusedFrame.elements[0].matrix = tmpMatrix;
	focusedFrame.elements[0].x = parseFloat(matInfo[4])
	focusedFrame.elements[0].y = parseFloat(matInfo[5])
	focusedFrame.elements[0].symbolType = data[i + 6];
	focusedFrame.name = data[i + 9];
	focusedFrame.labelType = data[i + 10];

	// Set the alpha of the layer to the value of the alpha channel in the copy data.
	focusedFrame.elements[0].colorAlphaPercent = parseInt(data[i + 11]);

	// Reset layer visibility
	fl.getDocumentDOM().getTimeline().layers[layer].visible = true;

}

//Does a separate tween pass.
for (var i = 0; i < data.length - 1; i += NUM_PARAMS) {
	var focusedFrame = fl.getDocumentDOM().getTimeline().layers[layer].frames[firstFrame + data[i]];

	if (data[i + 7] == "motion") {
		fl.getDocumentDOM().getTimeline().createMotionTween(firstFrame + data[i]);
	}

	if (data[i + 8] != "") {
		focusedFrame.setCustomEase("all", getEaseCurve(data[i + 8]));
	}
}

//Backwards sculpt function for blank keyframes.
for (var i = data.length - (NUM_PARAMS + 1); i > 0; i -= NUM_PARAMS) {
	
	//If we're a blank keyframe, work here.
	if (data[i + 1] == -1) {
		fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(firstFrame + data[i]);
	}
}