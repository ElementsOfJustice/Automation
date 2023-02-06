if (curFrame > 0) {
	var curFrame = fl.getDocumentDOM().getTimeline().currentFrame - 1;
	fl.getDocumentDOM().getTimeline().setSelectedFrames(curFrame, curFrame)
}