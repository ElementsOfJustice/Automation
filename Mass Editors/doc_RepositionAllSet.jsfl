/******************************************************************************
REPOSITION ALL
Description: 

******************************************************************************/

/*
Function: resetSelection
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: sets selection to the desired layer and frame
*/
function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}

var selLayer = fl.getDocumentDOM().getTimeline().currentLayer;
var deltaX = parseFloat(prompt("x to set to")), deltaY = parseFloat(prompt("y to set to"));
if (deltaX !== undefined && deltaY !== undefined && !isNaN(deltaX) && !isNaN(deltaY)) {
    resetSelection(selLayer, 0);
    var curFrame = 0, numFrames = fl.getDocumentDOM().getTimeline().getLayerProperty("frames").length;
    while (curFrame < numFrames - 1) {
        if (fl.getDocumentDOM().getTimeline().layers[selLayer].frames[curFrame].elements.length > 0) {
            fl.getDocumentDOM().getTimeline().layers[selLayer].frames[curFrame].elements[0].x = deltaX;
            fl.getDocumentDOM().getTimeline().layers[selLayer].frames[curFrame].elements[0].y = deltaY;
        }
        curFrame += fl.getDocumentDOM().getTimeline().layers[selLayer].frames[curFrame].duration;
    }
}