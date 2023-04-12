/*
	CASE 3 BLINK DAEMON DEBUG
*/
var blinkDuration = 6;
var bookmarkerTl = fl.getDocumentDOM().currentTimeline;
var bookmarkerFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var sceneArray = [0];
var tmpKeys = [];

fl.getDocumentDOM().selectNone();
fl.showIdleMessage(false);
fl.outputPanel.clear();

//Compile timeline index of scenes, where scenes are arbitrarially defined as a timeline containing
//a VECTOR_CHARACTERS folder. There is no fl.getDocumentDOM().scenes array... Too bad!

for (i = 1, total = fl.getDocumentDOM().timelines.length; i < total; i++) {
	for (j = 0, layerCount = fl.getDocumentDOM().timelines[i].layers.length; j < layerCount; j++) {
		if (fl.getDocumentDOM().timelines[i].layers[j].name === "VECTOR_CHARACTERS") {
			sceneArray.push(i);
			break;
		}
	}
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

/*
Function: blinkFrameIndex
Variables: 
    leftEye   We make the reasonable assumption both eyes are synchronized, so we work with only one eye
    rigFolder The location of the rig folder, used to find the movieClip
Description: Return the blink frame index for a given pose of a given rig by checking the xSheet. This is
current-frame-dependent. We use a cache to minimize the accessing of rigs. Wow! So fast!
*/

blinkFrameIndex = function (leftEye, rigFolder) {

	// Dumb that we shift this around, but use the Unicode arrow for library instance, underscore for timeline movieClip
	leftEye = leftEye.replace("_", "►")
	leftEye = rigFolder.substring(0, rigFolder.lastIndexOf('/')) + "/" + leftEye;

	// Get the current pose name from the rig
	var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
	var ffIndex = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[curFrame].elements[0].firstFrame + 1;
	var itemIndex = fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[curFrame].elements[0].libraryItem.name);
	var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];
	var poseName = objTl.frames[ffIndex - 1].name;

	// Load the eyes
	var itemIndex = fl.getDocumentDOM().library.findItemIndex(leftEye);
	var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];

	// Check the pose name between rig and eyes.
	for (var k = 0; k < objTl.frameCount; k++) {
		//fl.trace(k + " " + objTl.frames[k].name);
		if ((objTl.frames[k].labelType == "name") && (k == objTl.frames[k].startFrame) && (objTl.frames[k].name == poseName)) {
			return (k + 1);
		}
	}
}

/*
Function: autoEyeSet
Variables: 
    layerIndex	What layer are we blinking on
Description: Automatically apply cutOpen frame anchors to detected
pose changes.
*/

autoEyeSet = function (layerIndex) {

	fl.getDocumentDOM().getTimeline().setSelectedLayers(layerIndex);
	var firstGraphicInstance = findFirstFrameWithSymbol(layerIndex);

	if (firstGraphicInstance == -1) {
		return
	}

	var itemIndex = fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[firstGraphicInstance].elements[0].libraryItem.name);
	var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];
	var objTlFrameCount = objTl.frames.length;
	var frames = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames;

	var xSheetCache = [];

	for (var k = 0; k < objTlFrameCount; k++) {
		var objTlFrame = objTl.frames[k];
		if (objTlFrame.labelType === "name" && k === objTlFrame.startFrame) {
			xSheetCache.push(k);
		}
	}

	for (var i = 0; i < frames.length - 1; i++) {

		if ((i == 0) && (!fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].isEmpty)) {
			//First Frame of Layer
			fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].labelType = "anchor";
			fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].name = "CutOpen";
		}

		if ((fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].isEmpty) && (!fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + 1].isEmpty)) {
			//If we go from no content to content.
			fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + 1].labelType = "anchor";
			fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + 1].name = "CutOpen";
		}

		if ((!fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].isEmpty) && (!fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + 1].isEmpty)) {
			if (!checkRange(xSheetCache, fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].elements[0].firstFrame, fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + 1].elements[0].firstFrame)) {
				//If a change in poses is detected within content.
				fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + 1].labelType = "anchor";
				fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + 1].name = "CutOpen";
			}
		}
	}
}

/*
Function: runBlinking
Variables: 
    layerIndex	What layer are we blinking on
Description: Run the blinking code for all markers on a layer.
*/

