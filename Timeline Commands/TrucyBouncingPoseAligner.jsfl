/******************************************************************************
TRUCY BOUNCING POSE ALIGNER
Description: 
******************************************************************************/

HAPPY_DIFFS = [0, -1.2, -4.2, -7.7, -10.3, -10.4, -10.5, -10.8, -10.9, -11.1, -11.3, -11.3, -11.3, -11.5, -11.6, -12.1, -11.8, -11.8, -6.9, -3.9, -2.3, -1, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
ANNOYED_DIFFS = [0, 0, -0.5, -0.8, -1.2, -1.3, -1.4, -1.6, -1.9, -2.2, -2.6, -2.5, -2.5, -2.5, -2.6, -2.5, -2.5, -2.4, -2.6, -2.4, -2.4, -2.5, -2.5, -2.5, -2.6, -2, -0.7, 0, 0.5, 0.6, 0.6, 0.5, 0.5, 0.4, 0.3, 0.2, 0.3, 0.3, 0.2, 0.1, 0];
HAPPY_MODULO = 33;
ANNOYED_MODULO = 41;
var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startFrame = frameSelection[1];
var endFrame = frameSelection[2];

/*
Function: setup
Variables: None
Description: If the user makes a frame selection from right to left instead of 
left to right, the starting frame will be the last frame and the ending frame
will be the first. We need to ensure things are consistent.
*/
function setup() {
    if (startFrame > endFrame) { // if selection is backwards, fix it
        var temp = endFrame;
        endFrame = startFrame;
        startFrame = temp;
    }
    fl.getDocumentDOM().getTimeline().layers[selLayerIndex * 1].locked = false; // unlock layer
}


/*
Function: resetSelection
Variables:  
	layer [integer(or should be) index of a layer ]
	frame [integer index of a frame]
Description: sets selection to the desired layer and frame
*/
function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true); 
}

/*
>>>MAIN<<<
Description: 
*/
setup();
var characterTimeline = fl.getDocumentDOM().selection[0].libraryItem.timeline; // get the timeline of the selected symbol
var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet"); // get the integer index of layer "xSheet"
if (xSheetLayerIndex == undefined) {
    xSheetLayerIndex = 0; // assume it's at 0 if somehow it doesn't find it
}
var poseFrame = fl.getDocumentDOM().getElementProperty("firstFrame"); // get the index in the firstFrame property
// in the character timeline, obtain the name of the pose as it stands on the given frame
var poseName = characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].name; 

// for each selected frame...
for (var i = startFrame; i < endFrame; i++) {
    resetSelection(selLayerIndex, i);
    // is the current frame the starting frame of the keyframe?
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
    // if it isn't...
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // make it the start of a keyframe
        resetSelection(selLayerIndex, i); 
    }
    // now we should be at the start of a new keyframe, so let's start bouncing!
    if (poseName == "Happy Talk") {
        fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].elements[0].y = HAPPY_DIFFS[(i - startFrame) % HAPPY_MODULO];
    } else if (poseName == "Annoyed Talk") {
        fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].elements[0].y = ANNOYED_DIFFS[(i - startFrame) % ANNOYED_MODULO];
    } else {
        throw new Error("Invalid pose.");
    }
}
