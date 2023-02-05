/******************************************************************************
LINE ADDER
Description: Continuously prompt the user for voice line files and
automatically adds them to the next textbox in the timeline. 
(A config file is required)
******************************************************************************/

// set scriptPath to "/path/../LineAdder.jsfl"
var scriptPath = fl.scriptURI;
// set dirURL to the path up to the last / character (i.e. just the path)
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

// store the document object and other data inside
var doc = fl.getDocumentDOM();
var layer = doc.getTimeline().getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;


function switchActive(layerVar) {
	// get the layer index from the name
	var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
	// if the layer doesn't exist...
	if (layerIndex == null) {
		// create a new layer with the given name
		fl.getDocumentDOM().getTimeline().addNewLayer(layerVar);
		// set the index to that of the new layer
		layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
	}
	//  set the current player to whatever the layerindex is
	fl.getDocumentDOM().getTimeline().setSelectedLayers(layerIndex * 1);
}

function getDuration(linePath) {
	// Note that Utils.getFLACLength requires the Utils DLL to be in the External Libraries folder.
	var duration = -1, attempts = 0;
	while (duration == -1 && attempts < 200) {
		duration = Utils.getFLACLength(linePath);
		attempts++;
	}
	if (attempts == 200) {
		throw new Error("Maximum number of attempts to get voice line length reached! Please try again.");
	}
	return duration;
}
/*var num = prompt("Number of first voice line:");

if(num == null) {
	throw new Error("User stopped script.");
}*/

/*
Function: extendVoiceLine
Variables:  
	lineName [A string containing the name of a voice line]
Description: insert frames to match voice line length + 3 frames
*/
function extendVoiceLine(duration) {
	doc.getTimeline().insertFrames(3 + (Math.ceil(doc.frameRate * duration / 1000.0)) - doc.getTimeline().layers[doc.getTimeline().findLayerIndex("TEXT")].frames[doc.getTimeline().currentFrame].duration, true);
}

//var count = parseInt(num) - 1;
var prevVoiceLine = "none";
// verify that Utils is defined (the C level library that finds lengths of FLACs)
try {
	Utils;
} catch (error) {
	throw new Error("Utils.dll not found. Please place Utils.dll in the External Libraries folder in your Animate Configuration directory (same directory that has the commands folder).")
}


fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")].locked = true;

// while the current frame is before the last frame in the current layer
while (doc.getTimeline().currentFrame < doc.getTimeline().layers[doc.getTimeline().currentLayer].frames.length - 1) {
	// prompt user and store input
	// var cancel = confirm("Previous voice line: " + prevVoiceLine + ". Select voice line to add. Select no file to skip this text keyframe. Click cancel to stop this script.");
	// // if the user stops the script via the panel...
	// if (!cancel) {
	// 	throw new Error("User stopped script.");
	// }
	// open the file explorer, promting the user to select a file
	var linePath = fl.browseForFileURL("select", "Previous voice line: " + prevVoiceLine);
	// if the user selected a valid file...
	if (linePath != null) {
		if (linePath.indexOf(".flac") != linePath.length - 5) {
			throw new Error("Invalid file type! Voice lines must be in FLAC format.");
		}
		// show the user some options
		var layerGuess = linePath.substring(linePath.lastIndexOf('_') + 1, linePath.indexOf('.flac')).toUpperCase() + "_VOX";
		while (layerGuess.indexOf(" ") != -1 || layerGuess.indexOf("%20") != -1) {
			layerGuess = layerGuess.replace("%20", "_")
			layerGuess = layerGuess.replace(" ", "_");
		}
		// var promptPanel = fl.xmlPanelFromString("<dialog title=\"Line Adder\" buttons=\"accept, cancel\"> <vbox> <hbox> <label value=\"Name of voice layer (click cancel to stop script):\" control=\"panel_layerName\"/> <textbox id=\"panel_layerName\" size=\"24\" value=\"" + layerGuess + "\"/> </hbox> </vbox> </dialog>");
		// // if the user stops the script via the panel...
		// if (promptPanel.dismiss != "accept") {
		// 	throw new Error("User stopped script.");
		// }
		// give the layer variable the index of the variable of the name the user provided
		switchActive(layerGuess);
		// if we don't have a valid layer, the loop should start over

		// unlock the selected layer(s)
		fl.getDocumentDOM().getTimeline().layers[doc.getTimeline().getSelectedLayers() * 1].locked = false;
		var cleanLinePath = linePath;
		cleanLinePath = cleanLinePath.substring(8).replace("\|", ":");
		while (cleanLinePath.indexOf("%20") != -1) {
			cleanLinePath = cleanLinePath.replace("%20", " ");
		}
		var duration = getDuration(cleanLinePath); // get duration before importing file to prevent data race condition maybe?
		// import the user-selected line file into the library
		doc.importFile(linePath);
		prevVoiceLine = cleanLinePath.substring(cleanLinePath.lastIndexOf("/") + 1);
		extendVoiceLine(duration);
		//count++;
	} else {
		break; // break if no line selected
	}
	// select the text layer
	doc.getTimeline().setSelectedLayers(doc.getTimeline().findLayerIndex("TEXT") * 1);
	// set the current frame to the next keyframe
	doc.getTimeline().currentFrame = doc.getTimeline().layers[doc.getTimeline().currentLayer].frames[doc.getTimeline().currentFrame].startFrame + doc.getTimeline().layers[doc.getTimeline().currentLayer].frames[doc.getTimeline().currentFrame].duration;
}
