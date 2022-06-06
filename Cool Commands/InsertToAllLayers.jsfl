var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = fl.getDocumentDOM().getTimeline().currentLayer;
var firstFrame = selectedFrames[1];
var lastFrame = selectedFrames[2];
if(firstFrame > lastFrame) {
    var temp = firstFrame;
    firstFrame = lastFrame;
    lastFrame = temp;
}
var selectionArray = [];
for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
    selectionArray.push(i, firstFrame, lastFrame);
}
fl.getDocumentDOM().getTimeline().setSelectedFrames(selectionArray);
fl.getDocumentDOM().getTimeline().insertFrames();
fl.getDocumentDOM().getTimeline().setSelectedFrames([layer, firstFrame, lastFrame]);