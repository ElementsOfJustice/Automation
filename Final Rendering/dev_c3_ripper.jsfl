var docURI = fl.getDocumentDOM().pathURI
var slashIndex = docURI.lastIndexOf("/");
var docDir = docURI.substring(0, slashIndex + 1);

var originalLayers = [];

/*
Function: exportSWF
Variables: 
    originalLayers	Array of layers to consider
Description: Return the frame number that the first graphic symbol occurs on.
*/
function exportSWF(name) {
	fl.getDocumentDOM().exportSWF(docDir + fl.getDocumentDOM().name.slice(0, -4) + "_" + name + ".swf");
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

//Save all normal layers into an array so we can force them to become normal later.
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
	if (fl.getDocumentDOM().getTimeline().layers[i].layerType == "normal") {
		originalLayers.push(i);
	}
}

//Sequential SWF Export.

guideAll(originalLayers)

//Export all valid layers above "JAM_MASK" as "EffectOnly.swf"
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
	if (fl.getDocumentDOM().getTimeline().layers[i].name == "TEXTBOX") {
		for (var j = 0; j < fl.getDocumentDOM().getTimeline().layers.length; j++) {
			if ((j < i) && (originalLayers.indexOf(j) !== -1)) {
				fl.getDocumentDOM().getTimeline().layers[j].layerType = "normal";
			}
		}
	}
}

exportSWF("EffectsOnly");
guideAll(originalLayers)

//Export "TEXTBOX" as "TextboxOnly.swf"
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
	if (fl.getDocumentDOM().getTimeline().layers[i].name == "TEXTBOX") {
		fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
	}
}

exportSWF("TextboxOnly");
guideAll(originalLayers)

//Export "JAM_MASK" as "MaskOnly.swf"
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
	if (fl.getDocumentDOM().getTimeline().layers[i].name == "JAM_MASK") {
		fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
	}
}

exportSWF("JamMaskOnly");
guideAll(originalLayers)

//Export all valid layers beneath "JAM_MASK" who are not children of the AUDIO folder or "BACKGROUNDS" to "CharactersOnly"
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
	if (fl.getDocumentDOM().getTimeline().layers[i].name == "JAM_MASK") {
		for (var j = 0; j < fl.getDocumentDOM().getTimeline().layers.length; j++) {
			if ((j > i) && (originalLayers.indexOf(j) !== -1)) {
				if (fl.getDocumentDOM().getTimeline().layers[j].parentLayer == null) {continue};
				
				if ((fl.getDocumentDOM().getTimeline().layers[j].parentLayer.name != "AUDIO") && (fl.getDocumentDOM().getTimeline().layers[j].name != "BACKGROUNDS")) {
					fl.getDocumentDOM().getTimeline().layers[j].layerType = "normal";
				}
			}
		}
	}
}

exportSWF("CharactersOnly");
guideAll(originalLayers)

//Export "BACKGROUNDS" as "BackgroundsOnly.swf"
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
	if (fl.getDocumentDOM().getTimeline().layers[i].name == "BACKGROUNDS") {
		fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
	}
}

exportSWF("BackgroundsOnly");
guideAll(originalLayers)

//Export all layers with SFX in their name who are also child layers of the AUDIO folder as "SFX_Only"
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
	if (fl.getDocumentDOM().getTimeline().layers[i].parentLayer != null) {
		if ((fl.getDocumentDOM().getTimeline().layers[i].parentLayer.name == "AUDIO") && (fl.getDocumentDOM().getTimeline().layers[i].name.indexOf("SFX") !== -1)) {
			fl.trace("Hello");
			fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
		}
	}
}

exportSWF("SFX_Only");
guideAll(originalLayers)

//Export all layers with VOX in their name who are also child layers of the AUDIO folder as "SFX_Only"
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
	if (fl.getDocumentDOM().getTimeline().layers[i].parentLayer != null) {
		if ((fl.getDocumentDOM().getTimeline().layers[i].parentLayer.name == "AUDIO") && (fl.getDocumentDOM().getTimeline().layers[i].name.indexOf("VOX") !== -1)) {
			fl.getDocumentDOM().getTimeline().layers[i].layerType = "normal";
		}
	}
}

exportSWF("VOX_Only");

unguideAll(originalLayers);