//cLib
var cLib = fl.configURI + "Commands/cLib.jsfl";

//Expected names of lipsync files
var maleVoiceLine01 = "s8_012_phoenix.flac";
var maleVoiceLine02 = "s8_013_phoenix.flac";
var femaleVoiceLine01 = "s1_048_sonata.flac";
var femaleVoiceLine02 = "s1_050_sonata.flac";

//Voice line length in frames
var maleVoiceLine01Length = 247;
var maleVoiceLine02Length = 157;
var femaleVoiceLine01Length = 124;
var femaleVoiceLine02Length = 213;
var voiceLinePadding = 5;

//What frames should have what blink instructions
var maleBlinkInstructions = {
	0: 'CutOpen',
	27: 'Blink',
	83: 'AnimClose',
	107: 'AnimOpen',
	137: 'Blink',
	215: 'Blink',
	252: 'CutClosed',
	294: 'CutOpen',
	371: 'Blink'
};

var femaleBlinkInstructions = {
	0: 'CutOpen',
	26: 'Blink',
	65: 'Blink',
	127: 'CutClosed',
	157: 'CutOpen',
	190: 'AnimClose',
	228: 'AnimOpen',
	269: 'Blink',
	319: 'Blink'
};

var poseTxtLayerName = "Pose_Name";

var docURI = fl.getDocumentDOM().pathURI;
var docDir = docURI.substring(0, docURI.lastIndexOf("/") + 1);

var selItem = fl.getDocumentDOM().library.getSelectedItems();

if (selItem[0] === undefined) {
	throw new Error("Select the scaled symbol of the character to validate in the library and run again.");
};

var charIndex = fl.getDocumentDOM().library.findItemIndex(selItem[0].name);

var poseNameBounding = {
	left: 1920,
	top: 50,
	right: 2560,
	bottom: 480
};

//	=	=	=	=	=	=	BLINK API TRASH	=	=	=	=	=	=	=	=

var bookmarkerTl = fl.getDocumentDOM().currentTimeline;
var bookmarkerFrame = fl.getDocumentDOM().getTimeline().currentFrame;

var symbols = ["button", "graphic", "movie clip"];
var libItems = fl.getDocumentDOM().library.items
var blinkDuration = 6;
var sceneArray = [];

fl.getDocumentDOM().selectNone();
fl.showIdleMessage(false);
fl.outputPanel.clear();

//We need to make a list of all scenes that contain a VECTOR_CHARACTERS layer. Because wunderbar
//flashbacks exist, we have to have a hybrid approach of considering both all scenes and all symbols!	

