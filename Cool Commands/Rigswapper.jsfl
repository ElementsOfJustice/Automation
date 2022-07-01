/******************************************************************************
RIGSWAPPER
Description: 
******************************************************************************/

var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
var guiPanel = fl.getDocumentDOM().xmlPanel(dirURL + "/RigSwapper.xml");

/*
Function: setup
Variables: none
Description: unlock selected layer so elements can be selected
*/
function setup() {
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; // unlock layer
}

if (guiPanel.dismiss == "accept") {
    setup();
    var doc = fl.getDocumentDOM();
    var timeline = doc.getTimeline();
    var layer = timeline.getSelectedLayers();
    var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

    var rigToSwap = guiPanel.panel_rigName + "►";
    var rigsFolderPath = "RIGS/VECTOR CHARACTERS";
    var rigFolderPath = rigsFolderPath + "/" + guiPanel.panel_folderName + "►";
    var newRigPath = fl.browseForFileURL("select");

    var mat = timeline.layers[timeline.currentLayer].frames[timeline.currentFrame].elements[0].matrix;

    doc.library.moveToFolder(rigsFolderPath, rigFolderPath + "/" + rigToSwap + "Scaled");
    doc.library.deleteItem(rigFolderPath);
    fl.copyLibraryItem(newRigPath, rigFolderPath + "/" + rigToSwap + "All");
    doc.clipPaste(false);
    doc.library.moveToFolder(rigFolderPath, rigsFolderPath + "/" + rigToSwap + "Scaled");


    timeline.layers[timeline.currentLayer].frames[timeline.currentFrame].elements[0].matrix = mat;

    fl.trace("Finished. New rig is on the timeline.");
}