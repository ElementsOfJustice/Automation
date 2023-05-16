var chunk = 3; // Number of voice lines per scene

function goTo(inputString) {
	var lineIndex = parseInt(inputString.substring(3, 6), 10);
	var sceneIndex = Math.ceil(lineIndex / chunk);

	// Go to the target scene
	fl.getDocumentDOM().editScene(sceneIndex - 1);

	var timeline = fl.getDocumentDOM().getTimeline();
	var textLayer = timeline.layers[timeline.findLayerIndex("TEXT")]; // Get the "TEXT" layer
	var keyframes = textLayer.frames; // Get all the keyframes on the textLayer

	// Iterate over the keyframes on the textLayer
	for (var i = 0; i < keyframes.length; i++) {
		var frame = keyframes[i];

		// Check if the frame name matches the input frame label
		if (frame.name === inputString) {
			// Go to the target frame within the scene
			timeline.currentFrame = i;
			break;
		}

		// Calculate the index of the next keyframe
		var nextFrameIndex = i + frame.duration;

		// Skip to the next keyframe
		i = nextFrameIndex - 1;
	}
}

//goTo("s1_001_xxx"); // Example usage.
for (var i = 1; i <= 9; i++) {
	var instance = "s1_" + padNumber(i, 3) + "_xxx";
	goTo(instance);
	alert("hi")
}

function padNumber(number, length) {
	var str = number.toString();
	while (str.length < length) {
		str = "0" + str;
	}
	return str;
}