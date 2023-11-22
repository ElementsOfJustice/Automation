var docURI = fl.getDocumentDOM().pathURI;
var slashIndex = docURI.lastIndexOf("/");
var docDir = docURI.substring(0, slashIndex + 1);
var cLib = fl.configURI + "Commands/cLib.jsfl";

var originalLayers = [];

var CPUCount = prompt("Enter the amount of CPUs for FFMPEG to use.", "16"); 

/*
Function: beep
Description: Annoys people
*/
function beep(frequency, duration) {
	fl.runScript(cLib, "beep", frequency, duration);
}

/*
Function: renameFolder
Description: Renames folders or files
*/
function renameFolder(oldPath, newPath) {
	fl.runScript(cLib, "renameFolder", oldPath, newPath);
}

/*
Function: exportSWF
Description: Exports a SWF with the provided name and scene number.
*/
function exportSWF(name, sceneNumber) {
	beep(250, 250);
	fl.getDocumentDOM().testScene();
	fl.closeAllPlayerDocuments();

	var oldPath = docDir + fl.getDocumentDOM().name.slice(0, -4) + "_" + fl.getDocumentDOM().timelines[sceneNumber].name + ".swf"
	var newPath = docDir + fl.getDocumentDOM().name.slice(0, -4) + "_" + formatIntWithLeadingZeros(sceneNumber) + "_" + name + ".swf";

	//alert(oldPath + '\n' + newPath)

	renameFolder(FLfile.uriToPlatformPath(oldPath), FLfile.uriToPlatformPath(newPath));
}

/*
Function: exportVideo
Description: Return the frame number that the first graphic symbol occurs on.
*/
function exportVideo(name) {
	beep(500, 500);
	fileURI = docDir + fl.getDocumentDOM().name.slice(0, -4) + "_" + name + ".mov";
	
	var totalFrameCount = 0;
	
	for (var i = 0; i < fl.getDocumentDOM().timelines.length; i++) {
		totalFrameCount += fl.getDocumentDOM().timelines[i].frameCount;
	}

	fl.getDocumentDOM().exportVideo(fileURI, false, true, true, totalFrameCount);
	
	return FLfile.uriToPlatformPath(fileURI);
}

/*
Function: callFFMPEG
Description: Calls FFMPEG on our MOV and converts it to an image sequence.
*/
function callFFMPEG(movName, threadCount, outputName) {
	var output = outputName + '_%05d.png';
	
	if (!FLfile.exists(docDir+output.split("/")[0]+"/")) { 
		FLfile.createFolder(docDir+output.split("/")[0]+"/");
	};

	
	var cdCmd = 'cd "' + FLfile.uriToPlatformPath(docDir) + '"';
	var ffmpegCmd = 'ffmpeg -i "' + movName + '" -vf "fps=23.976" -start_number 1 -c:v png -threads ' + threadCount + ' -pix_fmt rgba "' + output + '"';
	var combinedCmd = cdCmd + "&&" + ffmpegCmd;
	
	//alert("Created " + docDir+output.split("/")[0]+"/")
	//alert(combinedCmd)
	
	FLfile.runCommandLine(combinedCmd)
}

/*
Function: guideAll
Description: Guide all layers provided.
*/
function guideAll(originalLayers) {
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (originalLayers.indexOf(i) !== -1) {
			fl.getDocumentDOM().getTimeline().layers[i].layerType = "guide";
		}
	}
}

/*
Function: unguideAll
Description: Unguide all layers provided.
*/
function unguideAll(originalLayers) {
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (originalLayers.indexOf(i) !== -1) {
			fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
		}
	}
}

/*
Function: formatIntWithLeadingZeros
Description: Converts an int to a string with double-digit leading zeros.
*/
function formatIntWithLeadingZeros(num) {
	if (num >= 0 && num <= 99) {
		return (num < 10 ? '0' : '') + num.toString();
	} else {
		return "Out of range";
	}
}

