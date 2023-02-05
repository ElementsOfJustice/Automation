/******************************************************************************
RIGSWAPPER
Description: Swap a current rig with a new rig as specified by the user
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
    setup(); // unlock layer
    var rigToSwap = guiPanel.panel_rigName + "►"; // play sign in the name is standard
    var rigsFolderPath = "RIGS/VECTOR CHARACTERS"; // the path of all rigs
    var rigFolderPath = rigsFolderPath + "/" + guiPanel.panel_folderName + "►"; // the path of the specific rig we're using
    var newRigPath = fl.browseForFileURL("select"); // opens file select dialog box

    // save the matrix of 
    var mat = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].matrix;

    fl.getDocumentDOM().library.moveToFolder(rigsFolderPath, rigFolderPath + "/" + rigToSwap + "Scaled"); // ??
    fl.getDocumentDOM().library.deleteItem(rigFolderPath); // deletes the specified item from the Library panel
    fl.copyLibraryItem(newRigPath, rigFolderPath + "/" + rigToSwap + "All"); // ?? copy the rig ... ... ??
    fl.getDocumentDOM().clipPaste(false); // ?? perform a paste operation to the center of the document ??
    fl.getDocumentDOM().library.moveToFolder(rigFolderPath, rigsFolderPath + "/" + rigToSwap + "Scaled");

    // set the matrix to what it was before
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].matrix = mat;
    
    fl.trace("Finished. New rig is on the timeline."); // output to console
}