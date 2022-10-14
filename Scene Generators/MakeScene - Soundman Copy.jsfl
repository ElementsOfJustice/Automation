/******************************************************************************
                        EOJ SCENE GENERATOR (9/18/22)

Description: Makes EoJ scenes from scratch. The beating heart of the video
editing process.

Issues:
- Parallel array schema is terrible and doesn't encode for things that have since
been automated.
- Why are the witnesses commented out? Do witnesses work at all?
- Desk placement only works with symbols. Convert all attorney desks to symbols
in the template FLA and reverse hardcode workaround in config.txt
- First time BG placement in court mode is wack
- Text does strange stuff. Sometimes it is Suburga regular, sometimes othe properties
of the text are really bad. Hardcode font and the VA setting to force it to be
correct

To-Do:
- Add connecting features (Evidence, Typewriter, Screenshakes, Flashes)
- Re-write plaintext parser to include these features
- On generation, add the AE line ID to text using persistent data and add the VOX
line on runtime.
- How do we handle emotionEngine? Do we integrate it at all? When it is wrong, it 
is very wrong. Accept/deny per-line is a start, but adds tedium
- Incorporate investigation makeFades
- Dynamic rig obtaining. Instead of old, out of date libraries, we keep the rigs
in a folder and the scene generator imports the rigs on runtime. This automatically
ensures the rigs are up-to-date on every run.
- Get Joe to comment every function. Each one needs an in-depth description,
and even if he justs adds these kinds of headers to each function, that is good.
- put dialogue in textboxes every n frames, put da characters on screen

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

function trim(input) { // stolen from java :D
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

function switchActive(layerVar) {
    var layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
    if (layerIndex == null) {
        fl.getDocumentDOM().getTimeline().addNewLayer(layerVar);
        layerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex(layerVar);
    }
    fl.getDocumentDOM().getTimeline().setSelectedLayers(layerIndex * 1);
    propertiesLayer = fl.getDocumentDOM().getTimeline().layers[layerIndex];
}

function dialogueFormat() {
    fl.getDocumentDOM().setElementTextAttr("face", "Suburga 2 Semi-condensed Regular");
    fl.getDocumentDOM().setElementTextAttr("size", 40);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0xffffff);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
    fl.getDocumentDOM().setElementTextAttr("lineSpacing", 1);
}

function speakerFormat() {
    fl.getDocumentDOM().setElementTextAttr("face", "Suburga 2 Semi-condensed Regular");
    fl.getDocumentDOM().setElementTextAttr("size", 42);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0xffffff);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
}

function thinkingFormat() {
    fl.getDocumentDOM().setElementTextAttr("face", "Suburga 2 Semi-condensed Regular");
    fl.getDocumentDOM().setElementTextAttr("size", 40);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0x008fff);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
    fl.getDocumentDOM().setElementTextAttr("lineSpacing", 1);
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
    var unique = speakertagArray;
    for (var i = 0; i < unique.length; i++) {
        unique[i] = trim(unique[i]);
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
        if (masterRigArray[uniqueChars[i]] !== undefined) {
            //fl.trace(masterRigArray[uniqueChars[i]]);
            switchActive(masterRigArray[uniqueChars[i]][0]);
            fl.getDocumentDOM().getTimeline().currentFrame = 0;
            // select current frame
            fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);

            fl.getDocumentDOM().addItem({
                x: masterRigArray[uniqueChars[i]][2],
                y: masterRigArray[uniqueChars[i]][3]
            }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
            fl.trace(masterRigArray[uniqueChars[i]])
            fl.getDocumentDOM().swapElement(masterRigArray[uniqueChars[i]][1]);
            fl.getDocumentDOM().setTransformationPoint({ x: 0, y: 0 });
            fl.getDocumentDOM().align('vertical center', true);
            fl.getDocumentDOM().align('horizontal center', true);
            fl.getDocumentDOM().setElementProperty('transformX', masterRigArray[uniqueChars[i]][2]);
            fl.getDocumentDOM().setElementProperty('transformY', masterRigArray[uniqueChars[i]][3]);
            fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
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
    for (var i = speakertagArray.length - 1; i >= 0; i--) {
        //fl.trace(masterRigArray)
        //fl.trace(masterRigArray[uniqueChars[j]])
        for (var j = 0; j < uniqueChars.length; j++) {
                fl.trace(masterRigArray[uniqueChars[j]][0])
                if (masterRigArray[uniqueChars[j]][0] !== undefined) {
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

                // POSE AUTOMATION //

                //fl.trace("Layer Index: " + layerIndex)
                //fl.trace("Frame: " + fl.getDocumentDOM().getTimeline().currentFrame)
                //fl.trace("Element: " + fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0])
                //fl.trace("Item Index: " + fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].libraryItem.name))

                fl.trace("Selected Layer is " + masterRigArray[uniqueChars[j]][0] + " but it should be " + speakertagArray[i])
                fl.trace("Selected Sym for xSheet Browsing is: " + fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].libraryItem.name)

                var itemIndex= fl.getDocumentDOM().library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].libraryItem.name)
                var objTl = fl.getDocumentDOM().library.items[itemIndex].timeline.layers[0]

                var poseFrameNum = -1

                for (var k = 0; k < objTl.frameCount; k++) {
                    if ((objTl.frames[k].labelType == "name") && (k == objTl.frames[k].startFrame)) {    
                        //fl.trace(dialogueArray[i][2] + " " + dialogueArray[i][1])
                        //fl.trace("Internal xSheet Pose Name: " + objTl.frames[k].name + " | Intended Pose Name: " + dialogueArray[i][3] + " k: " + k)              
                        if (objTl.frames[k].name == dialogueArray[i][3]) {
                            poseFrameNum = k
                            fl.trace("K is : " + k)
                        }
                    }       
                }

                if (poseFrameNum != -1) {
                    fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].firstFrame = poseFrameNum
                } else {
                    fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].firstFrame = 0
                }

                //write pose to frame name
                fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[fl.getDocumentDOM().getTimeline().currentFrame].name = dialogueArray[i][3]

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

                }
        }
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
    var uniqueChars = getCharacters();
    for (var i = 0; i < uniqueChars.length; i++) {
        var character = uniqueChars[i];
        if (character == sDefense) {
            continue;
        }
        switchActive(masterInvestigationArray[character][0]);
        fl.getDocumentDOM().getTimeline().currentFrame = 0;
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);

        fl.getDocumentDOM().addItem({
            x: 0,
            y: 0
        }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
        fl.getDocumentDOM().swapElement(masterInvestigationArray[character][1]);
        fl.getDocumentDOM().setTransformationPoint({ x: 0, y: 0 });
        fl.getDocumentDOM().align('vertical center', true);
        fl.getDocumentDOM().align('horizontal center', true);
        // fl.getDocumentDOM().setElementProperty('transformX', masterRigArray[uniqueChars[i]][2]);
        // fl.getDocumentDOM().setElementProperty('transformY', masterRigArray[uniqueChars[i]][3]);
        fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
    }
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
        if (speakertagArray[i] == sDefense) {
            continue;
        }
        for (var j = 0; j < uniqueChars.length; j++) {
            fl.getDocumentDOM().getTimeline().currentFrame = iFrameDuration * i;
            if ((i == 0) && (speakertagArray[i] != uniqueChars[j])) { /// make blank keyframe on inactive character for the first frame (inserting blank keyframe causes weirdness)
                switchActive(masterInvestigationArray[uniqueChars[j]][0]);
                // select current frame
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
                // select current frame
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                fl.getDocumentDOM().deleteSelection();
            }

            else if (speakertagArray[i] == uniqueChars[j]) { // make keyframe on active character
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
                            CREATIVE FUNCTIONS
******************************************************************************/

