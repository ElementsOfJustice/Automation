var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var startFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[selectedFrames[1]].startFrame;
var endFrame = startFrame + fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[selectedFrames[1]].duration;;

fl.getDocumentDOM().getTimeline().setSelectedFrames(startFrame, endFrame);
fl.getDocumentDOM().getTimeline().currentFrame = startFrame