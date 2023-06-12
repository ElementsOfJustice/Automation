// TODO: assuming a rectangular selection, copy selection and move it to the frame after the start of the contiguous keyframe sequence
var selFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
//get the start of the continguous keyframe section, assume it's on the first layer
var lowestFrame = selFrames[1];
while(lowestFrame > 0 && !fl.getDocumentDOM().getTimeline().layers[selFrames[0]].frames[lowestFrame].isEmpty ) {
    lowestFrame = fl.getDocumentDOM().getTimeline().layers[selFrames[0]].frames[lowestFrame].startFrame - 1;
}
if(lowestFrame < 0) lowestFrame = 0;
// if(!fl.getDocumentDOM().getTimeline().layers[selFrames[0]].frames[lowestFrame].isEmpty) {
//     throw new Error("Unable to find empty keyframe before selection.");
// }
fl.getDocumentDOM().getTimeline().copyFrames();
fl.getDocumentDOM().getTimeline().clearKeyframes();
for(var i = 0; i < selFrames.length / 3; i++) {
    var diff = selFrames[3*i+2] - selFrames[3*i+1];
    selFrames[3*i + 1] = lowestFrame+2;
    selFrames[3*i+2] = lowestFrame+2+diff;
}
fl.getDocumentDOM().getTimeline().setSelectedFrames(selFrames);
fl.getDocumentDOM().getTimeline().pasteFrames();
