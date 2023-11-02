var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var delta = selectedFrames[2] - selectedFrames[1];
if (delta <= 10) {
    fl.getDocumentDOM().getTimeline().convertToKeyframes();
    if(!fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]].frames[selectedFrames[1]].isEmpty)
        fl.getDocumentDOM().selection = fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]].frames[selectedFrames[1]].elements;
} else {
    var doConvert = confirm("Do you want to convert your selection of more than ten frames to keyframes? It may be slow!");
    if (doConvert) {
        fl.getDocumentDOM().getTimeline().convertToKeyframes();
        if(!fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]].frames[selectedFrames[1]].isEmpty)
            fl.getDocumentDOM().selection = fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]].frames[selectedFrames[1]].elements;
    }
};