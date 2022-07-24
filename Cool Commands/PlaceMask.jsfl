
function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}
function selectOrMakeKeyframe(layer, frame) {
    resetSelection(layer, frame);
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence,   ke a note of that
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe();
        resetSelection(layer, frame);
    }
}
selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
an.getDocumentDOM().library.addItemToDocument({x:0, y:0});
fl.getDocumentDOM().setElementProperty('x', 0);
fl.getDocumentDOM().setElementProperty('y', 0);