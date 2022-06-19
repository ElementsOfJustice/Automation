/******************************************************************************
ADVANCE AND SELECT NEXT KEY FRAME
Description: Advance from the frame at the current playhead position
and select the starting frame of the next keyframe
******************************************************************************/

// get the 0 based index number of the frame at the current playhead
var currentTimelineFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().currentFrame];
// advance playhead by the amount of frames left until the next keyframe
fl.getDocumentDOM().getTimeline().currentFrame += currentTimelineFrame.duration - (fl.getDocumentDOM().getTimeline().currentFrame - currentTimelineFrame.startFrame);
// Select the current frame
fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);