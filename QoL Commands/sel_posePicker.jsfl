var xmlStr1 = ' <dialog title="Posepicker" buttons="accept, cancel"> <label value="Pick Pose" control="iName"/> <menulist id = "poseList"> <menupop>'
var xmlStr2 = '	</menupop> </menulist> </dialog>'

var layerNum = fl.getDocumentDOM().getTimeline().currentLayer;
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var totalSelStr = '';

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
				focus.firstFrame = guiPanel.poseList
			}
		}
	}
}