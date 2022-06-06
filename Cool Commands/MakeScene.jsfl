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

// COURTROOM FUNCTIONS
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
        fl.getDocumentDOM().setTextString(dialogueArray[i].trim());
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

function getCharacters() { // gets unique characters (basically returns a set)
    var unique = speakertagArray;
    for (var i = 0; i < unique.length; i++) {
        unique[i] = unique[i].trim();
    }
    unique = unique.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });
    return unique;
}

function addRigs() {
    var uniqueChars = getCharacters();
    for (var i = 0; i < uniqueChars.length; i++) {
        switchActive(masterRigArray[uniqueChars[i]][0]);
        fl.getDocumentDOM().getTimeline().currentFrame = 0;
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

function generateWitnessBools(speakerTagIndex) { // helper function to generate the condition for witness handling
    var isWitnessSpeaking = false;
    var isNextCharacterWitness = false;
    for (var witness in sWitnesses) {
        if (sWitnesses[witness] == speakertagArray[speakerTagIndex]) {
            isWitnessSpeaking = true;
        }
        if (sWitnesses[witness] == speakertagArray[speakerTagIndex + 1]) {
            isNextCharacterWitness = true;
        }
        if (isWitnessSpeaking && isNextCharacterWitness) {
            break;
        }
    }

    return [isWitnessSpeaking, isNextCharacterWitness];

}

function sculpt() {
    var uniqueChars = getCharacters();
    for (var i = speakertagArray.length - 2; i >= 0; i--) {
        for (var j = 0; j < uniqueChars.length; j++) {
            fl.getDocumentDOM().getTimeline().currentFrame = iFrameDuration * i;
            if ((i == 0) && (speakertagArray[i] != uniqueChars[j])) { /// make blank keyframe on inactive character for the first frame (inserting blank keyframe causes weirdness)
                switchActive(masterRigArray[uniqueChars[j]][0]);
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                fl.getDocumentDOM().deleteSelection();
            }

            else if ((generateWitnessBools(i)[0] /* isWitnessSpeaking */) && (uniqueChars[j] == speakertagArray[i])) { // make keyframe on active witnesses
                for (var witness in sWitnesses) {
                    switchActive(masterRigArray[sWitnesses[witness]][0]);
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
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                if (i != 0) {
                    fl.getDocumentDOM().getTimeline().insertKeyframe();
                } else {
                    fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
                }
                if (speakertagArray[i] != speakertagArray[i + 1]) {
                    fl.getDocumentDOM().getTimeline().currentFrame += iFrameDuration;
                    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                    fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
                }
            }
        }
    }
}

function placeDesks() {
    fl.getDocumentDOM().getTimeline().currentFrame = 0;
    switchActive("DESKS");
    for (var i = 0; i < speakertagArray.length; i++) {
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

function placeBGs() {
    fl.getDocumentDOM().getTimeline().currentFrame = 0;
    switchActive("BACKGROUNDS");
    for (var i = 0; i < speakertagArray.length; i++) {
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

//INVESTIGATION FUNCTIONS
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
        fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
        if (i != 0) {
            fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
        }

        fl.getDocumentDOM().addNewText(dialogueBounding);
        fl.getDocumentDOM().setTextString(dialogueArray[i].trim());
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

function addRigsInvestgation() {
    var uniqueChars = getCharacters();
    for (var i = 0; i < uniqueChars.length; i++) {
        var character = uniqueChars[i];
        if(character == sDefense) {
            continue;
        }
        switchActive(masterInvestigationArray[character][0]);
        fl.getDocumentDOM().getTimeline().currentFrame = 0;
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

function sculptInvestgation() {
    var uniqueChars = getCharacters();
    for (var i = speakertagArray.length - 2; i >= 0; i--) {
        if(speakertagArray[i] == sDefense) {
            continue;
        }
        for (var j = 0; j < uniqueChars.length; j++) {
            fl.getDocumentDOM().getTimeline().currentFrame = iFrameDuration * i;
            if ((i == 0) && (speakertagArray[i] != uniqueChars[j])) { /// make blank keyframe on inactive character for the first frame (inserting blank keyframe causes weirdness)
                switchActive(masterInvestigationArray[uniqueChars[j]][0]);
                fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                fl.getDocumentDOM().getTimeline().setLayerProperty('visible', !false);
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
                    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
                    fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
                }
            }
        }
    }
}


//INVOKE GUI//

var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));
var guiPanel = fl.xmlPanelFromString("<dialog title=\"Elements of Justice Generator (3.36.22)\" buttons=\"accept, cancel\"> <label value=\"Viewing Mode:\" control=\"iName\"/><menulist id = \"viewMode\"> <menupop>    <menuitem label=\"Courtroom Mode\" selected=\"true\" value=\"courtMode\" />    <menuitem label=\"Investigation Mode\" selected=\"false\" value=\"investigationMode\" />    <menuitem label=\"AAI Mode\" selected=\"false\" value=\"aaiMode\" /></menupop> </menulist><spacer /><label value=\"Defense/POV Character Name:\" control=\"iName\" /><textbox id=\"panel_sDefense\" size=\"24\" value=\"Athena\" /><spacer /><label value=\"Prosecutor Name:\" control=\"iName\" /><textbox id=\"panel_sProsecutor\" size=\"24\" value=\"Luna\" /><spacer /><label value=\"Judge Name:\" control=\"iName\" /><textbox id=\"panel_sJudge\" size=\"24\" value=\"Judge\" /><spacer /><label value=\"Cocouncil Name:\" control=\"iName\" /><textbox id=\"panel_sCocouncil\" size=\"24\" value=\"Twilight\" /><spacer /><label value=\"Witness No. 1 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness1\" size=\"24\" value=\"\" /><spacer /><label value=\"Witness No. 2 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness2\" size=\"24\" value=\"Diamond\" /><spacer /><label value=\"Witness No. 3 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness3\" size=\"24\" value=\"Silver Spoon\" /><spacer /><label value=\"Witness No. 4 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness4\" size=\"24\" value=\"\" /><spacer /><label value=\"Witness No. 5 Name:\" control=\"iName\" /><textbox id=\"panel_sWitness5\" size=\"24\" value=\"\" /><spacer /><separator /><label value=\"Select Array File\" control=\"iName\" /><choosefile id=\"selectedJSON\" type=\"open\" pathtype=\"absolute\" literal=\"false\" required=\"true\" /><checkbox id=\"panel_writeReport\" label=\"Write Report?\" checked=\"true\" /><spacer /></dialog>");

if (guiPanel.dismiss == "accept") {

    var startTime = new Date();

    //IMPORT FILES//


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

    // begin stuff

    // TODO: Put dialogue in textboxes every n frames, put da characters on screen
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
    if(viewMode == "investigationMode") {
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