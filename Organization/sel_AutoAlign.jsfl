//TODO: assuming poses of equal length and evenly spaced at 100, insert align comments to all selected layers
var selFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var poseLength = parseInt(prompt("Enter the length of each pose:"));
var firstOffset = parseInt(prompt("Enter an optional offset for the first pose:", 0))
if(poseLength !== undefined && firstOffset !== undefined) {
    var index = 1, curFrame = poseLength + firstOffset;
    while(curFrame < fl.getDocumentDOM().getTimeline().frameCount) {
        var curSel = [];
        for(var i = 0; i < selFrames.length / 3; i++) {
            if(fl.getDocumentDOM().getTimeline().layers[selFrames[3*i]].frames[curFrame].isEmpty) {
                curSel.push(selFrames[3*i]);
                curSel.push(curFrame);
                curSel.push(curFrame + 1);
            }
        }
        fl.getDocumentDOM().getTimeline().setSelectedFrames(curSel);
        fl.getDocumentDOM().getTimeline().convertToKeyframes();
        an.getDocumentDOM().getTimeline().setFrameProperty('labelType', 'comment');
        an.getDocumentDOM().getTimeline().setFrameProperty('name', '//ALIGN►'+index);
        curFrame = 100*index + poseLength - 1;
        index++;
    }
}