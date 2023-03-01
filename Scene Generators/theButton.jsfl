/******************************************************************************
                        EOJ SCENE GENERATOR (2/27/23)

Description: Makes EoJ scenes from scratch. The beating heart of the video
editing process.

Issues:
- Why are the witnesses commented out? Do witnesses work at all?
- Desk placement only works with symbols. Convert all attorney desks to symbols
in the template FLA and reverse hardcode workaround in config.txt
- First time BG placement in court mode is wack
- Text does strange stuff. Sometimes it is Suburga regular, sometimes the properties
of the text are really bad. Hardcode font and the VA setting to force it to be
correct
- WE NEED AN AAI STYLE generator predicated on courtroom mode.
- Intelligent debug print

To-Do:
- On generation, add the AE line ID to text using persistent data and add the VOX
line on runtime.
- Dynamic rig obtaining. Instead of old, out of date libraries, we keep the rigs
in a folder and the scene generator imports the rigs on runtime. This automatically
ensures the rigs are up-to-date on every run.
- Make sure you comment every function

******************************************************************************/

/******************************************************************************
                         GENERAL VARIABLES AND SETUP
******************************************************************************/

fl.showIdleMessage(false);

//CONFIGURABLE VARIABLES//
var iFrameDuration = 12;
var viewMode = null;
var arrayPath = null;
var bRemapTime = false

//COURTMODE VARIABLES//

var sDefense = null;
var sProsecutor = null;
var sJudge = null;
var sCocouncil = null;

//WITNESSES = [4 2 1 3 5]

var sWitnesses = {};

/*var sWitness1 = null;
var sWitness2 = null;
var sWitness3 = null;
var sWitness4 = null;
var sWitness5 = null; */

//GENERAL-PURPOSE VARIABLES//
var propertiesLayer = null;
var propertiesTextBox = null;

var currentSpeaker = null;
var nextSpeaker = null;
var previousSpeaker = null;

var writeReport = true;
var stopRigPlacement = false;
var hasDirections = null;
var stageDirections = null;

var dialogueArray = [];
var speakertagArray = [];

var startTime = new Date();

/******************************************************************************
                                BASIC FUNCTIONS
******************************************************************************/

/*
Function: trim
Variables: 
    input string
Description: ES5-compatible backport of the trim operator.
*/

function trim(input) {
    var len = input.length;
    var st = 0;
    var val = input;

    while ((st < len) && (val.charAt(st) <= ' ')) {
        st++;
    }
    while ((st < len) && (val.charAt(len - 1) <= ' ')) {
        len--;
    }
    return ((st > 0) || (len < input.length)) ? input.substring(st, len) : input;
}

/*
Function: switchActive
Variables: 
    layerVar int
Description: More intelligent layer switching function.
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
Description: ES5-compatible Levenshtein ratio function where s and t are input strings.
*/

