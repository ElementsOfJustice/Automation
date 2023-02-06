/*				ELEMENTS OF JUSTICE CASE 3 DAEMON
											2/3/2023
							
	This implementation of code uses event listeners on startup
	to abridge the functionality of the program to facilitate
	a more fluid video editing environment. Among the accommodations
	made herein include ActionScript3 blinking controlled by frame
	names, statistics about RAM consumption and file size, and
	eventually rollback options through XFL local repositories.
	
	Connor is bae.							-Soundman
*/

//Vanity Variables
var daemonName = "Elements of Justice utility daemon";
var sessionCommit = false;
var firstOpen = true;

//Don't touch these variables
var blinkDuration = 6;
var bookmarkerTl = null
var bookmarkerFrame = null
var toSave = "";
var autoSave = false;
var sceneArray = [0];
var xSheetCache = {};

/*		= = = REPEATED FUNCTIONS = = =
	Functions that are highly re-run go here.
*/

/*
Function: getMemory
Description: Returns both RAM usage and file size of the currently opened document.
*/

getMemory = function () {
	var memsize = fl.getAppMemoryInfo(2);
	var disksize = FLfile.getSize(fl.getDocumentDOM().pathURI);
	fl.trace("RAM consumption is " + Math.abs(memsize) + " bytes or " + Math.abs(Math.round(memsize / 1048576)) + "MB");
	fl.trace("File size is " + disksize + " bytes or " + Math.abs(Math.round(disksize / 1048576)) + "MB");
}

/*
Function: getLinkages
Description: I still don't know if we're going to use linkages, but here's some
code that reports on your current ones! ¯\_(ツ)_/¯,
*/

getLinkages = function () {
	var library = fl.getDocumentDOM().library
	var linkageCount = 0

	for (var i = 0; i < fl.getDocumentDOM().library.items.length; i++) {
		library.selectItem(fl.getDocumentDOM().library.items[i].name)

		if (library.getItemProperty('symbolType') == "graphic") {
			if (library.getItemProperty('sourceFilePath') != null) {
				linkageCount++;
			}
		}
	}

	fl.trace('Linkages found: ' + linkageCount);
}

/*
Function: makeLossless
Description: Gets all bitmaps and sounds in the document, sets them to the least
lossy compression type. Run this on document open.
*/

makeLossless = function () {
	for (var i = 0; i < fl.getDocumentDOM().library.items.length; i++) {
		if (fl.getDocumentDOM().library.items[i].itemType == "bitmap") {
			fl.getDocumentDOM().library.items[i].compressionType = "lossless";
		}
		if (fl.getDocumentDOM().library.items[i].itemType == "sound") {
			fl.getDocumentDOM().library.items[i].compressionType = "Raw";
		}
	}
	fl.trace("Set compression of all bitmap and audio files to lossless.");
}

//		= = = ACTIONSCRIPT FUNCTIONS = = =
/*	Creates Actionscript according to anchor frame
	comments before a scene publishes, and then
	cleans up the Actionscript after the publishing
	finishes.

	Ensure whatever is written here is 100% fool-
	proof. Video editors will not be able to see
	the code, as the code is self-deleting beyond
	the publishing stage.
*/