/*
Function: evidence
Variables:
    png        []
    type       []
    side       []
    descriptor []
Description:
    Takes in whether evidence is being presented or obtained. Will also take in
    a PNG and what side of the screen to appear on, or if evidence is obtained,
    what the descriptor is. Side and descriptor are mutually exclusive.
*/

function evidence(png, type, side, descriptor) {

}

/*
Function: screenshake
Variables:
    sfx []
    cue []
Description:
    Will apply a random screenshake. If a SFX is provided, will cross-reference
    the standards for which SFX require screenshakes AND flashes and will
    automatically flash if required. Screenshakes may happen on the middle
    of a word and so need to be linked to lipsync data to tell when in a 
    voice line that happens.
*/

function screenshake(sfx, cue) {

}

/*
Function: flash
Variables:
    sfx []
    cue []
Description:
    Applies a simple white flash on the flash layer.
    Always white, max opacity is always 50%.

    The flash occurs on the cue and can be provided with a SFX
*/

function flash(sfx, cue) {

}

/*
Function: fade
Variables:
    duration []
    inOut    []
Description:
    Fades out the standard amount of frames on the flash layer.
    Always black.
*/

function fade(duration, inOut) {

}

/*
Function: typewriter
Variables:
    type     []
    contents []
Description:
    Connor's autotypewriter script. Allows scene intros to be done
    automatically. If intro type, make a new Scene that is the first
    in the Scene order and enter the typewriter there. If evidence,
    do not change playhead location.
*/

function typewriter(type, contents) {

}

/*
Function: pan
Variables: 
    destination []
Description:
    Courtroom swipe over to the desired position.
*/

function pan(destination) {

}

/******************************************************************************
                                >>>MAIN<<<
******************************************************************************/
/******************************************************************************
                                INVOKE GUI
******************************************************************************/

