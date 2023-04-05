/******************************************************************************
EVIDENCE GET
Description: Creates the animation for when evidence is added to the court
record. Specifically moving the evidence image on to and off of the screen.

Tutorial Available in the MEGA: https://mega.nz/fm/qlIkjDSA
******************************************************************************/

DURATION = 200;
SCALE = fl.getDocumentDOM().width / 1280.0;
// get the adobe animate file and info inside
var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;

// Store Width and Height
var trueWidth = 928.0 * SCALE;
var trueHeight = 477.0 * SCALE;

// get frames selected by the user
var frameSelection = doc.getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startFrame = frameSelection[1];
var endFrame = frameSelection[2] - 1;

/*
Function: setup
Variables: None
Description: If the user makes a frame selection from right to left instead of 
left to right, the starting frame will be the last frame and the ending frame
will be the first. We need to ensure things are consistent.
*/

function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}

/*
Function: selectOrMakeKeyframe
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: selects the keyframe if there's one there, or makes one if there isn't
*/
function selectOrMakeKeyframe(layer, frame) {
    resetSelection(layer, frame); // select layer and frame
    // if the current frame isn't the first frame in a frame sequence, make a note of that
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
    // if it isn't...
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // keyframe for new position
        resetSelection(layer, frame); // select layer and frame
    }
}

function setup() {
    if (startFrame > endFrame) { // if selection is backwards, fix it
        var temp = endFrame;
        endFrame = startFrame;
        startFrame = temp;
    }
    fl.getDocumentDOM().getTimeline().currentFrame = startFrame;
    fl.getDocumentDOM().getTimeline().layers[selLayerIndex * 1].locked = false; // unlock layer
    if (endFrame - startFrame < 20) {
        endFrame = startFrame + DURATION;
        if (endFrame >= fl.getDocumentDOM().getTimeline().layers[selLayerIndex * 1].frameCount)
            throw new Error("Selection too close to end of timeline.");
        fl.getDocumentDOM().getTimeline().setSelectedFrames(startFrame, endFrame);
        fl.getDocumentDOM().getTimeline().currentFrame = startFrame;
    }
    fl.getDocumentDOM().getTimeline().clearKeyframes();
}

setup();
alert("Select the evidence info image.");
// Open the file explorer, prompting the user to select an image
var imagePath = fl.browseForFileURL("select");
doc.importFile(imagePath);

// prompt the user and store input
var evidenceName = prompt("Enter name of evidence");
// create a new symbol with a type, name, and registration point
doc.convertToSymbol("graphic", evidenceName, "center");
//TODO: move to its own folder in the library
// scale width and height of the evidence image
an.getDocumentDOM().scaleSelection(trueWidth / timeline.layers[layer].frames[curFrame].elements[0].width, 1);
an.getDocumentDOM().scaleSelection(1, trueHeight / timeline.layers[layer].frames[curFrame].elements[0].height);
// align objects to the vertical center and to the right using document bounds
an.getDocumentDOM().align('vertical center', true);
an.getDocumentDOM().align('right', true);
// we want to make the evidence offscreen and vertically centered
// the evidence is currently all the way to the right and vertically centered
an.getDocumentDOM().moveSelectionBy({ x: 918 * SCALE, y: 0 }); // move the object the rest of the way off screen
doc.getTimeline().currentFrame += 10; // advance playhead by 10
selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
// select the current frame
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame + 1);
// align objects to the horizontal center using document bounds
// (i.e. in 10 frames, the evidence will be onscreen)
an.getDocumentDOM().align('horizontal center', true);
doc.getTimeline().currentFrame -= 10; // reverse playhead by 10
// select the current frame
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame + 1);
// animate the movement of the evidence from right to left
// (Explanation of Tweening: https://www.youtube.com/watch?v=uVPJ-Nm_Igw)
doc.getTimeline().createMotionTween();
// Change how exactly the tween proceeds from one end to the other
// (Explanation of Easing: https://youtu.be/9VjbLUXN2b0)
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 10, 0);

// set the playhead to the saved frame from earlier
doc.getTimeline().currentFrame = endFrame;
selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
// select current frame
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame + 1);
an.getDocumentDOM().moveSelectionBy({ x: 0, y: 536 * SCALE }); // move the selection 536 downward
doc.getTimeline().currentFrame -= 10; // reverse playhead by 10
selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
// select the current frame
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame + 1);
// animate the movement of the evidence from up to down
doc.getTimeline().createMotionTween();
// Change how exactly the tween proceeds from one end to the other
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 9, 0);
// Insert a blank keyframe so the animation stops
doc.getTimeline().convertToBlankKeyframes(endFrame + 1);

fl.getDocumentDOM().getTimeline().setSelectedFrames(frameSelection);