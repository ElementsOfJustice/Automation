/******************************************************************************
MAKE COURTROOM SWIPE
Description: Create animation of swipe between characters in the courtroom
******************************************************************************/

var SWIPE_LENGTH = 14; // frames in swipe from witness stand to desks and vice versa *must be even*
var BACKGROUND_LAYER_NAME = "BACKGROUNDS";
var DESKS_LAYER_NAME = "DESKS";
var WITNESS_STAND_X = 640;
var WITNESS_STAND_Y = 509;
var WITNESS_STAND_SYMBOL_PATH = "OTHER ASSETS/DESKS/WitnessStand";

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
Function: do Layer Parenting
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
    fl.getDocumentDOM().getTimeline().setSelectedFrames(selectedFrames); // go back to original selection
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
Function: handleMidCrossCourtSwipe
Variables: None
Description: 
*/
function handleMidCrossCourtSwipe() { // handle the frame where the witnesses are on screen
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2)); // select desks layer in middle of tween
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // put keyframe in da middle
    resetSelection(fl.getDocumentDOM().getTimeline().findLayerIndex(DESKS_LAYER_NAME), startFrame + (SWIPE_LENGTH / 2)); // select desks layer in middle of tween
    fl.getDocumentDOM().deleteSelection(); // delete old desk
    fl.getDocumentDOM().addItem({ // put new desk there
        x: WITNESS_STAND_X,
        y: WITNESS_STAND_Y
    }, fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(WITNESS_STAND_SYMBOL_PATH)]);

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
    handleMidCrossCourtSwipe();
}


//makeWitnessStandToDeskSwipe(fl.getDocumentDOM().getTimeline().findLayerIndex("ATHENA_COURTROOM"), [fl.getDocumentDOM().getTimeline().findLayerIndex("PRIVATE_EYE"), fl.getDocumentDOM().getTimeline().findLayerIndex("SUGAR_STAMP"), fl.getDocumentDOM().getTimeline().findLayerIndex("FAIR_DEVOTION")]);
makeCrossCourtSwipe(fl.getDocumentDOM().getTimeline().findLayerIndex("PRINCESS_LUNA"), fl.getDocumentDOM().getTimeline().findLayerIndex("ATHENA_COURTROOM"), undefined);