/*
Function: funcTestScene
Description: Error where EVERYTHING in the AS3 blink pipeline works but the test scene is interrupted
by the post publish event. Does putting it in a function fix it for some mysterious reason?
*/
funcTestScene = function () {
	//Test movie, as opposed to test scene. This new implementation of blinking tech is resistant to scenes!!!
	fl.getDocumentDOM().testMovie();
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
Description: Run the blinking code for all markers on a layer. There are some emergent properties of 
AS3-controlled blinks that I will state here. CutOpen has to be applied on every pose change or else
the blinks from one pose will carry over to another pose. This is not a bug, it is a feature. VEs
and the scene generator will have to name frames where a pose change occurs. There probably is a roundabout
way to use this creatively, but it would be stupid hard and it's not worth it. Just use CutOpen whenever a 
rig appears and when the pose changes.
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

//			= = = LOAD FUNCTIONS = = =
/*	Functions that are run once a document is
	loaded into memory, either by opening or
	by changing focus.
*/

docOpen = function () {
	fl.outputPanel.clear();
	fl.trace(daemonName + " is running.")
	fl.trace('Opened Document [' + fl.getDocumentDOM().name + "]");
	fl.trace('Description: ' + fl.getDocumentDOM().description);
	fl.getDocumentDOM().forceSimple = true;
	getMemory();
	makeLossless();

	if (firstOpen) {
		var commitXML = '<dialog title="Automatic Version History" buttons="accept, cancel"><label value="Do you want to enable version history control for this session?        "/><spacer/></dialog>';
		var commitDialogue = fl.xmlPanelFromString(commitXML);
		firstOpen = false;
	}

	if (commitDialogue.dismiss == "accept") {
		sessionCommit = true;
	}
}

docChanged = function () {
	fl.outputPanel.clear();
	fl.trace(daemonName + " is running.")
	fl.trace('Changed Document ' + fl.getDocumentDOM().name + "]");
	fl.trace('Description: ' + fl.getDocumentDOM().description);
	fl.getDocumentDOM().forceSimple = true;
	getMemory();
}

//			= = = DOCUMENT SAVE = = =
/*	Version history control on document save.
 */

docSave = function () {
	if (sessionCommit && !autoSave) {
		
		var path = fl.getDocumentDOM().path;
		var fileType = path.substring(path.length - 3);
		var fileName = fl.getDocumentDOM().name.substring(0, fl.getDocumentDOM().name.length - 4);
		var folderPath = fl.getDocumentDOM().pathURI
		var isFirstTime = false;

		if (fileType.toUpperCase() == "FLA") {
			//File is FLA
			var newFileName = folderPath.replace('.fla', '/' + fileName + '.xfl');

			if (!FLfile.exists(folderPath.substring(0, folderPath.length - 4))) {
				FLfile.createFolder(folderPath.substring(0, folderPath.length - 4))
			} else {
				FLfile.remove(newFileName)
			}
		
			toSave = newFileName;

			//fl.getDocumentDOM().close();
			//fl.openDocument(newFileName);
		} else if (fileType.toUpperCase() == "XFL") {
			//File is XFL
		}
	}
}

/*			= = = MOUSE MOVE = = =
	Hyperaids quasi-multithreading, because you
	cannot save in a save event handler. So we'll
	do it after you move your mouse after saving
 */

moveMouse = function () {
	if (toSave != "") {
		autoSave = true;
		fl.getDocumentDOM().saveAsCopy(toSave);
		var tmpPath = FLfile.uriToPlatformPath(toSave.substring(0, toSave.lastIndexOf("/")));
		//fl.trace(tmpPath.replace(/\\/g, "/"));
		//fl.trace("TmpPath is " + tmpPath.replace(/\\/g, "/"));
		try {
		fl.trace("Committed change to version history.");
		Sample.commitLocalChange(tmpPath);
		} catch(e) {
			fl.trace("CRITICAL ERROR: " + e.stack);
			fl.trace(e.name);
			fl.trace(e.message);
		}
		autoSave = false;
		toSave = "";
	}
}

/*			= = = MODIFYER KEYS = = =
	Invokes automation scripts by selecting frames
	while modifier keys are depressed.
*/

frameChange = function () {
	if (fl.tools.shiftIsDown == true) {
		//fl.trace("Changed frames with shift depressed");
	}
}

/*			= = = AS3 BLINKING = = =
	Initiate the AS3 blinking pipeline.
 */

prePublish = function () {

	//Remember our spot pre-publish
	bookmarkerTl = fl.getDocumentDOM().currentTimeline;
	bookmarkerFrame = fl.getDocumentDOM().getTimeline().currentFrame;

	//Reset to at least one scene to avoid duplicates. (Didn't think of this before!);
	sceneArray = [0];

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

	//For each scene, runBlinking on each child layer of VECTOR_CHARACTERS
	for (var a = 0; a < sceneArray.length; a++) {
		fl.getDocumentDOM().currentTimeline = sceneArray[a];
		var currentTimeline = sceneArray[a];
		for (var b = 0; b < fl.getDocumentDOM().timelines[currentTimeline].layerCount; b++) {
			if (fl.getDocumentDOM().timelines[currentTimeline].layers[b].parentLayer !== null) {
				if (fl.getDocumentDOM().timelines[currentTimeline].layers[b].parentLayer.name == "VECTOR_CHARACTERS") {
					//We're in a scene. You're now on a child layer of VECTOR_CHARACTERS. Run your code.
					runBlinking(b);
					//fl.trace("Run Blinking on layer " + b + " of scene " + currentTimeline);
				}
			}
		}
	}
}

postPublish = function () {
	funcTestScene();
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
}

/*			= = = EXECUTION = = =
	Create event listeners here and run 
	whatever else you want here as well.
*/

fl.addEventListener("documentOpened", docOpen);
fl.addEventListener("documentChanged", docChanged);
//fl.addEventListener("frameChanged", frameChange);
fl.addEventListener("prePublish", prePublish);
fl.addEventListener("postPublish", postPublish);
fl.addEventListener("documentSaved", docSave);
fl.addEventListener("mouseMove", moveMouse);

var path = fl.configURI + "Commands";
var index = 0;
while(FLfile.exists(path + "_OLD" + index)) {
    index++;
}
var cleanPath = FLfile.uriToPlatformPath(path);
cleanPath = cleanPath.replace(/\\/g, "/");
if(!FLfile.exists(path + "/.git")) {
	Sample.renameFolder(cleanPath, cleanPath + "_OLD" + index);
	FLfile.createFolder(path);
	//alert("Downloading commands repo. This may take a while. Click OK to continue.")
}

Sample.updateOrDownloadCommandsRepo(cleanPath);