/******************************************************************************
doc_LineAdder.jsfl
Description: Automatically adds all lines and sorts them into a scene.
******************************************************************************/

/*
Function: soundAlert

Variables: 
    message string

Description: Plays the BetterAnimate notification sound, followed
by a message. Use this to notify the user that your clunky ass code
has finally finished executing.
*/
function soundAlert(message) {
	fl.runScript(cLib, "soundAlert", message);
}

var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
var cLib = fl.configURI + "Commands/cLib.jsfl";

var cfgFolderPath = fl.browseForFolderURL("Select the folder containing ALL voice lines for this scene.");

fl.runScript(dirURL + "/dev_LineAdder_core.jsfl", "insertLines", cfgFolderPath);
soundAlert();