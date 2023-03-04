var timeline = fl.getDocumentDOM().getTimeline();
var currentLayer = timeline.layers[timeline.currentLayer];
var currentFrameIndex = timeline.currentFrame;

// Find the start frame by searching backwards until an empty keyframe is found
var startFrameIndex = currentFrameIndex;
while (startFrameIndex >= 0) {
    if (currentLayer.frames[startFrameIndex].elements.length === 0) {
        break;
    }
    startFrameIndex--;
}

// Find the end frame by searching forwards until an empty keyframe is found
var endFrameIndex = currentFrameIndex;
while (endFrameIndex <= currentLayer.frames.length - 1) {
    if (currentLayer.frames[endFrameIndex].elements.length === 0) {
        break;
    }
    endFrameIndex++;
}

// Set the selected frames to the full keyframe sequence
timeline.setSelectedFrames(startFrameIndex + 1, endFrameIndex);

// Set the playhead to the start frame
timeline.currentFrame = startFrameIndex + 1;