/******************************************************************************
ERASE LIPSYNC DATA
Description: 

******************************************************************************/

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

/*
Function: checkRange
Variables: 
    arr		xSheetCache
	num1	First Frame #1
	num2	First Frame #2
Description: Returns true or false if two frame's firstFrames share the same pose.
*/

function checkRange(arr, num1, num2) {
	var rangeStart, rangeEnd;
	for (var i = 0; i < arr.length; i++) {
		if (num1 >= arr[i] && num1 <= arr[i + 1]) {
			rangeStart = arr[i];
			rangeEnd = arr[i + 1];
		}
	}
	if (num2 >= rangeStart && num2 <= rangeEnd) {
		return true;
	} else {
		return false;
	}
}

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layerInfo = [];

fl.showIdleMessage(false);

for (var i = 0; i < selectedFrames.length / 3; i++) {
	layerInfo.push([selectedFrames[3 * i], selectedFrames[3 * i + 1], selectedFrames[3 * i + 2]]);
}

var timeline = fl.getDocumentDOM().getTimeline();
var cullSelection = [];

var startTime = new Date();

for (var i = 0, len = layerInfo.length; i < len; i++) {
	var curLayer = layerInfo[i][0];
	var seekSymbol = findFirstFrameWithSymbol(curLayer);
	var elements = timeline.layers[curLayer].frames[seekSymbol].elements;
	var itemIndex = fl.getDocumentDOM().library.findItemIndex(elements[0].libraryItem.name);
	var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];
	var layerFrames = timeline.layers[curLayer].frames;

	timeline.layers[curLayer].visible = false;

	var xSheetCache = [];

	for (var k = 0, objTlFrameCount = objTl.frameCount; k < objTlFrameCount; k++) {
		var objTlFrame = objTl.frames[k];
		if (objTlFrame.labelType === "name" && k === objTlFrame.startFrame) {
			xSheetCache.push(k);
		}
	}

	for (var k = layerInfo[i][1], layerEnd = layerInfo[i][2]; k < layerEnd; k++) {

		if (k != 0) {
			// If we're an empty frame or a frame with content that has an empty frame preceeding it, ignore.
			if (((fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k - 1].isEmpty) && (!fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k].isEmpty)) || fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k].isEmpty) {
				//This is terrible, but we have to play the program's game by its own shitty rules
				cullSelection.push(layerInfo[i][0]);
				cullSelection.push(k);
				cullSelection.push(k + 1);
			}
		}

		if ((!fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k].isEmpty) && (!fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k + 1].isEmpty)) {
			// If the current frame has content and the next frame has content too, check if the poses are the same. If not, clear the keyframe.
			if (!checkRange(xSheetCache, fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k].elements[0].firstFrame, fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k + 1].elements[0].firstFrame)) {
				//This is terrible, but we have to play the program's game by its own shitty rules
				cullSelection.push(layerInfo[i][0]);
				cullSelection.push(k + 1);
				cullSelection.push(k + 2);
			}
		}
	}

	fl.getDocumentDOM().getTimeline().setSelectedFrames(cullSelection, false)
	timeline.clearKeyframes();
	timeline.layers[curLayer].visible = true;
}

fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames);

var endTime = new Date();
timeDiff = endTime - startTime;
timeDiff /= 1000;
var seconds = Math.round(timeDiff);

if (timeDiff < 60) {
	fl.trace("SCENE GENERATION TIME ELAPSED: " + seconds + " seconds.");
}

if (timeDiff > 60) {
	var minutes = Math.floor(timeDiff / 60);
	var seconds = timeDiff - minutes * 60;
	fl.trace("SCENE GENERATION TIME ELAPSED: " + minutes + " minutes and " + seconds + " seconds");
}