//Timeline handling
for (i = 0; i < fl.getDocumentDOM().timelines.length; i++) {
	if (fl.getDocumentDOM().timelines[i].findLayerIndex("VECTOR_CHARACTERS") != undefined) {
		sceneArray.push(["Scene", i]);
	}
}
//Symbol handling
for (i = 0; i < libItems.length; i++) {
	if (symbols.indexOf(libItems[i].itemType) > -1) {
		if (libItems[i].timeline.findLayerIndex("VECTOR_CHARACTERS") != undefined) {
			sceneArray.push(["Symbol", i]);
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
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers[layerIndex].frames.length; i++) {
		var frameHasElements = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].elements.length > 0;
		if (!frameHasElements) continue;
		var elementIsInstance = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].elements[0].elementType == "instance";
		if (!elementIsInstance) continue;
		var instanceNameContainsPose = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].elements[0].libraryItem.name.indexOf("Pose") != -1;
		if (instanceNameContainsPose) {
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
function blinkFrameIndex(leftEye, rigFolder, currentFrame, layerIndex, xSheetCache) {

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
function autoEyeSet(layerIndex) {

	var xSheetCache = [];
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

	//Make a cache of that character's xSheet. We reference the cache instead of loading the character many times.
	for (var k = 0; k < objTl.frames.length; k++) {
		var objTlFrame = objTl.frames[k];
		if (objTlFrame.labelType === "name" && k === objTlFrame.startFrame) {
			xSheetCache.push(k);
		}
	}

	//For all frames on the layer we are running autoEyeSet on, automatically apply the bare minimum blink instructions.
	for (var i = 0; i < frames.length - 1; i++) {
		if (frames[i].labelType == "anchor") { continue };
		if ((i == 0) && (!frames[i].isEmpty)) {
			//CutOpen on the first frame of a character layer if it has content. 
			frames[i].labelType = "anchor";
			frames[i].name = "CutOpen";
		}

		//Next two operations check if a pre-existing anchor label exists, and if it does, does nothing. This allows human users to circumvent the automatic labelling.
		if (frames[i + 1].labelType == "anchor") { continue };
		if ((frames[i].isEmpty) && (!frames[i + 1].isEmpty)) {
			//CutOpen if we go from no content to content from one frame to the next.
			frames[i + 1].labelType = "anchor";
			frames[i + 1].name = "CutOpen";
		}

		if (frames[i].isEmpty) { continue };

		if (!frames[i + 1].isEmpty) {
			if (!checkRange(xSheetCache, frames[i].elements[0].firstFrame, frames[i + 1].elements[0].firstFrame)) {
				//CutOpen on pose changes.
				frames[i + 1].labelType = "anchor";
				frames[i + 1].name = "CutOpen";
			}
		}
	}
}

/*
Function: AS3_Constructor
Variables: 
	leftEye			
	rightEye		
	blinkFrame		
	blinkDuration	
	instruction		
Description: Automatically apply cutOpen frame anchors to detected
pose changes.
*/
function AS3_Constructor(leftEye, rightEye, blinkFrame, blinkDuration, instruction) {
	if (instruction == "Blink") {
		return leftEye + ".gotoAndPlay(" + blinkFrame + ");\n" + rightEye + ".gotoAndPlay(" + blinkFrame + ");";
	}
	if (instruction == "AnimClose") {
		return leftEye + ".gotoAndPlay(" + blinkFrame + ");\n" + rightEye + ".gotoAndPlay(" + blinkFrame + ");";
	}
	if (instruction == "AnimOpen") {
		return leftEye + ".gotoAndPlay(" + (blinkFrame + (blinkDuration / 2)) + ");\n" + rightEye + ".gotoAndPlay(" + (blinkFrame + (blinkDuration / 2)) + ");";
	}
	if (instruction == "CutOpen") {
		return leftEye + ".gotoAndStop(" + blinkFrame + ");\n" + rightEye + ".gotoAndStop(" + blinkFrame + ");";
	}
	if (instruction == "CutClosed") {
		return leftEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");\n" + rightEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");";
	}
}

/*
Function: runBlinking
Variables: 
	layerIndex	What layer are we blinking on
Description: Run the blinking code for all markers on a layer.
*/
function runBlinking(layerIndex) {

	var xSheetCache = {};
	var firstGraphicInstance = findFirstFrameWithSymbol(layerIndex);
	fl.getDocumentDOM().getTimeline().currentLayer = layerIndex;

	if (firstGraphicInstance == -1) {
		return
	}

	//Get the library folder of the character we are running blinking code on.
	var rigPath = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[firstGraphicInstance].elements[0].libraryItem.name;
	var rigFolder = rigPath.substring(rigPath.lastIndexOf('/') + 1);
	rigFolder = rigFolder.substring(0, rigFolder.indexOf('►')) + "►";

	//Get the instance names of the blinking movieclips for the character we are running blinking code on.
	var leftEye = (rigFolder + "BlinkLeft").replace("►", "_");
	var rightEye = (rigFolder + "BlinkRight").replace("►", "_");

	//Make a cache of our character's xSheet. We reference the cache instead of loading the character many times.
	var itemIndex = fl.getDocumentDOM().library.findItemIndex(rigPath);
	var character_xSheet = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];

	for (var k = 0; k < character_xSheet.frames.length; k += character_xSheet.frames[k].duration - (k - character_xSheet.frames[k].startFrame)) {
		var character_xSheetEntry = character_xSheet.frames[k];
		if (character_xSheetEntry.labelType === "name" && k === character_xSheetEntry.startFrame) {
			xSheetCache[k] = character_xSheetEntry.name;
		}
	}
	var curTime = new Date();
	// checking for infinite loops
	for (i = 0; i < fl.getDocumentDOM().getTimeline().layers[layerIndex].frames.length; i += fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].duration - (i - fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].startFrame)) {
		var newTime = new Date();
		if (newTime - curTime > 180000) {
			throw new Error("Infinite loop detected. Please check your timeline for any loops in the blinking code.");
		}
		if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].isEmpty == true) { continue };

		if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].labelType != "anchor") { continue };

		if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].elements[0].libraryItem.name.toLowerCase().indexOf("pose") == -1) { continue };
		var blinkFrame = blinkFrameIndex(leftEye, rigPath, i, layerIndex, xSheetCache);
		var blinkInstruction = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].name;

		//The first frame of any blinkInstruction receives its AS3 here. The only instructions we have to do extra
		//code with are instructions that require us to go ahead, place another keyframe, and write more AS3.
		var AS3toWrite = AS3_Constructor(leftEye, rightEye, blinkFrame, blinkDuration, blinkInstruction);
		fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].actionScript = AS3toWrite;
		if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + (blinkDuration / 2)].isEmpty) continue;
		if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + (blinkDuration / 2)].elements[0].libraryItem.name.toLowerCase().indexOf("pose") == -1) continue;
		//ANIMATION OF EYES CLOSING
		//AS3 for first frame has been written. Iterate to frame [i + blinkDuration / 2] to end the animation. We convert this frame to
		//a keyframe if it isn't already, and if we convert it, we also mark it for deletion.
		//Hardcoded AS3 at the ending frame, we don't use AS3_Constructor because we're dealing with half a blink duration.
		if (blinkInstruction == "AnimClose") {
			if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + blinkDuration].startFrame != i + (blinkDuration / 2)) {
				fl.getDocumentDOM().getTimeline().convertToKeyframes(i + (blinkDuration / 2));
			}
			fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + (blinkDuration / 2)].actionScript = leftEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");\n" + rightEye + ".gotoAndStop(" + (blinkFrame + (blinkDuration / 2)) + ");";
		}

		//ANIMATION OF EYES OPENING
		//AS3 for first frame has been written. Iterate to frame [i + blinkDuration / 2] to end the animation. We convert this frame to
		//a keyframe if it isn't already, and if we convert it, we also mark it for deletion.
		//Hardcoded AS3 at the ending frame, we don't use AS3_Constructor because we're dealing with half a blink duration.
		if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i].name == "AnimOpen") {
			if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + blinkDuration].startFrame != i + (blinkDuration / 2)) {
				fl.getDocumentDOM().getTimeline().convertToKeyframes(i + (blinkDuration / 2));
			}
			fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + (blinkDuration / 2)].actionScript = leftEye + ".gotoAndStop(" + blinkFrame + ");\n" + rightEye + ".gotoAndStop(" + blinkFrame + ");";
		}
		if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + blinkDuration].isEmpty) continue;
		if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + blinkDuration].elements[0].libraryItem.name.toLowerCase().indexOf("pose") == -1) continue;
		//BLINK
		//AS3 for first frame has been written. Iterate to frame [i + blinkDuration], convert it to a keyframe if it isn't one already.
		//Hardcoded CutOpen at the end of the blink to force the blink to stop.
		if (blinkInstruction == "Blink") {

			if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + blinkDuration].startFrame != i + blinkDuration) {
				fl.getDocumentDOM().getTimeline().convertToKeyframes(i + blinkDuration);
			}
			fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[i + blinkDuration].actionScript = AS3_Constructor(leftEye, rightEye, blinkFrame, blinkDuration, "CutOpen");
		}
	}
}

