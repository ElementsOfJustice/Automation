var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layerNum = fl.getDocumentDOM().getTimeline().currentLayer;
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

var selFrames = timeline.getSelectedFrames()
timeline.setSelectedLayers(layerNum+1)
selFrames[0] = fl.getDocumentDOM().getTimeline().currentLayer
timeline.setSelectedFrames(selFrames)