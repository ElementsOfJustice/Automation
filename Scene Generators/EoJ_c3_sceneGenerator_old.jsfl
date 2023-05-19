/*****************************************************************************************************************

░█▀▀▀ ░█─── ░█▀▀▀ ░█▀▄▀█ ░█▀▀▀ ░█▄─░█ ▀▀█▀▀ ░█▀▀▀█ 　 ░█▀▀▀█ ░█▀▀▀ 　 ───░█ ░█─░█ ░█▀▀▀█ ▀▀█▀▀ ▀█▀ ░█▀▀█ ░█▀▀▀ 
░█▀▀▀ ░█─── ░█▀▀▀ ░█░█░█ ░█▀▀▀ ░█░█░█ ─░█── ─▀▀▀▄▄ 　 ░█──░█ ░█▀▀▀ 　 ─▄─░█ ░█─░█ ─▀▀▀▄▄ ─░█── ░█─ ░█─── ░█▀▀▀ 
░█▄▄▄ ░█▄▄█ ░█▄▄▄ ░█──░█ ░█▄▄▄ ░█──▀█ ─░█── ░█▄▄▄█ 　 ░█▄▄▄█ ░█─── 　 ░█▄▄█ ─▀▄▄▀ ░█▄▄▄█ ─░█── ▄█▄ ░█▄▄█ ░█▄▄▄

        ░█▀▀▀█ ░█▀▀█ ░█▀▀▀ ░█▄─░█ ░█▀▀▀ 　 ░█▀▀█ ░█▀▀▀ ░█▄─░█ ░█▀▀▀ ░█▀▀█ ─█▀▀█ ▀▀█▀▀ ░█▀▀▀█ ░█▀▀█ 
        ─▀▀▀▄▄ ░█─── ░█▀▀▀ ░█░█░█ ░█▀▀▀ 　 ░█─▄▄ ░█▀▀▀ ░█░█░█ ░█▀▀▀ ░█▄▄▀ ░█▄▄█ ─░█── ░█──░█ ░█▄▄▀ 
        ░█▄▄▄█ ░█▄▄█ ░█▄▄▄ ░█──▀█ ░█▄▄▄ 　 ░█▄▄█ ░█▄▄▄ ░█──▀█ ░█▄▄▄ ░█─░█ ░█─░█ ─░█── ░█▄▄▄█ ░█─░█

******************************************************************************************************************

Description: 
    This JSFL file creates a Case 3-compliant scene.

Contributors:
    123ConnorPoop (https://github.com/123connorpoop)
    ExodexoDev (https://github.com/ExodexoDev)
    Pretzelman718 (https://github.com/jmc718)

Desired Features:
    ⦁ Scenes will be generated all the way to the lipsyncing stage.
    ⦁ Lines will be added after characters are posed.
    ⦁ Characters will be lipsynced after their lines are added.
    ⦁ Characters will automatically blink after they are lipsynced.
    ⦁ Optimizations made by abolishing all selection code.
    ⦁ General quality of life features made to the code.

To-Do:
    ⦁ Do a validation check of all input before any generation begins.
        ⦁ Do a pre-emptive warn and abort if a character in the scene array 
        is not present in the rig array.
    ⦁ XMLUI should be an XML file within the directory of this JSFL file for
    easy editing.
    ⦁ Don't delete the many fl.trace statements. Use the new logging system, use
    them as INFO comments. That way you can read all your output without clogging
    the output panel.
    ⦁ Everything needs error-handling. This script should never fail unless you
    do something TERRIBLE!
    ⦁ EmotionEngine needs refactoring to allow negative-prompt bias.
    ⦁ All functions need commenting.
    ⦁ LineAdderFullAuto, MouthShapeLipSyncAll and GammaBlink need to be refactored
    to allow parameters to be passed in from this file, so the scene generator can
    run these scripts as needed.
    ⦁ Remove all !true, !false sillyness.

Issues:
    ⦁ Questions will be highlighted in comments with QUESTION:
    ⦁ Address all the questions
    ⦁ Remove all fl.trace statements. We only want logging, or SFX alert/error/updates.
    ⦁ tmp_DummySymbol looks like it's invoked, but not created if it doesn't exist.
    ⦁ 15K frame overflow exists when generating large scenes. Soundman will experiment with 
    creating a for-loop that intelligently switches scenes when a chunking value of frames is 
    achieved. The end result in writing this into the code should be that generation of very 
    long scenes can happen within one file, by generating within multiple scenes within Animate.
            ⦁ Soundman made a chunking system. Stress-test it, confirm it works nicely. When we
            integrate it, the placeText() function will place a pre-defined amount of text into
            each scene. This iterates normally. When we want to further iterate during steps such
            as lipsyncing or blinking, we use the chunking system goTo() function.
    ⦁ ???

*****************************************************************************************************************/

/******************************************************************************
                                DEBUGGING BACKEND
******************************************************************************/

var status00 = "INFO ";
var status01 = "WARN ";
var status02 = "DEBUG";
var status03 = "ERROR";

var logFile = fl.configURI + "log.txt";

/*
Function: formatDateTime
Variables: 
    date    object
Description: Returns a date formatted as YYYY-MM-DD HH:MM:SS.
*/
function formatDateTime(date) {
    var year = date.getFullYear();
    var month = ("0" + (date.getMonth() + 1)).slice(-2); // Adding 1 because month is zero-based
    var day = ("0" + date.getDate()).slice(-2);
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);

    var formattedDate = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds + " ";

    return formattedDate;
}

/*
Function: initializeLog
Variables: 
    none
Description: Creates the log file, or re-creates it, if it exists already.
*/
function initializeLog() {
    if (FLfile.exists(logFile)) {
        FLfile.remove(logFile);
    }

    FLfile.write(logFile, "");
}

/*
Function: writeLogRaw
Variables: 
    message     string
Description: Appends a raw string to the log. Newline character is built-in.
*/
function writeLogRaw(message) {
    FLfile.write(logFile, message + "\n", "append")
}

/*
Function: writeLogInfo
Variables: 
    timestamp   string
    level       string
    message     string
Description: Appends a raw string to the log. Newline character is built-in.
*/
function writeLogInfo(timestamp, level, message) {
    FLfile.write(logFile, timestamp + " | " + level + " | " + message + "\n", "append");
}

/*
Function: getCurrentDate
Variables: 
    none
Description: Returns the formatted current date and time for the log.
*/
function getCurrentDate() {
    return formatDateTime(new Date());
}

/*
Function: logSetup
Variables: 
    none
Description: Prints the first part of the log.
*/
function logSetup() {
    writeLogRaw("Elements of Justice — Scene Generator Logs              ");
    writeLogRaw("                                                        ");
    writeLogRaw("Timestamp                    | Message                  ");
    writeLogRaw("--------------------------------------------------------");
}

