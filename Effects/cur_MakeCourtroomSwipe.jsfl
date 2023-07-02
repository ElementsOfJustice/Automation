/******************************************************************************
MAKE COURTROOM SWIPE LEGACY
Description: Create animation of swipe between characters in the courtroom
******************************************************************************/

SWIPE_LENGTH = 14; // frames in swipe from witness stand to desks and vice versa *must be even*
BACKGROUND_LAYER_NAME = "BACKGROUNDS";
DESKS_LAYER_NAME = "DESKS";
WITNESS_STAND_X = 640;
WITNESS_STAND_Y = 509;
WITNESS_STAND_HEIGHT = 410;
WITNESS_STAND_SYMBOL_PATH = "OTHER ASSETS/DESKS/WitnessStand";
SYMBOL_CONTENT_LAYER = 1; // IF A RIG DOES NOT HAVE THEIR ANIMATION LAYER ON THE SECOND LAYER, THIS SCRIPT WILL BREAK. This means Sonata must have the second layer in her rig swapped for the one that has her animations (the "All" symbol) on them.
BLUR_SYMBOLS_FOLDER_NAME = "BLUR_SYMBOLS";

var masterRigArray = { // map LAYER NAMES to the rig and position-- first entry is the rig library path, second entry is the X coordinate, third entry is Y coordinate. Ignore the fourth entry.
    /*"TWILIGHT_SPARKLE": ["RIGS/VECTOR CHARACTERS/TWILIGHT SPARKLE/TwilightCouncil►/TwilightCouncil►Scaled", 0, 100, false],
    "ATHENA_COURTROOM": ["RIGS/RASTER CHARACTERS/Athena - Courtroom/tmp_Athena", 0, 0, true],
    "THE_JUDGE": ["RIGS/RASTER CHARACTERS/The Judge/THE_JUDGE", 640, 360, true],
    "PRIVATE_EYE": ["RIGS/VECTOR CHARACTERS/PRIVATE_EYE/PrivateEyeScaled", 0, 10, true],
    "PRINCESS_LUNA": ["RIGS/VECTOR CHARACTERS/Luna►/Luna►Scaled", 0, 24, false],
    "DIAMOND": ["RIGS/VECTOR CHARACTERS/DIAMOND_TIARA►/DT►Scaled", -240, 0, false],
    "DIAMOND_TIARA": ["RIGS/VECTOR CHARACTERS/DIAMOND_TIARA►/DT►Scaled", -240, 0, false],
    "SILVER": ["RIGS/VECTOR CHARACTERS/SILVER_SPOON►/Silver Spoon►Scaled", 240, 0, false],
    "SILVER_SPOON": ["RIGS/VECTOR CHARACTERS/SILVER_SPOON►/Silver Spoon►Scaled", 240, 0, false],
    "ZECORA": ["RIGS/VECTOR CHARACTERS/ZECORA/Zecora_Scaled", 0, 0, false],
    "SCOOTALOO": ["RIGS/VECTOR CHARACTERS/SCOOTALOO►/ST►Scaled", 0, 0, false],
    "SONATA": ["RIGS/VECTOR CHARACTERS/SonataDefense►/SonataDefense►Scaled", -250, 0, false],
    "SWEETIE_BELLE": ["RIGS/VECTOR CHARACTERS/SWEETIE_BELLE_CUFFED►/SBCuffed►Scaled", 0, 0, false],
    "SWEETIE": ["RIGS/VECTOR CHARACTERS/SWEETIE_BELLE_CUFFED►/SBCuffed►Scaled", 0, 0, false],
    "APOLLO_JUSTICE": ["RIGS/RASTER CHARACTERS/APOLLO - FRONT/JUSTICE - FRONT", 640, 360, false],
    "RARITY": ["RIGS/VECTOR CHARACTERS/RARITY►/Rarity►Scaled", 0, 0, false],
    "FAIR_DEVOTION": ["RIGS/VECTOR CHARACTERS/FAIR_DEVOTION►/Devotion►Scaled", -400, 0, false],
    "SUGAR_STAMP": ["RIGS/VECTOR CHARACTERS/SUGAR_STAMP►/SugarStamp_Scaled", 400, 0, false] */
}

