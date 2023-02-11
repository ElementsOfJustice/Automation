var layerNum = fl.getDocumentDOM().getTimeline().currentLayer;
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

var selFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();

function returnInt(num) {
	if (num === 0) {
		return fl.getDocumentDOM().getTimeline().layerCount - 1;
	} else {
		return num - 1;
	}
}

if (selFrames[1] == undefined) {
	fl.getDocumentDOM().getTimeline().setSelectedFrames(curFrame, curFrame)
}

var tmpArray = [];

for (var i = 0; i < fl.getDocumentDOM().getTimeline().getSelectedFrames().length; i += 3) {
	selFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
	tmpArray.push(returnInt(selFrames[i]));
	tmpArray.push(selFrames[i + 1]);
	tmpArray.push(selFrames[i + 2]);
}

fl.getDocumentDOM().getTimeline().setSelectedFrames(tmpArray);