initializeLog();
logSetup();

/******************************************************************************
                                C LIBRARY WRAPPERS
******************************************************************************/

var cLib = fl.configURI + "cLib.jsfl";

/*
Function: validationCheck

Variables: 
    none
	
Description: Confirm code exists, or otherwise warn the user.
*/
function validationCheck() {
    if (!FLfile.exists(cLib)) {
        throw new Error("cLib.jsfl does not exist in the user's configuration directory.");
    }
}

/*
Function: beep

Variables: 
    frequency int
    duration int

Description: Plays a harsh beep through Windows.h's PlaySound function.
Used for conditioning video editors to not do silly things like turning
on advanced layers.
*/
function beep(frequency, duration) {
    validationCheck()
    fl.runScript(cLib, "beep", frequency, duration);
}

/*
Function: playSound

Variables: 
    input string

Description: Plays a sound through Windows.h's PlaySound function.
If the input does not exist, no sound will be played.
*/
function playSound(input) {
    validationCheck()
    fl.runScript(cLib, "playSound", input);
}

/*
Function: soundError

Variables: 
    none

Description: Plays the BetterAnimate error sound. We do not throw
new error here, because then the error code would link to this line,
thus obfuscating the true error. Use this for long-execution code where
you want to be notified of an error, and remember to throw new error after
calling this.
*/
function soundError() {
    validationCheck()
    fl.runScript(cLib, "soundError");
}

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

/******************************************************************************
                         GENERAL VARIABLES AND SETUP
******************************************************************************/

fl.showIdleMessage(false);

//CONFIGURABLE VARIABLES//
var iFrameDuration = 12;

/******************************************************************************
                                BASIC FUNCTIONS
******************************************************************************/

/*
Function: trim
Variables: 
    input string
Description: ES5-compatible backport of the trim operator.
*/
function trim(inputString) {
    var length = inputString.length;
    var startIndex = 0;
    var trimmedValue = inputString;

    while ((startIndex < length) && (trimmedValue.charAt(startIndex) <= ' ')) {
        startIndex++;
    }

    while ((startIndex < length) && (trimmedValue.charAt(length - 1) <= ' ')) {
        length--;
    }

    return ((startIndex > 0) || (length < inputString.length)) ? inputString.substring(startIndex, length) : inputString;
}

/*
Function: spreadMax
Variables: 
    arr []
Description: ES5-compatible backport of the spread operator.
*/
function spreadMax(arr) {

    var result = arr.reduce(function (a, b) {
        return Math.max(a, b);
    });

    return result;
}

/*
Function: switchActive
Variables: 
    layerVar int
Description: Switches layers. If the layer doesn't exist, we create it.
*/
function switchActive(layerVar) {
    var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
    if (layerIndex == null) {
        fl.getDocumentDOM().getTimeline().addNewLayer(layerVar);
        layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
    }
    fl.getDocumentDOM().getTimeline().setSelectedLayers(layerIndex * 1);
    propertiesLayer = fl.getDocumentDOM().getTimeline().layers[layerIndex];
}

//QUESTION: A lot of the formatting types share properties like the font. Should we have a general formatter followed by a 
//specific formatter. i.e. run generalFormat(), then dialogueFormat()? Is this optimal while reducing lines of code?
//ANSWER: yes but not necessary

/*
Function: dialogueFormat
Variables: None
Description: Format the selected text to be normal talking text.
*/
function dialogueFormat() {
    fl.getDocumentDOM().setElementTextAttr("face", "Suburga 2 Semi-condensed Regular");
    fl.getDocumentDOM().setElementTextAttr("size", 40);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0xffffff);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
    fl.getDocumentDOM().setElementTextAttr("lineSpacing", 1);
}

/*
Function: speakerFormat
Variables: None
Description: Format the speakertag text with the default settings.
*/
function speakerFormat() {
    fl.getDocumentDOM().setElementTextAttr("face", "Suburga 2 Semi-condensed Regular");
    fl.getDocumentDOM().setElementTextAttr("size", 42);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0xffffff);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
}

/*
Function: thinkingFormat
Variables: None
Description: Format the selected text to be "thinking" text.
*/
function thinkingFormat() {
    fl.getDocumentDOM().setElementTextAttr("face", "Suburga 2 Semi-condensed Regular");
    fl.getDocumentDOM().setElementTextAttr("size", 40);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0x008fff);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
    fl.getDocumentDOM().setElementTextAttr("lineSpacing", 1);
}

/*
Function: levenshteinRatio
Variables: 
    s string
    t string
Description: ES5-compatible Levenshtein ratio function used to compare the similarity of two strings.
*/
function levenshteinRatio(source, target) {
    var distanceMatrix = []; // 2d matrix

    // Step 1
    var sourceLength = source.length;
    var targetLength = target.length;

    if (sourceLength == 0) return targetLength;
    if (targetLength == 0) return sourceLength;

    // Create an array of arrays in JavaScript
    for (var i = sourceLength; i >= 0; i--) {
        distanceMatrix[i] = [];
    }

    // Step 2
    for (var i = sourceLength; i >= 0; i--) {
        distanceMatrix[i][0] = i;
    }
    for (var j = targetLength; j >= 0; j--) {
        distanceMatrix[0][j] = j;
    }

    // Step 3
    for (var i = 1; i <= sourceLength; i++) {
        var sourceChar = source.charAt(i - 1);

        // Step 4
        for (var j = 1; j <= targetLength; j++) {

            // Check the jagged Levenshtein distance total so far
            if (i == j && distanceMatrix[i][j] > 4) return sourceLength;

            var targetChar = target.charAt(j - 1);
            var cost = (sourceChar == targetChar) ? 0 : 1; // Step 5

            // Calculate the minimum
            var deletion = distanceMatrix[i - 1][j] + 1;
            var insertion = distanceMatrix[i][j - 1] + 1;
            var substitution = distanceMatrix[i - 1][j - 1] + cost;

            var min = Math.min(deletion, insertion, substitution);

            distanceMatrix[i][j] = min; // Step 6

            // Damerau transposition
            if (i > 1 && j > 1 && sourceChar == target.charAt(j - 2) && source.charAt(i - 2) == targetChar) {
                distanceMatrix[i][j] = Math.min(distanceMatrix[i][j], distanceMatrix[i - 2][j - 2] + cost);
            }
        }
    }

    return ((sourceLength + targetLength - distanceMatrix[sourceLength][targetLength]) / (sourceLength + targetLength));
}

