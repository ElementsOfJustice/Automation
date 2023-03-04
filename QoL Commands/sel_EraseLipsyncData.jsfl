/******************************************************************************
ERASE LIPSYNC DATA
Description: 

******************************************************************************/

/*
Function: findFirstFrameWithSymbol
Variables: 
    layerIndex	What layer are you searching on
Description: Return the frame number that the first graphic symbol occurs on.
*/

findFirstFrameWithSymbol = function (layerIndex) {
	var frameArray = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames;

	for (var i = 0; i < frameArray.length; i++) {
		if (frameArray[i].elements.length > 0 && frameArray[i].elements[0].elementType == "instance") {
			return i;
		}
	}

	return -1;
}

/*
Function: checkRange
Variables: 
    arr		xSheetCache
	num1	First Frame #1
	num2	First Frame #2
Description: Returns true or false if two frame's firstFrames share the same pose.
*/

function checkRange(arr, num1, num2) {
  var rangeStart, rangeEnd;
  for (var i = 0; i < arr.length; i++) {
    if (num1 >= arr[i] && num1 <= arr[i+1]) {
      rangeStart = arr[i];
      rangeEnd = arr[i+1];
    }
  }
  if (num2 >= rangeStart && num2 <= rangeEnd) {
    return true;
  } else {
    return false;
  }
}

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layerInfo = [];

fl.showIdleMessage(false); 

for (var i = 0; i < selectedFrames.length / 3; i++) {
	layerInfo.push([selectedFrames[3 * i], selectedFrames[3 * i + 1], selectedFrames[3 * i + 2]]);
}

for (var i = 0; i < layerInfo.length; i++) {	
	var curLayer = layerInfo[i][0];
	var seekSymbol = findFirstFrameWithSymbol(curLayer);
	var itemIndex = fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[curLayer].frames[seekSymbol].elements[0].libraryItem.name);
	var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];
	
	fl.getDocumentDOM().getTimeline().layers[curLayer].visible = false;

	var xSheetCache = [];

	for (var k = 0; k < objTl.frameCount; k++) {
		if ((objTl.frames[k].labelType == "name") && (k == objTl.frames[k].startFrame)) {
			xSheetCache.push(k);
		}
	}

	for (var k = layerInfo[i][1]; k < layerInfo[i][2]; k++) {
				
		if ((fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k].isEmpty) || (k == layerInfo[i][1])) {
			fl.getDocumentDOM().getTimeline().setSelectedFrames(k, k, false);
		}
	
		if (k != 0) {
			if ((fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k - 1].isEmpty) && (!fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k].isEmpty)) {
				fl.getDocumentDOM().getTimeline().setSelectedFrames(k, k, false);
			}
		}

		if ((!fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k].isEmpty) && (!fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k + 1].isEmpty)) {
					
			// If the current frame has content and the next frame has content too, check if the poses are the same. If not, clear the keyframe.
			if (!checkRange(xSheetCache, fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k].elements[0].firstFrame, fl.getDocumentDOM().getTimeline().layers[curLayer].frames[k + 1].elements[0].firstFrame)) {
				// Clear the keyframe
				fl.getDocumentDOM().getTimeline().setSelectedFrames(k + 1, k + 1, false);
			}
		
		}

	}

	fl.getDocumentDOM().getTimeline().clearKeyframes();
	fl.getDocumentDOM().getTimeline().layers[curLayer].visible = true;

}

fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames);