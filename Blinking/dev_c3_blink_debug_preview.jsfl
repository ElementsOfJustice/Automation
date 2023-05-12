/*
	CASE 3 BLINK PREVIEW
*/
var bookmarkerTl = fl.getDocumentDOM().currentTimeline;
var bookmarkerFrame = fl.getDocumentDOM().getTimeline().currentFrame;

var blinkDuration = 6;
var sceneArray = [0];
var tmpKeys = [];

fl.getDocumentDOM().selectNone();
fl.showIdleMessage(false);
fl.outputPanel.clear();

//Compile timeline index of scenes, where scenes are defined as a timeline containing
//a VECTOR_CHARACTERS folder.
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
	layerIndex	What layer to search
Description: Return the frame number of the first occurance of any graphic symbol.
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
Function: roundDownToHundred
Variables: 
	num int
Description: Rounds down to the next hundred.
*/
function roundDownToHundred(num) {
	return Math.floor(num / 100) * 100;
}

/*
Function: checkRange
Variables: 
	arr		xSheetCache
	num1	First Frame #1
	num2	First Frame #2
Description: Returns true if two frame's firstFrames share the same pose.
*/
function checkRange(arr, num1, num2) {
	var rangeStart, rangeEnd;

	for (var i = 0; i < arr.length; i++) {
		if (num1 >= arr[i] && num1 <= arr[i + 1]) {
			rangeStart = arr[i];
			rangeEnd = arr[i + 1];
		}
	}

	/*if (num2 >= rangeStart && num2 <= rangeEnd) {
		return true;
	} else {
		return false;
	}*/ // WHAT IS THIS CRAP
	return (num2 >= rangeStart && num2 <= rangeEnd);
}

/*
Function: findKey
Variables: 
	arr		xSheetCache
	num1	First Frame #1
	num2	First Frame #2
Description: Returns true if two frame's firstFrames share the same pose.
*/

function findKey(number, dictionary) {
	var keys = [];

	for (var key in dictionary) {
		if (dictionary.hasOwnProperty(key)) {
			keys.push(Number(key));
		}
	}

	keys.sort(function (a, b) {
		return a - b;
	});

	for (var i = keys.length - 1; i >= 0; i--) {
		var key = keys[i];

		if (number >= key) {
			return key;
		}
	}

	return null;
}

/*
Function: blinkFrameIndex
Variables: 
	leftEye   We make the reasonable assumption both eyes are synchronized, so we work with only one eye
	rigFolder The location of the rig folder, used to find the movieClip
Description: Return the blink frame index for a given pose of a given rig by checking the xSheet. This is
current-frame-dependent. We use a cache to minimize the accessing of rigs. Wow! So fast!
*/