function levenshteinRatio(s, t) {
    var d = []; //2d matrix

    // Step 1
    var n = s.length;
    var m = t.length;

    if (n == 0) return m;
    if (m == 0) return n;

    //Create an array of arrays in javascript
    for (var i = n; i >= 0; i--) d[i] = [];

    // Step 2
    for (var i = n; i >= 0; i--) d[i][0] = i;
    for (var j = m; j >= 0; j--) d[0][j] = j;

    // Step 3
    for (var i = 1; i <= n; i++) {
        var s_i = s.charAt(i - 1);

        // Step 4
        for (var j = 1; j <= m; j++) {

            //Check the jagged ld total so far
            if (i == j && d[i][j] > 4) return n;

            var t_j = t.charAt(j - 1);
            var cost = (s_i == t_j) ? 0 : 1; // Step 5

            //Calculate the minimum
            var mi = d[i - 1][j] + 1;
            var b = d[i][j - 1] + 1;
            var c = d[i - 1][j - 1] + cost;

            if (b < mi) mi = b;
            if (c < mi) mi = c;

            d[i][j] = mi; // Step 6

            //Damerau transposition
            if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }

    return ((s.length + t.length - d[n][m]) / (s.length + t.length));
}

/*
Function: emotionAverage
Variables: 
    str1    string
    str2    string
Description: Averages out two emotionEngine abstractions for an in-between emotion.
*/

function emotionAverage(str1, str2) {
    // create a map to keep track of character counts
    var charMap = {};

    // loop through the first string and update charMap accordingly
    for (var i = 0; i < str1.length; i++) {
        if (charMap[str1[i]] === undefined) {
            charMap[str1[i]] = 1;
        } else {
            charMap[str1[i]]++;
        }
    }

    // loop through the second string and update charMap accordingly
    for (var j = 0; j < str2.length; j++) {
        if (charMap[str2[j]] === undefined) {
            charMap[str2[j]] = 1;
        } else {
            charMap[str2[j]]++;
        }
    }

    // remove opposites and limit the number of each character
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

    // sort the characters in the result string
    result = result.split('').sort(function (a, b) {
        var order = '++--HHBBRRAAGGFFSSTTC';
        return order.indexOf(a) - order.indexOf(b);
    }).join('');

    // return the result string
    return result;
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
Function: getTimeDiff
Variables:
Descriptions:
    Gets the time difference. Useful for telling how long each step
    takes to execute and which rigs are bloated.
*/

function getTimeDiff(startTime, endTime) {
    timeDiff = endTime - startTime;
    timeDiff /= 1000;
    var seconds = Math.round(timeDiff);

    if (timeDiff < 60) {
        fl.trace("Time Elapsed: " + seconds + " seconds.");
    }

    if (timeDiff > 60) {
        var minutes = Math.floor(timeDiff / 60);
        var seconds = timeDiff - minutes * 60;
        fl.trace("Time Elapsed: " + minutes + " minutes and " + seconds + " seconds");
    }
}

/*
Function: getBlinkProbability
Variables:
    theta   ?
    t       ?
Descriptions:
    Returns the probability of a blink occuring.
*/

function getBlinkProbability(theta, t) {
    return 1 - Math.pow(Math.E, -1 * (t / theta));
}

/*
Function: getPoseFromEmotion
Variables:
    layerIndex  int
    i           int
Descriptions:
    Selects a pose from a character layer and frame number i. We use L-ratio
    to match the line's emotion to the emotionEngine data for the rig.
*/

function getPoseFromEmotion(layerIndex, i) {
    var itemIndex = fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].libraryItem.name)
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

/*
Function: getCharacters
Variables: None
Description: 
    Returns a set of unique characters. I don't know why we do this
    but I assume it is related to error-handling or characters who speak
    without a rig.
*/

function getCharacters() { // gets unique characters (basically returns a set)
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
    speakerTagIndex []
Description: 
    Helper function to generate the condition for witness handling
*/

function generateWitnessBools(speakerTagIndex) {
    var isWitnessSpeaking = false;
    var isNextCharacterWitness = false;
    for (var witness in sWitnesses) {
        if (sWitnesses[witness] == speakertagArray[speakerTagIndex]) {
            isWitnessSpeaking = true;
        }
        if (speakerTagIndex < speakertagArray.length - 1 && sWitnesses[witness] == speakertagArray[speakerTagIndex + 1]) {
            isNextCharacterWitness = true;
        }
        if (isWitnessSpeaking && isNextCharacterWitness) {
            break;
        }
    }

    return [isWitnessSpeaking, isNextCharacterWitness];

}

/*
Function: poseAutomation
Variables: 
    layerIndex  int
    i           int
Description: 
    Pose automation based on LeXmo emotions and L-ratio algorithm.
*/

function poseAutomation(layerIndex, i) {

    //fl.trace("Layer Index: " + layerIndex)
    //fl.trace("Frame: " + fl.getDocumentDOM().getTimeline().currentFrame)
    //fl.trace("Element: " + fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0])
    //fl.trace("Item Index: " + fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].libraryItem.name))

    //fl.trace("Selected Layer is " + masterRigArray[uniqueChars[j]][0] + " but it should be " + speakertagArray[i])
    //fl.trace("Selected Sym for xSheet Browsing is: " + fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].libraryItem.name)

    var poseFrameNum = getPoseFromEmotion(layerIndex, i);

    if (poseFrameNum != -1) {
        fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].firstFrame = poseFrameNum
    } else {
        fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].firstFrame = 0
    }

    //WARNING! CASE 2 HARDCODING AHEAD!
    if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].libraryItem.name == "RIGS/RASTER CHARACTERS/Athena - Courtroom/tmp_Athena") {
        fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].name = dialogueArray[i][3]
    }

    if (speakertagArray[i] != speakertagArray[i + 1]) {
        fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
    }

}

