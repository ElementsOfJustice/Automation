/******************************************************************************
ADVANCE AND SELECT PREVIOUS KEY FRAME
Description: Move backward from the frame at the current playhead and select
the start frame of the keyframe
******************************************************************************/

// get the keyframe start index of the frame at the playhead position
var currentTimelineKeyframe = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame;
// If we're already at the start...
if (fl.getDocumentDOM().getTimeline().currentFrame == currentTimelineKeyframe && fl.getDocumentDOM().getTimeline().currentFrame != 0) {
	// ?? select the start of the previous keyframe ??
	fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()].frames[currentTimelineKeyframe - 1].startFrame;
} else {
	// ?? otherwise just select the current keyframe's starting frame ??
	fl.getDocumentDOM().getTimeline().currentFrame = currentTimelineKeyframe;
}
// Select the current frame
fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);