blinkFrameIndex = function (leftEye, rigFolder, currentFrame, layerIndex, xSheetCache) {

	//► for the library instance Char►BlinkLeft, underscore for the timeline movieclip instance, Char_BlinkLeft.
	leftEye = leftEye.replace("_", "►");
	leftEye = rigFolder.substring(0, rigFolder.lastIndexOf('/')) + "/" + leftEye;

	//In-scope timeline vars.
	var timeline = fl.getDocumentDOM().getTimeline();

	//Get the current pose from the character.
	var firstFrame = timeline.layers[layerIndex].frames[currentFrame].elements[0].firstFrame + 1;
	var poseName = xSheetCache[findKey(firstFrame, xSheetCache)];

	//Load the eyes
	var itemIndex = fl.getDocumentDOM().library.findItemIndex(leftEye);
	var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];

	//Return the frame there is a match in xSheet entries between BlinkLeft and the character.
	for (var k = 0; k < objTl.frameCount; k++) {
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

	var firstGraphicInstance = findFirstFrameWithSymbol(layerIndex);

	if (firstGraphicInstance == -1) {
		return;
	}

	//In-scope timeline vars.	
	var timeline = fl.getDocumentDOM().getTimeline();
	var layer = timeline.layers[layerIndex];
	var frames = layer.frames;

	//Reference the character's xSheet we are about to consider.
	var itemIndex = fl.getDocumentDOM().library.findItemIndex(frames[firstGraphicInstance].elements[0].libraryItem.name);
	var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];

	var xSheetCache = [];

	//Make a cache of that character's xSheet. We reference the cache instead of loading the character many times.
	for (var k = 0; k < objTl.frames.length; k++) {
		var objTlFrame = objTl.frames[k];
		if (objTlFrame.labelType === "name" && k === objTlFrame.startFrame) {
			xSheetCache.push(k);
		}
	}

	//For all frames on the layer we are running autoEyeSet on, automatically apply the bare minimum blink instructions.
	for (var i = 0; i < frames.length - 1; i++) {

		if ((i == 0) && (!frames[i].isEmpty)) {
			//CutOpen on the first frame of a character layer if it has content.
			frames[i].labelType = "anchor";
			frames[i].name = "CutOpen";
		}

		//Next two operations check if a pre-existing anchor label exists, and if it does, does nothing. This allows human users to circumvent the automatic labelling. 

		if ((frames[i].isEmpty) && (!frames[i + 1].isEmpty) && (!frames[i].labelType == "anchor")) {
			//CutOpen if we go from no content to content from one frame to the next.
			frames[i + 1].labelType = "anchor";
			frames[i + 1].name = "CutOpen";
		}

		if ((!frames[i].isEmpty) && (!frames[i + 1].isEmpty) && (checkRange(xSheetCache, xSheetCache[-1], frames[i + 1].elements[0].firstFrame)) && (!frames[i].labelType == "anchor")) {
			if (!checkRange(xSheetCache, frames[i].elements[0].firstFrame, frames[i + 1].elements[0].firstFrame)) {
				//CutOpen on pose changes.
				frames[i + 1].labelType = "anchor";
				frames[i + 1].name = "CutOpen";
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

	var firstGraphicInstance = findFirstFrameWithSymbol(layerIndex);

	if (firstGraphicInstance == -1) {
		return
	}

	var xSheetCache = {};

	//Get the library folder of the character we are running blinking code on.
	var timeline = fl.getDocumentDOM().getTimeline();
	var frameArray = timeline.layers[layerIndex].frames;
	var rigPath = timeline.layers[layerIndex].frames[firstGraphicInstance].elements[0].libraryItem.name;
	var rigFolder = rigPath.substring(rigPath.lastIndexOf('/') + 1);
	rigFolder = rigFolder.substring(0, rigFolder.indexOf('►')) + "►";

	//Get the instance names of the blinking movieclips for the character we are running blinking code on.
	var leftEye = (rigFolder + "BlinkLeft").replace("►", "_");
	var rightEye = (rigFolder + "BlinkRight").replace("►", "_");

	//Make a cache of our character's xSheet. We reference the cache instead of loading the character many times.
	var itemIndex = fl.getDocumentDOM().library.findItemIndex(rigPath);
	var character_xSheet = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];

	for (var k = 0; k < character_xSheet.frames.length; k+= character_xSheet.frames[k].duration - (k - character_xSheet.frames[k].startFrame)) {
		var character_xSheetEntry = character_xSheet.frames[k];
		if (character_xSheetEntry.labelType === "name" && k === character_xSheetEntry.startFrame) {
			xSheetCache[k] = character_xSheetEntry.name;
		}
	}

	for (i = 0; i < frameArray.length; i++) {
		if ((i == frameArray[i].startFrame) && (frameArray[i].isEmpty == false) && (frameArray[i].labelType == "anchor")) {
			var blinkFrame = blinkFrameIndex(leftEye, rigPath, i, layerIndex, xSheetCache);

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
		var parentLayerIsNull = fl.getDocumentDOM().timelines[currentTimeline].layers[b].parentLayer === null;
		var layerIsNotVectorCharacters = fl.getDocumentDOM().timelines[currentTimeline].layers[b].parentLayer.name !== "VECTOR_CHARACTERS";
		var layerTypeIsNotNormal = fl.getDocumentDOM().timelines[currentTimeline].layers[b].layerType !== "normal";
		if (parentLayerIsNull || layerIsNotVectorCharacters || layerTypeIsNotNormal) {
			continue;
		}
		//We're in a scene. You're now on a child layer of VECTOR_CHARACTERS. Run your code.
		autoEyeSet(b);
		runBlinking(b);
	}
}
//Test movie, as opposed to test scene. This new implementation of blinking tech is resistant to testing scenes!
fl.getDocumentDOM().testMovie();

//AS3 Cleanup
for (var i = 0; i < sceneArray.length; i++) {
	fl.getDocumentDOM().currentTimeline = sceneArray[i];
	var currentTimeline = sceneArray[i];
	for (var j = 0; j < fl.getDocumentDOM().timelines[currentTimeline].layerCount; j++) {
		var parentLayerIsNull = fl.getDocumentDOM().timelines[currentTimeline].layers[b].parentLayer === null;
		var layerIsNotVectorCharacters = fl.getDocumentDOM().timelines[currentTimeline].layers[b].parentLayer.name !== "VECTOR_CHARACTERS";
		var layerTypeIsNotNormal = fl.getDocumentDOM().timelines[currentTimeline].layers[b].layerType !== "normal";
		if (parentLayerIsNull || layerIsNotVectorCharacters || layerTypeIsNotNormal) {
			continue;
		}
		//We're in a scene. You're now on a child layer of VECTOR_CHARACTERS. Erase your code.
		var frameArray = fl.getDocumentDOM().getTimeline().layers[j].frames;
		for (k = 0; k < frameArray.length; k++) {
			frameArray[k].actionScript = ""
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