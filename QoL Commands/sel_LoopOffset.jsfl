var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
var guiPanel = fl.getDocumentDOM().xmlPanel(dirURL+"/loopOffset.xml");

var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
var n = frameArray.length;

if(guiPanel.dismiss == "accept") {

var offsetValue = guiPanel.numOffset;

if(guiPanel.opMode == "negative") {
	offsetValue = -Math.abs(offsetValue);
}

if(guiPanel.opMode == "positive") {
	offsetValue = Math.abs(offsetValue);
}

var frameSelection = timeline.getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startFrame = frameSelection[1]+1;
var endFrame = frameSelection[2];

for (i = 0; i < n; i++) {
	if ((i==frameArray[i].startFrame) && (frameArray[i].isEmpty == false)) {
		var elList = frameArray[i].elements
			for (var j = 0; j < elList.length; j++) {
				var el = elList[j]
					el.firstFrame += offsetValue;
}	}	}	}