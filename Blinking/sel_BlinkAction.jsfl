var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;

var frameSelection = timeline.getSelectedFrames();
var selectedFrame = frameArray[frameSelection[1]];
var setName = "";

if (selectedFrame.startFrame + 1 != frameSelection[1] + 1) {
	fl.getDocumentDOM().getTimeline().convertToKeyframes(frameSelection[1]);
	selectedFrame = fl.getDocumentDOM().getTimeline().layers[layer].frames[frameSelection[1]]
}

if (selectedFrame.name == "AnimClose") {
	selectedFrame.labelType = "none";
} else if (selectedFrame.name == "AnimOpen") {
	selectedFrame.name = "AnimClose";
} else if (selectedFrame.name == "CutClosed") {
	selectedFrame.name = "AnimOpen";
} else if (selectedFrame.name == "CutOpen") {
	selectedFrame.name = "CutClosed";
} else if (selectedFrame.name == "Blink") {
	selectedFrame.name = "CutOpen";
} else if (selectedFrame.labelType == "none") {
	selectedFrame.name = "Blink";
	selectedFrame.labelType = "anchor";
}