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
        var seconds = parseInt(timeDiff - minutes * 60);
        return (minutes + " minutes and " + seconds + " seconds");
    }
}

initializeLog();
logSetup();

/******************************************************************************
                                C LIBRARY WRAPPERS
******************************************************************************/

var cLib = fl.configURI + "Commands/cLib.jsfl";

function validationCheck() {
    if (!FLfile.exists(cLib)) {
        throw new Error("cLib.jsfl does not exist in the user's Commands directory.");
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
    var skipBGs = false;
    var skipTypewriter = false;
    var skipLines = false;
    var skipFades = false;
    var skipBlinks = false;

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

    var check_masterInvestigationArray = getKeys(masterInvestigationArray);
    var check_masterRigArray = getKeys(masterRigArray);

    for (var i = 0; i < sceneData.length; i++) {
        if (skipRigs) break;
        if (viewMode == "courtMode") break;
        if (check_masterInvestigationArray.indexOf(sceneData[i][2]) === -1) {
            logError('An entry for ' + sceneData[i][2] + "'s rig is not included in masterInvestigationArray.");
        }
        if (!fl.getDocumentDOM().library.itemExists(masterInvestigationArray[sceneData[i][2]][1])) {
            logError("Library path to " + sceneData[i][2] + "'s rig does not exist.");
        }
    }

    for (var i = 0; i < sceneData.length; i++) {
        if (skipRigs) break;
        if (viewMode == "investigationMode") break;
        if (check_masterRigArray.indexOf(sceneData[i][2]) === -1) {
            logError('An entry for ' + sceneData[i][2] + "'s rig is not included in masterRigArray.");
        }
        if (!fl.getDocumentDOM().library.itemExists(masterRigArray[sceneData[i][2]][1])) {
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
    if (layerIndex == undefined) {
        fl.getDocumentDOM().getTimeline().addNewLayer(layerVar);
        layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
    }
    fl.getDocumentDOM().getTimeline().currentLayer = layerIndex[0];
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

function inputValidation() {
    var flagMissingCFG = false;
    var flagMissingVOX = false;

    for (var i = 0; i < sceneData.length; i++) {
        if (sceneData[i][0] != "dialogue") continue;
        var checkCFG = FLfile.platformPathToURI(pathToCFGs + "/" + sceneData[i][1] + ".cfg");
        if (!FLfile.exists(checkCFG)) {
            writeLogInfo(getCurrentDate(), status01, "Missing CFG: " + sceneData[i][1] + ".cfg");
            flagMissingCFG = true;
        };
    };

    for (var i = 0; i < sceneData.length; i++) {
        if (sceneData[i][0] != "dialogue") continue;
        var checkCFG = FLfile.platformPathToURI(pathToLines + "/" + sceneData[i][1] + ".flac");
        if (!FLfile.exists(checkCFG)) {
            writeLogInfo(getCurrentDate(), status01, "Missing Voice Line: " + sceneData[i][1] + ".flac");
            flagMissingVOX = true;
        };
    };
    var continueExecution = true;
    if (flagMissingCFG && flagMissingVOX) {
        soundAlert()
        continueExecution = confirm("Both CFGs and Voice Lines are missing from your input data. Check the log to see which files are missing. \n\n Do you want to continue?");
    } else if (flagMissingCFG) {
        soundAlert()
        continueExecution = confirm("CFGs are missing from your input data. Check the log to see which files are missing. \n\n Do you want to continue?");
    } else if (flagMissingVOX) {
        soundAlert()
        continueExecution = confirm("Voice Lines are missing from your input data. Check the log to see which files are missing. \n\n Do you want to continue?");
    };

    if (!continueExecution) {
        soundError()
        writeLogInfo(getCurrentDate(), status00, "The user decided to stop execution.");
        throw new Error("The user decided to stop execution.");
    }
};

function negativeEmotionBias(input, bias) {
    var result = '';
    var opposites = {
        '+': '-',
        '-': '+',
        'H': 'B',
        'B': 'H',
        'F': 'T',
        'T': 'F',
    };

    for (var i = 0; i < input.length; i++) {
        var currentChar = input[i];
        var isOpposite = false;
        for (var j = 0; j < bias.length; j++) {
            var biasChar = bias[j];
            if (currentChar === opposites[biasChar]) {
                isOpposite = true;
                bias = bias.substring(0, j) + bias.substring(j + 1);
                break;
            }
        }
        if (!isOpposite) {
            result += currentChar;
        }
    }
    return result;
}

function emotionAverage(str1, str2) {
    //Create a map to keep track of character counts
    var charMap = {};

    //Loop through the first string and update charMap accordingly
    for (var i = 0; i < str1.length; i++) {
        if (charMap[str1[i]] === undefined) {
            charMap[str1[i]] = 1;
        } else {
            charMap[str1[i]]++;
        }
    }

    //Loop through the second string and update charMap accordingly
    for (var j = 0; j < str2.length; j++) {
        if (charMap[str2[j]] === undefined) {
            charMap[str2[j]] = 1;
        } else {
            charMap[str2[j]]++;
        }
    }

    //Remove opposites and limit the number of each character
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

    //Sort the characters in the result string
    result = result.split('').sort(function (a, b) {
        var order = '++--HHBBRRAAGGFFSSTTC';
        return order.indexOf(a) - order.indexOf(b);
    }).join('');

    return result;
}

function pruneEmotionEngineData() {

    //Apply emotionEngine bias.
    for (var i = 0; i < sceneData.length; i++) {
        sceneData[i][4] = negativeEmotionBias(sceneData[i][4], eeBias);
    }

    var averagedEmotions = [];

    //Smooth out transient emotions.
    for (var i = 1; i < sceneData.length - 1; i++) {
        // Check if the third element between the current and previous arrays are equivalent
        if (sceneData[i][2] === sceneData[i - 1][2]) {
            var avgEmotion = emotionAverage(sceneData[i - 1][4], sceneData[i][4]);
            averagedEmotions[i] = avgEmotion;
        } else {
            averagedEmotions[i] = "";
        }
    }

    // Update the sceneData array with the averaged emotions
    for (var i = 1; i < sceneData.length - 1; i++) {
        if (averagedEmotions[i] !== "") {
            sceneData[i][4] = averagedEmotions[i];
        }
    }
}

function doTextBoxes() {

    var dialogueBounding = {
        left: (40.05) * 2,
        top: (549.5) * 2,
        right: (1212.95) * 2,
        bottom: (708.95) * 2
    };

    var speakerBounding = {
        left: (20.05) * 2,
        top: (482.5) * 2,
        right: (254.4) * 2,
        bottom: (540.2) * 2
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
        switchActive("TEXT"); // believe it or not, something up there causes the selected layer to change
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

function addRigs(characterArray) {
    var uniqueChars = getCharacters();

    for (var h = 0; h < totalChunks; h++) {
        fl.getDocumentDOM().editScene(h);

        if (fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS") == null) {
            fl.getDocumentDOM().getTimeline().addNewLayer("VECTOR_CHARACTERS");
            vectorCharactersLayer = fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS");
            fl.getDocumentDOM().getTimeline().layers[vectorCharactersLayer].layerType = "folder";
        };

        for (var i = 0; i < uniqueChars.length; i++) {
            //Some polymorphism for you Conzor (wink)
            if ((uniqueChars[i] == defense) && (viewMode == "investigationMode")) continue;
            switchActive(characterArray[uniqueChars[i]][0]);
            fl.getDocumentDOM().getTimeline().currentFrame = 0;
            fl.getDocumentDOM().addItem({
                x: 0,
                y: 0
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            writeLogInfo(getCurrentDate(), status00, "Added Rig: " + characterArray[uniqueChars[i]][0] + " at " + characterArray[uniqueChars[i]][1]);
            fl.getDocumentDOM().swapElement(characterArray[uniqueChars[i]][1]);
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[0].elements[0].setTransformationPoint({ x: 0, y: 0 });
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[0].elements[0].transformX = 0;
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[0].elements[0].transformY = 0;
            fl.getDocumentDOM().getTimeline().reorderLayer(fl.getDocumentDOM().getTimeline().currentLayer, (fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS")[0] + 1));
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].parentLayer = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS")[0]];
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().currentLayer].frames[0].elements[0].loop = "single frame";
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

    for (var iter = 0; iter < objTl.frameCount; iter += objTl.frames[iter].duration) {
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

function sculpt(characterArray) {
    var uniqueChars = getCharacters();

    for (var i = sceneData.length - 2; i >= 0; i--) {
        if (sceneData[i][0] != "dialogue") continue;

        var currentLineID = sceneData[i][1];
        var frameToConsider = iFrameDuration * (i % chunkSize);
        var isPov = sceneData[i][2] == defense;

        goTo(currentLineID);

        if ((sceneData[i][2] == defense && i != 0) && (viewMode == "investigationMode")) {
            var tempI = i;
            while (tempI > 0 && sceneData[tempI][2] == defense) {
                tempI--;
            }
            sceneData[i][2] = (tempI != 0) ? sceneData[tempI][2] : sceneData[i][2];
        }

        var characterIndex = 0; // for distributing multiple characters on screen

        for (var j = 0; j < uniqueChars.length; j++) {
            if (characterArray[uniqueChars[j]] === undefined) {
                continue;
            }
            //Some polymorphism for you Conzor AGAIN (wink)x2
            if((uniqueChars[j] == defense) && (viewMode == "investigationMode")) continue;
            var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(characterArray[uniqueChars[j]][0]);
            //fl.getDocumentDOM().getTimeline().currentFrame = frameToConsider;
            if ((i % chunkSize == 0) && (sceneData[i][2].indexOf(uniqueChars[j]) == -1)) { /// make blank keyframe on inactive character for the first frame (inserting blank keyframe causes weirdness)
                switchActive(characterArray[uniqueChars[j]][0]);
                fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(frameToConsider + 1);
                fl.getDocumentDOM().getTimeline().clearKeyframes(frameToConsider);
            }
            else if (sceneData[i][2].indexOf(uniqueChars[j]) > -1) { // make keyframe on active character
                switchActive(characterArray[uniqueChars[j]][0]);
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

                if (viewMode == "investigationMode") {
                    if (!isPov) {
                        poseAutomation(layerIndex, i, frameToConsider);
                    }
                } else {poseAutomation(layerIndex, i, frameToConsider)};

                if (sceneData[i][2] != sceneData[i + 1][2]) {
                    fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(frameToConsider + iFrameDuration);
                }
            }
        }
    }
}

// WARNING: THIS IS NOT TOO PERFORMANT, BUT NOT TOO UNPERFORMANT. DOES THIS NEED DE-SELECTIFICATION?
// please optimize this, future soundman.....
function jamFades() {
    for (var i = 0; i <= sceneData.length - 1; i++) {
        if (sceneData[i][0] != "dialogue") continue;

        var currentLineID = sceneData[i][1];
        var lineIndex = parseInt(currentLineID.substring(3, 6), 10);
        var jamFadeDuration = 14;

        goTo(currentLineID);

        if ((i == 0) || (i == sceneData.length - 1)) {
            var doesMCspeakBeforeOrAfterThisLine = false;
            var doesTheSameCharacterSpeakBeforeThisLine = false;
        } else {
            var doesMCspeakBeforeOrAfterThisLine = ((sceneData[i - 1][2] == defense) || (sceneData[i + 1][2] == defense));
            var doesTheSameCharacterSpeakBeforeThisLine = ((sceneData[i - 1][2] == sceneData[i][2]));
        };

        if (doesMCspeakBeforeOrAfterThisLine || doesTheSameCharacterSpeakBeforeThisLine) { continue };

        if (lineIndex % chunkSize === 1) {
            //First fade in a chunk.
            switchActive("JAM_MASK");
            fl.getDocumentDOM().getTimeline().currentFrame = 0;

            fl.getDocumentDOM().addItem({
                x: 0,
                y: 0
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            fl.getDocumentDOM().swapElement("OTHER ASSETS/Jam_Fade");

            fl.getDocumentDOM().align("vertical center", true);
            fl.getDocumentDOM().align("horizontal center", true);

            fl.getDocumentDOM().getTimeline().insertFrames(7, true);

            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("JAM_MASK")[0]].frames[0].elements[0].firstFrame = 9;
            switchActive("JAM_MASK");
            fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(6, 6);

            writeLogInfo(getCurrentDate(), status00, currentLineID + " is the first fade in a chunk.");
        } else if ((lineIndex % chunkSize === 0) || (i == sceneData.length - 1)) {
            //Last fade in a chunk.

            //WARNING: This technically works, but not with the current cushioning of frames at the end of chunks.
            switchActive("JAM_MASK");
            fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().frameCount - 1;
            fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame);

            fl.getDocumentDOM().addItem({
                x: 0,
                y: 0
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            fl.getDocumentDOM().swapElement("OTHER ASSETS/Jam_Fade");

            fl.getDocumentDOM().align("vertical center", true);
            fl.getDocumentDOM().align("horizontal center", true);

            fl.getDocumentDOM().getTimeline().insertFrames(7, true);

            writeLogInfo(getCurrentDate(), status00, currentLineID + " is the last fade in a chunk.");
        } else {
            //Regular jamFade.
            switchActive("JAM_MASK");
            fl.getDocumentDOM().getTimeline().currentFrame = fl.getDocumentDOM().getTimeline().currentFrame - 1;
            fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame);

            fl.getDocumentDOM().addItem({
                x: 0,
                y: 0
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            fl.getDocumentDOM().swapElement("OTHER ASSETS/Jam_Fade");

            fl.getDocumentDOM().align("vertical center", true);
            fl.getDocumentDOM().align("horizontal center", true);

            fl.getDocumentDOM().getTimeline().insertFrames(6, true);
            goTo(currentLineID);
            fl.getDocumentDOM().getTimeline().insertFrames(8, true);
            switchActive("JAM_MASK");
            fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame);

            writeLogInfo(getCurrentDate(), status00, currentLineID + " is a middle fade in a chunk.");
        }
    }
};

function automaticBlinking() {
    for (var i = 0; i < totalChunks; i++) {
        fl.getDocumentDOM().editScene(i);
        var vectorCharactersLayer = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("VECTOR_CHARACTERS")[0]];
        for (var j = 0; j <= fl.getDocumentDOM().getTimeline().layerCount - 1; j++) {
            if (fl.getDocumentDOM().getTimeline().layers[j].parentLayer != vectorCharactersLayer) { continue };
            fl.getDocumentDOM().getTimeline().setSelectedLayers(j);
            gammaBlink(6);
        }
    }
};

function addAllVoiceLines(voiceLineFolderPath) {

    var missedLines = fl.runScript(fl.configURI + "Commands/QoL%20Commands/dev_LineAdder_core.jsfl", "insertLinesChunked", voiceLineFolderPath, chunkSize, totalChunks);

    var allMissedLines = charArrayToString(missedLines);
    allMissedLines = allMissedLines.split(",");

    writeLogInfo(getCurrentDate(), status01, "You missed these many voice lines: " + allMissedLines.length);
    for (var i = 0; i < allMissedLines.length - 1; i++) {
        writeLogInfo(getCurrentDate(), status01, "Missed voice line: " + allMissedLines[i]);
    }
};

function autoLipsyncDocument(cfgFolderPath) {
    fl.runScript(fl.configURI + "Commands/Lipsyncing/dev_c3_LipSync_core.jsfl", "runLipsyncingDoc", cfgFolderPath, writeLogInfo, getCurrentDate);
};

function gammaBlink(mean) {
    fl.runScript(fl.configURI + "Commands/Blinking/dev_GammaBlink_core.jsfl", "autoBlink", mean);
};

function placeDesks() {
    fl.getDocumentDOM().getTimeline().currentFrame = 0;
    
    for (var i = 0; i < sceneData.length; i++) {
        if(i % chunkSize == 0) {
            fl.getDocumentDOM().editScene(Math.floor(i / chunkSize));
            fl.getDocumentDOM().getTimeline().currentFrame = 0;
            switchActive("DESKS");
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("DESKS")[0]].parentLayer = null;
        }    
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        if (fl.getDocumentDOM().getTimeline().currentFrame != 0) {
            fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
        }
        if (masterDeskArray[sceneData[i][2]] == undefined) {
            fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
            continue;
        }
        fl.getDocumentDOM().addItem({
            x: masterDeskArray[sceneData[i][2]][1],
            y: masterDeskArray[sceneData[i][2]][2]
        }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
        fl.getDocumentDOM().swapElement(masterDeskArray[sceneData[i][2]][0]);
        fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
    }
}

function placeBGs() {
    fl.getDocumentDOM().getTimeline().currentFrame = 0;
    for (var i = 0; i < sceneData.length; i++) {
        if(i % chunkSize == 0) {
            fl.getDocumentDOM().editScene(Math.floor(i / chunkSize));
            fl.getDocumentDOM().getTimeline().currentFrame = 0;
            switchActive("BACKGROUNDS");
            fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex("BACKGROUNDS")[0]].parentLayer = null;
        } 
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        if (fl.getDocumentDOM().getTimeline().currentFrame != 0) {
            fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
        } 
        if (courtmodeBackgroundsArray[sceneData[i][2]] == undefined) {
            fl.getDocumentDOM().addItem({
                x: 640,
                y: 360
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            fl.getDocumentDOM().swapElement("BACKGROUNDS/Full-Courtroom");
            fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
            continue;
        }

        fl.getDocumentDOM().addItem({
            x: courtmodeBackgroundsArray[sceneData[i][2]][1],
            y: courtmodeBackgroundsArray[sceneData[i][2]][2]
        }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
        fl.getDocumentDOM().swapElement(courtmodeBackgroundsArray[sceneData[i][2]][0]);
        fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
    }
}

/******************************************************************************
                                MAIN EXECUTION
******************************************************************************/

fl.getDocumentDOM().editScene(0);
var iFrameDuration = 24;
var totalChunks = 0;

if (viewMode == "courtMode") {
    inputValidation();
    generationStarted = new Date();
    stepStarted = new Date();
    playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/ADDING TEXT.wav");
    doTextBoxes();
    stepEnded = new Date();
    getTimeDiff(stepStarted, stepEnded);
    writeLogInfo(getCurrentDate(), status00, "[!] Textbox placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

    if (!skipRigs) {
        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/ADDING ALL RIGS.wav");
        addRigs(masterRigArray);
        sculpt(masterRigArray);
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Rig placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipBGs) {
        stepStarted = new Date();
        playSound("/Notifications/ADDING ALL DESKS.wav");
        placeDesks();
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Desk placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

        stepStarted = new Date();
        playSound("/Notifications/ADDING ALL BACKGROUNDS.wav");
        placeBGs();
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Background placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipLines) {
        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/ADDING ALL THE VOICE LINES.wav");
        addAllVoiceLines(pathToLines);
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Voice line placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/LIPSYNCING ALL CHARACTERS.wav");
        autoLipsyncDocument(pathToCFGs);
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Lipsyncing succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipBlinks) {
        stepStarted = new Date();
        //QUESTION: this is broken lol
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/AUTOMATING BLINKING.wav");
        automaticBlinking();
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Automatic Blinking succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    generationEnded = new Date();
    soundAlert("Scene generation completed successfully!\n\nTook: " + getTimeDiff(generationStarted, generationEnded));
    writeLogInfo(getCurrentDate(), status00, "[!] Scene generation completed successfully! Took: " + getTimeDiff(generationStarted, generationEnded));
    fl.selectTool("arrow");
};

if (viewMode == "investigationMode") {
    inputValidation();
    pruneEmotionEngineData();
    generationStarted = new Date();
    stepStarted = new Date();
    playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/ADDING TEXT.wav");
    doTextBoxes();
    stepEnded = new Date();
    getTimeDiff(stepStarted, stepEnded);
    writeLogInfo(getCurrentDate(), status00, "[!] Textbox Placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

    if (!skipRigs) {
        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/ADDING ALL RIGS.wav");
        addRigs(masterInvestigationArray);
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Rig Placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
        stepStarted = new Date();
        sculpt(masterInvestigationArray);
        stepEnded = new Date();
        soundAlert();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Rig Sculpting succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipLines) {
        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/ADDING ALL THE VOICE LINES.wav");
        addAllVoiceLines(pathToLines);
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Voice Line Placement succeeded. Took " + getTimeDiff(stepStarted, stepEnded));

        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/LIPSYNCING ALL CHARACTERS.wav");
        autoLipsyncDocument(FLfile.platformPathToURI(pathToCFGs));
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Lipsyncing Succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipFades) {
        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/AUTOFADING ALL CHARACTERS.wav");
        jamFades();
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Automatic Jam Fading succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    if (!skipBlinks) {
        stepStarted = new Date();
        playSound(FLfile.uriToPlatformPath(scriptPathURI) + "/Notifications/AUTOMATING BLINKING.wav");
        automaticBlinking()
        stepEnded = new Date();
        getTimeDiff(stepStarted, stepEnded);
        writeLogInfo(getCurrentDate(), status00, "[!] Automatic Blinking succeeded. Took " + getTimeDiff(stepStarted, stepEnded));
    };

    generationEnded = new Date();
    soundAlert("Scene generation completed successfully! Took " + getTimeDiff(generationStarted, generationEnded));
    writeLogInfo(getCurrentDate(), status00, "[!] Scene generation completed successfully! Took " + getTimeDiff(generationStarted, generationEnded));
    fl.selectTool("arrow");
};