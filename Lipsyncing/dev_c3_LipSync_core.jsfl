/******************************************************************************
MouthShapeLipSync_core
Description: Case 3 Lipsyncing Core Library
******************************************************************************/

fl.showIdleMessage(false);
var sceneArray = [];

END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;

OFFSET_MAP = {
	"No Talking": 0,
	"Closed Mouth No Teeth": 0,
	"Open Mouth Big": 6,
	"Open Mouth Teeth": 6,
	"Open Mouth Wide": 16,
	"Open Mouth Round": 16,
	"Closed Mouth Teeth": 1,
	"Ajar Mouth Tongue": 26,
	"Ajar Mouth Teeth Together": 21,
	"Ajar Mouth Teeth Seperate": 3
}

LENGTH_MAP = {
	"No Talking": 1,
	"Closed Mouth No Teeth": 1,
	"Open Mouth Big": 3,
	"Open Mouth Teeth": 3,
	"Open Mouth Wide": 3,
	"Open Mouth Round": 3,
	"Closed Mouth Teeth": 1,
	"Ajar Mouth Tongue": 1,
	"Ajar Mouth Teeth Together": 1,
	"Ajar Mouth Teeth Seperate": 1
}

DIPHTHONGS = ["AW", "AY", "OY"];

// Mouth shapes that should be held on single frame.
SINGLE_FRAME_MOUTH_SHAPES = ["Ajar Mouth Teeth Together", "Closed Mouth No Teeth", "Closed Mouth Teeth", "Ajar Mouth Tongue", "Ajar Mouth Teeth Seperate", "No Talking"];

PHONEME_TO_MOUTH_SHAPE = {
	"AA": "Open Mouth Big",
	"AE": "Open Mouth Big",
	"AH": "Open Mouth Big",
	"AO": "Open Mouth Big",
	"B": "Closed Mouth No Teeth",
	"CH": "Ajar Mouth Teeth Together",
	"D": "Ajar Mouth Teeth Together",
	"DH": "Ajar Mouth Tongue",
	"EH": "Open Mouth Teeth",
	"ER": "Open Mouth Round",
	"EY": "Open Mouth Teeth",
	"F": "Closed Mouth Teeth",
	"G": "Ajar Mouth Teeth Seperate",
	"HH": "Ajar Mouth Teeth Seperate",
	"IH": "Open Mouth Teeth",
	"IY": "Open Mouth Teeth",
	"JH": "Ajar Mouth Teeth Together",
	"K": "Ajar Mouth Teeth Seperate",
	"L": "Ajar Mouth Tongue",
	"M": "Closed Mouth No Teeth",
	"N": "Ajar Mouth Teeth Together",
	"NG": "Open Mouth Teeth",
	"OW": "Open Mouth Round",
	"P": "Closed Mouth No Teeth",
	"R": "Open Mouth Round",
	"S": "Ajar Mouth Teeth Together",
	"SH": "Ajar Mouth Teeth Together",
	"T": "Ajar Mouth Teeth Together",
	"TH": "Ajar Mouth Tongue",
	"UH": "Open Mouth Round",
	"UW": "Open Mouth Round",
	"V": "Closed Mouth Teeth",
	"W": "Open Mouth Round",
	"Y": "Open Mouth Teeth",
	"Z": "Ajar Mouth Teeth Together",
	"ZH": "Ajar Mouth Teeth Together",
	"": "No Talking",
	"sp": "No Talking" // this is the unknown word marker
}

DIPHTHONG_ORDERING = {
	"AW": ["Open Mouth Big", "Open Mouth Round"],
	"AY": ["Open Mouth Big", "Open Mouth Teeth"],
	"OY": ["Open Mouth Round", "Open Mouth Teeth"]
}

/*
Function: getKeys
Variables:  
	input 	arr
Description: Gets an array of start times from the words or phonemes.
*/
function getKeys(input) {
	var arr = [];
	for (var i in input) {
		arr.push(i);
	}
	return arr;
}
function isEqual(a, b) {
	return a == b;
}
function stringContains(a, b) {
	return b.indexOf(a) >= 0;
}
function arrayContains(array, element, compare) {
	for (var i = 0; i < array.length; i++) {
		if (compare(array[i], element)) {
			return true;
		}
	}
	return false;
}

