CONTENT_FRAME_BEGIN = 39;
CONTENT_FRAME_END = 44;
CONTENT_SCENE = 0;

function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}
// TODO: get into the toolbox FLA, copy appropriate frames, and then paste and overwrite at the selected frame.
var toolboxDocIndex = -1;
for(var i = 0; i < fl.documents.length; i++) {
    if(fl.documents[i].name == "General Toolbox.fla") {
        toolboxDocIndex = i;
    }
}
if(toolboxDocIndex == -1) {
    throw new Error("Toolbox FLA not open OR toolbox FLA is not called \"General Toolbox.fla\"");
}
// Everything is valid. Let's go
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var curLayer = fl.getDocumentDOM().getTimeline().currentLayer;
fl.documents[toolboxDocIndex].editScene(CONTENT_SCENE); 
fl.documents[toolboxDocIndex].getTimeline().setSelectedLayers(fl.documents[toolboxDocIndex].getTimeline().findLayerIndex("CONTENT") * 1);
fl.documents[toolboxDocIndex].getTimeline().copyFrames(CONTENT_FRAME_BEGIN, CONTENT_FRAME_END + 1); 
resetSelection(curLayer, curFrame);
fl.getDocumentDOM().getTimeline().pasteFrames(curFrame, curFrame + (CONTENT_FRAME_END - CONTENT_FRAME_BEGIN) + 1);