var doc = fl.getDocumentDOM();
var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

var frameSelection = doc.getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startFrame = frameSelection[1]+1;
var endFrame = frameSelection[2];


var layer = doc.getTimeline().getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
alert("Select the evidence image.");
var imagePath = fl.browseForFileURL("select");

doc.importFile(imagePath);

var evidenceName = prompt("Enter name of evidence");

var left = confirm("Click \"OK\" for a left swoosh, click \"Cancel\" for a right swoosh");

doc.convertToSymbol("graphic", evidenceName, "center");

var mat = doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix;
mat.a = (5.2 /1000.0);
mat.b = 0;
mat.c = 0;
mat.d = (5.2 /1000.0);
mat.tx = (!left) ? (1280 - 12.6) : 12.6;
mat.ty = 12.6;

doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix = mat;

doc.setTransformationPoint({x:-115.6, y:-115.6});

doc.getTimeline().currentFrame += 4;
doc.getTimeline().convertToKeyframes(doc.getTimeline().currentFrame);
var secondMat = doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix;
secondMat.a = (240.0 /1000.0);
secondMat.b = 0;
secondMat.c = 0;
secondMat.d = (240.0 /1000.0);
secondMat.tx = (!left) ? (1280 - 130) :130;
secondMat.ty = 130;

doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix = secondMat;

doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);

doc.setTransformationPoint({x:-115.6, y:-115.6});

doc.getTimeline().currentFrame -=4;
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
doc.getTimeline().createMotionTween();
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 10, 0);

doc.getTimeline().currentFrame = endFrame;
doc.getTimeline().convertToKeyframes(doc.getTimeline().currentFrame);
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
doc.getTimeline().layers[layer].frames[doc.getTimeline().currentFrame].elements[0].matrix = mat;
doc.setTransformationPoint({x:-115.6, y:-115.6});

doc.getTimeline().currentFrame-=4;
doc.getTimeline().convertToKeyframes(doc.getTimeline().currentFrame);
doc.getTimeline().setSelectedFrames(doc.getTimeline().currentFrame, doc.getTimeline().currentFrame+1);
doc.setTransformationPoint({x:-115.6, y:-115.6});
doc.getTimeline().createMotionTween();
an.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 9, 0);
doc.getTimeline().convertToBlankKeyframes(endFrame + 1);