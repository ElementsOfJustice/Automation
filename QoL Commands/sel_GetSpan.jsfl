var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var startFrame = 0
var endFrame = 0

startFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].startFrame;
endFrame = startFrame + fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].duration;

fl.getDocumentDOM().getTimeline().setSelectedFrames(startFrame, endFrame);
fl.getDocumentDOM().getTimeline().currentFrame = startFrame