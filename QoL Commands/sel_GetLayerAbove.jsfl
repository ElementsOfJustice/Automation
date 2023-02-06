var layerNum = fl.getDocumentDOM().getTimeline().currentLayer;
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

var selFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames()

if (selFrames[1] == undefined) {
	fl.getDocumentDOM().getTimeline().setSelectedFrames(curFrame, curFrame)
}

if (layerNum > 0) {
	selFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames()
	fl.getDocumentDOM().getTimeline().setSelectedLayers(layerNum - 1)
	selFrames[0] = fl.getDocumentDOM().getTimeline().currentLayer
	fl.getDocumentDOM().getTimeline().setSelectedFrames(selFrames)
}

if (layerNum == 0) {
	selFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames()
	fl.getDocumentDOM().getTimeline().setSelectedLayers(fl.getDocumentDOM().getTimeline().layerCount-1)
	selFrames[0] = fl.getDocumentDOM().getTimeline().currentLayer
	fl.getDocumentDOM().getTimeline().setSelectedFrames(selFrames)
}