/*
Function: resetSelection
Variables:  
	layerIndex 	int
	frame 		int
Description: Sets selection to the input layer and frame.
*/
function resetSelection(layerIndex, frame) {
	fl.getDocumentDOM().getTimeline().currentFrame = frame;
	fl.getDocumentDOM().getTimeline().setSelectedFrames([layerIndex * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}

/*
Function: compileScenes
Variables:  
	none
Description: Compiles all scenes that contain a VECTOR_CHARACTERS folder.
*/
function compileScenes() {
	for (i = 0, total = fl.getDocumentDOM().timelines.length; i < total; i++) {
		for (j = 0, layerCount = fl.getDocumentDOM().timelines[i].layers.length; j < layerCount; j++) {
			if (fl.getDocumentDOM().timelines[i].layers[j].name === "VECTOR_CHARACTERS") {
				sceneArray.push(i);
				break;
			}
		}
	}
}

/*
Function: placeKeyframes
Variables:  
	startFrame 		int
	layer 			int
	lipsyncMap 		arr
Description: Contains the logic for placing the keyframes responsible for lipsyncing.
*/
function placeKeyframes(startFrame, layer, lipsyncMap, poseStartFrame) {
	fl.getDocumentDOM().getTimeline().currentLayer = layer;
	var diphthongMap = {};
	var mouthShapeMap = {};

	for (var phonemeStartTime in phonemes) {
		var curFrame = startFrame + Math.round((phonemeStartTime * FRAME_RATE));
		var isKeyFrame = curFrame == fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].startFrame;

		// Replace extremely short phonemes with the next available phoneme.
		if (!isKeyFrame) {
			fl.getDocumentDOM().getTimeline().convertToKeyframes(curFrame);
		}

		fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].elements[0].loop = 'play once';

		var phoneme = phonemes[phonemeStartTime][WORD_PHONEME_INDEX].substring(0, 2);

		if (arrayContains(DIPHTHONGS, phoneme, isEqual)) {
			diphthongMap[fl.getDocumentDOM().getTimeline().currentFrame] = phoneme;
			continue;
		}

		// Some poses don't have the 'no talking' mouth shape defined. But is this still the case for Case 3 rigs?
		if (PHONEME_TO_MOUTH_SHAPE[phoneme] == "No Talking" && lipsyncMap[PHONEME_TO_MOUTH_SHAPE[phoneme]] === undefined) {
			var frame = lipsyncMap["Closed Mouth No Teeth"];
		} else {
			var frame = lipsyncMap[PHONEME_TO_MOUTH_SHAPE[phoneme]];
		}

		fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].elements[0].firstFrame = poseStartFrame + frame;
		fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].elements[0].lastFrame = poseStartFrame + frame + LENGTH_MAP[PHONEME_TO_MOUTH_SHAPE[phoneme]] - 1;
		fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].elements[0].loop = 'play once';

		if (arrayContains(SINGLE_FRAME_MOUTH_SHAPES, PHONEME_TO_MOUTH_SHAPE[phoneme], isEqual)) {
			fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].elements[0].loop = 'single frame';
		}

		mouthShapeMap[fl.getDocumentDOM().getTimeline().currentFrame] = PHONEME_TO_MOUTH_SHAPE[phoneme];
	}

	// Diphthong handling.
	for (var frame in diphthongMap) {
		// For each mouth shape in the diphthong:
		for (var i = 0; i < DIPHTHONG_ORDERING[diphthongMap[frame]].length; i++) {
			var curFrame = (parseInt(frame) + i);
			// If the current frame isn't the first frame in a frame sequence, make a note of that.
			var isKeyFrame = curFrame == fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].startFrame;

			if (frame != curFrame && isKeyFrame) {
				// Abort at the next keyframe.
				break;
			}

			if (!isKeyFrame) {
				fl.getDocumentDOM().getTimeline().convertToKeyframes(curFrame);
			}

			var firstFrame = lipsyncMap[DIPHTHONG_ORDERING[diphthongMap[frame]][i]];

			fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].elements[0].firstFrame = poseStartFrame + firstFrame;
			fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].elements[0].loop = 'loop';

			mouthShapeMap[fl.getDocumentDOM().getTimeline().currentFrame] = DIPHTHONG_ORDERING[diphthongMap[frame]][i];
		}
	}
	var curFrame = startFrame + Math.round(getKeys(phonemes)[getKeys(phonemes).length - 1] * FRAME_RATE);
	fl.getDocumentDOM().getTimeline().layers[layer].frames[curFrame].elements[0].loop = "single frame"; // set last phoneme to single frame
}