/*
Function: getTimeDiff
Variables:
Description:
    Gets the time difference. Useful for telling how long each step
    takes to execute and which rigs are bloated.
*/
function getTimeDiff(startTime, endTime) {
    timeDiff = endTime - startTime;
    timeDiff /= 1000;
    var seconds = Math.round(timeDiff);

    if (timeDiff < 60) {
        return ("Time Elapsed: " + seconds + " seconds.");
    }

    if (timeDiff > 60) {
        var minutes = Math.floor(timeDiff / 60);
        var seconds = timeDiff - minutes * 60;
        return ("Time Elapsed: " + minutes + " minutes and " + seconds + " seconds");
    }
}

/******************************************************************************
                                EMOTION ENGINE
******************************************************************************/

//QUESTION: Do we even want emotionAverage smoothing? Run tests and see if it is worth the compute cycles.

//QUESTION: What even is emotionAverage? What is an in-between emotion?

//ANSWER: An in-between emotion is an averaged emotion between two input emotions. The semantic analysis
//code we use for extracting emotions from text works on a per-line level. This means the code can produce
//pose whiplash. A character may be happy, and then mad in the next pose. emotionAverage, and getting an
//in-between emotion should allow us to smooth out these transient emotions for more posing consistency.

/*
Function: emotionAverage
Variables: 
    str1    string
    str2    string
Description: Averages out two emotionEngine abstractions for an in-between emotion.
*/
function emotionAverage(str1, str2) {
    // Create a map to keep track of character counts
    var charMap = {};

    // Loop through the first string and update charMap accordingly
    for (var i = 0; i < str1.length; i++) {
        if (charMap[str1[i]] === undefined) {
            charMap[str1[i]] = 1;
        } else {
            charMap[str1[i]]++;
        }
    }

    // Loop through the second string and update charMap accordingly
    for (var j = 0; j < str2.length; j++) {
        if (charMap[str2[j]] === undefined) {
            charMap[str2[j]] = 1;
        } else {
            charMap[str2[j]]++;
        }
    }

    // Remove opposites and limit the number of each character
    var result = '';
    if (charMap['+'] > charMap['-']) {
        charMap['+'] -= charMap['-'];
        charMap['-'] = 0;
    } else {
        charMap['-'] -= charMap['+'];
        charMap['+'] = 0;
    }
    if (charMap['B'] > charMap['H']) {
        charMap['B'] -= charMap['H'];
        charMap['H'] = 0;
    } else {
        charMap['H'] -= charMap['B'];
        charMap['B'] = 0;
    }
    if (charMap['F'] > charMap['T']) {
        charMap['F'] -= charMap['T'];
        charMap['T'] = 0;
    } else {
        charMap['T'] -= charMap['F'];
        charMap['F'] = 0;
    }
    if (charMap['C'] > 1) {
        charMap['C'] = 1;
    }
    for (var char in charMap) {
        if (charMap[char] > 2) {
            charMap[char] = 2;
        }
        for (var i = 0; i < charMap[char]; i++) {
            result += char;
        }
    }

    // Sort the characters in the result string
    result = result.split('').sort(function (a, b) {
        var order = '++--HHBBRRAAGGFFSSTTC';
        return order.indexOf(a) - order.indexOf(b);
    }).join('');

    // Return the result string
    return result;
}

//QUESTION: Would an xSheet cache speed this up?

/*
Function: getPoseFromEmotion
Variables:
    layerIndex  int
    i           int
Description:
    Selects a pose from a character layer and frame number i. We use L-ratio
    to match the line's emotion to the emotionEngine data for the rig.
*/
function getPoseFromEmotion(layerIndex, i) {
    var itemIndex = fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[curFrame].elements[0].libraryItem.name)
    var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[fl.getDocumentDOM().library.items[itemIndex].timeline.layers.length - 1];

    var poseFrameNum = -1
    var tmpArray = []

    for (var k = 0; k < objTl.frameCount; k++) {
        if ((objTl.frames[k].labelType == "name") && (k == objTl.frames[k].startFrame)) {
            tmpArray.push(levenshteinRatio(objTl.frames[k].name, dialogueArray[i][3]))
            if (spreadMax(tmpArray) == tmpArray[tmpArray.length - 1]) {
                poseFrameNum = k
            }
        }
    }
    return poseFrameNum;
}

/******************************************************************************
                                CHUNK FUNCTIONS
******************************************************************************/

var chunk = 3; // Number of voice lines per scene

/*
Function: goTo
Variables:
    inputString     str
Description:
    Will set the currentFrame to the first frame of a line. A line is
    defined as when the TEXT layer has a frame.name value equaling a 
    value from the sceneData. These frame names are placed when the text
    is generated, so we will use them as markers for where lines begin.

    The goTo function, and the chunking value above determines how many
    lines will be in an Animate scene. The function intelligently enters
    scenes before taking you to the start of the line.

    goTo() should be used for all iteration post-text placement. This
    way we can add frames, as we would when inserting voice lines, and
    the iteration will not be affected because we compute dynamically.
*/
function goTo(inputString) {
	var lineIndex = parseInt(inputString.substring(3, 6), 10);
	var sceneIndex = Math.ceil(lineIndex / chunk);

	// Go to the target scene
	fl.getDocumentDOM().editScene(sceneIndex - 1);

	var timeline = fl.getDocumentDOM().getTimeline();
	var textLayer = timeline.layers[timeline.findLayerIndex("TEXT")]; // Get the "TEXT" layer
	var keyframes = textLayer.frames; // Get all the keyframes on the textLayer

	// Iterate over the keyframes on the textLayer
	for (var i = 0; i < keyframes.length; i++) {
		var frame = keyframes[i];

		// Check if the frame name matches the input frame label
		if (frame.name === inputString) {
			// Go to the target frame within the scene
			timeline.currentFrame = i;
			break;
		}

		// Calculate the index of the next keyframe
		var nextFrameIndex = i + frame.duration;

		// Skip to the next keyframe
		i = nextFrameIndex - 1;
	}
}

/******************************************************************************
                                CORE INVOKERS
******************************************************************************/

//QUESTION: This is how we'll hook up features to the sceneGenerator without duplicate code.
//A core script that is function-pure, and an end-user script we run in manual cases.

//QUESTION: Warn user via FLfile.exists if these files don't exist ahead of time.
//Forseeable, since filenames may change once we enter Case 4.

/*
Function: gammaBlink
Variables:
    layerIndex  int
    mean        float
Description:
    Places blinking labels across a character's layer via a mean.
*/
function gammaBlink(layerIndex, mean) {
    fl.getDocumentDOM().getTimeline().setSelectedLayers(layerIndex);
    fl.runScript(fl.configURI + "Commands/Blinking/dev_GammaBlink_core.jsfl", "autoBlink", mean);
}

/*
Function: autoLipsyncDocument
Variables:
    cfgFolderPath   str
Description:
    Lipsyncs an entire document when provided a folder to CFGs.
*/
function autoLipsyncDocument(cfgFolderPath) {
    fl.runScript(configURI + "Commands/Lipsyncing/dev_c3_LipSync_core.jsfl", "runLipsyncingDoc", cfgFolderPath);
}

