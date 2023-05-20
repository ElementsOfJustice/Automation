/******************************************************************************
                                DEBUGGING BACKEND
******************************************************************************/

var status00 = "INFO ";
var status01 = "WARN ";
var status02 = "DEBUG";
var status03 = "ERROR";

var logFile = fl.configURI + "log.txt";

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

function initializeLog() {
    if (FLfile.exists(logFile)) {
        FLfile.remove(logFile);
    }

    FLfile.write(logFile, "");
}


function writeLogRaw(message) {
    FLfile.write(logFile, message + "\n", "append")
}


function writeLogInfo(timestamp, level, message) {
    FLfile.write(logFile, timestamp + " | " + level + " | " + message + "\n", "append");
}

function getCurrentDate() {
    return formatDateTime(new Date());
}

function logError(message) {
    soundError();
    writeLogInfo(getCurrentDate(), status03, message);
    throw new Error(message);
}

function logSetup() {
    writeLogRaw("Elements of Justice — Scene Generator Logs              ");
    writeLogRaw("                                                        ");
    writeLogRaw("Timestamp                    | Message                  ");
    writeLogRaw("--------------------------------------------------------");
}

function getTimeDiff(startTime, endTime) {
    timeDiff = endTime - startTime;
    timeDiff /= 1000;
    var seconds = Math.round(timeDiff);

    if (timeDiff < 60) {
        return (seconds + " seconds.");
    }

    if (timeDiff > 60) {
        var minutes = Math.floor(timeDiff / 60);
        var seconds = timeDiff - minutes * 60;
        return (minutes + " minutes and " + seconds + " seconds");
    }
}

initializeLog();
logSetup();

/******************************************************************************
                                C LIBRARY WRAPPERS
******************************************************************************/

var cLib = fl.configURI + "cLib.jsfl";

function validationCheck() {
    if (!FLfile.exists(cLib)) {
        throw new Error("cLib.jsfl does not exist in the user's configuration directory.");
    }
}

function beep(frequency, duration) {
    validationCheck()
    fl.runScript(cLib, "beep", frequency, duration);
}

function playSound(input) {
    validationCheck()
    fl.runScript(cLib, "playSound", input);
}

function soundError() {
    validationCheck()
    fl.runScript(cLib, "soundError");
}

function soundAlert(message) {
    fl.runScript(cLib, "soundAlert", message);
}

//END C WRAPPERS

//functions go here lol

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

function charArrayToString(charArray) {
    var str = "";
    for (var i = 0; i < charArray.length; i++) {
      str += charArray[i];
    }
    return str;
  }

function getKeys(input) {
	var arr = [];
	for (var i in input) {
		arr.push(i);
	}
	return arr;
}

function spreadMax(arr) {

    var result = arr.reduce(function (a, b) {
        return Math.max(a, b);
    });

    return result;
}

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

/******************************************************************************
                                INVOKE GUI
******************************************************************************/

var scriptPathURI = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
var guiPanel = fl.getDocumentDOM().xmlPanel(scriptPathURI + "/ui_sceneGenerator.xml");

