/******************************************************************************
WRITE FRAME DATA TO TIMELINE
Description: 
******************************************************************************/

fl.showIdleMessage(false);

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = selectedFrames[0];
var firstFrame = selectedFrames[1];
var lastFrame = selectedFrames[2];

/*
Function: setup
Variables: None
Description: If the user makes a frame selection from right to left instead of 
left to right, the starting frame will be the last frame and the ending frame
will be the first. We need to ensure things are consistent.
*/
function setup() {
    if (firstFrame > lastFrame) { // if selection is backwards, fix it
        var temp = lastFrame;
        lastFrame = firstFrame;
        firstFrame = temp;
    }
    fl.getDocumentDOM().getTimeline().layers[layer].locked = false; // unlock layer
}

var startTime = new Date();
//MAIN
setup();
var file = fl.browseForFileURL("open", "Open CFG File...", "CFG File (*.cfg)", "cfg");
fl.runScript(file); // read data
fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
for (var frame in data) {
    if (parseInt(frame) != 0) { // don't make a keyframe if frame == 0
        fl.getDocumentDOM().getTimeline().convertToKeyframes(parseInt(frame) + firstFrame);
    }
}
fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
for (var frame in data) {
    frameArray[parseInt(frame) + firstFrame].elements[0].firstFrame = parseInt(data[frame][0]);
    frameArray[parseInt(frame) + firstFrame].elements[0].lastFrame = parseInt(data[frame][1]);
    frameArray[parseInt(frame) + firstFrame].elements[0].loop = (data[frame][2]);
}

var endTime = new Date();
var timeDiff = endTime - startTime;
timeDiff /= 1000;
var seconds = Math.round(timeDiff);

if (timeDiff < 60) {
    fl.trace("Time Elapsed: " + seconds + " seconds.");
}

if (timeDiff > 60) {
    var minutes = Math.floor(timeDiff / 60);
    var seconds = timeDiff - minutes * 60;
    fl.trace("Time Elapsed: " + minutes + " minutes and " + seconds + " seconds");
}