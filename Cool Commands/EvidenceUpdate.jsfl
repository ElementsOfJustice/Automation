/******************************************************************************
EVIDENCE UPDATE
Description: 
******************************************************************************/

// get the adobe animate doc object and data inside
var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;

var trueWidth = 928;
var trueHeight = 477;

// store indexes of frames selected by the user
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
// do initial tween 
doc.convertToSymbol("graphic", evidenceName, "center");
doc.setElementProperty("height", trueHeight);
doc.setElementProperty("width", trueWidth);
an.getDocumentDOM().align('vertical center', true);
an.getDocumentDOM().align('right', true);
an.getDocumentDOM().moveSelectionBy({x:918, y:0}); // make the evidence offscren and vertically centered
doc.getTimeline().currentFrame += 10; // advance playhead 10 frames
doc.getTimeline().insertKeyframe(); // in current layer at current playhead
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
an.getDocumentDOM().align('horizontal center', true);
doc.getTimeline().currentFrame -= 10; // reverse playhead 10 frames
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
doc.getTimeline().createMotionTween();
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 10, 0);

// do evidence update tween
doc.getTimeline().currentFrame += 18; // advance playhead 18 frames
doc.getTimeline().insertKeyframe(); // in current layer at current playhead
doc.getTimeline().currentFrame += 9; // advance playhead 9 frames
doc.getTimeline().insertKeyframe(); // in current layer at current playhead
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
doc.setElementProperty("height", 543);
doc.setElementProperty("width", 1056);
doc.setInstanceTint('#ffffff', 100);
doc.getTimeline().currentFrame -= 9; // reverse playhead 9 frames
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);  
doc.getTimeline().createMotionTween();
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 9, 0);
doc.getTimeline().currentFrame += 9 + 5; // advance playhead 14 frames
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);  
doc.getTimeline().insertBlankKeyframe();
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);  

// put in updated evidence
alert("Select the updated evidence info image.");
// Open the file explorer, prompting the user to select an image
imagePath = fl.browseForFileURL("select");
doc.importFile(imagePath);
// prompt the user and store input
evidenceName = prompt("Enter name of updated evidence");
doc.convertToSymbol("graphic", evidenceName, "center");
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1); 
doc.setElementProperty("height", 543);
doc.setElementProperty("width", 1056);
an.getDocumentDOM().align('vertical center', true);
an.getDocumentDOM().align('horizontal center', true);
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);  
doc.setInstanceTint('#ffffff', 100);
doc.getTimeline().currentFrame += 9; // advance playhead 9 frames
doc.getTimeline().insertKeyframe(); // in current layer at current playhead
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
an.getDocumentDOM().setElementProperty('colorMode', 'none');
doc.setElementProperty("height", trueHeight);
doc.setElementProperty("width", trueWidth);
doc.getTimeline().currentFrame -= 9; // reverse playhead 9 frames
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
doc.getTimeline().createMotionTween();
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 10, 0);

// now get rid of it
doc.getTimeline().currentFrame = endFrame;
doc.getTimeline().insertKeyframe(); // in current layer at current playhead
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
an.getDocumentDOM().moveSelectionBy({x:0, y:536});
doc.getTimeline().currentFrame -= 10; // reverse playhead 10 frames
doc.getTimeline().insertKeyframe(); // in current layer at current playhead
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
doc.getTimeline().createMotionTween();
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 9, 0);
doc.getTimeline().convertToBlankKeyframes(endFrame + 1);