var delta = fl.getDocumentDOM().getTimeline().getSelectedFrames()[2] - fl.getDocumentDOM().getTimeline().getSelectedFrames()[1];

if (delta <= 10) {
    fl.getDocumentDOM().getTimeline().convertToKeyframes();
} else {
    var doConvert = confirm("Do you want to convert your selection of more than ten frames to keyframes? It may be slow!");
    if (doConvert) {
        fl.getDocumentDOM().getTimeline().convertToKeyframes();
    }
};