if (guiPanel.dismiss == "accept") {
    fl.showIdleMessage(false); 

    var arrayPath = guiPanel.panel_sceneData;
    var driveLetter = arrayPath.charAt(0);
    arrayPath = arrayPath.substring(2, arrayPath.length);
    arrayPath = "file:///" + driveLetter + "|" + arrayPath.replace(/\\/g, "/").replace(/ /g, '%20');

    var viewMode = guiPanel.panel_viewMode;

    var defense = guiPanel.panel_Defense;
    var prosecutor = guiPanel.panel_Prosecutor;
    var judge = guiPanel.panel_Judge;
    var cocouncil = guiPanel.panel_Cocouncil;
    var witnesses = guiPanel.panel_allWitnesses.split(',');

    var eeBias = guiPanel.panel_eeBias;
    var chunkSize = guiPanel.panel_chunkSize;

 /*    var skipRigs = guiPanel.panel_skip01 == "true";
    var skipBGs = guiPanel.panel_skip02 == "true";
    var skipTypewriter = guiPanel.panel_skip03 == "true";
    var skipLines = guiPanel.panel_skip04 == "true";
    var skipBlinks = guiPanel.panel_skip05 == "true"; */

    var skipRigs = false;
    var skipBGs = true;
    var skipTypewriter = true;
    var skipLines = false;
    var skipBlinks = true;

    var pathToSceneData = guiPanel.panel_sceneData;
    var pathToCFGs = FLfile.platformPathToURI(guiPanel.panel_folderCFG);
    var pathToLines = FLfile.platformPathToURI(guiPanel.panel_folderLines);

    pathToCFGs = pathToCFGs.substring(0, pathToCFGs.lastIndexOf("/"));
    pathToCFGs = FLfile.uriToPlatformPath(pathToCFGs);

    pathToLines = pathToLines.substring(0, pathToLines.lastIndexOf("/"));
    pathToLines = FLfile.uriToPlatformPath(pathToLines);

    var writeReport = guiPanel.panel_writeReport;

    //You've heard of sanity checks? Here, we're checking to see if the user is insane.
    if (!skipLines && skipRigs) {
        logError("You have attempted to skip rig placement, but not skip line insertion. You are insane.");
    };

    if (!skipLines && ((pathToCFGs == "") || (pathToLines == ""))) {
        logError("Both a path to the CFG files and voice lines are required for line placement.");
    };

    fl.runScript(arrayPath); // load sceneData
    fl.runScript(scriptPathURI + "/config.txt"); // load configuration file

    var check_masterInvestigationArray = getKeys(masterInvestigationArray );

    for (var i = 0; i < sceneData.length; i++) {
        if (skipRigs) break;
        if (check_masterInvestigationArray.indexOf(sceneData[i][2]) === -1) {
            logError('An entry for ' + sceneData[i][2] + "'s rig is not included in masterInvestigationArray .");
        }
        if (!fl.getDocumentDOM().library.itemExists(masterInvestigationArray [sceneData[i][2]][1])) {
            logError("Library path to " + sceneData[i][2] + "'s rig does not exist.");
        }
    }
} else {
    logError("The user stopped execution.");
}

/******************************************************************************
                                MAIN FUNCTIONS
******************************************************************************/

function switchActive(layerVar) {
    var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
    if (layerIndex == null) {
        fl.getDocumentDOM().getTimeline().addNewLayer(layerVar);
        layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
    }
    fl.getDocumentDOM().getTimeline().currentLayer = layerIndex * 1;
    propertiesLayer = fl.getDocumentDOM().getTimeline().layers[layerIndex];
}

function goTo(inputString) {
	var lineIndex = parseInt(inputString.substring(3, 6), 10);
	var sceneIndex = Math.ceil(lineIndex / chunkSize);

	fl.getDocumentDOM().editScene(sceneIndex - 1);

	var timeline = fl.getDocumentDOM().getTimeline();
	var textLayer = timeline.layers[timeline.findLayerIndex("TEXT")];
	var keyframes = textLayer.frames;

	for (var i = 0; i < keyframes.length; i++) {
		var frame = keyframes[i];

		if (frame.name === inputString) {
			timeline.currentFrame = i;
			break;
		}

		var nextFrameIndex = i + frame.duration;

		i = nextFrameIndex - 1;
	}
}