function syncMane(layerIndex, maneName, tailName) {
	// TODO: search for symbol changes, and then add maneName.gotoAndPlay and tailName.gotoAndPlay
	var previousSymbol = undefined;
	for (var iter = 0; iter < fl.getDocumentDOM().getTimeline().layers[layerIndex].frameCount; iter += fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[iter].duration) {
		if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[iter].isEmpty) {
			previousSymbol = undefined;
			continue;
		}
		if (previousSymbol === undefined) {
			previousSymbol = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[iter].elements[0].libraryItem.name;
			continue;
		}
		if (previousSymbol != fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[iter].elements[0].libraryItem.name) { // symbol is... le changed!
			fl.getDocumentDOM().getTimeline().convertToKeyframes(iter - 1); // keyframe previous frame
			// tmpKeys.push([layerIndex, iter - 1])
			fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[iter - 1].actionScript += "\nthis.maneFrame = " + maneName + ".currentFrame;\n this.tailFrame = " + tailName + ".currentFrame;";
			fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[iter].actionScript += "\nthis." + maneName + ".gotoAndPlay((this.maneFrame + 1) % this." + maneName + ".totalFrames);\nthis." + tailName + ".gotoAndPlay((this.tailFrame + 1) % this." + tailName + ".totalFrames);";
		}
		previousSymbol = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[iter].elements[0].libraryItem.name;
	}
}

