/******************************************************************************
LINE ADDER
Description: Automatically adds voice lines to a scene, no user intervention
required beyond first step.

Issues: 
Autoparent newly created layers to AUDIO folder.
Convert all voice lines to Stream.
Get all voice lines in a subset of folders
******************************************************************************/
UPPER_FRAMECOUNT_LIMIT = 12000;

function switchVox(layerVar) {
	var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
	if (layerIndex == null) {
		var newLayer = fl.getDocumentDOM().getTimeline().addNewLayer(layerVar);
		layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
	}
	fl.getDocumentDOM().getTimeline().setSelectedLayers(layerIndex * 1);
}

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

function fixLinePath(cleanLinePath) {
	cleanLinePath = cleanLinePath.substring(8).replace("\|", ":");
	while (cleanLinePath.indexOf("%20") != -1) {
		cleanLinePath = cleanLinePath.replace("%20", " ");
	}
	return cleanLinePath
}

function extendVoiceLine(duration) {
	fl.getDocumentDOM().getTimeline().insertFrames(3 + (Math.ceil(fl.getDocumentDOM().frameRate * duration / 1000.0)) -
		fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration, true);
}
function placeLine(attemptFile, frame) {
	switchVox(frameName.split(" & ")[i].substring(7).replace(".flac", "").replace(" ", "_").toUpperCase() + "_VOX");
	fl.getDocumentDOM().getTimeline().setSelectedFrames(frame, frame + 1);
	fl.getDocumentDOM().importFile(attemptFile);
	var duration = getDuration(fixLinePath(attemptFile));
	extendVoiceLine(duration);
}

var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT");
var frameArray = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames;

var folderURI = fl.browseForFolderURL("Select the folder containing ALL voice lines.");

var count = 0;
while (fl.getDocumentDOM().getTimeline().currentFrame < fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")].frames.length - 1) {
	layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT");
	var frameName = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].name;
	var frame = fl.getDocumentDOM().getTimeline().currentFrame;
	for (var i = 0; i < frameName.split(" & ").length; i++) {
		var attemptFile = folderURI + "/" + frameName.split(" & ")[i] + ".flac";
		if (FLfile.exists(attemptFile)) {
			placeLine(attemptFile, frame);
		} else if(FLfile.exists(attemptFile.replace(' ', '_'))) { // filename fuckups
			placeLine(attemptFile.replace(' ', '_'), frame);
		} else {
			fl.trace("NOT FOUND: " + attemptFile);
		}
	}

	switchVox("TEXT");

	// fl.trace("Current Frame is: " + fl.getDocumentDOM().getTimeline().currentFrame);
	// fl.trace("Current Frame start frame is: " + fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame);
	// fl.trace("Current Frame duration is:  " + fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration)
	// fl.trace("Calculated frame increment is: " + (fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame + fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration))
	//if(count == 2) 
	//throw new Error ("Balls in yo jawz");

	fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame +
		fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration;
	count++;
	if(fl.getDocumentDOM().getTimeline().frameCount > UPPER_FRAMECOUNT_LIMIT) {
		fl.trace("Maximum number of frames reached. Ending execution.")
		break;
	}
}