function doTextBoxes() {

    var dialogueBounding = {
        left: (40.05)*2,
        top: (549.5)*2,
        right: (1212.95)*2,
        bottom: (708.95)*2
    };

    var speakerBounding = {
        left: (20.05)*2,
        top: (482.5)*2,
        right: (254.4)*2,
        bottom: (540.2)*2
    };
    
    var curFrame = 0;
    var currentScene = 1;
    
    for (var i = 0; i < sceneData.length; i++) {

        if (sceneData[i][0] != "dialogue") continue;

        var lineID = sceneData[i][1];
        var speakerName = sceneData[i][2];
        var dialogue = sceneData[i][3];

        for (var j = 0; j < nameswapArray.length; j++) {
            if (speakerName == nameswapArray[j][0]) speakerName = nameswapArray[j][1];
        }

        var lineIndex = parseInt(lineID.substring(3, 6), 10);
        var sceneIndex = Math.ceil(lineIndex / chunkSize);

        if (sceneIndex != currentScene) {
            fl.getDocumentDOM().addNewScene("Scene " + sceneIndex);
            fl.getDocumentDOM().editScene(sceneIndex - 1);
            writeLogInfo(getCurrentDate(), status00, "Added Scene " + sceneIndex);
            currentScene = sceneIndex;
            curFrame = 0;
        };

        if (fl.getDocumentDOM().getTimeline().findLayerIndex("TEXTBOX") == null) {
            switchActive("TEXTBOX");
            fl.getDocumentDOM().addItem({
                x: 0,
                y: 0
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            writeLogInfo(getCurrentDate(), status00, "Added Textbox in Scene " + currentScene + ".");
            fl.getDocumentDOM().swapElement("OTHER ASSETS/Textbox");
            var textbox = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXTBOX")[0]].frames[0].elements[0];
            textbox.loop = "single frame";
            textbox.scaleX = 1.34164876055;
            textbox.scaleY = 1.34152669671;
            fl.getDocumentDOM().align("horizontal center", true);
            fl.getDocumentDOM().align("bottom", true);
        };

        switchActive("TEXT");
        var curLayer = fl.getDocumentDOM().getTimeline().currentLayer;
        var isKeyframe = curFrame == fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].startFrame;

        if (!isKeyframe) {
            fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(curFrame);
        }

        fl.getDocumentDOM().getTimeline().currentFrame = curFrame;
        fl.getDocumentDOM().addNewText(dialogueBounding);

        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextString(trim(dialogue));
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr('alignment', 'left');
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].textType = 'dynamic';
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].lineType = 'multiline';
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].name = 'txt';
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].fontRenderingMode = 'standard';
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("face", "Suburga 2 Semi-condensed Regular");
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("size", 80);
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("fillColor", 0xffffff);
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("letterSpacing", 2);
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("lineSpacing", 1);

        if (dialogue.indexOf('(') > -1) {
            fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("face", "Suburga 2 Semi-condensed Regular");
            fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("size", 84);
            fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("fillColor", 0x008fff);
            fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("letterSpacing", 2);
            fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("lineSpacing", 1);
        }

        if (speakerName == "Widget") {
            fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[0].setTextAttr("fillColor", 0xD7D700);
        }

        fl.getDocumentDOM().addNewText(speakerBounding);
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].setTextString(speakerName);
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].setTextAttr("alignment", "left");
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].textType = 'dynamic';
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].lineType = 'multiline';
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].name = 'txt';
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].fontRenderingMode = 'standard';
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].setTextAttr("face", "Suburga 2 Semi-condensed Regular");
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].setTextAttr("size", 84);
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].setTextAttr("fillColor", 0xffffff);
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].setTextAttr("letterSpacing", 2);

        for (var j = 0; j < letterSpacingArray.length; j++) {
            if (speakerName == letterSpacingArray[j][0]) {
                fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].elements[1].setTextAttr("letterSpacing", (letterSpacingArray[j][1]));
            }
        }

        //This causes cushioning frames at end of timeline.
        //This fella is wrong ^, it's sculpt that does this, as evidenced by the fact it's end-of-layer.
        fl.getDocumentDOM().getTimeline().layers[curLayer].frames[curFrame].name = lineID;
        if ((curFrame + iFrameDuration) >= fl.getDocumentDOM().getTimeline().layers[curLayer].frames.length) {
            fl.getDocumentDOM().getTimeline().insertFrames(iFrameDuration, true);
        };

        curFrame += iFrameDuration;
    }

    totalChunks = currentScene;

}

function getCharacters() {
    var unique = [];
    for (var i = 0; i < sceneData.length; i++) {
        if (sceneData[i][0] != "dialogue") continue;
        for (var character in sceneData[i][2].split(" & ")) {
            unique.push(trim(sceneData[i][2].split(" & ")[character]));
        }
    }
    unique = unique.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });
    return unique;
}

function addRigsInvestgation() {
    var uniqueChars = getCharacters();

    for (var h = 0; h < totalChunks; h++) {
        fl.getDocumentDOM().editScene(h);

        if (fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS") == null) {
            fl.getDocumentDOM().getTimeline().addNewLayer("VECTOR_CHARACTERS");
            vectorCharactersLayer = fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS");
            fl.getDocumentDOM().getTimeline().layers[vectorCharactersLayer].layerType = "folder";

        };

        for (var i = 0; i < uniqueChars.length; i++) {
            switchActive(masterInvestigationArray [uniqueChars[i]][0]);
            fl.getDocumentDOM().getTimeline().currentFrame = 0;
            fl.getDocumentDOM().addItem({
                x: 0,
                y: 0
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            writeLogInfo(getCurrentDate(), status00, "Added Rig: " + masterInvestigationArray [uniqueChars[i]][0] + " at " + masterInvestigationArray [uniqueChars[i]][1]);
            fl.getDocumentDOM().swapElement(masterInvestigationArray [uniqueChars[i]][1]);
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[0].elements[0].setTransformationPoint({ x: 0, y: 0 });
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[0].elements[0].transformX = 0;
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[0].elements[0].transformY = 0;
            fl.getDocumentDOM().getTimeline().reorderLayer(fl.getDocumentDOM().getTimeline().currentLayer, (fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS")[0] + 1));
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].parentLayer = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS")[0]];
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].visible = false;
        };
    };
}

//WARNING/TODO/QUESTION: This needs to work per-chunk
function buildLayerStructure() {
    var textLayerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")[0];
    var visualsLayer = fl.getDocumentDOM().getTimeline().findLayerIndex("VISUALS");

    if (visualsLayer == null) {
        fl.getDocumentDOM().getTimeline().addNewLayer("VISUALS");
        fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("VISUALS")].layerType = "folder";
    };

    var visualsLayer = fl.getDocumentDOM().getTimeline().findLayerIndex("VISUALS")[0];

    fl.getDocumentDOM().getTimeline().reorderLayer(textLayerIndex, visualsLayer + 1);
    fl.getDocumentDOM().getTimeline().reorderLayer(fl.getDocumentDOM().getTimeline().findLayerIndex("TEXTBOX")[0], visualsLayer + 2);
    fl.getDocumentDOM().getTimeline().layers[textLayerIndex].parentLayer = fl.getDocumentDOM().getTimeline().layers[visualsLayer];
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("TEXTBOX")[0]].parentLayer = fl.getDocumentDOM().getTimeline().layers[visualsLayer];
};