//	=	=	=	=	=	=	BLINK API TRASH	=	=	=	=	=	=	=	=

function exportSWF(name, index) {
	fl.getDocumentDOM().exportSWF(docDir + fl.getDocumentDOM().name.slice(0, -4) + "_" + formatIntWithLeadingZeros(index) + "_" + name + ".swf");
};

function formatIntWithLeadingZeros(num) {
	if (num >= 0 && num <= 99) {
		return (num < 10 ? '0' : '') + num.toString();
	} else {
		return "Out of range";
	}
}

function roundDownToHundred(num) {
	return Math.floor(num / 100) * 100;
}

function getKeys(input) {
	var arr = [];
	for (var i in input) {
		arr.push(i);
	}
	return arr;
}

function getXSheetEntries(libraryName) {
	var xSheet = fl.getDocumentDOM().library.items[libraryName].timeline.layers[0];
	return roundDownToHundred(xSheet.frames.length);
}

function switchActive(layerVar) {
	var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
	if (layerIndex == undefined) {
		fl.getDocumentDOM().getTimeline().addNewLayer(layerVar);
		layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar)[0];
	}
	fl.getDocumentDOM().getTimeline().currentLayer = layerIndex[0];
}

function placePoseText(poseText, poseName) {
	fl.getDocumentDOM().addNewText(poseNameBounding, poseName);

	var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(poseTxtLayerName);

	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].setTextString(poseText);
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].setTextAttr('alignment', 'center');
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].textType = 'dynamic';
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].lineType = 'multiline';
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].name = 'txt';
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].fontRenderingMode = 'standard';
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].setTextAttr("face", "Suburga 2 Semi-condensed Regular");
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].setTextAttr("size", 80);
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].setTextAttr("fillColor", 0xffffff);
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].setTextAttr("letterSpacing", 2);
	fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0].setTextAttr("lineSpacing", 1);
}

function addRigToStage(charIndex) {
	var item = fl.getDocumentDOM().library.items[charIndex];
	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, item);
}

//	Main Execution
var execute = confirm("Before executing, confirm that the focused document has no scenes and only an empty Layer_1, and that the Scaled► symbol is selected in the library.");

if (!execute) {
	throw new Error("Stopping Execution.");
}

var characterLayerName = selItem[0].name.substring(selItem[0].name.lastIndexOf("/"), -1).replace('►', '_');
var soundSyncType = 'stream';

switchActive(characterLayerName);
addRigToStage(charIndex);

//Force fix rig placement
fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]].frames[0].elements[0].x = 0;
fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]].frames[0].elements[0].y = 0;

switchActive("VECTOR_CHARACTERS");
fl.getDocumentDOM().getTimeline().deleteLayer(fl.getDocumentDOM().getTimeline().findLayerIndex("Layer_1")[0]);

// All this shit to make a character layer and parent it to the VECTOR_CHARACTERS folder
fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS")[0]].layerType = "folder";
fl.getDocumentDOM().getTimeline().reorderLayer(fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0], fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS")[0], false);
fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]].parentLayer = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS")[0]];

// Male v Female Discrimination
var sex = confirm("Is your character male or female? Press OK for male, or cancel for female.");

// The actual execution should be polymorphic, but it's 10pm...