// store frames selected by the user
var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var startFrame = fl.getDocumentDOM().getTimeline().getSelectedFrames()[1];

/*
Function: setup
Variables: none
Description: unlock selected layer so elements can be selected
*/
function setup() {
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers() * 1].locked = false; // unlock layer
}
/*
Function: resetSelection
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: sets selection to the desired layer and frame
*/
function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}


/*
Function: selectOrMakeKeyframe
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: selects the keyframe if there's one there, or makes one if there isn't
*/
function selectOrMakeKeyframe(layer, frame) {
    resetSelection(layer, frame); // select layer and frame
    // if the current frame isn't the first frame in a frame sequence, make a note of that
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
    // if it isn't...
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // keyframe for new position
        resetSelection(layer, frame); // select layer and frame
    }
}

function alignStartToBackground(backgroundX, characterLayer, startFrame, length) {
    resetSelection(characterLayer, startFrame);
    var characterX = fl.getDocumentDOM().getElementProperty("x");
    for (var i = 0; i < length; i++) {
        selectOrMakeKeyframe(characterLayer, fl.getDocumentDOM().getTimeline().currentFrame); // advance to next frame and make keyframe
        fl.getDocumentDOM().setElementProperty("x", characterX + (fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME)].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].x - backgroundX));
        fl.getDocumentDOM().getTimeline().currentFrame++;
        // above line sets the x to the x plus the amount the background shifted by, mimicking layer parenting
    }
}

function alignEndToBackground(backgroundX, characterLayer, startFrame, length) {
    resetSelection(characterLayer, startFrame + length);
    fl.getDocumentDOM().getTimeline().layers[characterLayer * 1].locked = false;
    var characterX = fl.getDocumentDOM().getElementProperty("x");
    for (var i = 0; i < length; i++) {
        selectOrMakeKeyframe(characterLayer, fl.getDocumentDOM().getTimeline().currentFrame); // advance to next frame and make keyframe
        fl.getDocumentDOM().setElementProperty("x", characterX + (fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME)].frames[fl.getDocumentDOM().getTimeline().currentFrame].elements[0].x - backgroundX));
        fl.getDocumentDOM().getTimeline().currentFrame--;
        // above line sets the x to the x plus the amount the background shifted by, mimicking layer parenting
    }
}

/*
Function: createTween
Variables:  
    sourceCharacterLayers [array of ints. layer indices of source characters]
Description: 
*/
function createTween(sourceCharacterlayers) {
    fl.getDocumentDOM().getTimeline().insertFrames(SWIPE_LENGTH - 1, true); // insert frames to all layers
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), startFrame); // go back to original selection
    var backgroundX = fl.getDocumentDOM().getElementProperty("matrix").tx;
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // put keyframe for start of swipe
    fl.getDocumentDOM().getTimeline().createMotionTween(); // create the CLASSIC tween 
    fl.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 11, 0); // set tween to quint ease in out
    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + SWIPE_LENGTH);
    fl.getDocumentDOM().getTimeline().convertToKeyframes(); // convert tween to frame-by-frame animation
    fl.getDocumentDOM().getTimeline().setFrameProperty('tweenType', 'none');
    for (var i = 0; i < sourceCharacterlayers.length; i++) {
        alignStartToBackground(backgroundX, sourceCharacterLayers[i], startFrame, SWIPE_LENGTH / 2);
    }
    alignStartToBackground(backgroundX, fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame, SWIPE_LENGTH / 2);
}