/*
Function: runLipsyncingSingle
Variables:  
	none
Description: Runs one lipsyncing operation on layerIndex and frame.
*/
function runLipsyncingSingle() {

	// Input Validation
	// Unlock layer.
	fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false;

	// If selection is invalid:
	if (fl.getDocumentDOM().getTimeline().getSelectedFrames().length != 3 || fl.getDocumentDOM().getTimeline().getSelectedFrames()[2] - fl.getDocumentDOM().getTimeline().getSelectedFrames()[1] != 1) {
		throw new Error("Invalid selection. Select one frame that denotes the beginning of a character talking (first frame of the voice line audio).")
	}

	//Retrieve xSheet of selected symbol.
	var characterTimeline = fl.getDocumentDOM().selection[0].libraryItem.timeline;
	var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet");
	if (xSheetLayerIndex == undefined) {
		//If the layer isn't named xSheet, shit on the rigger. Thankfully, it's always layer 0.
		xSheetLayerIndex = 0;
	}

	//Prime the first frame of the keyframe sequence. Retrieve the CFG file.
	var poseFrame = fl.getDocumentDOM().getElementProperty("firstFrame");
	var poseStartFrame = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].startFrame;
	var cfgPath = fl.browseForFileURL("select");

	//Load the CFG.
	fl.runScript(cfgPath);

	//Do the lipsyncing.
	placeKeyframes(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().getSelectedLayers(), OFFSET_MAP, poseStartFrame);
}

/*
Function: runLipsyncingDoc
Variables:  
	cfgFolderPath 	str
Description: Runs all lipsyncing operations in the active document.
*/
function runLipsyncingDoc(cfgFolderPath) {

	compileScenes();

	//Iterate through all scenes
	for (var i = 0; i < sceneArray.length; i++) {
		fl.getDocumentDOM().currentTimeline = sceneArray[i];
		var currentTimeline = sceneArray[i];

		//Iterate through all layers of all scenes, and find VECTOR_CHARACTERS folder.
		for (var j = 0; j < fl.getDocumentDOM().timelines[currentTimeline].layerCount; j++) {
			if (fl.getDocumentDOM().timelines[currentTimeline].layers[j].parentLayer !== null) {
				if (fl.getDocumentDOM().timelines[currentTimeline].layers[j].parentLayer.name == "VECTOR_CHARACTERS") {
					//Reset the sound array.
					var layerSoundArray = [];

					//Unlock and unhide operating layer.
					fl.getDocumentDOM().timelines[currentTimeline].layers[j].visible = true;
					fl.getDocumentDOM().timelines[currentTimeline].layers[j].locked = false;

					//The audio layer for which we will seek voice lines.
					var audioSeekLayer = fl.getDocumentDOM().timelines[currentTimeline].layers[j].name.toUpperCase() + "_VOX";

					//Find the audio layer for the current character layer.
					for (var k = 0; k < fl.getDocumentDOM().timelines[currentTimeline].layerCount; k++) {

						if (fl.getDocumentDOM().timelines[currentTimeline].layers[k].name == audioSeekLayer) {
							//Once on the audio layer, compile an array of the frames where all voice lines occur.
							for (var l = 1; l < fl.getDocumentDOM().timelines[currentTimeline].layers[k].frames.length; l++) {
								//Only consider the first frame of a sound keyframe.
								if (l == fl.getDocumentDOM().timelines[currentTimeline].layers[k].frames[l].startFrame) {
									//If the frame has audio content, add it to the array.
									if (fl.getDocumentDOM().timelines[currentTimeline].layers[k].frames[l].soundName != null) {
										//Push the frame number the sound occured on and the soundName.
										//WARNING! HARDCODED SLICE LENGTH OF 5 TO CORRESPOND TO STRING '.FLAC'! OTHER AUDIO TYPES WILL FUCK UP!!!
										layerSoundArray.push([l, fl.getDocumentDOM().timelines[currentTimeline].layers[k].frames[l].soundName.slice(0, -5)]);
									}
								}
							}
						}
					}

					//Actual lipsync execution occurs here
					for (var k = 1; k < fl.getDocumentDOM().timelines[currentTimeline].layers[j].frames.length; k++) {
						for (var x = 0; x < layerSoundArray.length; x++) {
							if (layerSoundArray[x][0] === k) {
								var voiceLine = layerSoundArray[x][1];

								//Takes a performance hit.
								fl.getDocumentDOM().getTimeline().currentFrame = k;

								//Standard procedure...
								var characterTimeline = fl.getDocumentDOM().getTimeline().layers[j].frames[k].elements[0].libraryItem.timeline;
								var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet");

								if (xSheetLayerIndex == undefined) {
									xSheetLayerIndex = 0;
								}

								var poseFrame = fl.getDocumentDOM().getTimeline().layers[j].frames[k].elements[0].firstFrame;
								var poseStartFrame = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].startFrame;
								var cfgPath = cfgFolderPath + "/" + voiceLine + ".cfg";

								fl.runScript(cfgPath);
								placeKeyframes(k, j, OFFSET_MAP, poseStartFrame);

								break;
							}
						}
					}

					//Re-enable layer visibility
					fl.getDocumentDOM().timelines[currentTimeline].layers[j].visible = true;

				}
			}
		}
	}
}