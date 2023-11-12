var docURI = fl.getDocumentDOM().pathURI
var slashIndex = docURI.lastIndexOf("/");
var docDir = docURI.substring(0, slashIndex + 1);
var cLib = fl.configURI + "Commands/cLib.jsfl";

var originalLayers = [];

/*
Function: beep
Description: Annoys people
*/
function beep(frequency, duration) {
	fl.runScript(cLib, "beep", frequency, duration);
}

/*
Function: rename
Description: Renames folders or files
*/
function renameFolder(oldPath, newPath) {
	fl.runScript(cLib, "renameFolder", oldPath, newPath);
}

/*
Function: exportSWF
Variables: 
    originalLayers	Array of layers to consider
Description: Return the frame number that the first graphic symbol occurs on.
*/
function exportSWF(name, sceneNumber) {
	fl.getDocumentDOM().testScene()
	fl.closeAllPlayerDocuments()
	
	var oldPath = docDir + fl.getDocumentDOM().name.slice(0, -4) + "_" + fl.getDocumentDOM().timelines[sceneNumber].name + ".swf"
	var newPath = docDir + fl.getDocumentDOM().name.slice(0, -4) + "_" + formatIntWithLeadingZeros(sceneNumber) + "_" + name + ".swf";
	
	//alert(oldPath + '\n' + newPath)
	
	renameFolder(FLfile.uriToPlatformPath(oldPath), FLfile.uriToPlatformPath(newPath));
}

/*
Function: guideAll
Variables: 
    originalLayers	Array of layers to consider
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
Variables: 
    originalLayers	Array of layers to consider
Description: Unguide all layers provided.
*/
function unguideAll(originalLayers) {
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (originalLayers.indexOf(i) !== -1) {
			fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
		}
	}
}

function formatIntWithLeadingZeros(num) {
	if (num >= 0 && num <= 99) {
		return (num < 10 ? '0' : '') + num.toString();
	} else {
		return "Out of range";
	}
}

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

	//Export all valid layers beneath "JAM_MASK" who are not children of the AUDIO folder or "BACKGROUNDS" to "CharactersOnly"
	for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
		if (fl.getDocumentDOM().getTimeline().layers[i].name == "JAM_MASK") {
			for (var j = 0; j < fl.getDocumentDOM().getTimeline().layers.length; j++) {
				if ((j > i) && (originalLayers.indexOf(j) !== -1)) {
					if (fl.getDocumentDOM().getTimeline().layers[j].parentLayer == null) {
						continue
					};

					if ((fl.getDocumentDOM().getTimeline().layers[j].parentLayer.name != "AUDIO") && (fl.getDocumentDOM().getTimeline().layers[j].name != "BACKGROUNDS")) {
						fl.getDocumentDOM().getTimeline().layers[j].layerType = "normal";
					}
				}
			}
		}
	}

	exportSWF("CharactersOnly", s);
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

}