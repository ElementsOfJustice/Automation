/******************************************************************************
MASS REPOSITIONER
Description: 
******************************************************************************/

// create some variables
// set scriptPath to "/path/../massRepositioner.jsfl"
var scriptPath = fl.scriptURI;
// set dirURL to the path up to the last / character (i.e. just the path)
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
// Creates a GUI window in Animate using the given XML file
var guiPanel = fl.getDocumentDOM().xmlPanel(dirURL+"/massRepositioner.xml");

// get the doc object and data inside
var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = timeline.getSelectedLayers();
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
var n = frameArray.length;

if(guiPanel.dismiss == "accept") {
	// 
	var xPos = guiPanel.panel_X;
	var yPos = guiPanel.panel_Y;

	// store indexes of user selected frames
	var frameSelection = timeline.getSelectedFrames();
	var selLayerIndex = frameSelection[0];
	var startFrame = frameSelection[1]+1;
	var endFrame = frameSelection[2];

	// for every item in frameArray...
	for (i = 0; i < n; i++) {
		if ((i==frameArray[i].startFrame) && (frameArray[i].isEmpty == false)) {
			var elList = frameArray[i].elements
				for (var j = 0; j < elList.length; j++) {
					var el = elList[j]
						el.setTransformationPoint({x:0, y:0});
						var xPosVal = parseFloat(xPos)
						var yPosVal = parseFloat(yPos)
						el.transformX = xPosVal+0.1
						el.transformY = yPosVal+0.1
				}
			}	
		}

}