runBlinking = function (layerIndex) {

	fl.getDocumentDOM().getTimeline().setSelectedLayers(layerIndex);
	var firstGraphicInstance = findFirstFrameWithSymbol(layerIndex);

	if (firstGraphicInstance == -1) {
		return
	}

	var timeline = fl.getDocumentDOM().getTimeline();
	var frameArray = timeline.layers[layerIndex].frames;
	var rigPath = timeline.layers[layerIndex].frames[firstGraphicInstance].elements[0].libraryItem.name;
	var rigFolder = rigPath.substring(rigPath.lastIndexOf('/') + 1);
	rigFolder = rigFolder.substring(0, rigFolder.indexOf('►')) + "►";

	var leftEye = (rigFolder + "BlinkLeft").replace("►", "_");
	var rightEye = (rigFolder + "BlinkRight").replace("►", "_");

	rigFolder = rigPath;

	for (i = 0; i < frameArray.length; i++) {
		if ((i == frameArray[i].startFrame) && (frameArray[i].isEmpty == false) && (frameArray[i].labelType == "anchor")) {
			fl.getDocumentDOM().getTimeline().currentFrame = i
			var blinkFrame = blinkFrameIndex(leftEye, rigFolder);

			//BLINK
			if (frameArray[i].name == "Blink") {
				frameArray[i].actionScript = leftEye + ".gotoAndPlay(" + blinkFrame + ");\n" + rightEye + ".gotoAndPlay(" + blinkFrame + ");";
				if (frameArray[i + blinkDuration].startFrame != i + blinkDuration) {
					fl.getDocumentDOM().getTimeline().convertToKeyframes(i + blinkDuration);
					tmpKeys.push([layerIndex, (i + blinkDuration)]);
				}
				fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + blinkDuration].actionScript = leftEye + ".gotoAndStop(" + blinkFrame + ");\n" + rightEye + ".gotoAndStop(" + blinkFrame + ");";
			}

			//ANIMATION OF EYES CLOSING
			if (frameArray[i].name == "AnimClose") {
				frameArray[i].actionScript = leftEye + ".gotoAndPlay(" + blinkFrame + ");\n" + rightEye + ".gotoAndPlay(" + blinkFrame + ");";
				if (frameArray[i + blinkDuration].startFrame != i + (blinkDuration / 2)) {
					fl.getDocumentDOM().getTimeline().convertToKeyframes(i + (blinkDuration / 2));
					tmpKeys.push([layerIndex, (i + (blinkDuration / 2))]);
				}
				fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + (blinkDuration / 2)].actionScript = leftEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");\n" + rightEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");";
			}

			//ANIMATION OF EYES OPENING
			if (frameArray[i].name == "AnimOpen") {
				frameArray[i].actionScript = leftEye + ".gotoAndPlay(" + (blinkFrame + (blinkDuration / 2)) + ");\n" + rightEye + ".gotoAndPlay(" + (blinkFrame + (blinkDuration / 2)) + ");";
				if (frameArray[i + blinkDuration].startFrame != i + (blinkDuration / 2)) {
					fl.getDocumentDOM().getTimeline().convertToKeyframes(i + (blinkDuration / 2));
					tmpKeys.push([layerIndex, (i + (blinkDuration / 2))]);
				}
				fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + (blinkDuration / 2)].actionScript = leftEye + ".gotoAndStop(" + blinkFrame + ");\n" + rightEye + ".gotoAndStop(" + blinkFrame + ");";
			}

			//CUT TO EYES OPEN
			if (frameArray[i].name == "CutOpen") {
				frameArray[i].actionScript = leftEye + ".gotoAndStop(" + blinkFrame + ");\n" + rightEye + ".gotoAndStop(" + blinkFrame + ");";
			}

			//CUT TO EYES CLOSED
			if (frameArray[i].name == "CutClosed") {
				frameArray[i + 1].actionScript = leftEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");\n" + rightEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");";
			}
		}
	}
}

//For each scene, runBlinking on each child layer of VECTOR_CHARACTERS
for (var a = 0; a < sceneArray.length; a++) {
	fl.getDocumentDOM().currentTimeline = sceneArray[a];
	var currentTimeline = sceneArray[a];
	for (var b = 0; b < fl.getDocumentDOM().timelines[currentTimeline].layerCount; b++) {
		if (fl.getDocumentDOM().timelines[currentTimeline].layers[b].parentLayer !== null) {
			if (fl.getDocumentDOM().timelines[currentTimeline].layers[b].parentLayer.name == "VECTOR_CHARACTERS") {
				if (fl.getDocumentDOM().timelines[currentTimeline].layers[b].layerType == "normal") {
					//We're in a scene. You're now on a child layer of VECTOR_CHARACTERS. Run your code.

					autoEyeSet(b);
					runBlinking(b);

				}
			}
		}
	}
}

//Test movie, as opposed to test scene. This new implementation of blinking tech is resistant to scenes!!!
fl.getDocumentDOM().testMovie();

//AS3 Cleanup
for (var i = 0; i < sceneArray.length; i++) {
	fl.getDocumentDOM().currentTimeline = sceneArray[i];
	var currentTimeline = sceneArray[i];
	for (var j = 0; j < fl.getDocumentDOM().timelines[currentTimeline].layerCount; j++) {
		if (fl.getDocumentDOM().timelines[currentTimeline].layers[j].parentLayer !== null) {
			if (fl.getDocumentDOM().timelines[currentTimeline].layers[j].parentLayer.name == "VECTOR_CHARACTERS") {
				if (fl.getDocumentDOM().timelines[currentTimeline].layers[j].layerType == "normal") {
					//We're in a scene. You're now on a child layer of VECTOR_CHARACTERS. Erase your code.
					var frameArray = fl.getDocumentDOM().getTimeline().layers[j].frames;
					for (k = 0; k < frameArray.length; k++) {
						frameArray[k].actionScript = ""
					}
				}
			}
		}
	}
}

for (var i = 0; i < tmpKeys.length; i++) {
	fl.getDocumentDOM().getTimeline().setSelectedLayers(tmpKeys[i][0]);
	fl.getDocumentDOM().getTimeline().clearKeyframes(tmpKeys[i][1], tmpKeys[i][1]);
}

//Put you back where you were
fl.getDocumentDOM().currentTimeline = bookmarkerTl;
fl.getDocumentDOM().getTimeline().currentFrame = bookmarkerFrame;