/*
Function: removeAbsentCharactersAndDoPoseAutomation
Variables: 
    uniqueChars []
    i           int
Description: 
    Removes nonexistent characters so we do not return an error
    by trying to access symbols and library items that do not exist!
*/

function removeAbsentCharactersAndDoPoseAutomation(uniqueChars, i) {
    for (var j = 0; j < uniqueChars.length; j++) {
        // fl.trace(masterRigArray[uniqueChars[j]][0])
        if (masterRigArray[uniqueChars[j]][0] !== undefined && fl.getDocumentDOM().library.itemExists(masterRigArray[uniqueChars[j]][1])) {
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
                for (var witness in sWitnesses) {
                    switchActive(masterRigArray[sWitnesses[witness]][0]);
                    // select current frame
                    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                    if (i != 0) {
                        fl.getDocumentDOM().getTimeline().insertKeyframe();
                    } else {
                        fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
                    }
                }

                if (!generateWitnessBools(i)[1] /* isNextCharacterWitness */) { // if next speaker is neither witnesses, put blank keyframes at the end of their keyframe
                    for (var witness in sWitnesses) {
                        fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
                        switchActive(masterRigArray[sWitnesses[witness]][0]);
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

/*
Function: addRigsInvestigation
Variables: 
Description:
    Adds rigs for the Investigation view format. Same as courtroom, but
    all the ponies face forwards and are centered. Also add emotionEngine support
    to this as well as incorporate automating fading.
*/

function addRigsInvestgation() {
    var missingRigs = [];
    var uniqueChars = getCharacters();
    for (var i = 0; i < uniqueChars.length; i++) {
        var character = uniqueChars[i];
        if (character == sDefense) {
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

/*
Function: sculptInvestigations
Variables: None
Description: 
    Sculpts rigs like courtroom functions, but for Investigations.
*/

function sculptInvestgation() {
    var uniqueChars = getCharacters();

    for (var i = speakertagArray.length - 2; i >= 0; i--) {
        var isPov = speakertagArray[i] == sDefense;
        if (speakertagArray[i] == sDefense && i != 0) {
            var tempI = i;
            while (tempI > 0 && speakertagArray[tempI] == sDefense) {
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
                numChars -= (speakertagArray[i].indexOf(sDefense) > -1) ? 1 : 0;
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
                                >>>MAIN<<<
******************************************************************************/

/******************************************************************************
                                INVOKE GUI
******************************************************************************/

var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
var guiPanel = fl.xmlPanelFromString("<dialog title=\"Elements of Justice Generator (2.27.23)\" buttons=\"accept, cancel\"> <label value=\"Viewing Mode:\" control=\"iName\"/><menulist id = \"viewMode\"> <menupop>    <menuitem label=\"Courtroom Mode\" selected=\"true\" value=\"courtMode\" />    <menuitem label=\"Investigation Mode\" selected=\"false\" value=\"investigationMode\" />    <menuitem label=\"AAI Mode\" selected=\"false\" value=\"aaiMode\" /></menupop> </menulist><spacer /><label value=\"Defense/POV Character Name:\" control=\"iName\" /><textbox id=\"panel_sDefense\" size=\"24\" value=\"Athena\" /><spacer /><label value=\"Prosecutor Name:\" control=\"iName\" /><textbox id=\"panel_sProsecutor\" size=\"24\" value=\"Luna\" /><spacer /><label value=\"Judge Name:\" control=\"iName\" /><textbox id=\"panel_sJudge\" size=\"24\" value=\"Judge\" /><spacer /><label value=\"Cocouncil Name:\" control=\"iName\" /><textbox id=\"panel_sCocouncil\" size=\"24\" value=\"Twilight\" /><spacer /><label value=\"Witness No. 1 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness1\" size=\"24\" value=\"\" /><spacer /><label value=\"Witness No. 2 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness2\" size=\"24\" value=\"Diamond\" /><spacer /><label value=\"Witness No. 3 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness3\" size=\"24\" value=\"Silver Spoon\" /><spacer /><label value=\"Witness No. 4 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness4\" size=\"24\" value=\"\" /><spacer /><label value=\"Witness No. 5 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness5\" size=\"24\" value=\"\" /><spacer /><separator /><label value=\"Select Array File\" control=\"iName\" /><choosefile id=\"selectedJSON\" type=\"open\" pathtype=\"absolute\" literal=\"false\" required=\"true\" /><checkbox id=\"panel_writeReport\" label=\"Write Report?\" checked=\"true\" /><spacer /></dialog>");

if (guiPanel.dismiss == "accept") {

    var startTime = new Date();

    arrayPath = guiPanel.selectedJSON;
    var driveLetter = arrayPath.charAt(0);
    arrayPath = arrayPath.substring(2, arrayPath.length);
    arrayPath = "file:///" + driveLetter + "|" + arrayPath;
    arrayPath = arrayPath.replace(/\\/g, "/");
    arrayPath = arrayPath.replace(/ /g, '%20');

    viewMode = guiPanel.viewMode;

    sDefense = guiPanel.panel_sDefense;
    sProsecutor = guiPanel.panel_sProsecutor;
    sJudge = guiPanel.panel_sJudge;
    sCocouncil = guiPanel.panel_sCocouncil;
    var NUM_WITNESSES = 5;
    for (var i = 0; i < NUM_WITNESSES; i++) {
        eval("var isEmpty = guiPanel.panel_sWitness" + (i + 1) + " == \"\"");
        if (!isEmpty) {
            eval("sWitnesses[" + i + "]" + " = guiPanel.panel_sWitness" + (i + 1));
        }
    }

    writeReport = guiPanel.panel_writeReport;

    fl.runScript(arrayPath);
    fl.runScript(dirURL + "/config.txt");

    /******************************************************************************
                                DISCRIMINATE ARRAYS
    ******************************************************************************/

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

    //move get time diff into each function plus a string saying the name of the function

    fl.getDocumentDOM().getTimeline().currentFrame = 0;
    if (viewMode == "courtMode") {
        var start = new Date();
        doTextBoxes();
        var end = new Date();
        getTimeDiff(start, end);
        start = new Date();
        addRigs();
        end = new Date();
        getTimeDiff(start, end);
        start = new Date();
        sculpt();
        end = new Date();
        getTimeDiff(start, end);
        start = new Date();
        placeDesks();
        end = new Date();
        getTimeDiff(start, end);
        start = new Date();
        placeBGs();
        end = new Date();
        getTimeDiff(start, end);

    }
    //reportTrace function
    if (viewMode == "investigationMode") {
        sProsecutor = null;
        sJudge = null;
        sCocouncil = null;
        sWitnesses = {};
        var start = new Date();
        doTextBoxes();
        var end = new Date();
        getTimeDiff(start, end);
        start = new Date();
        var missing = addRigsInvestgation();
        fl.trace("Missing rigs: " + missing);
        end = new Date();
        getTimeDiff(start, end);
        start = new Date();
        sculptInvestgation();
        end = new Date();
        getTimeDiff(start, end);
    }

    fl.selectTool("arrow");

}

var endTime = new Date();
timeDiff = endTime - startTime;
timeDiff /= 1000;
var seconds = Math.round(timeDiff);

if (timeDiff < 60) {
    fl.trace("SCENE GENERATION TIME ELAPSED: " + seconds + " seconds.");
}

if (timeDiff > 60) {
    var minutes = Math.floor(timeDiff / 60);
    var seconds = timeDiff - minutes * 60;
    fl.trace("SCENE GENERATION TIME ELAPSED: " + minutes + " minutes and " + seconds + " seconds");
} 