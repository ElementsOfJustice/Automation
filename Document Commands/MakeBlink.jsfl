/******************************************************************************
MAKE BLINK
Description: 

Tutorial Available in the MEGA: https://mega.nz/fm/qlIkjDSA
******************************************************************************/

/*
Function: resetSelection
Variables:  
    layer [integer(or should be) index of a layer]
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
    layer [integer(or should be) index of a layer]
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

/*
Function: getPoseName
Variables:  
    layer [integer(or should be) index of a layer]
    frame [integer index of a frame]
Description: Returns the name of the pose
*/
function getPoseName(layer, frame) {
    resetSelection(layer, frame); // select layer & frame
    if (fl.getDocumentDOM().selection[0] == undefined) { // if there is no selection
        return undefined;
    }
    var characterTimeline = fl.getDocumentDOM().selection[0].libraryItem.timeline; // get the timeline of the selected symbol
    var xSheetLayerIndex = characterTimeline.findLayerIndex("xSheet"); // get the integer index of layer "xSheet"
    if (xSheetLayerIndex == undefined) {
        xSheetLayerIndex = 0; // assume it's at 0 if somehow it doesn't find it
    }
    var poseFrame = fl.getDocumentDOM().getElementProperty("firstFrame"); // get the index in the firstFrame property
    // in the character timeline, obtain the name of the pose as it stands on the given frame
    if(characterTimeline.layers[xSheetLayerIndex].frames[poseFrame] === undefined) {
        return undefined;   
    }
    return characterTimeline.layers[xSheetLayerIndex].frames[poseFrame].name;
}

/*
Function: getBlinkInfo
Variables:  
    layer [integer(or should be) index of a layer]
    frame [integer index of a frame]
Description: Returns an array containing the first frame of a blink animation 
    and the length of the blink animation
*/
function getBlinkInfo(layer, frame) {
    var poseName = getPoseName(layer, frame);
    var characterName = fl.getDocumentDOM().selection[0].libraryItem.name; // gets the name of the character 
    var firstFrameOfBlink = undefined; 
    var blinkLength = undefined;
    var i = 0;
    // iterates through all open documents 
    while (firstFrameOfBlink === undefined && blinkLength === undefined && i < fl.documents.length) {
        // attempt to retrieve the first frame of the blink and the blink length from the data in the document
        firstFrameOfBlink = fl.documents[i].getDataFromDocument(characterName + "." + poseName + ".blink")[0];
        blinkLength = fl.documents[i].getDataFromDocument(characterName + "." + poseName + ".blink")[1];
        i++
    }
    // If the data is not found in the full path
    if (firstFrameOfBlink === undefined || blinkLength === undefined) { // check to see if data is in the symbol name instead of the full path 
        characterName = characterName.substring(characterName.lastIndexOf("/") + 1);
        i = 0;
        // try again with the symbol name
        while (firstFrameOfBlink === undefined && blinkLength === undefined && i < fl.documents.length) {
            firstFrameOfBlink = fl.documents[i].getDataFromDocument(characterName + "." + poseName + ".blink")[0];
            blinkLength = fl.documents[i].getDataFromDocument(characterName + "." + poseName + ".blink")[1];
            i++
        }
    }
    return [firstFrameOfBlink, blinkLength];
}

//TODO: search for the blinking persistent data. If it does not exist, tell the user and quit
var blinkInfo = getBlinkInfo(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame);
if(blinkInfo[0] === undefined || blinkInfo[1] === undefined) throw new Error("Blink data not found. Use InsertBlinkData to create it.");
selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame);
fl.getDocumentDOM().setElementProperty("loop", "loop");
fl.getDocumentDOM().setElementProperty("firstFrame", blinkInfo[0] - 1); // it's one indexed
selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().getSelectedLayers(), fl.getDocumentDOM().getTimeline().currentFrame + blinkInfo[1]);
fl.getDocumentDOM().setElementProperty("loop", "single frame");
