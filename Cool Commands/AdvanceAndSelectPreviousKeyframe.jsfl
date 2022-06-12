var currentTimelineKeyframe = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame;
if (fl.getDocumentDOM().getTimeline().currentFrame == currentTimelineKeyframe) {
	fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[currentTimelineKeyframe - 1].startFrame;
} else {
	fl.getDocumentDOM().getTimeline().currentFrame = currentTimelineKeyframe;
}
fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);