//QUESTION: THIS DOESN'T WORK WITH MULTIPLE SCENES IN ONE FLA. WE GOTTA FIX THIS.

/*
Function: addAllVoiceLines
Variables:
    voiceLineFolderPath   str
Description:
    Adds all voice lines to a scene.
*/
function addAllVoiceLines(voiceLineFolderPath) {
    fl.runScript(configURI + "Commands/Lipsyncing/dev_LineAdder_core.jsfl", "insertLines", voiceLineFolderPath);
}

/******************************************************************************
                            COURTROOM FUNCTIONS
******************************************************************************/

/*
Function: doTextBoxes
Variables: None
Description: 
    Inserts dialogue and speaker tags into each frame on the text layer. 
    This text is obtained from the script itself via a plaintext parser. Bounding 
    boxes are specified for the textboxes as well as text options like multiline 
    wrap, antialiasing and paragraph settings. Text color is determined here. 
    Defaults to white, blue for thinking, and yellow for Widget.
*/

function doTextBoxes() {
    var dialogueBounding = {
        left: 40.05,
        top: 549.5,
        right: 1212.95,
        bottom: 708.95
    };
    var speakerBounding = {
        left: 20.05,
        top: 482.5,
        right: 254.4,
        bottom: 540.2
    };

    switchActive("TEXT");

    for (var i = 0; i < dialogueArray.length; i++) {
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);

        if (i != 0) {
            fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
        }

        fl.getDocumentDOM().addNewText(dialogueBounding);
        fl.getDocumentDOM().setTextString(trim(dialogueArray[i][1]));

        //QUESTIION: These setElementProperties can probably just be moved to dialogueFormat() and every other format, right?

        fl.getDocumentDOM().setElementTextAttr('alignment', 'left');
        fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
        fl.getDocumentDOM().setElementProperty('lineType', 'multiline');
        fl.getDocumentDOM().setElementProperty('name', 'txt');
        fl.getDocumentDOM().setElementProperty('fontRenderingMode', 'standard');
        dialogueFormat();

        if (dialogueArray[i][1].indexOf('(') > -1) {
            thinkingFormat();
        }

        if (dialogueArray[i][0] == "Widget") {
            fl.getDocumentDOM.setTextAttr("fillColor", 0xD7D700);
        }

        for (var m = 0; m < nameswapArray.length; m++) {
            if (dialogueArray[i][0] == nameswapArray[m][0]) {
                dialogueArray[i][0] = nameswapArray[m][1]
            }
        }

        fl.getDocumentDOM().selectNone();
        fl.getDocumentDOM().addNewText(speakerBounding);

        fl.getDocumentDOM().setTextString(dialogueArray[i][0]);
        fl.getDocumentDOM().setElementTextAttr("alignment", "left");
        fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
        fl.getDocumentDOM().setElementProperty('lineType', 'multiline');
        fl.getDocumentDOM().setElementProperty('name', 'txt');
        fl.getDocumentDOM().setElementProperty('fontRenderingMode', 'standard');
        speakerFormat();

        for (var z = 0; z < letterSpacingArray.length; z++) {
            if (dialogueArray[i][0] == letterSpacingArray[z][0]) {
                fl.getDocumentDOM().setElementTextAttr("letterSpacing", (letterSpacingArray[z][1]))
            }
        }

        fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].name = dialogueArray[i][2]

        fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
    }
}

//QUESTION: This function needs better documentation.

/*
Function: getCharacters
Variables: None
Description: 
    Returns a set of all characters in the scene, with no duplicates.
*/
function getCharacters() {
    var unique = [];
    for (var i = 0; i < speakertagArray.length; i++) {
        for (var character in speakertagArray[i].split(" & ")) {
            unique.push(trim(speakertagArray[i].split(" & ")[character]));
        }
    }
    unique = unique.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });
    return unique;
}

//QUESTION: This function needs cleanup and more documentation.
//QUESTION: This function uses fl.trace to acknowledge a rig being placed, and also for errors.
//This is the perfect use case for the logging system.

/*
Function: addRigs
Variables: None
Description:
    Adds the rigs to the stage. First, we add a dummy symbol, because it is faster to
    replace a symbol than it is to place a rig. Then we swap the symbol with the rig
    of our chouse, make sure it is positioned correctly and visible. This function
    needs a companion function that changes poses based on emotionEngine output.
*/
function addRigs() {
    var uniqueChars = getCharacters();
    for (var i = 0; i < uniqueChars.length; i++) {
        if (masterRigArray[uniqueChars[i]] !== undefined && fl.getDocumentDOM().library.itemExists(masterRigArray[uniqueChars[i]][1])) {
            //fl.trace(masterRigArray[uniqueChars[i]]);
            switchActive(masterRigArray[uniqueChars[i]][0]);
            var selLayerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(masterRigArray[uniqueChars[i]][0]) * 1;
            fl.getDocumentDOM().getTimeline().currentFrame = 0;
            // select current frame
            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);

            fl.getDocumentDOM().addItem({
                x: masterRigArray[uniqueChars[i]][2],
                y: masterRigArray[uniqueChars[i]][3]
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            // fl.trace(masterRigArray[uniqueChars[i]])
            fl.trace("hi " + masterRigArray[uniqueChars[i]]);
            fl.getDocumentDOM().swapElement(masterRigArray[uniqueChars[i]][1]);
            // fl.getDocumentDOM().getTimeline().layers[selLayerIndex].setRigParentAtFrame(fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("BACKGROUNDS")], fl.getDocumentDOM().getTimeline().currentFrame);
            fl.getDocumentDOM().setTransformationPoint({ x: 0, y: 0 });
            fl.getDocumentDOM().align('vertical center', true);
            fl.getDocumentDOM().align('horizontal center', true);
            fl.getDocumentDOM().setElementProperty('transformX', masterRigArray[uniqueChars[i]][2]);
            fl.getDocumentDOM().setElementProperty('transformY', masterRigArray[uniqueChars[i]][3]);
            fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
        } else {
            fl.trace("WARNING! UNDEFINED RIG: " + masterRigArray[uniqueChars[i]]);
        }
    }
}

/*
Function: generateWitnessBools
Variables: 
    speakerTagIndex arr
Description: 
    Generates two bools: isWitnessSpeaking, isNextCharacterWitness.
    We use this for keeping multiple characters on screen at once, even
    if one doesn't speak.
*/
function generateWitnessBools(speakerTagIndex) {
    var isWitnessSpeaking = false;
    var isNextCharacterWitness = false;
    for (var witness in witnesses) {
        if (witnesses[witness] == speakertagArray[speakerTagIndex]) {
            isWitnessSpeaking = true;
        }
        if (speakerTagIndex < speakertagArray.length - 1 && witnesses[witness] == speakertagArray[speakerTagIndex + 1]) {
            isNextCharacterWitness = true;
        }
        if (isWitnessSpeaking && isNextCharacterWitness) {
            break;
        }
    }

    return [isWitnessSpeaking, isNextCharacterWitness];

}

//QUESTION: Pose needs better documentation, and trace statements should be logged as INFO.

/*
Function: poseAutomation
Variables: 
    layerIndex  int
    i           int
Description: 
    Pose automation based on LeXmo emotions and L-ratio algorithm.
*/
function poseAutomation(layerIndex, i, curFrame) {

    //fl.trace("Layer Index: " + layerIndex)
    //fl.trace("Frame: " + fl.getDocumentDOM().getTimeline().currentFrame)
    //fl.trace("Element: " + fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0])
    //fl.trace("Item Index: " + fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].libraryItem.name))

    //fl.trace("Selected Layer is " + masterRigArray[uniqueChars[j]][0] + " but it should be " + speakertagArray[i])
    //fl.trace("Selected Sym for xSheet Browsing is: " + fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].libraryItem.name)

    var poseFrameNum = getPoseFromEmotion(layerIndex, i, curFrame);

    if (poseFrameNum != -1) {
        fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[curFrame].elements[0].firstFrame = poseFrameNum;
    } else {
        fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[curFrame].elements[0].firstFrame = 0;
    }

    //WARNING! CASE 2 HARDCODING AHEAD!
    if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[curFrame].elements[0].libraryItem.name == "RIGS/RASTER CHARACTERS/Athena - Courtroom/tmp_Athena") {
        fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[curFrame].name = sceneData[i][4];
    }

    /*if (sceneData[i][2] != sceneData[i + 1][2]) {
        fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
    } */
}

