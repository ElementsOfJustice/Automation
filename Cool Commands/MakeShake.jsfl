var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
var guiPanel = fl.getDocumentDOM().xmlPanel(dirURL+"/MakeShake.xml");

if(guiPanel.dismiss == "accept") {

var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

var startTime = new Date();

var frameSelection = timeline.getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];
var range = endFrame - startingFrame;

var intensity = guiPanel.panel_int;
var taperOff = guiPanel.panel_taperOff;
var mat = timeline.layers[layer].frames[timeline.currentFrame].elements[0].matrix;

for(var i = startingFrame; i < endFrame - 1; i++) {
	if(fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame != i) {
		timeline.convertToKeyframes(timeline.currentFrame);
	}
	timeline.layers[layer].frames[timeline.currentFrame].elements[0].matrix = mat;
	var randX = Math.random() - 0.5;
	var randY = Math.random() - 0.5;
	var deltaX = 0;
	var deltaY = 0;
	if(taperOff == "true") {
		deltaX = ((2 * intensity) * randX) * (1 - (((i - startingFrame) / range)));
		deltaY = ((2 * intensity) * randY) * (1 - (((i - startingFrame) / range)));
	}
	else {
		deltaX = ((2 * intensity) * randX);
		deltaY = ((2 * intensity) * randY);
	}
	fl.getDocumentDOM().getTimeline().layers[layer].frames[timeline.currentFrame].elements[0].x += deltaX;
	fl.getDocumentDOM().getTimeline().layers[layer].frames[timeline.currentFrame].elements[0].y += deltaY;
	timeline.currentFrame += 1;
}

timeline.layers[layer].frames[timeline.currentFrame].elements[0].matrix = mat;
}