/*
Function: handleCharacters
Variables:  
    sourceCharacterLayers [array of ints. layer indices of source characters]
    destinationCharacterLayer [array of ints. layer indices of destination characters]
Description: 
*/
function handleCharacters(sourceCharacterLayers, destinationCharacterLayers) {
    for (var i = 0; i < sourceCharacterLayers.length; i++) { // iterate over all source character layers
        resetSelection(sourceCharacterLayers[i], startFrame + (SWIPE_LENGTH / 2)); // select source character layer in the middle of the tween
        fl.getDocumentDOM().getTimeline().insertBlankKeyframe(); // put a blank keyframe in the middle
    }
    for (var i = 0; i < destinationCharacterLayers.length; i++) {
        resetSelection(destinationCharacterLayers[i], startFrame + (SWIPE_LENGTH / 2)); // select destination character layer in the middle of the tween
        fl.getDocumentDOM().getTimeline().removeFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + (SWIPE_LENGTH / 2)); // remove half the length in frames (get non-empty keyframes at the playhead)
        fl.getDocumentDOM().getTimeline().insertFrames((SWIPE_LENGTH / 2)); // put the frames back (this mimicks a resize span)
    }
}

/*
Function: handleDesksAndParentDestinationCharacters
Variables:  
    destinationCharacterLayers [array of ints. layer indices of destination characters]
Description: 
*/
function handleDesksAndParentDestinationCharactersFullSwipe(destinationCharacterLayers) {
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2)); // select desks layer in the middle of the tween
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME) * 1].locked = false;
    var backgroundX = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME)].frames[startFrame + SWIPE_LENGTH].elements[0].matrix.tx;
    fl.getDocumentDOM().getTimeline().removeFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + (SWIPE_LENGTH / 2)); // remove half the length in frames (get non-empty keyframes at the playhead)
    fl.getDocumentDOM().getTimeline().insertFrames((SWIPE_LENGTH / 2)); // put the frames back (this mimicks a resize span)
    //doLayerParenting(destinationCharacterLayers.concat(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME)), fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME)); // parent da layers
    for (var i = 0; i < destinationCharacterLayers.length; i++) {
        alignEndToBackground(backgroundX, destinationCharacterLayers[i], startFrame + (SWIPE_LENGTH / 2), SWIPE_LENGTH / 2);
        resetSelection(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
        fl.getDocumentDOM().deleteSelection();
    }
    alignEndToBackground(backgroundX, fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2), SWIPE_LENGTH / 2);
}


function handleDesksAndParentDestinationCharactersHalfSwipe(destinationCharacterLayers) {
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2)); // select desks layer in the middle of the tween
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME) * 1].locked = false;
    var backgroundX = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME)].frames[startFrame + SWIPE_LENGTH].elements[0].matrix.tx;
    fl.getDocumentDOM().getTimeline().removeFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + (SWIPE_LENGTH / 2)); // remove half the length in frames (get non-empty keyframes at the playhead)
    fl.getDocumentDOM().getTimeline().insertFrames((SWIPE_LENGTH / 2)); // put the frames back (this mimicks a resize span)
    //doLayerParenting(destinationCharacterLayers.concat(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME)), fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME)); // parent da layers
    for (var i = 0; i < destinationCharacterLayers.length; i++) {
        alignEndToBackground(backgroundX, destinationCharacterLayers[i], startFrame + (SWIPE_LENGTH / 2) - 1, SWIPE_LENGTH / 2 + 1);
        resetSelection(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
    }
    alignEndToBackground(backgroundX, fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2) - 1, SWIPE_LENGTH / 2 + 1);
}


