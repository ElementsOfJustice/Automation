/******************************************************************************
WRITE FRAME DATA TO FILE
Description: 
******************************************************************************/

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var layer = selectedFrames[0];
var firstFrame = selectedFrames[1];
var lastFrame = selectedFrames[2];
function setup() {
    if (firstFrame > endFrame) { // if selection is backwards, fix it
        var temp = lastFrame;
        lastFrame = firstFrame;
        firstFrame = temp;
    }
    fl.getDocumentDOM().getTimeline().layers[layer].locked = false; // unlock layer
}
setup();
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
var file = fl.browseForFileURL("save", "Save CFG file as...", "CFG File (*.cfg)", "cfg"); // get file to save to
var toWrite = "var data = {\n";
for (var i = firstFrame; i < lastFrame; i += frameArray[i].duration) { // iterate over all keyframes
    toWrite += (i - firstFrame) + " : [";
    toWrite += frameArray[i].elements[0].firstFrame + ", ";
    toWrite += frameArray[i].elements[0].lastFrame + ", ";
    toWrite += "\"" + frameArray[i].elements[0].loop + "\"],\n";
}
toWrite = toWrite.substring(0, toWrite.length - 2); //remove last comma
toWrite += "\n};"
FLfile.write(file, toWrite);