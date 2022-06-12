// TODO figure out how to get an inverse function of the lipsyncer
// Approach 1: remove all keyframes that aren't the first frame of a lip flap?

var firstFrameOfLipFlap = parseInt(prompt("Enter first frame of lip flap"));
if (firstFrameOfLipFlap != null) {
    var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
    var selLayerIndex = frameSelection[0];
    var startingFrame = frameSelection[1];
    var endFrame = frameSelection[2];
    for (var i = startingFrame; i < endFrame; i++) {
        if(i == fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].startFrame && fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].elements[0].firstFrame != (firstFrameOfLipFlap - 1)) { // if i == start of a keyframe and it is not the first frame of a lip flap
            fl.getDocumentDOM().getTimeline().clearKeyframes(i);
        }
    }
}