/*
Function: makeSymbol
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
    name [a string containing the name for the symbol]
Description: 
*/
function makeSymbol(layer, frame, name) { // reused code from fade script
    resetSelection(layer, frame);
    var originalMat = fl.getDocumentDOM().getElementProperty('matrix'); // get matrix of element on timeline
    fl.getDocumentDOM().enterEditMode('inPlace'); // enter symbol
    fl.getDocumentDOM().getTimeline().setSelectedLayers(SYMBOL_CONTENT_LAYER); // set layer to the layer that character is on (assumed to be SYMBOL_CONTENT_LAYER)
    // select current frame
    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
    var isFirstFrameOfFrameSequence = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of that
    fl.getDocumentDOM().getTimeline().convertToKeyframes();
    // select current frame
    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
    if (isFirstFrameOfFrameSequence) {
        fl.getDocumentDOM().setElementProperty('firstFrame', fl.getDocumentDOM().getElementProperty('firstFrame') - 1); // animate makes the firstframe one more if you insert a keyframe on a keyframe
    }
    fl.getDocumentDOM().convertToSymbol("movie clip", name, "top left"); // just assume top left for now. i'll fix it if it doesn't work
    var mat = fl.getDocumentDOM().getElementProperty('matrix');
    mat.tx += originalMat.tx;
    mat.ty += originalMat.ty; // this somehow helps align shittily placed characters like apollo
    fl.getDocumentDOM().library.newFolder(BLUR_SYMBOLS_FOLDER_NAME);
    fl.getDocumentDOM().library.moveToFolder(BLUR_SYMBOLS_FOLDER_NAME, name);
    fl.getDocumentDOM().getTimeline().clearKeyframes(); // clear that keyframe so that the symbol is unchanged :D
    fl.getDocumentDOM().exitEditMode(); // go back to standard timeline
    return mat;
}

/*
Function: placeRigs
Variables:  
    characterLayers [array of ints. layer indices of characters]
Description: 
*/
function placeRigs(characterLayers) {
    for (var i = 0; i < characterLayers.length; i++) {
        resetSelection(characterLayers[i], startFrame + (SWIPE_LENGTH / 2)); // reset selection to ith character
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // insert keyframe
        // fl.getDocumentDOM().getTimeline().layers[characterLayers[i]].setRigParentAtFrame(-1, fl.getDocumentDOM().getTimeline().currentFrame)// get rid of layer parenting
        var layerName = fl.getDocumentDOM().getTimeline().layers[characterLayers[i]].name;
        fl.getDocumentDOM().addItem({ // put new rig
            x: masterRigArray[layerName][1],
            y: masterRigArray[layerName][2]
        }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex("tmp_Dummysymbol")]);
        fl.getDocumentDOM().swapElement(masterRigArray[layerName][0]);
        resetSelection(characterLayers[i], startFrame + (SWIPE_LENGTH / 2)); // reset selection
        var mat = fl.getDocumentDOM().getElementProperty('matrix'); // modify matrix to align the rig
        mat.tx = masterRigArray[layerName][1];
        mat.ty = masterRigArray[layerName][2];
        fl.getDocumentDOM().setElementProperty("x", masterRigArray[layerName][1]);
        fl.getDocumentDOM().setElementProperty("y", masterRigArray[layerName][2]);
        fl.getDocumentDOM().setElementProperty('matrix', mat); // align rig
        var name = layerName + " BLUR";
        var characterBlurIndex = 1;
        while (fl.getDocumentDOM().library.itemExists(BLUR_SYMBOLS_FOLDER_NAME + "/" + name + " " + characterBlurIndex)) {
            characterBlurIndex++;
        }
        var mat = makeSymbol(characterLayers[i], fl.getDocumentDOM().getTimeline().currentFrame, name + " " + characterBlurIndex); // create movieclip symbol of current frame of rig
        resetSelection(characterLayers[i], startFrame + (SWIPE_LENGTH / 2)); // reset selection
        fl.getDocumentDOM().setElementProperty('symbolType', 'movie clip');
        fl.getDocumentDOM().swapElement(BLUR_SYMBOLS_FOLDER_NAME + "/" + name + " " + characterBlurIndex);
        fl.getDocumentDOM().addFilter('blurFilter'); // blur the character
        fl.getDocumentDOM().setFilterProperty("blurX", 0, 70); // set blur parametrs
        fl.getDocumentDOM().setElementProperty('matrix', mat); // align new symbol
        fl.getDocumentDOM().getTimeline().insertBlankKeyframe();
    }
}

