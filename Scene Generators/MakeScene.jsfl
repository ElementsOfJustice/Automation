/******************************************************************************
                        EOJ SCENE GENERATOR (9/18/22)

Description: Makes EoJ scenes from scratch. The beating heart of the video
editing process.

Issues:
- Parallel array schema is terrible and doesn't encode for things that have since
been automated.
- Why are the witnesses commented out? Do witnesses work?

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
    fl.getDocumentDOM().setElementTextAttr("face", "Suburga 2");
    fl.getDocumentDOM().setElementTextAttr("size", 40);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0xffffff);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
    fl.getDocumentDOM().setElementTextAttr("lineSpacing", 1);
}

function speakerFormat() {
    fl.getDocumentDOM().setElementTextAttr("face", "Suburga 2");
    fl.getDocumentDOM().setElementTextAttr("size", 42);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0xffffff);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
}

function thinkingFormat() {
    fl.getDocumentDOM().setElementTextAttr("face", "Suburga 2");
    fl.getDocumentDOM().setElementTextAttr("size", 40);
    fl.getDocumentDOM().setElementTextAttr("fillColor", 0x008fff);
    fl.getDocumentDOM().setElementTextAttr("letterSpacing", 2);
    fl.getDocumentDOM().setElementTextAttr("lineSpacing", 1);
}

/******************************************************************************
                            COURTROOM FUNCTIONS
******************************************************************************/

/*
FUNCTION doTextBoxes

Inserts dialogue and speaker tags into each frame on the text layer. This text
is obtained from the script itself via a plaintext parser. Bounding boxes are
specified for the textboxes as well as text options like multiline wrap,
antialiasing and paragraph settings. Text color is determined here. Defaults to
white, blue for thinking, and yellow for Widget.
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
        fl.getDocumentDOM().setTextString(trim(dialogueArray[i]));
        fl.getDocumentDOM().setElementTextAttr('alignment', 'left');
        fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
        fl.getDocumentDOM().setElementProperty('lineType', 'multiline');
        fl.getDocumentDOM().setElementProperty('name', 'txt');
        fl.getDocumentDOM().setElementProperty('fontRenderingMode', 'standard');
        dialogueFormat();

        if (dialogueArray[i].indexOf('(') > -1) {
            thinkingFormat();
        }

        if (speakertagArray[i] == "Widget") {
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
FUNCTION getCharacters

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
FUNCTION addRigs

Adds the rigs to the stage. First, we add a dummy symbol, because it is faster to
replace a symbol than it is to place a rig. Then we swap the symbol with the rig
of our chouse, make sure it is positioned correctly and visible. This function
needs a companion function that changes poses based on emotionEngine output.
*/

function addRigs() {
    var uniqueChars = getCharacters();
    for (var i = 0; i < uniqueChars.length; i++) {
        fl.trace(masterRigArray[uniqueChars[i]]);
        switchActive(masterRigArray[uniqueChars[i]][0]);
        fl.getDocumentDOM().getTimeline().currentFrame = 0;
        // select current frame
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);

        fl.getDocumentDOM().addItem({
            x: masterRigArray[uniqueChars[i]][2],
            y: masterRigArray[uniqueChars[i]][3]
        }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
        fl.getDocumentDOM().swapElement(masterRigArray[uniqueChars[i]][1]);
        fl.getDocumentDOM().setTransformationPoint({ x: 0, y: 0 });
        fl.getDocumentDOM().align('vertical center', true);
        fl.getDocumentDOM().align('horizontal center', true);
        fl.getDocumentDOM().setElementProperty('transformX', masterRigArray[uniqueChars[i]][2]);
        fl.getDocumentDOM().setElementProperty('transformY', masterRigArray[uniqueChars[i]][3]);
        fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
    }
}

/*
FUNCTION generateWitnessBools

No idea
*/

function generateWitnessBools(speakerTagIndex) { // helper function to generate the condition for witness handling
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
FUNCTION sculpt

A reversed process for adding rigs to stage. It is faster to remove and
clear frames than it is to place them. So every rig is placed one time
and then we navigate to the end of the document and work backwards,
chiseling out where we want rigs to be by adding blank keyframes. This
function alone is the most extreme speedup to scene generation.
*/

function sculpt() {
    var uniqueChars = getCharacters();
    for (var i = speakertagArray.length - 1; i >= 0; i--) {
        for (var j = 0; j < uniqueChars.length; j++) {
            fl.getDocumentDOM().getTimeline().currentFrame = iFrameDuration * i;
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
                // if (fl.getDocumentDOM().getTimeline().getLayerProperty('visible')) {
                //     fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !true);
                // }
                // select current frame
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

/*
FUNCTION placeDesks

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
FUNCTION placeBGs

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
FUNCTION getTimeDiff

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
FUNCTION doTextBoxesInvestigation

No clue why this function needs an investigation variant. Ask Connor
about this later.
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
        fl.getDocumentDOM().setTextString(trim(dialogueArray[i]));
        fl.getDocumentDOM().setElementTextAttr('alignment', 'left');
        fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
        fl.getDocumentDOM().setElementProperty('lineType', 'multiline');
        fl.getDocumentDOM().setElementProperty('name', 'txt');
        fl.getDocumentDOM().setElementProperty('fontRenderingMode', 'standard');
        dialogueFormat();
        if (dialogueArray[i].indexOf('(') > -1) {
            thinkingFormat();
        }

        if (speakertagArray[i] == "Widget") {
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
FUNCTION addRigsInvestigation

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
FUNCTION sculptInvestigations

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
FUNCTION evidence

Takes in whether evidence is being presented or obtained. Will also take in
a PNG and what side of the screen to appear on, or if evidence is obtained,
what the descriptor is. Side and descriptor are mutually exclusive.
*/

function evidence(png, type, side, descriptor) {

}

/*
FUNCTION screenshake

Will apply a random screenshake. If a SFX is provided, will cross-reference
the standards for which SFX require screenshakes AND flashes and will
automatically flash if required. Screenshakes may happen on the middle
of a word and so need to be linked to lipsync data to tell when in a 
voice line that happens.
*/

function screenshake(intensity, taperOff) {

}

/*
FUNCTION flash

Applies a simple white flash on the flash layer.
Always white, max opacity is always 50%.
*/

function flash() {

}

/*
FUNCTION fade

Fades out the standard amount of frames on the flash layer.
Always black.
*/

function fade(duration, inOut) {

}

/*
FUNCTION typewriter

Connor's autotypewriter script. Allows scene intros to be done
automatically. If intro type, make a new Scene that is the first
in the Scene order and enter the typewriter there. If evidence,
do not change playhead location.
*/

function typewriter(type, contents) {

}


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
                                MAIN EXECUTION
******************************************************************************/

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