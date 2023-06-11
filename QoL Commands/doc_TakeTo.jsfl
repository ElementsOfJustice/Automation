var xmlString1 = '<dialog title="Calgon, Take Me Away!" buttons="accept, cancel"><radiogroup id="search_method" ><radio label="Consider time only within this document." value="panel_inside" /><radio label="Consider time across all active documents." value="panel_outside" /></radiogroup></dialog>';
var guiPanel1 = fl.xmlPanelFromString(xmlString1);

var xmlString2 = '<dialog title="Calgon, Take Me Away!" buttons="accept, cancel"><label value="mm : ss" control="iName" /><hbox><textbox id="mm" size="3" value="00" /><textbox id="ss" size="3" value="00" /></hbox><spacer/></dialog>';
var guiPanel2 = fl.xmlPanelFromString(xmlString2);

if ((guiPanel1.dismiss == "accept") && (guiPanel2.dismiss == "accept")) {
	var mm = parseInt(guiPanel2.mm);
	var ss = parseInt(guiPanel2.ss);

	//Only a moron would want to run this between documents with different framerates.
	var totalSeconds = (mm * 60) + ss;
	var desiredFrame = parseInt(totalSeconds * fl.getDocumentDOM().frameRate) - 1;

	//Intra-document method:
	if (guiPanel1.search_method == "panel_inside") {
		var sceneLengths = [];
		var totalFrames = 0;

		for (var i = 0; i < fl.getDocumentDOM().timelines.length; i++) {
			if (fl.getDocumentDOM().timelines[i].libraryItem != null) {
				continue;
			}
			var sceneFrames = fl.getDocumentDOM().timelines[i].frameCount;

			sceneLengths.push(sceneFrames);
			totalFrames += sceneFrames;
		}

		var currentSceneIndex = -1;
		var currentFrame = 0;

		for (var i = 0; i < sceneLengths.length; i++) {
			currentSceneIndex++;
			var sceneFrames = sceneLengths[i];
			currentFrame += sceneFrames;

			if (currentFrame >= desiredFrame) {
				currentFrame -= sceneFrames;
				currentFrame = desiredFrame - currentFrame;
				break;
			}
		}

		fl.getDocumentDOM().currentTimeline = currentSceneIndex;
		fl.getDocumentDOM().getTimeline().currentFrame = currentFrame;

	} else {
		var activeDocuments = fl.documents;
		var sceneLengths = [];
		var totalFrames = 0;
		
		for (var docIndex = 0; docIndex < activeDocuments.length; docIndex++) {
			var timelines = activeDocuments[docIndex].timelines;
		
			for (var i = 0; i < timelines.length; i++) {
				if (timelines[i].libraryItem != null) {
					continue;
				}
		
				var sceneFrames = timelines[i].frameCount;
				sceneLengths.push([sceneFrames, docIndex]);
				totalFrames += sceneFrames;
			}
		}
		
		//alert(sceneLengths);
		
		var currentSceneIndex = -1;
		var currentFrame = 0;
		
		for (var i = 0; i < sceneLengths.length; i++) {
			currentSceneIndex++;
			var sceneFrames = sceneLengths[i][0];
			fl.openDocument(activeDocuments[sceneLengths[i][1]].pathURI);
		
			currentFrame += sceneFrames;
		
			if (currentFrame >= desiredFrame) {
				currentFrame -= sceneFrames;
				currentFrame = desiredFrame - currentFrame;
				break;
			}
		}
		
		fl.getDocumentDOM().currentTimeline = currentSceneIndex;
		fl.getDocumentDOM().getTimeline().currentFrame = currentFrame;
	}
};