function poseAutomation(layerIndex, i, curFrame) {

    var poseFrameNum = getPoseFromEmotion(layerIndex, i, curFrame);

    if (poseFrameNum != -1) {
        fl.getDocumentDOM().getTimeline().layers[layerIndex * 1].frames[curFrame].elements[0].firstFrame = poseFrameNum;
    } else {
        fl.getDocumentDOM().getTimeline().layers[layerIndex * 1].frames[curFrame].elements[0].firstFrame = 0;
    }
}

function getPoseFromEmotion(layerIndex, i, curFrame) {
    var itemIndex = fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerIndex * 1].frames[curFrame].elements[0].libraryItem.name)
    var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[fl.getDocumentDOM().library.items[itemIndex].timeline.layers.length - 1];
    var xSheet = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0];
    var eeInput = sceneData[i][4];

    if (eeInput == "") {
        eeInput = "-";
    };

    var poseFrameNum = -1;
    var tmpArray = [];

    for (var iter = 0; iter < objTl.frameCount; iter+= objTl.frames[iter].duration) {
        if ((objTl.frames[iter].labelType == "name") && (iter == objTl.frames[iter].startFrame)) {
            tmpArray.push(levenshteinRatio(objTl.frames[iter].name, eeInput));
            if (spreadMax(tmpArray) == tmpArray[tmpArray.length - 1]) {
                poseFrameNum = iter;
            };
        };
    };
    
    if (poseFrameNum != -1) {
        writeLogInfo(getCurrentDate(), status00, "emotionEngine input " + eeInput + " yielded pose " + xSheet.frames[poseFrameNum].name + ", for character " + fl.getDocumentDOM().getTimeline().layers[layerIndex * 1].name + ".");
    } else {
        writeLogInfo(getCurrentDate(), status00, "emotionEngine input " + eeInput + " yielded no pose.");
    };

    return poseFrameNum;
};

function sculptInvestgation() {
    var uniqueChars = getCharacters();

    for (var i = sceneData.length - 2; i >= 0; i--) {
        if (sceneData[i][0] != "dialogue") continue;

        var currentLineID = sceneData[i][1];
        var frameToConsider = iFrameDuration * (i % chunkSize);
        var isPov = sceneData[i][2] == defense;
        
        goTo(currentLineID);

        if (sceneData[i][2] == defense && i != 0) {
            var tempI = i;
            while (tempI > 0 && sceneData[tempI][2] == defense) {
                tempI--;
            }
            sceneData[i][2] = (tempI != 0) ? sceneData[tempI][2] : sceneData[i][2];
        }
        
        var characterIndex = 0; // for distributing multiple characters on screen

        for (var j = 0; j < uniqueChars.length; j++) {
            if (masterInvestigationArray[uniqueChars[j]] === undefined) {
                continue;
            }
            var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(masterInvestigationArray[uniqueChars[j]][0]);
            //fl.getDocumentDOM().getTimeline().currentFrame = frameToConsider;
            if ((i % chunkSize == 0) && (sceneData[i][2].indexOf(uniqueChars[j]) == -1)) { /// make blank keyframe on inactive character for the first frame (inserting blank keyframe causes weirdness)
                switchActive(masterInvestigationArray[uniqueChars[j]][0]);
                fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(frameToConsider + 1);
                fl.getDocumentDOM().getTimeline().clearKeyframes(frameToConsider);
            }
            else if (sceneData[i][2].indexOf(uniqueChars[j]) > -1) { // make keyframe on active character
                switchActive(masterInvestigationArray[uniqueChars[j]][0]);
                if (i != 0) {
                    fl.getDocumentDOM().getTimeline().convertToKeyframes(frameToConsider);
                } else {
                    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].visible = true;
                }
                var numChars = sceneData[i][2].split(" & ").length;
                numChars -= (sceneData[i][2].indexOf(defense) > -1) ? 1 : 0;
                if (numChars > 1) { // multiple characters on screen, distribute them evenly
                    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].visible = true;
                    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[frameToConsider].elements[0].transformX(getAlignmentPos(numChars, characterIndex).x);
                    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].visible = false;
                    characterIndex++;
                }

                if (!isPov) {
                    poseAutomation(layerIndex, i, frameToConsider);
                }

                if (sceneData[i][2] != sceneData[i + 1][2]) {
                    fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(frameToConsider + iFrameDuration);
                }
            }
        }
    }
}

