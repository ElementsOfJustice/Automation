/******************************************************************************
LINE ADDER
Description: 
******************************************************************************/

var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

var doc = fl.getDocumentDOM();
var layer = doc.getTimeline().getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;

alert("Select the config file for this batch of voice lines. If you don't have this file, run the JAR that is also provided.");
var cfgPath = fl.browseForFileURL("select");

/*var num = prompt("Number of first voice line:");

if(num == null) {
	throw new Error("User stopped script.");
}*/

function extendVoiceLine(lineName) {
	doc.getTimeline().insertFrames(3 + (Math.ceil(doc.frameRate * voiceLineLengths[lineName])) - doc.getTimeline().layers[doc.getTimeline().findLayerIndex("TEXT")].frames[doc.getTimeline().currentFrame].duration, true); // insert frames to match voice line length + 3 frames
}
fl.runScript(cfgPath);

var curLayer = "";
//var count = parseInt(num) - 1;
var prevVoiceLine = "none";

fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")].locked = true;


while(doc.getTimeline().currentFrame < doc.getTimeline().layers[doc.getTimeline().currentLayer].frames.length - 1) {
	var cancel = confirm("Previous voice line: " + prevVoiceLine + ". Select voice line to add. Select no file to skip this text keyframe. Click cancel to stop this script.");
	if(!cancel) {
		throw new Error("User stopped script.");
	}
	var linePath = fl.browseForFileURL("select");
	if(linePath != null) {
		var layerToAddTo = undefined;
		while(layerToAddTo == undefined) {
			var promptPanel = fl.xmlPanelFromString("<dialog title=\"Line Adder\" buttons=\"accept, cancel\"> <vbox> <hbox> <label value=\"Name of voice layer (click cancel to stop script):\" control=\"panel_layerName\"/> <textbox id=\"panel_layerName\" size=\"24\" value=\"" + curLayer + "\"/> </hbox> </vbox> </dialog>");
			if(promptPanel.dismiss != "accept") {
				throw new Error("User stopped script.");
			}
			layerToAddTo = doc.getTimeline().findLayerIndex(promptPanel.panel_layerName);
			curLayer = promptPanel.panel_layerName;
		}
		doc.getTimeline().setSelectedLayers(layerToAddTo * 1);
		fl.getDocumentDOM().getTimeline().layers[doc.getTimeline().getSelectedLayers() * 1].locked = false;
		doc.importFile(linePath);
		var lineName = linePath.substring(linePath.lastIndexOf("/") + 1);
		lineName = lineName.replace("%20", " ");
		prevVoiceLine = lineName;
		extendVoiceLine(lineName);
		//count++;
	}
	doc.getTimeline().setSelectedLayers(doc.getTimeline().findLayerIndex("TEXT") * 1);
	doc.getTimeline().currentFrame = doc.getTimeline().layers[doc.getTimeline().currentLayer].frames[doc.getTimeline().currentFrame].startFrame + doc.getTimeline().layers[doc.getTimeline().currentLayer].frames[doc.getTimeline().currentFrame].duration;
}
