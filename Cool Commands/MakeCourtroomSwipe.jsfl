/******************************************************************************
MAKE COURTROOM SWIPE
Description: Create animation of swipe between characters in the courtroom
******************************************************************************/

SWIPE_LENGTH = 14; // frames in swipe from witness stand to desks and vice versa *must be even*
BACKGROUND_LAYER_NAME = "BACKGROUNDS";
DESKS_LAYER_NAME = "DESKS";
WITNESS_STAND_X = 640;
WITNESS_STAND_Y = 509;
WITNESS_STAND_SYMBOL_PATH = "OTHER ASSETS/DESKS/WitnessStand";
WITNESS_STAND_HEIGHT = 410;
SYMBOL_CONTENT_LAYER = 1;
BLUR_SYMBOLS_FOLDER_NAME = "BLUR_SYMBOLS";

var masterRigArray = { // map layer names to the rig and position (idk what the boolean is :D)-- first entry is the path to the rig, second entry is the X coordinate, third entry is Y coordinate
    "TWILIGHT_SPARKLE": ["RIGS/VECTOR CHARACTERS/TWILIGHT SPARKLE/TwilightCouncil►/TwilightCouncil►Scaled", 0, 100, false],
    "ATHENA_COURTROOM": ["RIGS/RASTER CHARACTERS/Athena - Courtroom/tmp_Athena", 0, 0, true],
    "THE_JUDGE": ["RIGS/RASTER CHARACTERS/The Judge/THE_JUDGE", 640, 360, true],
    "PRIVATE_EYE": ["RIGS/VECTOR CHARACTERS/PRIVATE_EYE/PrivateEyeScaled", 0, 10, true],
    "PRINCESS_LUNA": ["RIGS/VECTOR CHARACTERS/Luna►/Luna►Scaled", 0, 24, false],
    "DIAMOND": ["RIGS/VECTOR CHARACTERS/DIAMOND_TIARA/DT►Scaled", -240, 0, false],
    "DIAMOND_TIARA": ["RIGS/VECTOR CHARACTERS/DIAMOND_TIARA/DT►Scaled", -240, 0, false],
    "SILVER": ["RIGS/VECTOR CHARACTERS/SILVER_SPOON/Silver Spoon►Scaled", 240, 0, false],
    "SILVER_SPOON": ["RIGS/VECTOR CHARACTERS/SILVER_SPOON/Silver Spoon►Scaled", 240, 0, false],
    "ZECORA": ["RIGS/VECTOR CHARACTERS/ZECORA/Zecora_Scaled", 0, 0, false],
    "SCOOTALOO": ["RIGS/VECTOR CHARACTERS/SCOOTALOO►/ST►Scaled", 0, 0, false],
    "SONATA": ["RIGS/VECTOR CHARACTERS/SonataDefense►/SonataDefense►Scaled", -250, 0, false],
    "SWEETIE_BELLE": ["RIGS/VECTOR CHARACTERS/SWEETIE_BELLE_CUFFED►/SBCuffed►Scaled", 0, 0, false],
    "SWEETIE": ["RIGS/VECTOR CHARACTERS/SWEETIE_BELLE_CUFFED►/SBCuffed►Scaled", 0, 0, false],
    "APOLLO_JUSTICE": ["RIGS/RASTER CHARACTERS/APOLLO - FRONT/JUSTICE - FRONT", 640, 360, false],
    "RARITY": ["RIGS/VECTOR CHARACTERS/RARITY►/Rarity►Scaled", 0, 0, false],
    "FAIR_DEVOTION": ["RIGS/VECTOR CHARACTERS/FAIR_DEVOTION►/Devotion►Scaled", -400, 0, false],
    "SUGAR_STAMP": ["RIGS/VECTOR CHARACTERS/SUGAR_STAMP►/SugarStamp_Scaled", 400, 0, false]
}

// store frames selected by the user
var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var startFrame = fl.getDocumentDOM().getTimeline().getSelectedFrames()[1];

