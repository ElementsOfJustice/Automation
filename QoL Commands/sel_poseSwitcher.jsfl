/******************************************************************************
POSE SHIFTER
Description: Intelligently shifts frames with preservation for lipsync data.
******************************************************************************/

var scriptPath = fl.scriptURI;
var xmlStr1 = ' <dialog title="Pose Shifter" buttons="accept, cancel"> <label value="Pick Pose" control="iName"/> <menulist id = "poseList"> <menupop>'
var xmlStr2 = '	</menupop> </menulist> </dialog>'
var poseData = [];
var totalSelStr = '';
var delta = 0;

// store document object and other objects in the doc
var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layerNum = fl.getDocumentDOM().getTimeline().currentLayer;
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var layer = timeline.getSelectedLayers();

// store indexes of frames selected by the user
var frameSelection = timeline.getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];

	var elList = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements
		for (var j = elList.length; j > 0; j--) {
			var el = elList[j - 1]
				var ffIndex = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements[0].firstFrame + 1
				var itemIndex = doc.library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements[0].libraryItem.name)
			
				var objTl = doc.library.items[itemIndex].timeline.layers[0]

				var poseName = objTl.frames[ffIndex-1].name;
			
				for (var k = 0; k < objTl.frameCount; k++) {
					if ((objTl.frames[k].labelType == "name") && (k == objTl.frames[k].startFrame)) {
						//fl.trace(objTl.frames[k].name + " " + k)
						//fl.trace(ffIndex + " " + k+1);
						if (ffIndex != k+1) {
						
						var selStr = '<menuitem label="' + objTl.frames[k].name + '" selected="false" value="' + k + '"/>';
						totalSelStr = totalSelStr.concat(selStr);
						} else {
						var selStr = '<menuitem label="' + objTl.frames[k].name + '" selected="true" value="' + k + '"/>';
						totalSelStr = totalSelStr.concat(selStr);
						}
						
					}
				}
				
				var guiPanel = fl.xmlPanelFromString(xmlStr1 + totalSelStr + xmlStr2);
				
				if(guiPanel.dismiss == "accept") {
					delta = ( parseInt(guiPanel.poseList) - fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements[0].firstFrame);
					fl.trace(delta)
					fl.trace(fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements[0].firstFrame)
				}
	}
	
/*
Function: setup
Variables: None
Description: If the user makes a frame selection from right to left instead of 
left to right, the starting frame will be the last frame and the ending frame
will be the first. We need to ensure things are consistent.
*/
function setup() {
    if (startingFrame > endFrame) { // if selection is backwards, fix it
        var temp = endFrame;
        endFrame = startingFrame;
        startingFrame = temp;
    }
    fl.getDocumentDOM().getTimeline().layers[selLayerIndex * 1].locked = false; // unlock layer
}

setup();

for(var i = startingFrame; i < endFrame - 1; i++) {
	//fl.trace(delta);
	//fl.trace(i);
	if(fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame == i) {
		// Move the frame (the most important line of the script)
		fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].firstFrame += delta;
		// set the last frame property to what it already is plus the frames to shift by
		if(fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].lastFrame != undefined) { // only newer versions of Animate have the lastFrame property
			fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].lastFrame += delta;
		}
	}
}