﻿//GENERAL-PURPOSE VARIABLES//
var doc = fl.getDocumentDOM();
var timeline = document.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
var n = frameArray.length;

for (i = 0; i < n; i++) {
	if ((i==frameArray[i].startFrame) && (frameArray[i].isEmpty == false)) {
		var elList = frameArray[i].elements
			for (var j = 0; j < elList.length; j++) {
				var el = elList[j]
				var frameCount = el.firstFrame;
				el.firstFrame = i;
}	}	}