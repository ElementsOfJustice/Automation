/******************************************************************************
LINE ADDER
Description: Automatically adds voice lines to a scene, no user intervention
required beyond first step.

Issues: 
Autoparent newly created layers to AUDIO folder.
Convert all voice lines to Stream.
Get all voice lines in a subset of folders
Errors should be returned into the scene generator to be reconstructed for the logging system
Failed lines should be returned into the scene generator to be reconstructed for the logging system
Does not iterate to other scenes via chunking system when it should. In the words of the Heavy from TF2: "OH, THIS IS BAD!"
Put all imported voice lines into the VOX folder. Organize by character.
Don't use fl.trace.
Try to handle errors without breaking. Skip stuff if need be.
(Can we automatically retry if fail is >200 attempts?)
******************************************************************************/

UPPER_FRAMECOUNT_LIMIT = 12000;
var cLib = fl.configURI + "cLib.jsfl";

/*
Function: getFLACLength
Variables:  
	pathName	str
Description: Returns the number of samples in a FLAC file.
*/
function getFLACLength(pathName) {
	return fl.runScript(cLib, "getFLACLength", pathName);
}

/*
Function: switchVox
Variables:  
	layerVar	str
Description: Switches to a VOX layer, and if it doesn't exist, creates it.
*/
function switchVox(layerVar) {
	var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
	if (layerIndex == null) {
		fl.getDocumentDOM().getTimeline().addNewLayer(layerVar);
		layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
	}
	fl.getDocumentDOM().getTimeline().setSelectedLayers(layerIndex * 1);
}

/*
Function: getDuration
Variables:  
	linePath 	str
Description: Returns the number of samples in a FLAC file.
*/
function getDuration(linePath) {
	var duration = -1, attempts = 0;
	while (duration == -1 && attempts < 200) {
		duration = getFLACLength(linePath);
		attempts++;
	}
	if (attempts == 200) {
		throw new Error("Maximum number of attempts to get voice line length reached! Please try again.");
	}
	return duration;
}

/*
Function: fixLinePath
Variables:  
	cleanLinePath	str
Description: Does cleanup and pruning on a file path.
*/
function fixLinePath(cleanLinePath) {
	cleanLinePath = cleanLinePath.substring(8).replace("\|", ":");
	while (cleanLinePath.indexOf("%20") != -1) {
		cleanLinePath = cleanLinePath.replace("%20", " ");
	}
	return cleanLinePath
}

/*
Function: extendVoiceLine
Variables:  
	duration	int
Description: Inserts frames to make a text/character sequence match the
duration of the voice line.
*/
function extendVoiceLine(duration) {
	fl.getDocumentDOM().getTimeline().insertFrames(3 + (Math.ceil(fl.getDocumentDOM().frameRate * duration / 1000.0)) -
		fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration, true);
}

/*
Function: placeLine
Variables:  
	attemptFile		str
	frame			int
Description: Places the line, dummy!
*/
function placeLine(attemptFile, frame, frameName) {
	// WARNING: Removed ampersand handling because it didn't work when running it here.
	switchVox(frameName.substring(7).replace(".flac", "").replace(" ", "_").toUpperCase() + "_VOX");
	fl.getDocumentDOM().getTimeline().setSelectedFrames(frame, frame + 1);
	fl.getDocumentDOM().importFile(attemptFile);
	var duration = getDuration(fixLinePath(attemptFile));
	extendVoiceLine(duration);
}

/*
Function: insertLines
Variables:  
	folderURI	str
Description: Inserts all lines automatically.
*/
function insertLines(folderURI) {

	var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT");
	var frameArray = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames;
	
	var count = 0;
	
	while (fl.getDocumentDOM().getTimeline().currentFrame < fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")].frames.length - 1) {
		layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT");

		var frameName = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].name;
		var frame = fl.getDocumentDOM().getTimeline().currentFrame;

		for (var i = 0; i < frameName.split(" & ").length; i++) {
			var attemptFile = folderURI + "/" + frameName.split(" & ")[i] + ".flac";
			if (FLfile.exists(attemptFile)) {
				placeLine(attemptFile, frame, frameName);
			} else if (FLfile.exists(attemptFile.replace(' ', '_'))) {
				placeLine(attemptFile.replace(' ', '_'), frame, frameName);
			} else {
				fl.trace("NOT FOUND: " + attemptFile);
			}
		}

		switchVox("TEXT");

		fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame +
			fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration;

		count++;

		if (fl.getDocumentDOM().getTimeline().frameCount > UPPER_FRAMECOUNT_LIMIT) {
			fl.trace("Maximum number of frames reached. Ending execution.")
			break;
		}
	}
}

function insertLinesChunked(folderURI, chunkSize, totalChunks) {
	var sceneNum = 0;
	fl.getDocumentDOM().editScene(sceneNum);
	var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT");
	var frameArray = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames;
	
	var count = 0;
	
	while (fl.getDocumentDOM().getTimeline().currentFrame < fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")].frames.length - 1) {
		layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT");

		var frameName = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].name;
		var frame = fl.getDocumentDOM().getTimeline().currentFrame;

		for (var i = 0; i < frameName.split(" & ").length; i++) {
			var attemptFile = folderURI + "/" + frameName.split(" & ")[i] + ".flac";
			if (FLfile.exists(attemptFile)) {
				placeLine(attemptFile, frame, frameName);
			} else if (FLfile.exists(attemptFile.replace(' ', '_'))) {
				placeLine(attemptFile.replace(' ', '_'), frame, frameName);
			} else {
				fl.trace("NOT FOUND: " + attemptFile);
			}
		}

		switchVox("TEXT");

		fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame +
			fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration;

		count++;
		if(count % chunkSize == 0) {
			sceneNum++;
			fl.getDocumentDOM().getTimeline().currentFrame = 0;
			if(sceneNum == totalChunks) break;
			fl.getDocumentDOM().editScene(sceneNum);
			
		}
	}
}