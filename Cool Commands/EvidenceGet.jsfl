/******************************************************************************
EVIDENCE GET
Description: Creates the animation for when evidence is added to the court
record. Specifically moving the evidence image on to and off of the screen.
******************************************************************************/

// get the adobe animate file and info inside
var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;

// Store Width and Height
var trueWidth = 928;
var trueHeight = 477;

// get frames selected by the user
var frameSelection = doc.getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startFrame = frameSelection[1]+1;
var endFrame = frameSelection[2];

alert("Select the evidence info image.");
// Open the file explorer, prompting the user to select an image
var imagePath = fl.browseForFileURL("select");
doc.importFile(imagePath);

// prompt the user and store input
var evidenceName = prompt("Enter name of evidence");
// create a new symbol with a type, name, and registration point
doc.convertToSymbol("graphic", evidenceName, "center");
// scale width and height of ?? the evidence image ??
an.getDocumentDOM().scaleSelection(trueWidth / timeline.layers[layer].frames[curFrame].elements[0].width, 1);
an.getDocumentDOM().scaleSelection(1, trueHeight / timeline.layers[layer].frames[curFrame].elements[0].height);
// align objects to the vertical center and to the right using document bounds
an.getDocumentDOM().align('vertical center', true);
an.getDocumentDOM().align('right', true);

an.getDocumentDOM().moveSelectionBy({x:918, y:0}); // make the evidence offscreen and vertically centered
doc.getTimeline().currentFrame += 10; // advance playhead by 10
doc.getTimeline().insertKeyframe(); // insert keyframe at current playhead
// select the current frame and the one after that
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
// align objects to the horizontal center using document bounds
an.getDocumentDOM().align('horizontal center', true);
doc.getTimeline().currentFrame -= 10; // reverse playhead by 10
// select the current frame and the one after that
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
// animate the movement of the evidence from one place to another
// (Explanation of Tweening: https://www.youtube.com/watch?v=uVPJ-Nm_Igw)
doc.getTimeline().createMotionTween();
// 
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 10, 0);

// set the playhead to the saved frame from earlier
doc.getTimeline().currentFrame = endFrame;
doc.getTimeline().insertKeyframe(); // insert keyframe at current playhead
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
an.getDocumentDOM().moveSelectionBy({x:0, y:536});
doc.getTimeline().currentFrame -= 10; // reverse playhead by 10
doc.getTimeline().insertKeyframe(); // insert keyframe at current playhead
// select the current frame and the one after that
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
// animate the movement of the evidence from one place to another
doc.getTimeline().createMotionTween();
// 
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 9, 0);
// 
doc.getTimeline().convertToBlankKeyframes(endFrame + 1);