//Non-Character Exports
for (var s = 0; s < fl.getDocumentDOM().timelines.length; s++) {
	fl.getDocumentDOM().editScene(s);

	//Save all normal layers into an array so we can force them to become normal later.
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].layerType == "normal") {
			originalLayers.push(i);
		}
	}

	//Sequential SWF Export.

	guideAll(originalLayers)

	//Export all valid layers above "TEXTBOX" as "AboveText_EffectsOnly.swf"
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].name == "TEXTBOX") {
			for (var j = 0; j < fl.getDocumentDOM().getTimeline().layers.length; j++) {
				if ((j < i) && (originalLayers.indexOf(j) !== -1)) {
					fl.getDocumentDOM().getTimeline().layers[j].layerType = "normal";
				}
			}
		}
	}

	exportSWF("AboveTextbox_EffectsOnly", s);
	guideAll(originalLayers)

	//Export "TEXTBOX" as "TextboxOnly.swf"
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].name == "TEXTBOX") {
			fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
		}
	}

	exportSWF("TextboxOnly", s);
	guideAll(originalLayers)

	//Export all valid layers below "TEXTBOX" but above "JAM_MASK" as "BelowTextbox_EffectsOnly.swf"
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].name == "JAM_MASK") {
			for (var j = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXTBOX")[0] + 1; j < fl.getDocumentDOM().getTimeline().layers.length; j++) {
				if ((j < i) && (originalLayers.indexOf(j) !== -1)) {
					fl.getDocumentDOM().getTimeline().layers[j].layerType = "normal";
				}
			}
		}
	}

	exportSWF("BelowTextbox_EffectsOnly", s);
	guideAll(originalLayers)

	//Export "JAM_MASK" as "MaskOnly.swf"
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].name == "JAM_MASK") {
			fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
		}
	}

	exportSWF("JamMaskOnly", s);
	guideAll(originalLayers)

	//Export "BACKGROUNDS" as "BackgroundsOnly.swf"
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].name == "BACKGROUNDS") {
			fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
		}
	}

	exportSWF("BackgroundsOnly", s);
	guideAll(originalLayers)

	//Export all layers with SFX in their name who are also child layers of the AUDIO folder as "SFX_Only"
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].parentLayer != null) {
			if ((fl.getDocumentDOM().getTimeline().layers[i].parentLayer.name == "AUDIO") && (fl.getDocumentDOM().getTimeline().layers[i].name.indexOf("SFX") !== -1)) {
				fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
			}
		}
	}

	exportSWF("SFX_Only", s);
	guideAll(originalLayers)

	//Export all layers with VOX in their name who are also child layers of the AUDIO folder as "SFX_Only"
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].parentLayer != null) {
			if ((fl.getDocumentDOM().getTimeline().layers[i].parentLayer.name == "AUDIO") && (fl.getDocumentDOM().getTimeline().layers[i].name.indexOf("VOX") !== -1)) {
				fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
			}
		}
	}

	exportSWF("VOX_Only", s);
	unguideAll(originalLayers);
	originalLayers = [];
}

//Character-Only Export (This currently fucks up the file)
for (var s = 0; s < fl.getDocumentDOM().timelines.length; s++) {
	fl.getDocumentDOM().editScene(s);

	//Save all normal layers into an array so we can force them to become normal later.
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].layerType == "normal") {
			originalLayers.push(i);
		}
	}

	guideAll(originalLayers);

	//Export all valid layers beneath "JAM_MASK" who are not children of the AUDIO folder or "BACKGROUNDS" to "CharactersOnly"
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].name == "JAM_MASK") {
			for (var j = 0; j < fl.getDocumentDOM().getTimeline().layers.length; j++) {
				if ((j > i) && (originalLayers.indexOf(j) !== -1)) {
					if (fl.getDocumentDOM().getTimeline().layers[j].parentLayer == null) {
						continue
					}
					
					if ((fl.getDocumentDOM().getTimeline().layers[j].parentLayer.name != "AUDIO") && (fl.getDocumentDOM().getTimeline().layers[j].name != "BACKGROUNDS") && fl.getDocumentDOM().getTimeline().layers[j].layerType != "folder") {
						fl.getDocumentDOM().getTimeline().layers[j].layerType = "normal";
					}
				}
			}
		}
	}
	originalLayers = [];
}

var movName = exportVideo("CharactersOnly");
callFFMPEG(movName, parseInt(CPUCount, 10), "Output/Output")
FLfile.remove(FLfile.platformPathToURI(movName))