//QUESTION: Function needs de-nesting, optimization and more documentation.

/*
Function: removeAbsentCharactersAndDoPoseAutomation
Variables: 
    uniqueChars arr
    i           int
Description: 
    Removes nonexistent characters so we do not return an error
    by trying to access symbols and library items that do not exist!
*/
function removeAbsentCharactersAndDoPoseAutomation(uniqueChars, i) {
    for (var j = 0; j < uniqueChars.length; j++) {
        // fl.trace(masterRigArray[uniqueChars[j]][0])
        if (!(masterRigArray[uniqueChars[j]][0] !== undefined && fl.getDocumentDOM().library.itemExists(masterRigArray[uniqueChars[j]][1]))) continue;
        fl.getDocumentDOM().getTimeline().currentFrame = iFrameDuration * i;

        var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(masterRigArray[uniqueChars[j]][0]);

        if (speakertagArray[i] == uniqueChars[j]) { // make keyframe on active character
            switchActive(masterRigArray[uniqueChars[j]][0]);
            layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(masterRigArray[uniqueChars[j]][0]);
        }

        if ((i == 0) && (speakertagArray[i] != uniqueChars[j])) { /// make blank keyframe on inactive character for the first frame (inserting blank keyframe causes weirdness)
            switchActive(masterRigArray[uniqueChars[j]][0]);
            // select current frame
            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
            fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
            // select current frame
            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
            fl.getDocumentDOM().deleteSelection();
        }

        else if ((generateWitnessBools(i)[0] /* isWitnessSpeaking */) && (uniqueChars[j] == speakertagArray[i])) { // make keyframe on active witnesses
            for (var witness in witnesses) {
                switchActive(masterRigArray[witnesses[witness]][0]);
                // select current frame
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                if (i != 0) {
                    fl.getDocumentDOM().getTimeline().insertKeyframe();
                } else {
                    fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
                }
            }

            if (!generateWitnessBools(i)[1] /* isNextCharacterWitness */) { // if next speaker is neither witnesses, put blank keyframes at the end of their keyframe
                for (var witness in witnesses) {
                    fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
                    switchActive(masterRigArray[witnesses[witness]][0]);
                    // select current frame
                    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                    fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
                    fl.getDocumentDOM().getTimeline().currentFrame -= iFrameDuration;
                }
            }
        }

        else if (speakertagArray[i] == uniqueChars[j]) { // make keyframe on active character
            switchActive(masterRigArray[uniqueChars[j]][0]);

            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
            if (i != 0) {
                fl.getDocumentDOM().getTimeline().insertKeyframe();
            } else {
                fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
            }

            poseAutomation(layerIndex, i);

        }
    }
}

/*
Function: sculpt
Variables: None
Description:
    A reversed process for adding rigs to stage. It is faster to remove and
    clear frames than it is to place them. So every rig is placed one time
    and then we navigate to the end of the document and work backwards,
    chiseling out where we want rigs to be by adding blank keyframes. This
    function alone is the most extreme speedup to scene generation.
*/
function sculpt() {
    var uniqueChars = getCharacters();
    // For each line of dialogue
    for (var i = speakertagArray.length - 1; i >= 0; i--) {
        removeAbsentCharactersAndDoPoseAutomation(uniqueChars, i);
    }
}

