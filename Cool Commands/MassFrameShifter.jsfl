/******************************************************************************
MASS FRAME SHIFTER
Description: 
******************************************************************************/

var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

var frameSelection = timeline.getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];

var delta = parseInt(prompt("Enter the frames to shift each keyframe by (positive = forward, negatve = backward)"));


for(var i = startingFrame; i < endFrame - 1; i++) {
	if(fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame == i) {
		doc.getTimeline().setSelectedFrames(i, i+1);
		fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].firstFrame += delta;
		an.getDocumentDOM().setElementProperty('lastFrame', (an.getDocumentDOM().getElementProperty('lastFrame') + delta) * 1);
	}
}