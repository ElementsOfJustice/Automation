﻿/*				ELEMENTS OF JUSTICE CASE 3 DAEMON
											2/3/2023
							
	This implementation of code uses event listeners on startup
	to abridge the functionality of the program to facilitate
	a more fluid video editing environment. Among the accommodations
	made herein include ActionScript3 blinking controlled by frame
	names, statistics about RAM consumption and file size, and
	eventually rollback options through XFL local repositories.
	
	Connor is bae.							-Soundman
*/

//Vanity Variables
var daemonName = "Elements of Justice Case 3 daemon";
var sessionCommit = false;
var firstOpen = true;

//Don't touch these variables
var scriptsToCheck = ["Copy Font Name for ActionScript.jsfl", "Copy Motion as XML.jsfl", "Export Motion XML.jsfl", "Import Motion XML.jsfl", "names.xml"];
var blinkDuration = 6;
var bookmarkerTl = null
var bookmarkerFrame = null
var toSave = "";
var autoSave = false;
var sceneArray = [0];
var xSheetCache = {};

for (var i = 0; i < scriptsToCheck.length; i++) {
	var scriptToCheck = scriptsToCheck[i];
	var encodedScriptToCheck = scriptToCheck.replace(/ /g, "%20");
	var scriptFile = fl.configURI + "Commands/" + encodedScriptToCheck;
	if (FLfile.exists(scriptFile)) {
		FLfile.remove(scriptFile);
	}
}

/*		= = = REPEATED FUNCTIONS = = =
	Functions that are highly re-run go here.
*/

function decodeCString(input) {
    var real = "";
    for (var i = 0; i < input.length; i++) {
        var charCode = input.charCodeAt(i);
        real += String.fromCharCode(charCode & 255);
        real += String.fromCharCode(charCode >> 8);
    }
    return real;
}

/*
Function: getMemory
Description: Returns both RAM usage and file size of the currently opened document.
*/

getMemory = function () {
	var memsize = fl.getAppMemoryInfo(2);
	var disksize = FLfile.getSize(fl.getDocumentDOM().pathURI);
	fl.trace("RAM consumption is " + Math.abs(memsize) + " bytes or " + Math.abs(Math.round(memsize / 1048576)) + "MB");
	fl.trace("File size is " + disksize + " bytes or " + Math.abs(Math.round(disksize / 1048576)) + "MB");
}

/*
Function: getLinkages
Description: I still don't know if we're going to use linkages, but here's some
code that reports on your current ones! ¯\_(ツ)_/¯,
*/

getLinkages = function () {
	var library = fl.getDocumentDOM().library
	var linkageCount = 0

	for (var i = 0; i < fl.getDocumentDOM().library.items.length; i++) {
		library.selectItem(fl.getDocumentDOM().library.items[i].name)

		if (library.getItemProperty('symbolType') == "graphic") {
			if (library.getItemProperty('sourceFilePath') != null) {
				linkageCount++;
			}
		}
	}

	fl.trace('Linkages found: ' + linkageCount);
}

/*
Function: makeLossless
Description: Gets all bitmaps and sounds in the document, sets them to the least
lossy compression type. Run this on document open.
*/

makeLossless = function () {
	for (var i = 0; i < fl.getDocumentDOM().library.items.length; i++) {
		if (fl.getDocumentDOM().library.items[i].itemType == "bitmap") {
			fl.getDocumentDOM().library.items[i].compressionType = "lossless";
		}
		if (fl.getDocumentDOM().library.items[i].itemType == "sound") {
			fl.getDocumentDOM().library.items[i].compressionType = "Raw";
		}
	}
	fl.trace("Set compression of all bitmap and audio files to lossless.");
}

//			= = = LOAD FUNCTIONS = = =
/*	Functions that are run once a document is
	loaded into memory, either by opening or
	by changing focus.
*/

vanityDisplay = function () {
	fl.trace("▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀");
	fl.trace("                    _____ ____   _____  ");
	fl.trace("                   / ____|___ \\ |  __  \\");
	fl.trace("                  | |      __) || |  | |");
	fl.trace("                  | |     |__ < | |  | |");
	fl.trace("                  | |____ ___) || |__| |");
	fl.trace("                   \\_____|____/ |_____/ ");
	fl.trace("                            ______      ");
	fl.trace("                           |______|     ");
	fl.trace("");
	fl.trace("▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀");
}

docOpen = function () {

	if (fl.getDocumentDOM().description == "") {
		var description = "[No file description]";
	} else {
		var description = fl.getDocumentDOM().description;
	}

	fl.outputPanel.clear();
	vanityDisplay();
	fl.trace(daemonName + " is running.")
	fl.trace('Opened Document [' + fl.getDocumentDOM().name + "]");
	fl.trace('Description: ' + description);
	fl.getDocumentDOM().forceSimple = true;
	getMemory();
	makeLossless();

	if (firstOpen) {
		var commitXML = '<dialog title="Automatic Version History" buttons="accept, cancel"><label value="Do you want to enable version history control for this session?        "/><spacer/></dialog>';
		var commitDialogue = fl.xmlPanelFromString(commitXML);
		firstOpen = false;
	}

	if (commitDialogue.dismiss == "accept") {
		sessionCommit = true;
	}
}