/*
Function: placeDesks
Variables: None
Description:
    Places desks as bitmaps. Sometimes desks jump out of position. This is related
    to whichever step is last in execution. It is typically desks in most builds of
    EoJ scene generators.
*/
function placeDesks() {
    fl.getDocumentDOM().getTimeline().currentFrame = 0;
    switchActive("DESKS");
    for (var i = 0; i < speakertagArray.length; i++) {
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        if (i != 0) {
            fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
        }
        if (masterDeskArray[speakertagArray[i]] == undefined) {
            fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
            continue;
        }
        fl.getDocumentDOM().addItem({
            x: masterDeskArray[speakertagArray[i]][1],
            y: masterDeskArray[speakertagArray[i]][2]
        }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
        fl.getDocumentDOM().swapElement(masterDeskArray[speakertagArray[i]][0]);
        fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
    }
}

/*
Function: placeBGs
Variables:
Descriptions:
    Places backgrounds. Knows which BG to add by comparing to an array of backgrounds
    for each character. So the Judge will always get the Judge background and Athena
    will always get the defense background.
*/
function placeBGs() {
    fl.getDocumentDOM().getTimeline().currentFrame = 0;
    switchActive("BACKGROUNDS");
    for (var i = 0; i < speakertagArray.length; i++) {
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        if (i != 0) {
            fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
        } if (courtmodeBackgroundsArray[speakertagArray[i]] == undefined) {
            fl.getDocumentDOM().addItem({
                x: 640,
                y: 360
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            fl.getDocumentDOM().swapElement("BACKGROUNDS/Full-Courtroom");
            fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
            continue;
        }

        fl.getDocumentDOM().addItem({
            x: courtmodeBackgroundsArray[speakertagArray[i]][1],
            y: courtmodeBackgroundsArray[speakertagArray[i]][2]
        }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
        fl.getDocumentDOM().swapElement(courtmodeBackgroundsArray[speakertagArray[i]][0]);
        fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
    }
}

/******************************************************************************
                         INVESTIGATION FUNCTIONS
******************************************************************************/

//QUESTION:  Why does this function need an investigation variant? Document why :(

/*
Function: doTextBoxesInvestigation
Variables:
Description: 
    No clue why this function needs an investigation variant. 
    Ask Connor about this later.
*/
function doTextBoxesInvestigation() {
    var dialogueBounding = {
        left: 40.05,
        top: 549.5,
        right: 1212.95,
        bottom: 708.95
    };
    var speakerBounding = {
        left: 20.05,
        top: 482.5,
        right: 254.4,
        bottom: 540.2
    };
    switchActive("TEXT");

    for (var i = 0; i < dialogueArray.length; i++) {
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        if (i != 0) {
            fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
        }

        fl.getDocumentDOM().addNewText(dialogueBounding);
        fl.getDocumentDOM().setTextString(trim(dialogueArray[i][1]));
        fl.getDocumentDOM().setElementTextAttr('alignment', 'left');
        fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
        fl.getDocumentDOM().setElementProperty('lineType', 'multiline');
        fl.getDocumentDOM().setElementProperty('name', 'txt');
        fl.getDocumentDOM().setElementProperty('fontRenderingMode', 'standard');
        dialogueFormat();
        if (dialogueArray[i][1].indexOf('(') > -1) {
            thinkingFormat();
        }

        if (dialogueArray[i][0] == "Widget") {
            fl.getDocumentDOM.setTextAttr("fillColor", 0xD7D700);
        }
        for (var m = 0; m < nameswapArray.length; m++) {
            if (speakertagArray[i] == nameswapArray[m][0]) {
                speakertagArray[i] = nameswapArray[m][1]
            }
        }
        fl.getDocumentDOM().selectNone();
        fl.getDocumentDOM().addNewText(speakerBounding);

        fl.getDocumentDOM().setTextString(speakertagArray[i]);
        fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
        fl.getDocumentDOM().setElementProperty('lineType', 'multiline');
        fl.getDocumentDOM().setElementProperty('name', 'txt');
        fl.getDocumentDOM().setElementProperty('fontRenderingMode', 'standard');
        speakerFormat();

        for (var z = 0; z < letterSpacingArray.length; z++) {
            if (speakertagArray[i] == letterSpacingArray[z][0]) {
                fl.getDocumentDOM().setElementTextAttr("letterSpacing", (letterSpacingArray[z][1]))
            }
        }
        fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
    }
}

//QUESTION: fl.trace statements should be logged under INFO. Function needs more documentation and cleanup.
//QUESTION: Configuration file error aborts here, very late into the generation process. Check earlier and abort before anything is done.

/*
Function: addRigsInvestigation
Variables: 
Description:
    Adds rigs for the Investigation view format. Same as courtroom, but
    all the ponies face forwards and are centered.
*/
function addRigsInvestgation() {
    var missingRigs = [];
    var uniqueChars = getCharacters();
    for (var i = 0; i < uniqueChars.length; i++) {
        var character = uniqueChars[i];
        if (character == defense) {
            continue;
        }
        if (masterInvestigationArray[character] === undefined) {
            missingRigs.push(character);
            continue;
        }
        switchActive(masterInvestigationArray[character][0]);
        var selLayerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(masterRigArray[uniqueChars[i]][0]) * 1;
        fl.getDocumentDOM().getTimeline().currentFrame = 0;
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);

        fl.getDocumentDOM().addItem({
            x: 0,
            y: 0
        }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);

        if (!fl.getDocumentDOM().library.itemExists(masterInvestigationArray[character][1])) {
            alert('The configuration file has an invalid entry. Attempt to parse rig path \n' + masterInvestigationArray[character][1] + ' \nyielded no rig. Please update the configuration file to a valid entry for this rig.');
            throw new Error('Aborting...');
        }

        fl.getDocumentDOM().swapElement(masterInvestigationArray[character][1]);
        // fl.getDocumentDOM().getTimeline().layers[selLayerIndex].setRigParentAtFrame(fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("BACKGROUNDS")], fl.getDocumentDOM().getTimeline().currentFrame);
        // fl.getDocumentDOM().setTransformationPoint({ x: 0, y: 0 });
        // fl.getDocumentDOM().align('vertical center', true);
        // fl.getDocumentDOM().align('horizontal center', true);
        // fl.getDocumentDOM().setElementProperty('transformX', masterRigArray[uniqueChars[i]][2]);
        // fl.getDocumentDOM().setElementProperty('transformY', masterRigArray[uniqueChars[i]][3]);
        fl.getDocumentDOM().setElementProperty("loop", "single frame");
        fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
    }
    return missingRigs;
}

//QUESTION: Turn fl.trace into log info statements.

/*
Function: getAlignmentPos
Variables: 
    totalChars  int
    currentChar int
Description:
    Intelligently spaces the position of multiple on-screen characters.
*/
function getAlignmentPos(totalChars, currentChar) {
    var X = 0;
    // case 1: even number of characters
    if (totalChars % 2 == 0) {
        var deltaX = fl.getDocumentDOM().width / totalChars;
        var initialPlacement = (-1 * fl.getDocumentDOM().width / 2) + deltaX / 2;
        // fl.trace("initalPlacement: " + initialPlacement)
        // fl.trace("deltaX: " + deltaX)
        // fl.trace("totalChars: " + totalChars)
        // fl.trace("currentChar: " + currentChar)
        X = initialPlacement + (currentChar * deltaX);

    }
    // case 2: odd number of characters
    else {
        // if (currentChar == (totalChars - 1) / 2) {
        //     X = 0; // CENTER
        // } else {
        var deltaX = fl.getDocumentDOM().width / totalChars;
        var initialPlacement = (-1 * fl.getDocumentDOM().width / 2) + deltaX / 2;
        X = initialPlacement + (currentChar * deltaX);
        // }
    }
    // fl.trace("X: " + X);
    return { x: X, y: 0 };
}

//QUESTION: Function needs de-nesting, optimization and more documentation.
//QUESTION: Use logging for fl.trace statements.

/*
Function: sculptInvestigations
Variables: None
Description: 
    Sculpts rigs like courtroom functions, but for Investigations.
*/
function sculptInvestgation() {
    var uniqueChars = getCharacters();

    for (var i = speakertagArray.length - 2; i >= 0; i--) {
        var isPov = speakertagArray[i] == defense;
        if (speakertagArray[i] == defense && i != 0) {
            var tempI = i;
            while (tempI > 0 && speakertagArray[tempI] == defense) {
                tempI--;
            }
            speakertagArray[i] = (tempI != 0) ? speakertagArray[tempI] : speakertagArray[i];
        }
        var characterIndex = 0; // for distributing multiple characters on screen

        for (var j = 0; j < uniqueChars.length; j++) {
            if (masterInvestigationArray[uniqueChars[j]] === undefined) {
                continue;
            }
            var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(masterInvestigationArray[uniqueChars[j]][0]);
            fl.getDocumentDOM().getTimeline().currentFrame = iFrameDuration * i;
            if ((i == 0) && (speakertagArray[i].indexOf(uniqueChars[j]) == -1)) { /// make blank keyframe on inactive character for the first frame (inserting blank keyframe causes weirdness)
                switchActive(masterInvestigationArray[uniqueChars[j]][0]);
                // select current frame
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
                // select current frame
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                if (fl.getDocumentDOM().getTimeline().getFrameProperty("elements").length != 0) {
                    fl.getDocumentDOM().deleteSelection();
                }
            }

            else if (speakertagArray[i].indexOf(uniqueChars[j]) > -1) { // make keyframe on active character
                switchActive(masterInvestigationArray[uniqueChars[j]][0]);
                // if (fl.getDocumentDOM().getTimeline().getLayerProperty('visible')) {
                //     fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
                // }
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                if (i != 0) {
                    fl.getDocumentDOM().getTimeline().insertKeyframe();
                } else {
                    fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
                }
                var numChars = speakertagArray[i].split(" & ").length;
                numChars -= (speakertagArray[i].indexOf(defense) > -1) ? 1 : 0;
                if (numChars > 1) { // multiple characters on screen, distribute them evenly
                    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                    fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
                    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                    fl.getDocumentDOM().moveSelectionBy(getAlignmentPos(numChars, characterIndex));
                    fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
                    characterIndex++;
                }

                if (!isPov) {
                    //Then do pose automation...

                    poseAutomation(layerIndex, i)

                }

                if (speakertagArray[i] != speakertagArray[i + 1]) {
                    fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
                    // select current frame
                    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                    fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
                }
            }
        }
    }
}

/******************************************************************************
                                INVOKE GUI
******************************************************************************/

//QUESTION: This area is not very clean. Some variables still use the old hungarian
//notation variables from 2021!

var scriptPathURI = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
var guiPanel = fl.getDocumentDOM().xmlPanel(scriptPathURI + "/ui_sceneGenerator.xml");

if (guiPanel.dismiss == "accept") {

    arrayPath = guiPanel.selectedJSON;
    var driveLetter = arrayPath.charAt(0);
    arrayPath = arrayPath.substring(2, arrayPath.length);
    arrayPath = "file:///" + driveLetter + "|" + arrayPath;
    arrayPath = arrayPath.replace(/\\/g, "/");
    arrayPath = arrayPath.replace(/ /g, '%20');

    var viewMode = guiPanel.panel_viewMode;

    //QUESTION: Case 3 XMLUI panel for the scene generator has only one text input for witnesses.
    //Witnesses will be entered "Sugar Stamp,Turning Page,Fair Devotion" to indicate the positioning
    //and how many witnesses show up. Does this integrate smoothly with intelligent witness spacing?

    var defense = guiPanel.panel_Defense;
    var prosecutor = guiPanel.panel_Prosecutor;
    var judge = guiPanel.panel_Judge;
    var cocouncil = guiPanel.panel_Cocouncil;
    var witnesses = guiPanel.panel_allWitnesses;

    var eeBias = guiPanel.panel_eeBias;
    var chunkSize = guiPanel.panel_chunkSize;

    //QUESTION: Ahahaha, Soundman realized really late into the game that skipping text is out of the cards, because...
    //THE ENTIRE CHUNK SYSTEM DEPENDS ON IT!!! hahaha... 
    var skipText = guiPanel.panel_skip00;

    var skipRigs = guiPanel.panel_skip01;
    var skipBGs = guiPanel.panel_skip02;
    var skipTypewriter = guiPanel.panel_skip03;
    var skipLines = guiPanel.panel_skip04;
    var skipBlinks = guiPanel.panel_skip05;

    var pathToSceneData = guiPanel.panel_sceneData;
    var pathToCFGs = guiPanel.panel_folderCFG;
    var pathToLines = guiPanel.panel_folderLines;

    var writeReport = guiPanel.panel_writeReport;

    //QUESTION: New method for adding witnesses should use str.split(",") to split a string formatted such as
    //"Fair Devotion,Turning Page,Sugar Stamp" into an array of entries, 
    //["Fair Devotion", "Turning Page", "Sugar Stamp"].
    var NUM_WITNESSES = 5;
    for (var i = 0; i < NUM_WITNESSES; i++) {
        eval("var isEmpty = guiPanel.panel_sWitness" + (i + 1) + " == \"\"");
        if (!isEmpty) {
            eval("sWitnesses[" + i + "]" + " = guiPanel.panel_sWitness" + (i + 1));
        }
    }

    //You've heard of sanity checks? Here, we're checking to see if the user is insane.
    if (!skipLines && skipRigs) {
        soundError();
        var newError = "You have attempted to skip rig placement, but not skip line insertion. You are insane.";
        writeLogInfo(getCurrentDate(), status03, newError);
        throw new Error(newError);
    }

    if (skipLines && ((pathToCFGs == "") || (pathToLines == ""))) {
        soundError();
        var newError = "Both a path to the CFG files and voice lines are required for line placement.";
        writeLogInfo(getCurrentDate(), status03, newError);
        throw new Error(newError);
    }

    //Load the sceneData, and the appropriate configuration file.
    fl.runScript(arrayPath);
    fl.runScript(scriptPathURI + "/config.txt");

    //WE SHOULD DO A WARNING RIGHT HERE IF A RIG IS GOING TO BE CALLED THAT DOESN'T FUCKING EXIST!!!!!!!!!!!!

}

/******************************************************************************
                                DISCRIMINATE ARRAYS
******************************************************************************/

    //QUESTION: Everything about this area is very scary. Nothing in the code is really
    //using the new array formatting, we just re-create the old format out of the new
    //format here.

    //QUESTION: Is emotionEngine smoothing going to be performed?

    //QUESTION: EmotionEngine bias should occur here. Bias will be negative, so it will
    //remove the antithesis of the emotions included in the bias. This allows greater
    //expressive range in the emotions that are desired.

    //QUESTION: Warnings about characters being called that don't exist in the rig arrays
    //should occur here.

    /*
    Remove inappropriate emotions.
    */

    // Loop through sceneData in batches of 10
    for (var i = 0; i < sceneData.length; i += 10) {
        var tempSum = "";
        var counts = {};
        var leastCommonLetters = [];

        // Add the fifth elements of the current batch of 20 arrays together
        for (var j = i; j < i + 20 && j < sceneData.length; j++) {
            tempSum += sceneData[j][4];
        }

        // Count the occurrences of each letter in the temporary variable
        for (var k = 0; k < tempSum.length; k++) {
            var letter = tempSum.charAt(k);
            counts[letter] = counts[letter] ? counts[letter] + 1 : 1;
        }

        // Find the three least common letters
        var leastCommonLetters = [];
        var minCounts = [Infinity, Infinity, Infinity];
        for (var letter in counts) {
            var count = counts[letter];
            if (count < minCounts[0]) {
                leastCommonLetters[2] = leastCommonLetters[1];
                leastCommonLetters[1] = leastCommonLetters[0];
                leastCommonLetters[0] = letter;
                minCounts[2] = minCounts[1];
                minCounts[1] = minCounts[0];
                minCounts[0] = count;
            } else if (count < minCounts[1] && count > minCounts[0]) {
                leastCommonLetters[2] = leastCommonLetters[1];
                leastCommonLetters[1] = letter;
                minCounts[2] = minCounts[1];
                minCounts[1] = count;
            } else if (count < minCounts[2] && count > minCounts[1]) {
                leastCommonLetters[2] = letter;
                minCounts[2] = count;
            }
        }

        fl.trace(leastCommonLetters)

        // Remove the two least common letters from the 20 arrays
        for (var j = i; j < i + 20 && j < sceneData.length; j++) {
            sceneData[j][4] = sceneData[j][4].replace(new RegExp("[" + leastCommonLetters.join("") + "]", "g"), "");
        }
    }


    /*
    This section smooths out emotionEngine data.
    */

    // Loop through the sceneData array starting from the second element (index 1)
    // Create an empty array to store the averaged emotions
    /*   var averagedEmotions = [];
  
      for (var i = 1; i < sceneData.length - 1; i++) {
          // Check if the third element between the current and previous arrays are equivalent
          if (sceneData[i][2] === sceneData[i - 1][2]) {
              // If they are equivalent, call the emotionAverage function on the two 5th elements
              var avgEmotion = emotionAverage(sceneData[i - 1][4], sceneData[i][4]);
  
              // Store the averaged emotion in the temporary array
              averagedEmotions[i] = avgEmotion;
          } else {
              // If they are not equivalent, store an empty string in the temporary array
              averagedEmotions[i] = "";
          }
      }
  
      // Update the sceneData array with the averaged emotions
      for (var i = 1; i < sceneData.length - 1; i++) {
          // Check if the temporary array has an averaged emotion at this index
          if (averagedEmotions[i] !== "") {
              // Update the current array's 5th element with the averaged emotion
              sceneData[i][4] = averagedEmotions[i];
          }
      }
   */

    /*
    Dialogue Array
    
    All the entries in the scene data array that are prefixed with "dialogue" will
    be bumped into this new array in charge of text and rig generation.
    
    speakertagArray is a fossil from the old schema, but it's called like 40 times
    in this script and I have no idea what some functions do, so we will add a step
    to rebuild the old speakertagArray to fit compatibility with this new schema.
    
    sceneData[0] will determine if it is dialogue
    sceneData[1] is the AE markup ID
    sceneData[2] is the speaker
    sceneData[3] is the dialogue itself
    sceneData[4] is the pose suggested by the script or emotionEngine
    */

    for (var i = 0; i < sceneData.length; i++) {

        if (sceneData[i][0] == "dialogue") {
            dialogueArray.push([sceneData[i][2], sceneData[i][3], sceneData[i][1], sceneData[i][4]])
            //dialogueArray[i][0] for SpeakerTag
            //dialogueArray[i][1] for Dialogue
            //dialogueArray[i][2] for Line ID
            //dialogueArray[i][3] for Pose
        }

    }

    for (var i = 0; i < dialogueArray.length; i++) {
        speakertagArray[i] = (dialogueArray[i][0])
    }

/******************************************************************************
                                MAIN EXECUTION
******************************************************************************/

fl.getDocumentDOM().editScene(0);
fl.getDocumentDOM().getTimeline().currentFrame = 0;

if (viewMode == "courtMode") {
    generationStarted = new Date();
    stepStarted = new Date();
    doTextBoxes();
        stepEnded = new Date();
        playSound("put textbox sound here");
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "Textbox placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

    if (!skipRigs)  {
        stepStarted = new Date();
        addRigs();
        sculpt();
            stepEnded = new Date();
            playSound("put rig sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "Rig placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipBGs) {
    stepStarted = new Date();
    placeDesks();
        stepEnded = new Date();
        playSound("put desk sound here");
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "Desk placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

    stepStarted = new Date();
    placeBGs();
        stepEnded = new Date();
        playSound("put background sound here");
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "Background placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipLines)  {
        stepStarted = new Date();
        addAllVoiceLines(voiceLineFolderPath);
            stepEnded = new Date();
            playSound("put voice lines sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "Voice line placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
        
        stepStarted = new Date();
        autoLipsyncDocument(pathToCFGs);
            stepEnded = new Date();
            playSound("put lipsync sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "Lipsyncing succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipBlinks) {
        stepStarted = new Date();
        //QUESTION: this is broken lol
        gammaBlink()
            stepEnded = new Date();
            playSound("put blinking sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "Automatic blinking succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    generationEnded = new Date();
    soundAlert("Scene generation completed successfully!\n\nTook: " + getTimeDiff(generationStarted, generationEnded));
    writeLogInfo(getCurrentDate(), status00, "Scene generation completed successfully! Took: " + getTimeDiff(generationStarted, generationEnded));
    fl.selectTool("arrow");
};

if (viewMode == "investigationMode") {
    generationStarted = new Date();
    stepStarted = new Date();
    doTextBoxes();
        stepEnded = new Date();
        playSound("put textbox sound here");
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "Textbox placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

    if (!skipRigs)  {
        stepStarted = new Date();
        addRigsInvestgation();
        sculptInvestgation();
            stepEnded = new Date();
            playSound("put rig sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "Rig placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipLines)  {
        stepStarted = new Date();
        addAllVoiceLines(voiceLineFolderPath);
            stepEnded = new Date();
            playSound("put voice lines sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "Voice line placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
        
        stepStarted = new Date();
        autoLipsyncDocument(cfgFolderPath);
            stepEnded = new Date();
            playSound("put lipsync sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "Lipsyncing succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipBlinks) {
        stepStarted = new Date();
        //QUESTION: this is broken lol
        gammaBlink()
            stepEnded = new Date();
            playSound("put blinking sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "Automatic blinking succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    generationEnded = new Date();
    soundAlert("Scene generation completed successfully! Took " + getTimeDiff(stepStarted, stepEnded));
    writeLogInfo(getCurrentDate(), status00, "Scene generation completed successfully! Took " + getTimeDiff(generationStarted, generationEnded));
    fl.selectTool("arrow");
};