if (sex) {
	if (!fl.getDocumentDOM().library.itemExists(maleVoiceLine01) || !fl.getDocumentDOM().library.itemExists(maleVoiceLine02)) {
		throw new Error("Either " + maleVoiceLine01 + " or " + maleVoiceLine02 + " does not exist in the root directory of your library. Please add it and try again.");
	};

	//Nightmarish Line Adding
	switchActive(characterLayerName + "_VOX");
	fl.getDocumentDOM().getTimeline().reorderLayer(fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName + "_VOX")[0], fl.getDocumentDOM().getTimeline().layerCount - 1, false);
	fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName + "_VOX")[0]].parentLayer = null;

	fl.getDocumentDOM().getTimeline().currentFrame = 1;
	fl.getDocumentDOM().getTimeline().convertToKeyframes(1);
	addRigToStage(fl.getDocumentDOM().library.findItemIndex(maleVoiceLine01));
	fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName + "_VOX")[0]].frames[1].soundSync = soundSyncType;

	fl.getDocumentDOM().getTimeline().convertToKeyframes(maleVoiceLine01Length + voiceLinePadding);
	fl.getDocumentDOM().getTimeline().currentFrame = maleVoiceLine01Length + voiceLinePadding;
	addRigToStage(fl.getDocumentDOM().library.findItemIndex(maleVoiceLine02));
	fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName + "_VOX")[0]].frames[maleVoiceLine01Length + voiceLinePadding].soundSync = soundSyncType;
	fl.getDocumentDOM().getTimeline().convertToKeyframes(maleVoiceLine01Length + maleVoiceLine02Length + (voiceLinePadding * 2));

	//Extending Character
	switchActive(characterLayerName);
	fl.getDocumentDOM().getTimeline().currentFrame = 0;
	fl.getDocumentDOM().getTimeline().insertFrames(maleVoiceLine01Length + maleVoiceLine02Length + (voiceLinePadding * 2));

	//Lipsync
	fl.getDocumentDOM().getTimeline().setSelectedFrames(1, 1);
	fl.runScript(fl.configURI + "Commands/Lipsyncing/dev_c3_LipSync_core.jsfl", "runLipsyncingSingle");
	fl.getDocumentDOM().getTimeline().setSelectedFrames(maleVoiceLine01Length + voiceLinePadding, maleVoiceLine01Length + voiceLinePadding);
	fl.runScript(fl.configURI + "Commands/Lipsyncing/dev_c3_LipSync_core.jsfl", "runLipsyncingSingle");

	//Blinking
	var keys = getKeys(maleBlinkInstructions);
	for (var i = 0; i < keys.length; i++) {
		var currentKey = parseInt(keys[i]);
		if (fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]].frames[currentKey].startFrame != currentKey) {
			fl.getDocumentDOM().getTimeline().convertToKeyframes(currentKey, currentKey);
		}
		fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]].frames[currentKey].labelType = 'anchor';
		fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]].frames[currentKey].name = maleBlinkInstructions[currentKey];
	};

	//Main Loop, iterator is z because blink has i-bleed
	var xSheetEntries = getXSheetEntries(charIndex);
	for (var z = 0; z < xSheetEntries; z++) {
		//Try-catch because there's an error at the end of execution without it but it's 10PM
		try {
			var delta = (z == 1) ? 99 : 100;
			var poseName = fl.getDocumentDOM().library.items[charIndex].timeline.layers[0].frames[z * 100].name
			switchActive(poseTxtLayerName)
			placePoseText(poseName);

			if (z != 0) {
				var characterLayerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0];
				for (var k = 0; k < fl.getDocumentDOM().getTimeline().layers[characterLayerIndex].frames.length; k = fl.getDocumentDOM().getTimeline().layers[characterLayerIndex].frames[k].startFrame + fl.getDocumentDOM().getTimeline().layers[characterLayerIndex].frames[k].duration) {
					fl.getDocumentDOM().getTimeline().layers[characterLayerIndex].frames[k].elements[0].firstFrame += delta;
				}
			};

			runBlinking(fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]);

			exportSWF(poseName, z);
			fl.getDocumentDOM().getTimeline().deleteLayer(fl.getDocumentDOM().getTimeline().findLayerIndex(poseTxtLayerName)[0]);
		} catch (error) {
		}
	}

	//Delete Everything (except the last layer because this is STUPID)
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		fl.getDocumentDOM().getTimeline().deleteLayer(i);
	}
}