var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
var guiPanel = fl.xmlPanelFromString("<dialog title=\"Elements of Justice Generator (3.36.22)\" buttons=\"accept, cancel\"> <label value=\"Viewing Mode:\" control=\"iName\"/><menulist id = \"viewMode\"> <menupop>    <menuitem label=\"Courtroom Mode\" selected=\"true\" value=\"courtMode\" />    <menuitem label=\"Investigation Mode\" selected=\"false\" value=\"investigationMode\" />    <menuitem label=\"AAI Mode\" selected=\"false\" value=\"aaiMode\" /></menupop> </menulist><spacer /><label value=\"Defense/POV Character Name:\" control=\"iName\" /><textbox id=\"panel_sDefense\" size=\"24\" value=\"Athena\" /><spacer /><label value=\"Prosecutor Name:\" control=\"iName\" /><textbox id=\"panel_sProsecutor\" size=\"24\" value=\"Luna\" /><spacer /><label value=\"Judge Name:\" control=\"iName\" /><textbox id=\"panel_sJudge\" size=\"24\" value=\"Judge\" /><spacer /><label value=\"Cocouncil Name:\" control=\"iName\" /><textbox id=\"panel_sCocouncil\" size=\"24\" value=\"Twilight\" /><spacer /><label value=\"Witness No. 1 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness1\" size=\"24\" value=\"\" /><spacer /><label value=\"Witness No. 2 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness2\" size=\"24\" value=\"Diamond\" /><spacer /><label value=\"Witness No. 3 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness3\" size=\"24\" value=\"Silver Spoon\" /><spacer /><label value=\"Witness No. 4 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness4\" size=\"24\" value=\"\" /><spacer /><label value=\"Witness No. 5 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness5\" size=\"24\" value=\"\" /><spacer /><separator /><label value=\"Select Array File\" control=\"iName\" /><choosefile id=\"selectedJSON\" type=\"open\" pathtype=\"absolute\" literal=\"false\" required=\"true\" /><checkbox id=\"panel_writeReport\" label=\"Write Report?\" checked=\"true\" /><spacer /></dialog>");

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
            dialogueArray.push( [sceneData[i][2], sceneData[i][3], sceneData[i][1], sceneData[i][4]] ) 
            //dialogueArray[i][0] for SpeakerTag
            //dialogueArray[i][1] for Dialogue
            //dialogueArray[i][2] for Line ID
            //dialogueArray[i][3] for Pose
        }

    }

    for (var i = 0; i < dialogueArray.length; i++) {
        speakertagArray[i] = (dialogueArray[i][0])
    }

/*
Pan Array

sceneData[0] will determine if we are panning
sceneData[1] will determine the pan destination
*/

    for (var i = 0; i < sceneData.length; i++) {

        if (sceneData[i][0] == "pan") {
            //issue: what step do we run this on and how do we tell the function where to pan? We lose our step order after we pull from the scene data array!!!
            // Do we include what sceneData i we are on? That way we don't lose the original scene data order.
            // Even shittier idea, discriminate arrays as we iterate dialogueArray and match dialogueArray[i] to the type we're doing to be in sync
            pan(sceneData[i][1])
        }

    }

/*
Fade Array

sceneData[0] will determine if we are fading
sceneData[1] will determine if we are fading in or out
*/

var defaultFadeLength = 12; //declare this a million years ago

for (var i = 0; i < sceneData.length; i++) {

    if (sceneData[i][0] == "fade") {
        fade(defaultFadeLength, sceneData[i][1])
    }

}

/*
Flash 
*/

for (var i = 0; i < sceneData.length; i++) {

    if (sceneData[i][0] == "flash") {
        flash(sfx, cue)
    }

}

/*
Screenshake 
*/

for (var i = 0; i < sceneData.length; i++) {

    if (sceneData[i][0] == "screenshake") {
        screenshake(sfx, cue) //screenshake with default settings always
    }

}

/*
Evidence

sceneData[0] will determine if we are evidence
sceneData[1] will determine if we are presenting or obtaining
sceneData[2] will determine the png name
sceneData[3] the side of the evidence if we're presenting
sceneData[4] the text data of the evidence if we're obtaining it

If we obtain the evidence, invoke typewriter with the text data of 'sceneData[2] added to Court Record.'

*/

for (var i = 0; i < sceneData.length; i++) {

    if (sceneData[i][0] == "evidence") {
        evidence(sceneData[i][1], sceneData[i][2], sceneData[i][3], sceneData[i][4])
        //evidence function needs to be polymorphic for obtain vs present
    }

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
        addRigsInvestgation();
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
    fl.trace("Time Elapsed: " + seconds + " seconds.");
}

if (timeDiff > 60) {
    var minutes = Math.floor(timeDiff / 60);
    var seconds = timeDiff - minutes * 60;
    fl.trace("Time Elapsed: " + minutes + " minutes and " + seconds + " seconds");
} 