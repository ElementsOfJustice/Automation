/*				ELEMENTS OF JUSTICE CASE 3 DAEMON
											6/12/2023
							
	This shit does some shit like VHC and other shit.
	
	Connor is bae.							-Soundman
*/

//Vanity Variables
var daemonName = "Elements of Justice Case 3 daemon";
var sessionCommit = false;
var firstOpen = true;

//Don't touch these variables
var DLL_NAME = "Utils";
var scriptsToCheck = ["Copy Font Name for ActionScript.jsfl", "Copy Motion as XML.jsfl", "Export Motion XML.jsfl", "Import Motion XML.jsfl", "names.xml"];
var blinkDuration = 6;
var bookmarkerTl = null
var bookmarkerFrame = null
var toSave = "";
var autoSave = false;
var sceneArray = [0];
var xSheetCache = {};

//cLib API & User Settings
var settings = FLfile.read(fl.configURI + "Commands/Settings.txt");
var cLib = fl.configURI + "Commands/cLib.jsfl";

for (var i = 0; i < scriptsToCheck.length; i++) {
	var scriptToCheck = scriptsToCheck[i];
	var encodedScriptToCheck = scriptToCheck.replace(/ /g, "%20");
	var scriptFile = fl.configURI + "Commands/" + encodedScriptToCheck;
	if (FLfile.exists(scriptFile)) {
		FLfile.remove(scriptFile);
	}
}

function validate_cLib_installation() {

	if (!FLfile.exists(settings)) {
		FLfile.write(settings, "");
	}

	if (!FLfile.exists(cLib)) {
		throw new Error("A valid cLib file was not found at the expected path: \n" + cLib + "\nLocate cLib.jsfl and put it in the directed path, and reboot.");
	}

}

// C-LIB WRAPPERS

function soundError() {
	validationCheck()
	fl.runScript(cLib, "soundError");
}

function soundAlert(message) {
	fl.runScript(cLib, "soundAlert", message);
}

function playSound(input) {
	fl.runScript(cLib, "playSound", input);
}

function beep(frequency, duration) {
	validationCheck()
	fl.runScript(cLib, "beep", frequency, duration);
}

function isSubstringPresent(string, substring) {
	if (typeof string !== 'string' || typeof substring !== 'string') {
		throw new TypeError('Both arguments must be strings.');
	};
	return string.indexOf(substring) !== -1;
}

// DLL WRAPPERS

function stringToCFunctionString(input) {
	var arr = "";
	for (var i = 0; i < input.length; i++) {
		arr += input.charCodeAt(i) + ", ";
	}
	return arr.substring(0, arr.length - 2);
}

function stringExample(input) {
	var execString = DLL_NAME + ".stringExample" + "(" + stringToCFunctionString(input) + ");";
	return eval(execString);
}

function renameFolder(oldPath, newPath) {
	var execString = DLL_NAME + ".renameFolder(" + stringToCFunctionString(oldPath + "?" + newPath) + ");"; // use "?" as delimiter between arguments
	return eval(execString);
}

function updateOrDownloadCommandsRepo(pathName) {
	var execString = DLL_NAME + ".updateOrDownloadCommandsRepo(" + stringToCFunctionString(pathName) + ");";
	return eval(execString);
}

function getFLACLength(pathName) {
	var execString = DLL_NAME + ".getFLACLength(" + stringToCFunctionString(pathName) + ");";
	return eval(execString);
}

function commitLocalChange(pathName) {
	var execString = DLL_NAME + ".commitLocalChange(" + stringToCFunctionString(pathName) + ");";
	return eval(execString);
}

// DOCUMENT-LEVEL FUNCTIONS

function getMemory() {
	var memsize = fl.getAppMemoryInfo(2);
	var disksize = FLfile.getSize(fl.getDocumentDOM().pathURI);
	fl.trace("RAM consumption is " + Math.abs(memsize) + " bytes or " + Math.abs(Math.round(memsize / 1048576)) + "MB");
	fl.trace("File size is " + disksize + " bytes or " + Math.abs(Math.round(disksize / 1048576)) + "MB");
}