docChanged = function () {

	if (fl.getDocumentDOM().description == "") {
		var description = "[No file description]";
	} else {
		var description = fl.getDocumentDOM().description;
	}

	fl.outputPanel.clear();
	vanityDisplay();
	fl.trace(daemonName + " is running.")
	fl.trace('Changed Document ' + "[" + fl.getDocumentDOM().name + "]");
	fl.trace('Description: ' + description);
	fl.getDocumentDOM().forceSimple = true;
	getMemory();
}

injectKeybinds = function (inputFile, writeFile) {
	var readPath = inputFile.replace(/ /g, "%20");
	var keyData = FLfile.read(readPath);
	var count = 0;

	for (var i = fl.configURI.length - 2; i >= 0; i--) {
		if (fl.configURI[i] === "/") {
			count++;
		}
		if (count === 6) {
			keymapPath = fl.configURI.slice(0, i + 1) + "AppData/Roaming/Adobe/Animate/2022/Shortcuts";
			break;
		}
	}

	URI = keymapPath + "/" + writeFile;

	if (FLfile.write(URI, keyData)) {
		//Successful
	} else {
		alert("Keymap injection failed.");
	}
}

//			= = = DOCUMENT SAVE = = =
/*	Version history control on document save.
 */

docSave = function () {
	if (sessionCommit && !autoSave) {

		var path = fl.getDocumentDOM().path;
		var fileType = path.substring(path.length - 3);
		var fileName = fl.getDocumentDOM().name.substring(0, fl.getDocumentDOM().name.length - 4);
		var folderPath = fl.getDocumentDOM().pathURI
		var isFirstTime = false;

		if (fileType.toUpperCase() == "FLA") {
			//File is FLA
			var driveLetter = folderPath.substring(8, 9);
			var newFileName = ("file:///" + driveLetter + '|/VHC' + '/' + fileName);

			if (!FLfile.exists(newFileName)) {
				FLfile.createFolder(newFileName)
			} else {
				FLfile.remove(newFileName + "/" + fileName + ".xfl")
			}

			toSave = newFileName;

		} else if (fileType.toUpperCase() == "XFL") {
			//File is XFL
		}
	}
}

/*			= = = MOUSE MOVE = = =
	Hyperaids quasi-multithreading, because you
	cannot save in a save event handler. So we'll
	do it after you move your mouse after saving
 */

moveMouse = function () {
	if (toSave != "") {
		autoSave = true;
		fl.getDocumentDOM().saveAsCopy(toSave + ".xfl");
		var tmpPath = FLfile.uriToPlatformPath(toSave);
		var result = "Retry";
		var retryCount = 0;
		var success = false;
		while (result.indexOf("Retry") != -1 && retryCount < 50) {
			try {
				fl.trace("Attempting to commit change to version history...");
				result = decodeCString(Sample.commitLocalChange(tmpPath));
				if (result === undefined || result == "Success.") {
					success = true;
					fl.trace("Success.");
				}
				else {
					fl.trace("Local commit failed at path " + tmpPath + ": " + decodeCString(result));
				}
			} catch (e) {
				fl.trace("CRITICAL ERROR: " + e.stack);
				fl.trace(e.name);
				fl.trace(e.message);
			}
			retryCount++;
		}
		if(!success) {
			alert("Local Commit failed after " + retryCount + " retries.");
		}
		autoSave = false;
		toSave = "";
	}
}

/*			= = = MODIFYER KEYS = = =
	Invokes automation scripts by selecting frames
	while modifier keys are depressed.
*/

frameChange = function () {
	if (fl.tools.shiftIsDown == true) {
		//fl.trace("Changed frames with shift depressed");
	}
}

/*			= = = AS3 BLINKING = = =
	Initiate the AS3 blinking pipeline.
 */

/*			= = = EXECUTION = = =
	Create event listeners here and run 
	whatever else you want here as well.
*/

injectKeybinds((fl.configURI + "Commands" + "/" + "External Libraries" + "/" + "C3VEKeys.xml"), "Case 3 Video Editor Keybinds.xml");
fl.addEventListener("documentOpened", docOpen);
fl.addEventListener("documentChanged", docChanged);
fl.addEventListener("documentSaved", docSave);
fl.addEventListener("mouseMove", moveMouse);

var path = fl.configURI + "Commands";
var index = 0;

while (FLfile.exists(path + "_OLD" + index)) {
	index++;
}

var cleanPath = FLfile.uriToPlatformPath(path);
cleanPath = cleanPath.replace(/\\/g, "/");

if (!FLfile.exists(path + "/.git")) {
	Sample.renameFolder(cleanPath, cleanPath + "_OLD" + index);
	FLfile.createFolder(path);
}

Sample.updateOrDownloadCommandsRepo(cleanPath);