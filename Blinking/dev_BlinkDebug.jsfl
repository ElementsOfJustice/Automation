/*
	CASE 3 BLINK DAEMON DEBUG
*/
var blinkDuration = 6;
var bookmarkerTl = fl.getDocumentDOM().currentTimeline;
var bookmarkerFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var sceneArray = [0];
var xSheetCache = {};

fl.getDocumentDOM().selectNone();
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

	// Get the current pose name
	var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
	var ffIndex = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[curFrame].elements[0].firstFrame + 1;
	var itemIndex = fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[curFrame].elements[0].libraryItem.name);
	var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];
	var poseName = objTl.frames[ffIndex - 1].name;

	// Get blinking symbols in library (lead with the leftEye)
	var xSheetCacheKey = rigFolder + "/" + leftEye;
	if (!xSheetCache[xSheetCacheKey]) {
		var itemIndex = fl.getDocumentDOM().library.findItemIndex(xSheetCacheKey);
		xSheetCache[xSheetCacheKey] = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];
	}

	objTl = xSheetCache[xSheetCacheKey];

	for (var k = 0; k < objTl.frameCount; k++) {
		if ((objTl.frames[k].labelType == "name") && (k == objTl.frames[k].startFrame) && (objTl.frames[k].name == poseName)) {
			return (k + 1);
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
	var rigFolder = rigPath.substring(0, rigPath.lastIndexOf('/'));
	var leftEye = (rigFolder + "BlinkLeft").replace("►", "_");
	var rightEye = (rigFolder + "BlinkRight").replace("►", "_");

	for (i = 0; i < frameArray.length; i++) {
		if ((i == frameArray[i].startFrame) && (frameArray[i].isEmpty == false) && (frameArray[i].labelType == "anchor")) {
			fl.getDocumentDOM().getTimeline().currentFrame = i
			var blinkFrame = blinkFrameIndex(leftEye, rigFolder);

			//BLINK
			if (frameArray[i].name == "Blink") {
				frameArray[i].actionScript = leftEye + ".gotoAndPlay(" + blinkFrame + ");\n" + rightEye + ".gotoAndPlay(" + blinkFrame + ");";
				if (frameArray[i + blinkDuration].startFrame != i + blinkDuration) {
					fl.getDocumentDOM().getTimeline().convertToKeyframes(i + blinkDuration);
				}
				fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + blinkDuration].actionScript = leftEye + ".gotoAndStop(" + blinkFrame + ");\n" + rightEye + ".gotoAndStop(" + blinkFrame + ");";
			}

			//ANIMATION OF EYES CLOSING
			if (frameArray[i].name == "AnimClose") {
				frameArray[i].actionScript = leftEye + ".gotoAndPlay(" + blinkFrame + ");\n" + rightEye + ".gotoAndPlay(" + blinkFrame + ");";
				if (frameArray[i + blinkDuration].startFrame != i + (blinkDuration / 2)) {
					fl.getDocumentDOM().getTimeline().convertToKeyframes(i + (blinkDuration / 2));
				}
				fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + (blinkDuration / 2)].actionScript = leftEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");\n" + rightEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");";
			}

			//ANIMATION OF EYES OPENING
			if (frameArray[i].name == "AnimOpen") {
				frameArray[i].actionScript = leftEye + ".gotoAndPlay(" + (blinkFrame + (blinkDuration / 2)) + ");\n" + rightEye + ".gotoAndPlay(" + (blinkFrame + (blinkDuration / 2)) + ");";
				if (frameArray[i + blinkDuration].startFrame != i + (blinkDuration / 2)) {
					fl.getDocumentDOM().getTimeline().convertToKeyframes(i + (blinkDuration / 2));
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
				//We're in a scene. You're now on a child layer of VECTOR_CHARACTERS. Run your code.
				runBlinking(b);
				fl.trace("Run Blinking on layer " + b + " of scene " + currentTimeline);
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
				//We're in a scene. You're now on a child layer of VECTOR_CHARACTERS. Erase your code.
				var frameArray = fl.getDocumentDOM().getTimeline().layers[j].frames;
				for (k = 0; k < frameArray.length; k++) {
					if ((frameArray[k].startFrame) && (frameArray[k].isEmpty == false)) {
						frameArray[k].actionScript = ""
					}
				}
			}
		}
	}
}

//Put you back where you were
fl.getDocumentDOM().currentTimeline = bookmarkerTl;
fl.getDocumentDOM().getTimeline().currentFrame = bookmarkerFrame;