var locked = 0;
var unlocked = 0;

for (var i = 0; i < fl.getDocumentDOM().getTimeline().getSelectedFrames().length / 3; i++) {
	selectedLayer = fl.getDocumentDOM().getTimeline().getSelectedFrames()[i * 3]
	if (fl.getDocumentDOM().getTimeline().layers[selectedLayer].visible) {
		fl.getDocumentDOM().getTimeline().layers[selectedLayer].visible = false;
	} else {
		fl.getDocumentDOM().getTimeline().layers[selectedLayer].visible = true;
	}
}