/*
Function: resetSelection
Variables:  
	layer []
	frame []
Description: 
*/
function resetSelection(layer, frame) { // sets selection the desired layer and frame
    fl.getDocumentDOM().selectNone();
    fl.getDocumentDOM().getTimeline().setSelectedLayers(layer * 1);
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select current frame
    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
}


/*
Function: doLayerParenting
Variables:  
	childLayerIndices []
	parentLayerIndex []
Description: 
*/
function doLayerParenting(childLayerIndices, parentLayerIndex) {
    for (var i = 0; i < childLayerIndices.length; i++) {
        fl.getDocumentDOM().getTimeline().layers[childLayerIndices[i]].setRigParentAtFrame(fl.getDocumentDOM().getTimeline().layers[parentLayerIndex], fl.getDocumentDOM().getTimeline().currentFrame); // THE SECRET COMMAND THAT SETS A LAYER'S PARENT TO THE ARGUMENT AT THE SECOND ARGUMENT FRAME AAAAAAA
    }
}

/*
Function: createTween
Variables:  
	layer []
	frame []
Description: 
*/
function createTween(sourceCharacterlayers) {
    fl.getDocumentDOM().getTimeline().insertFrames(SWIPE_LENGTH - 1, true); // insert frames to all layers
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), startFrame); // go back to original selection
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // put keyframe for start of swipe
    doLayerParenting(sourceCharacterlayers.concat(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME)), fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME)); // parent da layers
    fl.getDocumentDOM().getTimeline().createMotionTween(); // create the CLASSIC tween 
    fl.getDocumentDOM().getTimeline().setFrameProperty('easeType', 5, 11, 0); // set tween to quint ease in out
}

/*
Function: handleCharacters
Variables:  
	sourceCharacterLayers []
	destinationCharacterLayers []
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
	destinationCharacterLayers []
Description: 
*/
function handleDesksAndParentDestinationCharacters(destinationCharacterLayers) {
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2)); // select desks layer in the middle of the tween
    fl.getDocumentDOM().getTimeline().removeFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + (SWIPE_LENGTH / 2)); // remove half the length in frames (get non-empty keyframes at the playhead)
    fl.getDocumentDOM().getTimeline().insertFrames((SWIPE_LENGTH / 2)); // put the frames back (this mimicks a resize span)
    doLayerParenting(destinationCharacterLayers.concat(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME)), fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME)); // parent da layers
}

/*
Function: makeSymbol
Variables:  
	layer []
    frame []
    name []
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
	characterLayers []
Description: 
*/
function placeRigs(characterLayers) {
    for (var i = 0; i < characterLayers.length; i++) {
        resetSelection(characterLayers[i], startFrame + (SWIPE_LENGTH / 2)); // reset selection to ith character
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // insert keyframe
        fl.getDocumentDOM().getTimeline().layers[characterLayers[i]].setRigParentAtFrame(-1, fl.getDocumentDOM().getTimeline().currentFrame)// get rid of layer parenting
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
        fl.getDocumentDOM().setElementProperty('matrix', mat); // align rig
        var name = layerName + " BLUR";
        var mat;
        if (!fl.getDocumentDOM().library.itemExists(BLUR_SYMBOLS_FOLDER_NAME + "/" + name)) {
            mat = makeSymbol(characterLayers[i], fl.getDocumentDOM().getTimeline().currentFrame, name); // create movieclip symbol of current frame of rig
        } else {
            mat = fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(BLUR_SYMBOLS_FOLDER_NAME + "/" + name)].timeline.layers[SYMBOL_CONTENT_LAYER].frames[fl.getDocumentDOM().getElementProperty("firstFrame")].elements[0].matrix; // get matrix from the already-existant symbol (holy shit this is a long ass line and I'm making it longer with this comment xD)
        }
        resetSelection(characterLayers[i], startFrame + (SWIPE_LENGTH / 2)); // reset selection
        fl.getDocumentDOM().setElementProperty('symbolType', 'movie clip');
        fl.getDocumentDOM().swapElement(BLUR_SYMBOLS_FOLDER_NAME + "/" + name);
        fl.getDocumentDOM().addFilter('blurFilter'); // blur the desk
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
    fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME)].setRigParentAtFrame(-1, fl.getDocumentDOM().getTimeline().currentFrame)// get rid of layer parenting
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