/*
Function: handleMidCrossCourtSwipe
Variables: None
Description: 
*/
function handleMidCrossCourtSwipe(witnessStandCharacterLayers) { // handle the frame where the witnesses are on screen
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2)); // select desks layer in middle of tween
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // put keyframe in da middle
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2)); // select desks layer in middle of tween
    fl.getDocumentDOM().deleteSelection(); // delete old desk
    //fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME)].setRigParentAtFrame(-1, fl.getDocumentDOM().getTimeline().currentFrame)// get rid of layer parenting
    fl.getDocumentDOM().addItem({ // put new desk there
        x: WITNESS_STAND_X,
        y: (WITNESS_STAND_Y + WITNESS_STAND_HEIGHT / 2) // for some reason this aligns it correctly
    }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(WITNESS_STAND_SYMBOL_PATH)]);
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2)); // reset selection
    fl.getDocumentDOM().setElementProperty('symbolType', 'movie clip');
    fl.getDocumentDOM().addFilter('blurFilter'); // blur the desk
    fl.getDocumentDOM().setFilterProperty("blurX", 0, 70); // set blur parametrs
    placeRigs(witnessStandCharacterLayers);
}


// go backwards from a frame to find the most recent non-empty keyframe
function findNonEmptyGraphicKeyframe(layer) {
    for(var i = 0; i < fl.getDocumentDOM().getTimeline().layers[layer].frameCount; i+= fl.getDocumentDOM().getTimeline().layers[layer].frames[i].duration) {
        if(!fl.getDocumentDOM().getTimeline().layers[layer].frames[i].isEmpty && fl.getDocumentDOM().getTimeline().layers[layer].frames[i].elements[0].symbolType == "graphic") {
            return i;
        }
    }
    return -1;
}

function pushCharacterData(layers) { // just push entries to masterRigArray
    for (var i = 0; i < layers.length; i++) {
        var layer = fl.getDocumentDOM().getTimeline().layers[layers[i]];
        var contentFrame = findNonEmptyGraphicKeyframe(layers[i]);
        if(contentFrame == -1) {
            throw new Error("Error: No instance of character on layer: " + layer.name);
        }
        var toPush = [layer.frames[contentFrame].elements[0].libraryItem.name, layer.frames[contentFrame].elements[0].x, layer.frames[contentFrame].elements[0].y];
        masterRigArray[layer.name] = toPush;
    }
}

/*
Function: makeWitnessStandToDeskSwipe
Variables:  
    sourceCharacterLayers [array of ints. layer indices of source characters]
    destinationCharacterLayer [array of ints. layer indices of destination characters]
Description: 
*/
function makeWitnessStandToDeskSwipe(sourceCharacterLayers, destinationCharacterLayers) {
    createTween(sourceCharacterLayers);
    handleCharacters(sourceCharacterLayers, destinationCharacterLayers);
    handleDesksAndParentDestinationCharactersHalfSwipe(destinationCharacterLayers);
}

/*
Function: makeCrossCourtSwipe
Variables:  
    sourceCharacterLayer [integer index of the source character layer]
    destinationCharacterLayer [array of ints. layer indices of destination characters]
    witnessStandCharacterLayers [array of ints. layer indices of witness characters]
Description: 
*/
function makeCrossCourtSwipe(sourceCharacterLayer, destinationCharacterLayer, witnessStandCharacterLayers) {
    pushCharacterData(witnessStandCharacterLayers); 
    createTween(sourceCharacterLayer);
    handleCharacters(sourceCharacterLayer, destinationCharacterLayer);
    handleDesksAndParentDestinationCharactersFullSwipe(destinationCharacterLayer);
    handleMidCrossCourtSwipe(witnessStandCharacterLayers);
}

function makeCrossCourtSwipeEmptyStand(sourceCharacterLayer, destinationCharacterLayer) {
    createTween(sourceCharacterLayer);
    handleCharacters(sourceCharacterLayer, destinationCharacterLayer);
    handleDesksAndParentDestinationCharactersFullSwipe(destinationCharacterLayer);
    handleMidCrossCourtSwipe([]);
}

