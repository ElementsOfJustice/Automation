var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

if (selectedFrames[1] === undefined) {
	fl.getDocumentDOM().getTimeline().setSelectedFrames(curFrame, curFrame);
	var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
}

var layer = selectedFrames[0];
var maxFrames = fl.getDocumentDOM().getTimeline().layers[layer].frameCount;
var range = 1;

var tmpArray = [];

for (var i = 0; i < fl.getDocumentDOM().getTimeline().getSelectedFrames().length; i += 3) {
	selFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
	tmpArray.push(selFrames[i]);
	tmpArray.push(Math.max(selFrames[i + 1] - range, 0));
	tmpArray.push(Math.min(selFrames[i + 2] - range, maxFrames - 1));
}

fl.getDocumentDOM().getTimeline().setSelectedFrames(tmpArray);