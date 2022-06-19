/******************************************************************************
INVERSE LIP SYNCER
Description: Allows the user to undo portions of the Lip Syncer script
    without undoing everything.
******************************************************************************/

// TODO figure out how to get an inverse function of the lipsyncer
// Approach 1: remove all keyframes that aren't the first frame of a lip flap?

// store user input as an integer
var firstFrameOfLipFlap = parseInt(prompt("Enter first frame of lip flap"));
// if the user gave us valid input
if (firstFrameOfLipFlap != null) {
    // store frames selected by the user
    var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
    var selLayerIndex = frameSelection[0];
    var startingFrame = frameSelection[1];
    var endFrame = frameSelection[2];
    // for all selected frames
    for (var i = startingFrame; i < endFrame; i++) {
        // if i == start of a keyframe and it is not the first frame of a lip flap
        if(i == fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].startFrame && fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].elements[0].firstFrame != (firstFrameOfLipFlap - 1)) { 
            // convert keyframe to regular frame and delete its contents on the current layer
            fl.getDocumentDOM().getTimeline().clearKeyframes(i);
        }
    }
}