/*
>>>MAIN<<<
Description: 
*/
/*try {
    fl.runScript(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/")) + "/MasterRigArray.cfg");
} catch (error) {
    alert("MasterRigArray.cfg not found! Using builtin values.");
    // var masterRigArrayPath = fl.browseForFileURL("select");
    // fl.runScript(masterRigArrayPath);
} */
setup();
// select layer and frame
resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), startFrame);
// user specified boolean value
var halfCourt = confirm("Click OK for a half-court swipe. Click Cancel for a full-court swipe.");
// source characters are characters displayed before the swipe
var suggestion = "";
// if there's data in the document, use it!
if (fl.getDocumentDOM().documentHasData("sourceChars")) {
    suggestion = fl.getDocumentDOM().getDataFromDocument("sourceChars");
}
var sourceCharacterLayerNames = prompt("Enter the source character LAYER NAMES, separated by a comma (no spaces)", suggestion);
var sourceCharacterLayers = [];

for (var i = 0; i < sourceCharacterLayerNames.split(',').length; i++) {
    if (fl.getDocumentDOM().getTimeline().findLayerIndex(sourceCharacterLayerNames.split(',')[i]) != undefined) {
        sourceCharacterLayers.push(fl.getDocumentDOM().getTimeline().findLayerIndex(sourceCharacterLayerNames.split(',')[i]));
    } else {
        throw new Error("Invalid input.");
    }
}
// store valid source characters into persistent data
fl.getDocumentDOM().addDataToDocument("sourceChars", "string", sourceCharacterLayerNames);
// A desitination character is the character that will be displayed after the swipe
suggestion = "";
// if there's data in the document, use it!
if (fl.getDocumentDOM().documentHasData("destChars")) {
    suggestion = fl.getDocumentDOM().getDataFromDocument("destChars");
}
var destinationCharacterLayerNames = prompt("Enter the destination character LAYER NAMES, separated by a comma (no spaces)", suggestion);
var destinationCharacterLayers = [];
// for each layer name provided...
for (var i = 0; i < destinationCharacterLayerNames.split(',').length; i++) {
    // if the name is valid
    if (fl.getDocumentDOM().getTimeline().findLayerIndex(destinationCharacterLayerNames.split(',')[i]) != undefined) {
        // add the layer index to the array
        destinationCharacterLayers.push(fl.getDocumentDOM().getTimeline().findLayerIndex(destinationCharacterLayerNames.split(',')[i]));
    } else {
        throw new Error("Invalid input.");
    }
}
// store valid destination characters into persistent data
fl.getDocumentDOM().addDataToDocument("destChars", "string", destinationCharacterLayerNames);
// If we've got ourselves a full courtroom swipe
if (!halfCourt) {
    // witness characters are characters currently at the witness stand
    var witnessCharacterLayerNames = prompt("Enter the witness characters LAYER NAMES, separated by a comma (no spaces)", fl.getDocumentDOM().getDataFromDocument("witnessLayerNames"));
    var witnessCharacterLayers = [];
    // for each layer name provided...
    for (var i = 0; i < witnessCharacterLayerNames.split(',').length; i++) {
        if(witnessCharacterLayerNames == "") break;
        // if the name is valid
        if (fl.getDocumentDOM().getTimeline().findLayerIndex(witnessCharacterLayerNames.split(',')[i]) != undefined) {
            // add the layer index to the array
            witnessCharacterLayers.push(fl.getDocumentDOM().getTimeline().findLayerIndex(witnessCharacterLayerNames.split(',')[i]));
        } else {
            throw new Error("Invalid input.");
        }
    }
}
// if we've got ourselves a half courtroom swipe
if (halfCourt) {
    makeWitnessStandToDeskSwipe(sourceCharacterLayers, destinationCharacterLayers);
} else if(witnessCharacterLayerNames != "") {
    makeCrossCourtSwipe(sourceCharacterLayers, destinationCharacterLayers, witnessCharacterLayers);
} else {
    makeCrossCourtSwipeEmptyStand(sourceCharacterLayers, destinationCharacterLayers);
}