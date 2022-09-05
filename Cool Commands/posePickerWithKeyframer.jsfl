var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

var xmlStr1 = ' <dialog title="Posepicker" buttons="accept, cancel"> <label value="Pick Pose" control="iName"/> <menulist id = "poseList"> <menupop>'
var xmlStr2 = '	</menupop> </menulist> </dialog>'

var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layerNum = fl.getDocumentDOM().getTimeline().currentLayer;
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var poseData = [];
var totalSelStr = '';

	var elList = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements
		for (var j = elList.length; j > 0; j--) {
			var el = elList[j - 1]
				var ffIndex = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements[0].firstFrame + 1
				var itemIndex = doc.library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements[0].libraryItem.name)
			
				var objTl = doc.library.items[itemIndex].timeline.layers[0]

				var poseName = objTl.frames[ffIndex-1].name;
			
				fl.getDocumentDOM().getTimeline().convertToKeyframes(curFrame);
			
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
					fl.getDocumentDOM().getTimeline().layers[layerNum].frames[curFrame].elements[0].firstFrame = guiPanel.poseList
				}
					
	}