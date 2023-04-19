var xmlStr1 = ' <dialog title="Mouth Shape Switcher" buttons="accept, cancel"> <label value="Pick Mouth Shape" control="iName"/> <menulist id = "poseList"> <menupop>'
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
Function: resetSelection
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: sets selection to the desired layer and frame
*/
function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}

/*
Function: selectOrMakeKeyframe
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: selects the keyframe if there's one there, or makes one if there isn't
*/
function selectOrMakeKeyframe(layer, frame) {
    resetSelection(layer, frame); // select layer and frame
    // if the current frame isn't the first frame in a frame sequence, make a note of that
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; 
    // if it isn't...
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // keyframe for new position
        resetSelection(layer, frame); // select layer and frame
    }
}

function getKeys(input) { // get array of start times from the words or phonemes
	var arr = [];
	for (var i in input) {
		arr.push(i);
	}
	return arr;
}

OFFSET_MAP = {
	"No Talking": 0,
	"Closed Mouth No Teeth": 0,
	"Open Mouth Big": 6,
	"Open Mouth Teeth": 6,
	"Open Mouth Wide": 16,
	"Open Mouth Round": 16,
	"Closed Mouth Teeth": 1,
	"Ajar Mouth Tongue": 26,
	"Ajar Mouth Teeth Together": 21,
	"Ajar Mouth Teeth Seperate": 3
}

LENGTH_MAP = {
	"No Talking": 1,
	"Closed Mouth No Teeth": 1,
	"Open Mouth Big": 3,
	"Open Mouth Teeth": 3,
	"Open Mouth Wide": 3,
	"Open Mouth Round": 3,
	"Closed Mouth Teeth": 1,
	"Ajar Mouth Tongue": 1,
	"Ajar Mouth Teeth Together": 1,
	"Ajar Mouth Teeth Seperate": 1
}

MOUTH_SHAPE_MAP = {
	"Closed Mouth" : "No Talking",
	"F": "Closed Mouth Teeth",
	"A": "Open Mouth Big",
	"IH": "Open Mouth Teeth",
	"O": "Open Mouth Round",
	"CH": "Ajar Mouth Teeth Together",
	"TH": "Ajar Mouth Tongue"
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

/*
Function: roundDownToHundred
Variables: num
Description: Rounds down to the next hundred.
*/
function roundDownToHundred(num) {
	return Math.floor(num/100) * 100;
}

setup();

var focus = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[startingFrame].elements[0];

if (focus !== undefined) {
	if (focus.elementType == "instance") {
		var ffIndex = focus.firstFrame + 1;
		var mapKeys = getKeys(MOUTH_SHAPE_MAP);
		for (var k = 0; k < mapKeys.length; k++) {
				if (focus.firstFrame == OFFSET_MAP[MOUTH_SHAPE_MAP[mapKeys[k]]]) {
					var selStr = '<menuitem label="' + mapKeys[k] + '" selected="false" value="' + mapKeys[k] + '"/>';
					totalSelStr = totalSelStr.concat(selStr);
				} else {
					var selStr = '<menuitem label="' + mapKeys[k] + '" selected="true" value="' + mapKeys[k] + '"/>';
					totalSelStr = totalSelStr.concat(selStr);
			}
		}

		var guiPanel = fl.xmlPanelFromString(xmlStr1 + totalSelStr + xmlStr2);

		if (guiPanel.dismiss == "accept") {
			delta = parseInt(OFFSET_MAP[MOUTH_SHAPE_MAP[guiPanel.poseList]]);
		}
		selectOrMakeKeyframe(layerNum, startingFrame);
		var newFirstFrame = roundDownToHundred(fl.getDocumentDOM().getElementProperty("firstFrame") + 1) + delta - 1;
		fl.getDocumentDOM().setElementProperty("firstFrame", newFirstFrame);
		if(focus.lastFrame !== undefined) {
			fl.getDocumentDOM().setElementProperty("lastFrame", fl.getDocumentDOM().getElementProperty("firstFrame") + LENGTH_MAP[MOUTH_SHAPE_MAP[guiPanel.poseList]] - 1);
			fl.getDocumentDOM().setElementProperty("loop", "play once");
		}
	}
}

fl.getDocumentDOM().getTimeline().setSelectedFrames(frameSelection);