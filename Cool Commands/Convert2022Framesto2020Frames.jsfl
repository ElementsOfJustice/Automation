/******************************************************************************
CONVERT 2022 FRAMES TO 2020 FRAMES
Description: Animate 2020 doesn't have the Last Frame option for looping, so this converts frames that utilize the Last Frame into 2020-friendly frames that don't.
******************************************************************************/

var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startFrame = frameSelection[1];
var endFrame = frameSelection[2];

function setup() {
    if (startFrame > endFrame) { // if selection is backwards, fix it
        var temp = endFrame;
        endFrame = startFrame;
        startFrame = temp;
    }
    fl.getDocumentDOM().getTimeline().layers[selLayerIndex * 1].locked = false; // unlock layer
}
setup();

startFrame = fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[startFrame].startFrame;
var timeline = fl.getDocumentDOM().getTimeline();
for (var i = startFrame; i < endFrame; i += timeline.layers[selLayerIndex].frames[i].duration) {
    fl.getDocumentDOM().getTimeline().currentFrame = i;
    // select the frame at the loop's index
    fl.getDocumentDOM().getTimeline().setSelectedFrames(i, i + 1);
    // case 1: play once
    if (fl.getDocumentDOM().getElementProperty("loop") == "play once" && fl.getDocumentDOM().getElementProperty("lastFrame") != -1) {
        var diff = 1 + fl.getDocumentDOM().getElementProperty("lastFrame") - fl.getDocumentDOM().getElementProperty("firstFrame");
        if (diff < fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].duration) { // if the duration of a keyframe is longer than the duration of a loop...
            fl.getDocumentDOM().getTimeline().currentFrame += diff;
            fl.getDocumentDOM().getTimeline().insertKeyframe();
            // select current frame
            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
            fl.getDocumentDOM().setElementProperty("loop", "single frame");
        }
    }
    // case 2: loop
    else if (fl.getDocumentDOM().getElementProperty("loop") == "loop" && fl.getDocumentDOM().getElementProperty("lastFrame") != -1) {
        var dur = fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].duration;
        var diff = 1 + fl.getDocumentDOM().getElementProperty("lastFrame") - fl.getDocumentDOM().getElementProperty("firstFrame");
        var loops = Math.floor(dur / diff);
        var firstFrame = fl.getDocumentDOM().getElementProperty("firstFrame");
        var count = 0;
        while (loops > 0 && count < dur) {
            fl.getDocumentDOM().getTimeline().currentFrame += diff;
            fl.getDocumentDOM().getTimeline().insertKeyframe();
            // select current frame
            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
            fl.getDocumentDOM().setElementProperty("firstFrame", firstFrame);
            loops--;
            count++;
        }
    }
    // case 3: play once reverse
    else if (fl.getDocumentDOM().getElementProperty("loop") == "play once reverse") {
        var dur = fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].duration;
        var diff = fl.getDocumentDOM().getElementProperty("firstFrame") - fl.getDocumentDOM().getElementProperty("lastFrame");
        fl.getDocumentDOM().setElementProperty("loop", "single frame");
        for (var j = 0; j < diff && j < (dur - 1); j++) {
            fl.getDocumentDOM().getTimeline().currentFrame += 1;
            fl.getDocumentDOM().getTimeline().insertKeyframe();
            // select current frame
            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
            fl.getDocumentDOM().setElementProperty("loop", "single frame");
            fl.getDocumentDOM().setElementProperty("firstFrame", fl.getDocumentDOM().getElementProperty("firstFrame") - 1);
        }
    }
}