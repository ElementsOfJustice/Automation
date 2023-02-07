var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var isAltDown = fl.tools.altIsDown;

if (selectedFrames[1] === undefined) {
	fl.getDocumentDOM().getTimeline().setSelectedFrames(curFrame, curFrame);
	var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
}

var range = Math.abs(selectedFrames[1] - selectedFrames[2]);
var layer = selectedFrames[0];

var maxFrames = fl.getDocumentDOM().getTimeline().layers[layer].frameCount;
var curFrame1 = Math.max(selectedFrames[1] - range, 0);
var curFrame2 = Math.min(selectedFrames[2] - range, maxFrames - 1);

if (selectedFrames[1] != 0) {
	fl.getDocumentDOM().getTimeline().setSelectedFrames(curFrame1, curFrame2);
	fl.getDocumentDOM().getTimeline().currentFrame = curFrame1;
} else {
	fl.getDocumentDOM().getTimeline().setSelectedFrames(maxFrames - 1, maxFrames - 1);
	fl.getDocumentDOM().getTimeline().currentFrame = maxFrames - 1;
}