/*
Function: makeWitnessStandToDeskSwipe
Variables:  
	sourceCharacterLayers []
    destinationCharacterLayers []
Description: 
*/
function makeWitnessStandToDeskSwipe(sourceCharacterLayers, destinationCharacterLayers) {
    createTween(sourceCharacterLayers);
    handleCharacters(sourceCharacterLayers, destinationCharacterLayers);
    handleDesksAndParentDestinationCharacters(destinationCharacterLayers);
}

/*
Function: makeCrossCourtSwipe
Variables:  
	sourceCharacterLayer []
    destinationCharacterLayer []
    witnessStandCharacterLayers []
Description: 
*/
function makeCrossCourtSwipe(sourceCharacterLayer, destinationCharacterLayer, witnessStandCharacterLayers) {
    createTween(sourceCharacterLayer);
    handleCharacters(sourceCharacterLayer, destinationCharacterLayer);
    handleDesksAndParentDestinationCharacters(destinationCharacterLayer);
    handleMidCrossCourtSwipe(witnessStandCharacterLayers);
}

/*
>>>MAIN<<<
Description: 
*/
resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(BACKGROUND_LAYER_NAME), startFrame);
var halfCourt = confirm("Click OK for a half-court swipe. Click Cancel for a full-court swipe.");
var sourceCharacterLayerNames = prompt("Enter the source character LAYER NAMES, separated by a comma (no spaces)");
var sourceCharacterLayers = [];
for (var i = 0; i < sourceCharacterLayerNames.split(',').length; i++) {
    if (fl.getDocumentDOM().getTimeline().findLayerIndex(sourceCharacterLayerNames.split(',')[i]) != undefined) {
        sourceCharacterLayers.push(fl.getDocumentDOM().getTimeline().findLayerIndex(sourceCharacterLayerNames.split(',')[i]));
    } else {
        throw new Error("Invalid input.");
    }
}
var destinationCharacterLayerNames = prompt("Enter the destination character LAYER NAMES, separated by a comma (no spaces)");
var destinationCharacterLayers = [];
for (var i = 0; i < destinationCharacterLayerNames.split(',').length; i++) {
    if (fl.getDocumentDOM().getTimeline().findLayerIndex(sourceCharacterLayerNames.split(',')[i]) != undefined) {
        destinationCharacterLayers.push(fl.getDocumentDOM().getTimeline().findLayerIndex(destinationCharacterLayerNames.split(',')[i]));
    } else {
        throw new Error("Invalid input.");
    }
}
if (!halfCourt) {
    var witnessCharacterLayerNames = prompt("Enter the witness characters LAYER NAMES, separated by a comma (no spaces)", fl.getDocumentDOM().getDataFromDocument("witnessLayerNames"));
    var witnessCharacterLayers = [];
    for (var i = 0; i < witnessCharacterLayerNames.split(',').length; i++) {
        if (fl.getDocumentDOM().getTimeline().findLayerIndex(witnessCharacterLayerNames.split(',')[i]) != undefined) {
            witnessCharacterLayers.push(fl.getDocumentDOM().getTimeline().findLayerIndex(witnessCharacterLayerNames.split(',')[i]));
        } else {
            throw new Error("Invalid input.");
        }
    }
}
if (halfCourt) {
    makeWitnessStandToDeskSwipe(sourceCharacterLayers, destinationCharacterLayers);
} else {
    makeCrossCourtSwipe(sourceCharacterLayers, destinationCharacterLayers, witnessCharacterLayers);
}