/******************************************************************************
EVIDENCE SWOOSH
Description: 
******************************************************************************/

// get the adobe animate doc object
var doc = fl.getDocumentDOM();
// set scriptPath to "/path/../EvidenceSwoosh.jsfl"
var scriptPath = fl.scriptURI;
// set dirURL to the path up to the last / character (i.e. just the path)
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

// store indexes of frames selected by the user
var frameSelection = doc.getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startFrame = frameSelection[1]+1;
var endFrame = frameSelection[2];
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

// store indexes of layers selected by the user
var layer = doc.getTimeline().getSelectedLayers();
// store all frames in the layer
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;

alert("Select the evidence image.");
// Open the file explorer, prompting the user to select an image
var imagePath = fl.browseForFileURL("select");
doc.importFile(imagePath);

// prompt the user and store input
var evidenceName = prompt("Enter name of evidence");
// Store boolean value based on user interaction
var left = confirm("Click \"OK\" for a left swoosh, click \"Cancel\" for a right swoosh");
// create a new symbol with a type, name, and registration point
doc.convertToSymbol("graphic", evidenceName, "center");

// store the current frame's matrix
var mat = doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix;
// change matrix values
mat.a = (5.2 /1000.0);
mat.b = 0;
mat.c = 0;
mat.d = (5.2 /1000.0);
mat.tx = (!left) ? (1280 - 12.6) : 12.6;
mat.ty = 12.6;

// assign the new matrix values back to the current frame
doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix = mat;

doc.setTransformationPoint({x:-115.6, y:-115.6});

// advance playhead by 4 frames
doc.getTimeline().currentFrame += 4;
// Make the current frame a keyframe
doc.getTimeline().convertToKeyframes(doc.getTimeline().currentFrame);
// store the new current frame's matrix in a seperate variable
var secondMat = doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix;
// change matrix values
secondMat.a = (240.0 /1000.0);
secondMat.b = 0;
secondMat.c = 0;
secondMat.d = (240.0 /1000.0);
secondMat.tx = (!left) ? (1280 - 130) :130;
secondMat.ty = 130;

// assign the new matrix values back to the current frame
doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix = secondMat;

// select the current frame and the one after
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);

//
doc.setTransformationPoint({x:-115.6, y:-115.6});

// reverse playhead by 4 frames
doc.getTimeline().currentFrame -=4;
// select the current frame and the one after
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
// animate movement between two positions
doc.getTimeline().createMotionTween();
// Change how exactly the tween proceeds from one end to the other
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 10, 0);

// move playhead to the last frame selected by the user
doc.getTimeline().currentFrame = endFrame;
// Make the current frame a key frame
doc.getTimeline().convertToKeyframes(doc.getTimeline().currentFrame);
// select the current frame and the one after
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
// assign the original matrix values to the current frame
doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix = mat;
//
doc.setTransformationPoint({x:-115.6, y:-115.6});

// reverse playhead by 4 frames
doc.getTimeline().currentFrame-=4;
// Make the current frame a key frame
doc.getTimeline().convertToKeyframes(doc.getTimeline().currentFrame);
// select the current frame and the one after
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
//
doc.setTransformationPoint({x:-115.6, y:-115.6});
// animate movement between two positions
doc.getTimeline().createMotionTween();
// Change how exactly the tween proceeds from one end to the other
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 9, 0);
// Insert a blank keyframe so the animation stops
doc.getTimeline().convertToBlankKeyframes(endFrame + 1);