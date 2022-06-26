




//MAIN
try {
    fl.runScript(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/")) + "/MasterRigArray.cfg");
} catch (error) {
    alert("MasterRigArray.cfg not found! Browse for and select the MasterRigArray.cfg file.");
    var masterRasterLipsyncsPath = fl.browseForFileURL("select");
    fl.runScript(masterRasterLipsyncsPath);
}