function addAllVoiceLines(voiceLineFolderPath) {
    var missedLines = fl.runScript(fl.configURI + "Commands/QoL%20Commands/dev_LineAdder_core.jsfl", "insertLinesChunked", voiceLineFolderPath, chunkSize, totalChunks);

    var allMissedLines = charArrayToString(missedLines);
    allMissedLines = allMissedLines.split(",");

    for (var i = 0; i < allMissedLines.length; i++) {
        writeLogInfo(getCurrentDate(), status01, allMissedLines[i]);
    };
};

function autoLipsyncDocument(cfgFolderPath) {
    fl.runScript(fl.configURI + "Commands/Lipsyncing/dev_c3_LipSync_core.jsfl", "runLipsyncingDoc", cfgFolderPath);
};

/******************************************************************************
                                MAIN EXECUTION
******************************************************************************/

fl.getDocumentDOM().editScene(0);
var iFrameDuration = 12;
var totalChunks = 0;

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
        writeLogInfo(getCurrentDate(), status00, "[!] Desk placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

    stepStarted = new Date();
    placeBGs();
        stepEnded = new Date();
        playSound("put background sound here");
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Background placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipLines)  {
        stepStarted = new Date();
        addAllVoiceLines(pathToLines);
            stepEnded = new Date();
            playSound("put voice lines sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "[!] Voice line placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
        
        stepStarted = new Date();
        //autoLipsyncDocument(pathToCFGs);
            stepEnded = new Date();
            playSound("put lipsync sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "[!] Lipsyncing succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipBlinks) {
        stepStarted = new Date();
        //QUESTION: this is broken lol
        gammaBlink()
            stepEnded = new Date();
            playSound("put blinking sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "[!] Automatic blinking succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    generationEnded = new Date();
    soundAlert("Scene generation completed successfully!\n\nTook: " + getTimeDiff(generationStarted, generationEnded));
    writeLogInfo(getCurrentDate(), status00, "[!] Scene generation completed successfully! Took: " + getTimeDiff(generationStarted, generationEnded));
    fl.selectTool("arrow");
};

if (viewMode == "investigationMode") {
    generationStarted = new Date();
    stepStarted = new Date();
    playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/ADDING TEXT.wav");
    doTextBoxes();
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Textbox placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

    if (!skipRigs)  {
        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/PLACING RIGS.wav");
        addRigsInvestgation();
            stepEnded = new Date();
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "[!] Rig placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));   
        stepStarted = new Date();
        sculptInvestgation();
            stepEnded = new Date();
            soundAlert();
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "[!] Rig sculpting succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipLines)  {
        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/ADDING ALL VOICE LINES.wav");
        addAllVoiceLines(pathToLines);
            stepEnded = new Date();
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "[!] Voice line placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
        
        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/LIPSYNCING ALL CHARACTERS.wav");
        autoLipsyncDocument(FLfile.platformPathToURI(pathToCFGs));
            stepEnded = new Date();
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "[!] Lipsyncing succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipBlinks) {
        stepStarted = new Date();
        //QUESTION: this is broken lol
        gammaBlink()
            stepEnded = new Date();
            playSound("put blinking sound here");
            getTimeDiff(stepStarted, stepEnded);
            writeLogInfo(getCurrentDate(), status00, "[!] Automatic blinking succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    generationEnded = new Date();
    soundAlert("Scene generation completed successfully! Took " + getTimeDiff(generationStarted, generationEnded));
    writeLogInfo(getCurrentDate(), status00, "[!] Scene generation completed successfully! Took " + getTimeDiff(generationStarted, generationEnded));
    fl.selectTool("arrow");
};