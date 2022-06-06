/******************************************************************************
WRITE FRAME DATA TO TIMELINE
Description: 
******************************************************************************/

fl.showIdleMessage(false);

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = selectedFrames[0];
var firstFrame = selectedFrames[1];
var lastFrame = selectedFrames[2];
if(firstFrame > lastFrame) {
    var temp = firstFrame;
    firstFrame = lastFrame;
    lastFrame = temp;
}

var startTime = new Date();
//MAIN

var file = fl.browseForFileURL("open", "Open CFG File...", "CFG File (*.cfg)", "cfg");
fl.runScript(file); // read data
fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
for(var frame in data) {
    if(parseInt(frame) != 0) { // don't make a keyframe if frame == 0
        fl.getDocumentDOM().getTimeline().convertToKeyframes(parseInt(frame));
    }
}   
fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
for(var frame in data) {
    frameArray[parseInt(frame)].elements[0].firstFrame = parseInt(data[frame][0]);
    frameArray[parseInt(frame)].elements[0].lastFrame = parseInt(data[frame][1]);
    frameArray[parseInt(frame)].elements[0].loop = (data[frame][2]);
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