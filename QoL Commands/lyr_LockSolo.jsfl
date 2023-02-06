var locked = 0;
var unlocked = 0;

for (var i = 0; i < fl.getDocumentDOM().getTimeline().layerCount; i++) {
	var layer = fl.getDocumentDOM().getTimeline().layers[i];
	if (fl.getDocumentDOM().getTimeline().getSelectedLayers().indexOf(i) === -1) {
		if (layer.locked == true) {
			locked++
		}
		if (layer.locked == false) {
			unlocked++
		}
	}
}

for (var i = 0; i < fl.getDocumentDOM().getTimeline().layerCount; i++) {
	if (unlocked > locked) {
		fl.getDocumentDOM().getTimeline().layers[i].locked = true;
	} else if (unlocked < locked) {
		fl.getDocumentDOM().getTimeline().layers[i].locked = false;
	}
}

for (var i = 0; i < fl.getDocumentDOM().getTimeline().getSelectedFrames().length/3; i++) {
	selectedLayer = fl.getDocumentDOM().getTimeline().getSelectedFrames()[i*3]
	fl.getDocumentDOM().getTimeline().layers[selectedLayer].locked = false;
}