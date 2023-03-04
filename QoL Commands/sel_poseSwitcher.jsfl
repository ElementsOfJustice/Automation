var xmlStr1 = ' <dialog title="Pose Switcher" buttons="accept, cancel"> <label value="Pick Pose" control="iName"/> <menulist id = "poseList"> <menupop>'
var xmlStr2 = '	</menupop> </menulist> </dialog>'

fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().getSelectedFrames()[1];

var layerNum = fl.getDocumentDOM().getTimeline().currentLayer;
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var totalSelStr = '';

var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];

var delta = 0;

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

var focus = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements[0]

if (focus !== undefined) {
	if (focus.elementType == "instance") {
		var ffIndex = focus.firstFrame + 1
		var itemIndex = fl.getDocumentDOM().library.findItemIndex(focus.libraryItem.name)
		if (fl.getDocumentDOM().library.items[itemIndex].timeline !== undefined) {
			var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0]
			var poseName = objTl.frames[ffIndex - 1].name;

			if (curFrame != fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].startFrame) {
				fl.getDocumentDOM().getTimeline().convertToKeyframes(curFrame);
			}

			for (var k = 0; k < objTl.frameCount; k++) {
				if ((objTl.frames[k].labelType == "name") && (k == objTl.frames[k].startFrame)) {
					if (ffIndex != k + 1) {
						var selStr = '<menuitem label="' + objTl.frames[k].name + '" selected="false" value="' + k + '"/>';
						totalSelStr = totalSelStr.concat(selStr);
					} else {
						var selStr = '<menuitem label="' + objTl.frames[k].name + '" selected="true" value="' + k + '"/>';
						totalSelStr = totalSelStr.concat(selStr);
					}
				}
			}

			var guiPanel = fl.xmlPanelFromString(xmlStr1 + totalSelStr + xmlStr2);

			if (guiPanel.dismiss == "accept") {
				delta = (parseInt(guiPanel.poseList) - fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements[0].firstFrame);
			}
		}
	}
}

for (var i = startingFrame; i < endFrame - 1; i++) {
	//For each keyframe
	if (fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].startFrame == i) {
		// Move the frame (the most important line of the script)
		fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].elements[0].firstFrame += delta;
		// set the last frame property to what it already is plus the frames to shift by
		if (fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].elements[0].lastFrame != undefined) { // only newer versions of Animate have the lastFrame property
			fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].elements[0].lastFrame += delta;
		}
	}
}

fl.getDocumentDOM().getTimeline().setSelectedFrames(frameSelection);