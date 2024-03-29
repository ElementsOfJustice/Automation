﻿/******************************************************************************
sel_c3_LipSyncSingle.jsfl
Description: Performs Case 3 Lipsyncing on a selection.
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

fl.runScript(dirURL + "/dev_c3_LipSync_core.jsfl", "runLipsyncingSingle");
soundAlert();