if (!sex) {

	if (!fl.getDocumentDOM().library.itemExists(femaleVoiceLine01) || !fl.getDocumentDOM().library.itemExists(femaleVoiceLine02)) {
		throw new Error("Either " + femaleVoiceLine01 + " or " + femaleVoiceLine02 + " does not exist in the root directory of your library. Please add it and try again.");
	};

	//Nightmarish Line Adding
	switchActive(characterLayerName + "_VOX");
	fl.getDocumentDOM().getTimeline().reorderLayer(fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName + "_VOX")[0], fl.getDocumentDOM().getTimeline().layerCount - 1, false);
	fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName + "_VOX")[0]].parentLayer = null;

	fl.getDocumentDOM().getTimeline().currentFrame = 1;
	fl.getDocumentDOM().getTimeline().convertToKeyframes(1);
	addRigToStage(fl.getDocumentDOM().library.findItemIndex(femaleVoiceLine01));
	fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName + "_VOX")[0]].frames[1].soundSync = soundSyncType;

	fl.getDocumentDOM().getTimeline().convertToKeyframes(femaleVoiceLine01Length + voiceLinePadding);
	fl.getDocumentDOM().getTimeline().currentFrame = femaleVoiceLine01Length + voiceLinePadding;
	addRigToStage(fl.getDocumentDOM().library.findItemIndex(femaleVoiceLine02));
	fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName + "_VOX")[0]].frames[femaleVoiceLine01Length + voiceLinePadding].soundSync = soundSyncType;
	fl.getDocumentDOM().getTimeline().convertToKeyframes(femaleVoiceLine01Length + femaleVoiceLine02Length + (voiceLinePadding * 2));

	//Extending Character
	switchActive(characterLayerName);
	fl.getDocumentDOM().getTimeline().currentFrame = 0;
	fl.getDocumentDOM().getTimeline().insertFrames(femaleVoiceLine01Length + femaleVoiceLine02Length + (voiceLinePadding * 2));

	//Lipsync
	fl.getDocumentDOM().getTimeline().setSelectedFrames(1, 1);
	fl.runScript(fl.configURI + "Commands/Lipsyncing/dev_c3_LipSync_core.jsfl", "runLipsyncingSingle");
	fl.getDocumentDOM().getTimeline().setSelectedFrames(femaleVoiceLine01Length + voiceLinePadding, femaleVoiceLine01Length + voiceLinePadding);
	fl.runScript(fl.configURI + "Commands/Lipsyncing/dev_c3_LipSync_core.jsfl", "runLipsyncingSingle");

	//Blinking
	var keys = getKeys(femaleBlinkInstructions);
	for (var i = 0; i < keys.length; i++) {
		var currentKey = parseInt(keys[i]);
		if (fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]].frames[currentKey].startFrame != currentKey) {
			fl.getDocumentDOM().getTimeline().convertToKeyframes(currentKey, currentKey);
		}
		fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]].frames[currentKey].labelType = 'anchor';
		fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]].frames[currentKey].name = femaleBlinkInstructions[currentKey];
	};

	//Main Loop, iterator is z because blink has i-bleed
	var xSheetEntries = getXSheetEntries(charIndex);
	for (var z = 0; z < xSheetEntries; z++) {
		//Try-catch because there's an error at the end of execution without it but it's 10PM
		try {
			var delta = (z == 1) ? 99 : 100;
			var poseName = fl.getDocumentDOM().library.items[charIndex].timeline.layers[0].frames[z * 100].name
			switchActive(poseTxtLayerName)
			placePoseText(poseName);

			if (z != 0) {
				var characterLayerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0];
				for (var k = 0; k < fl.getDocumentDOM().getTimeline().layers[characterLayerIndex].frames.length; k = fl.getDocumentDOM().getTimeline().layers[characterLayerIndex].frames[k].startFrame + fl.getDocumentDOM().getTimeline().layers[characterLayerIndex].frames[k].duration) {
					fl.getDocumentDOM().getTimeline().layers[characterLayerIndex].frames[k].elements[0].firstFrame += delta;
				}
			};

			runBlinking(fl.getDocumentDOM().getTimeline().findLayerIndex(characterLayerName)[0]);

			exportSWF(poseName, z);
			fl.getDocumentDOM().getTimeline().deleteLayer(fl.getDocumentDOM().getTimeline().findLayerIndex(poseTxtLayerName)[0]);
		} catch (error) {
		}
	}

	//Delete Everything (except the last layer because this is STUPID)
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		fl.getDocumentDOM().getTimeline().deleteLayer(i);
	}
};