function getLinkages() {
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

function makeLossless() {
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

// ANTIDEPRESSANT JOKE CODE

function getJoke() {
	if (!(isSubstringPresent(settings, "noJokes") || isSubstringPresent(settings, "noDLLs"))) {
		parseJoke(eval(DLL_NAME + '.joke()'));
	}
}

function replaceTwentyTimes(input) {
	var output = input;

	for (var i = 0; i < 20; i++) {
		output = output.replace("\\n", ' ').replace("\\", "");
	}

	return output;
}

function parseJoke(jsonString) {
	// Extract the type
	var typeStartIndex = jsonString.indexOf('"type":') + 8; // The index of the first character after '"type":'
	var typeEndIndex = jsonString.indexOf(',', typeStartIndex); // The index of the comma after the type value
	var type = jsonString.substring(typeStartIndex + 1, typeStartIndex + 2)

	if (type == "s") {
		//Single type joke

		var startIndex = jsonString.indexOf('"joke": "') + 9; // find the starting index of the substring
		var endIndex = jsonString.indexOf('",\n', startIndex); // find the ending index of the substring
		var desiredSubstring = jsonString.substring(startIndex, endIndex); // extract the substring	

		soundAlert(replaceTwentyTimes(desiredSubstring));

	} else if (type == "t") {
		//Two part joke

		var startIndex = jsonString.indexOf('"setup": "') + 10; // find the starting index of the substring
		var endIndex = jsonString.indexOf('",\n', startIndex); // find the ending index of the substring
		var desiredSubstring = jsonString.substring(startIndex, endIndex); // extract the substring	

		soundAlert(replaceTwentyTimes(desiredSubstring));

		var startIndex = jsonString.indexOf('"delivery": "') + 13; // find the starting index of the substring
		var endIndex = jsonString.indexOf('",\n', startIndex); // find the ending index of the substring
		var desiredSubstring = jsonString.substring(startIndex, endIndex); // extract the substring	

		soundAlert(replaceTwentyTimes(desiredSubstring));
	}
}

// OUTPUT STUFF

function vanityDisplay() {
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

function docOpen() {

	if (!(isSubstringPresent(settings, "noOutput"))) {

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
	}

	if (!(isSubstringPresent(settings, "noVHC"))) {

		if (firstOpen) {
			var commitXML = '<dialog title="Automatic Version History" buttons="accept, cancel"><label value="Do you want to enable version history control for this session?        "/><spacer/></dialog>';
			var commitDialogue = fl.xmlPanelFromString(commitXML);
			firstOpen = false;
		}

		if (commitDialogue.dismiss == "accept") {
			sessionCommit = true;
		}
	}


	if (Math.random() < 1/10) {
		getJoke();
	}

}

function docChanged() {

	if (!(isSubstringPresent(settings, "noOutput"))) {

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
}

function injectKeybinds(inputFile, writeFile) {
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

	if (!FLfile.exists(URI)) {
		FLfile.write(URI, "", "append")
	}

	if (FLfile.write(URI, keyData)) {
		//Successful
	} else {
		alert("Keymap injection failed. \nIs AppData/Roaming/Adobe/Animate/2022/Shortcuts a valid path?");
	}
}

function docSave() {
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
				if (!FLfile.createFolder(newFileName)) {
					alert("Warning: VHC folder creation failed!");
				}
			} else {
				FLfile.remove(newFileName + "/" + fileName + ".xfl")
			}

			toSave = newFileName;

		} else if (fileType.toUpperCase() == "XFL") {
			//File is XFL
		}
	}

	if (Math.random() < 1/20) {
		getJoke();
	}

}

function docClosed() {
	if (fl.documents.length == 0) {
		getJoke();
	} else {
		if (Math.random() < 1/10) {
			getJoke();
		}
	}
};

function moveMouse() {
	if (toSave !== "" && toSave !== undefined) {
		autoSave = true;
		fl.getDocumentDOM().saveAsCopy(toSave + ".xfl");
		var tmpPath = FLfile.uriToPlatformPath(toSave);
		if (tmpPath === undefined || tmpPath === null || tmpPath == "") {
			fl.trace("FLfile.uriToPlatformPath failed!");
			return;
		}
		var result = "Retry";
		var retryCount = 0;
		var success = false;
		while ((!success || result.indexOf("Retry")) != -1 && retryCount < 5) {
			try {
				fl.trace("Attempting to commit change to version history...");
				result = commitLocalChange(tmpPath);
				if (result === undefined || result.indexOf("Success.") != -1) {
					success = true;
					fl.trace(result);
				} else {
					fl.trace("Local commit failed at path " + tmpPath + ": " + result);
				}
			} catch (e) {
				fl.trace("CRITICAL ERROR: " + e.stack);
				fl.trace(e.name);
				fl.trace(e.message);
			}
			retryCount++;
		}
		if (!success) {
			alert("Local Commit failed after " + retryCount + " retries.");
		}
		autoSave = false;
		toSave = "";
	}
}

validate_cLib_installation();

if (!(isSubstringPresent(settings, "noKeymapInjection"))) {
	injectKeybinds((fl.configURI + "Commands" + "/" + "External Libraries" + "/" + "C3VEKeys.xml"), "Case 3 Video Editor Keybinds.xml");
}
fl.addEventListener("documentOpened", docOpen);
fl.addEventListener("documentChanged", docChanged);
fl.addEventListener("documentClosed", docClosed);
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
	renameFolder(cleanPath, cleanPath + "_OLD" + index);
	FLfile.createFolder(path);
}

if (!(isSubstringPresent(settings, "noBootSound"))) {
	playSound(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\Loadup.wav");
}

if (!(isSubstringPresent(settings, "noDLLs"))) {
	updateOrDownloadCommandsRepo(cleanPath);
}