var xmlString = '<dialog title="Test" buttons="accept, cancel"><label id="boxLabel1" value="mm : ss" control="iName" /><hbox><textbox id="mm" size="3" value="00" /><textbox id="ss" size="3" value="00" /></hbox><spacer/></dialog>';
var guiPanel = fl.xmlPanelFromString(xmlString);

if (guiPanel.dismiss == "accept") {
	var mm = parseInt(guiPanel.mm);
	var ss = parseInt(guiPanel.ss);

	var totalSeconds = (mm * 60) + ss;
	var desiredFrame = parseInt(totalSeconds * fl.getDocumentDOM().frameRate) - 1;

	var sceneLengths = [];
	var totalFrames = 0;

	for (var i = 0; i < fl.getDocumentDOM().timelines.length; i++) {
		if (fl.getDocumentDOM().timelines[i].libraryItem == null) {
			var sceneFrames = fl.getDocumentDOM().timelines[i].frameCount;

			sceneLengths.push(sceneFrames);
			totalFrames += sceneFrames;
		}
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
};