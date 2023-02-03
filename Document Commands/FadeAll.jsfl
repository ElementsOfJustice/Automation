/******************************************************************************
FADE ALL
Description: 


******************************************************************************/

FIRST_LAYER_INDEX = 3; // indecies of layers for timeline.getSelectedFrames() for multiple selections
SECOND_LAYER_INDEX = 0;
FIRST_FRAME_INDEX = 4; // indecies of frames for timeline.getSelectedFrames() for multiple selections
SECOND_FRAME_INDEX = 1;
SYMBOL_CONTENT_LAYER = 1;
FADES_FOLDER_NAME = "FADES";
CHARACTER_LAYER_FOLDERS_DISCRIMINATOR = "CHARACTERS";
EMPTY = false;
NOT_EMPTY = true;

// USER OPTIONS 
FADE_LENGTH = 4; // length of each fade in frames
BETWEEN_FADE_LENGTH = 4; // number of frames of blankness between fades (standard is 4)
CREATE_NEW_FRAMES = true; // if this is true, make fades by inserting frames; if this is false, creates no new frames (overrides BETWEEN_FADE_LENGTH as if it were 0)
CHANGE_TRANSFORMATION_POINT = false; // if this is true, do shenanigains with the transformation point. Sometimes this causes misalignments, other times it doesn't.
try {
    fl.runScript(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/")) + "/Options.cfg"); // load user options from file
} catch (error) {

}
/*
Function: setup
Variables: none
Description: unlock all selected layers
*/
function setup() {
    for (var i = 0; i < fl.getDocumentDOM().getTimeline().getSelectedLayers().length; i++) {
        fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[i] * 1].locked = false; // unlock layer
    }
}

/* Function: getKeys */
function getKeys(input) { // get array of start times from the words or phonemes
    var arr = [];
    for (var i in input) {
        arr.push(i);
    }
    return arr;
}

/* Function to check if two items are equal */
function isEqual(a, b) {
    return a == b;
}

/*
Function: arrayContains
Variables: 
    array   [the input array to search in]
    element [the element to search for]
    compare [?? A function that compares the elements and returns a boolean ??]
Description: Indicate whether the element is found in the array
*/
function arrayContains(array, element, compare) {
    for (var i = 0; i < array.length; i++) {
        if (compare(array[i], element)) {
            return true;
        }
    }
    return false;
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
Function: resetSelectionMultiple
Variables:  
    layer [array of layer incices]
    frame [integer index of a frame]
Description: select multiple layers on a single frame
*/
function resetSelectionMultiple(layers, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame; // Set current frame to given frame
    var selectionArr = [];
    for (var i = 0; i < layers.length; i++) {
        selectionArr.push(parseInt(layers[i]) * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
    }
    fl.getDocumentDOM().getTimeline().setSelectedFrames(selectionArr, true);
}


function masterResetSelection(layers, frame) { // handle all reset selections
    if (layers.length === undefined) {
        resetSelection(layers, frame);
    } else if (layers.length == 1) {
        resetSelection(layers[0], frame);
    } else {
        resetSelectionMultiple(layers, frame);
    }
}

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

function makeFadeSymbol(layer, frame, name) {
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
    var tp = fl.getDocumentDOM().getTransformationPoint();
    fl.getDocumentDOM().library.newFolder(FADES_FOLDER_NAME);
    fl.getDocumentDOM().library.moveToFolder(FADES_FOLDER_NAME, name);
    fl.getDocumentDOM().getTimeline().clearKeyframes(); // clear that keyframe so that the symbol is unchanged :D
    fl.getDocumentDOM().exitEditMode(); // go back to standard timeline
    return [mat, tp]; // return alignment matrix and tp
}

function insertNewFrames(layers, frame) { // insert new frames for a fade
    masterResetSelection(layers, frame - 1);
    fl.getDocumentDOM().getTimeline().removeFrames(); // remove one frame to line up the content keyframe
    fl.getDocumentDOM().getTimeline().insertFrames(FADE_LENGTH + (BETWEEN_FADE_LENGTH / 2), true); // insert (fade length + half the frames of emptiness between fades) frames on every layer
    masterResetSelection(layers, frame - 2); // go to frame before fade in, guaranteed to leave fadeouts unaffected
    fl.getDocumentDOM().getTimeline().insertFrames(); // re-insert deleted frame
}

function removeConflictingFrames(layers, frame) {
    for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
        var indexIsDifferentLayerFromFadingOne = false;
        if (layers.length === undefined) {
            indexIsDifferentLayerFromFadingOne = (i != layers);
        } else {
            indexIsDifferentLayerFromFadingOne = !arrayContains(layers, i, isEqual);
        }
        if (fl.getDocumentDOM().getTimeline().layers[i].parentLayer != null && fl.getDocumentDOM().getTimeline().layers[i].parentLayer.name.indexOf(CHARACTER_LAYER_FOLDERS_DISCRIMINATOR) != -1 && (indexIsDifferentLayerFromFadingOne) && fl.getDocumentDOM().getTimeline().layers[i].frames[frame - 2].elements.length > 0) {
            resetSelection(i, frame - 2);
            fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(); // remove conflicting frames
        }
    }
}

/*
Function: fadeSetup
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
    name  [a string containing the name for the symbol]
    mat   [a matrix]
    tp    [a transformation point]
Description: 
*/
function fadeSetup(layers, frame, names, mats, tps) {
    masterResetSelection(layers, frame);
    fl.getDocumentDOM().setElementProperty('symbolType', 'movie clip'); // convert the frame to movie clip beforehand (this fixes a really weird glitch)
    if (layers.length === undefined) {
        fl.getDocumentDOM().swapElement(FADES_FOLDER_NAME + "/" + names); // put fading symbol on the timeline
        if (CHANGE_TRANSFORMATION_POINT) { // if the flag is set to true
            fl.getDocumentDOM().setTransformationPoint(tps); // set the tp to the passed in variable
        }
        fl.getDocumentDOM().setElementProperty('matrix', mats); // align new symbol
        fl.getDocumentDOM().addFilter('dropShadowFilter'); // put the drop shadow filter on the fading symbol (necessary for this kind of fade)
        fl.getDocumentDOM().setFilterProperty("strength", 0, 0); // set the drop shadow strength to 0
    } else {
        for (var i = 0; i < layers.length; i++) {
            masterResetSelection(layers[i], frame);
            fl.getDocumentDOM().swapElement(FADES_FOLDER_NAME + "/" + names[i]); // swap all symbols for simiultaneous fading
            if (CHANGE_TRANSFORMATION_POINT) { // if the flag is set to true
                fl.getDocumentDOM().setTransformationPoint(tps[i]); // set the tp to the passed in variable
            }
            fl.getDocumentDOM().setElementProperty('matrix', mats[i]); // align new symbol
            fl.getDocumentDOM().addFilter('dropShadowFilter'); // put the drop shadow filter on the fading symbol (necessary for this kind of fade)
            fl.getDocumentDOM().setFilterProperty("strength", 0, 0); // set the drop shadow strength to 0
        }
        masterResetSelection(layers, frame);
    }
    if (CREATE_NEW_FRAMES) {
        insertNewFrames(layers, frame);
        removeConflictingFrames(layers, frame);
    }
    masterResetSelection(layers, frame);
}

/*
Function: makeFadeIn
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
    name  [a string containing the name for the symbol]
    mat   [a matrix]
    tp    [a transformation point]
Description: Create a fade-in effect
*/
function makeFadeIn(layers, frame, names, mats, tps) {
    fadeSetup(layers, frame, names, mats, tps);
    if (CREATE_NEW_FRAMES && BETWEEN_FADE_LENGTH != 0) { // if there's no space between fades or if we're not making new frames, no need to run these.
        frame += BETWEEN_FADE_LENGTH / 2;
        masterResetSelection(layers, frame); // go to beginning of fade 
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // create keyframe for beginning of fade
        frame -= BETWEEN_FADE_LENGTH / 2;
        masterResetSelection(layers, frame); // go to where empty frames should be
        fl.getDocumentDOM().deleteSelection(); // get it outta here
    }
    frame += FADE_LENGTH + BETWEEN_FADE_LENGTH / 2;
    masterResetSelection(layers, frame); // go to end of fade
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // put keyframe at end of fade
    frame -= FADE_LENGTH;
    masterResetSelection(layers, frame); // go to beginning of fade
    fl.getDocumentDOM().setInstanceAlpha(0); // set alpha to zero
    fl.getDocumentDOM().getTimeline().createMotionTween(); // create tween for the fade
}

/*
Function: makeFadeOut
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
    name  [a string containing the name for the symbol]
    mat   [a matrix]
    tp    [a transformation point]
Description: Create a fade-out effect
*/
function makeFadeOut(layers, frame, name, mats, tps) {
    if (!CREATE_NEW_FRAMES) {
        frame -= FADE_LENGTH; // put cursor at appropriate spot if we're not making new frames   
    }
    masterResetSelection(layers, frame);
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // insert keyframe at the cursor
    fadeSetup(layers, frame, name, mats, tps);
    frame += FADE_LENGTH; // move to where end of fade is
    masterResetSelection(layers, frame);
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // create keyframe for end of fade
    if (CREATE_NEW_FRAMES && BETWEEN_FADE_LENGTH != 0) {
        masterResetSelection(layers, frame + 1);
        fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(); // create blank keyframe for the emptiness between fades
    }
    masterResetSelection(layers, frame); // inserting keyframes deselects everything, so it's most efficient to put this here
    fl.getDocumentDOM().setInstanceAlpha(0); // get it outta here
    frame -= FADE_LENGTH; // go to start of fade
    masterResetSelection(layers, frame);
    fl.getDocumentDOM().getTimeline().createMotionTween(); // create the tween for the fade
}

/*
Function: fadeOutAndIn
Variables:  
    fadeOutLayer [integer index of a layer for the fadeOut]
    fadeOutFrame [integer index of a frame for the fadeOut]
    fadeOutName  [a string containing the name for the symbol for the fadeOut]
    fadeInLayer  [integer index of a layer for the fadeIn]
    fadeInFrame  [integer index of a frame for the fadeIn]
    fadeInName   [a string containing the name for the symbol for the fadeIn]
Description: Call functions to create symbols, fadeIn, and fadeOut
*/
function fadeOutAndIn(fadeOutLayer, fadeOutFrame, fadeOutName, fadeInLayer, fadeInFrame, fadeInName) {
    fadeInFrame += (CREATE_NEW_FRAMES) ? (FADE_LENGTH + (BETWEEN_FADE_LENGTH / 2)) : 0; // we sometimes insert frames during makeFadeOut(), so we gotta consider that
    var info = makeFadeSymbol(fadeOutLayer, fadeOutFrame, fadeOutName); // make fade out symbol
    makeFadeOut(fadeOutLayer, fadeOutFrame, fadeOutName, info[0], info[1]); // make fade out
    info = makeFadeSymbol(fadeInLayer, fadeInFrame, fadeInName); // make fade in symbol
    makeFadeIn(fadeInLayer, fadeInFrame, fadeInName, info[0], info[1]); // make fade in
}

/*
Function: fadeOut
Variables:  
    fadeOutLayer [integer index of a layer for the fadeOut]
    fadeOutFrame [integer index of a frame for the fadeOut]
    fadeOutName  [a string containing the name for the symbol for the fadeOut]
Description: Create a symbol and a fade-out
*/
function fadeOut(fadeOutLayer, fadeOutFrame, fadeOutName) {
    var info = makeFadeSymbol(fadeOutLayer, fadeOutFrame, fadeOutName); // make fade out symbol
    makeFadeOut(fadeOutLayer, fadeOutFrame, fadeOutName, info[0], info[1]); // make fade out
}

/*
Function: fadeIn
Variables:  
    fadeInLayer [integer index of a layer for the fadeIn]
    fadeInFrame [integer index of a frame for the fadeIn]
    fadeInName  [a string containing the name for the symbol for the fadeIn]
Description: Create a symbol and a fade-in
*/
function fadeIn(fadeInLayer, fadeInFrame, fadeInName) {
    var info = makeFadeSymbol(fadeInLayer, fadeInFrame, fadeInName); // make fade in symbol
    makeFadeIn(fadeInLayer, fadeInFrame, fadeInName, info[0], info[1]); // make fade in
}

function fadeInMultiple(fadeInLayers, fadeInFrame, fadeInNames) {
    var mats = [];
    var tps = [];
    for (var i = 0; i < fadeInLayers.length; i++) {
        var info = makeFadeSymbol(fadeInLayers[i], fadeInFrame, fadeInNames[i]);
        mats.push(info[0]);
        tps.push(info[1]);
    }
    makeFadeIn(fadeInLayers, fadeInFrame, fadeInNames, mats, tps); // make fade in
}

function fadeOutMultiple(fadeOutLayers, fadeOutFrame, fadeOutNames) {
    var mats = [];
    var tps = [];
    for (var i = 0; i < fadeOutLayers.length; i++) {
        var info = makeFadeSymbol(fadeOutLayers[i], fadeOutFrame, fadeOutNames[i]);
        mats.push(info[0]);
        tps.push(info[1]);
    }
    makeFadeOut(fadeOutLayers, fadeOutFrame, fadeOutNames, mats, tps); // make fade in
}

function getUniqueNameIndex(name, index) {
    while (fl.getDocumentDOM().library.itemExists(FADES_FOLDER_NAME + "/" + name + " " + index)) {
        index++;
    }
    return index;
}

function selectNextKeyframe() {
    var currentTimelineFrame = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().currentFrame];
    resetSelection(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame += currentTimelineFrame.duration - (fl.getDocumentDOM().getTimeline().currentFrame - currentTimelineFrame.startFrame));
}

function performFadeIn(layer, frame) {
    resetSelection(layer, frame);
    var nameIndex = 1;
    var suggestedName = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedFrames()[0]].name + " Fade";
    nameIndex = getUniqueNameIndex(suggestedName, nameIndex);
    var curFrame = fl.getDocumentDOM().getTimeline().currentFrame; // save currentframe
    selectNextKeyframe();
    resetSelection(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame - 1);
    selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame); // create new keyframe just in case
    resetSelection(fl.getDocumentDOM().getTimeline().currentLayer, curFrame); // go back
    fadeIn(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame, suggestedName + " " + nameIndex);
}

function performFadeOut(layer, frame) {
    resetSelection(layer, frame - 1); // go to the previous frame, guaranteed to be non-empty
    var nameIndex = 1;
    var suggestedName = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedFrames()[0]].name + " Fade";
    nameIndex = getUniqueNameIndex(suggestedName, nameIndex);
    fadeOut(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame, suggestedName + " " + nameIndex);
}

function performSimultaneousFadeIns(layers, frame) {
    masterResetSelection(layers, frame);
    var suggestedNames = [];
    var nameIndices = [];
    var names = [];
    for (var i = 0; i < layers.length; i++) {
        masterResetSelection(layers[i], frame);
        suggestedNames.push(fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedFrames()[0]].name + " Fade");
        nameIndices.push(1);
        nameIndices[i] = getUniqueNameIndex(suggestedNames[i], nameIndices[i]);
        names.push(suggestedNames[i] + " " + nameIndices[i]);
        selectNextKeyframe();
        masterResetSelection(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame - 1);
        selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame); // create new keyframe just in case
    }
    masterResetSelection(layers, frame);
    fadeInMultiple(layers, frame, names);
}

function performSimultaneousFadeOuts(layers, frame) {
    masterResetSelection(layers, frame - 1); // go to the previous frame, guaranteed to be non-empty
    var suggestedNames = [];
    var nameIndices = [];
    var names = [];
    for (var i = 0; i < layers.length; i++) {
        masterResetSelection(layers[i], frame - 1);
        suggestedNames.push(fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedFrames()[0]].name + " Fade");
        nameIndices.push(1);
        nameIndices[i] = getUniqueNameIndex(suggestedNames[i], nameIndices[i]);
        names.push(suggestedNames[i] + " " + nameIndices[i]);
    }
    masterResetSelection(layers, frame - 1);
    fadeOutMultiple(layers, frame - 1, names);
}

function sortMap(map) { // O(n*log(n)), should be fine
    var keys = getKeys(map);
    keys.sort(function (a, b) { return a - b; });
    var newMap = {};
    for (var i = 0; i < keys.length; i++) {
        newMap[keys[i]] = map[keys[i]];
    }
    return newMap;
}

// assuming all relevant layers are selected, iterate through all frames, creating fades in and fades out when blank keyframes are reached
fl.showIdleMessage(false);
var confirmExecution = confirm("Confirm: Every character layer is selected that you want to fade");
if (confirmExecution) {
    var startTime = new Date();
    var selectedLayers = fl.getDocumentDOM().getTimeline().getSelectedLayers(); // get selected layers
    var fadeIns = {}; // SCEMA: {frame: [layer index 1, layer index 2...]}
    var fadeOuts = {}; // SCEMA: {frame: [layer index 1, layer index 2...]}
    for (var i = 0; i < selectedLayers.length; i++) { // loop through each character layer
        // TODO: find blank keyframes, go before them and after them and make fades
        resetSelection(selectedLayers[i], 0); // go to first frame of the layer
        // if it's on a blank keyframe, next non-blank keyframe will be a fade in and vice versa
        var state = fl.getDocumentDOM().getTimeline().getFrameProperty("elements").length != 0; // 0 meaning it's empty
        while (fl.getDocumentDOM().getTimeline().currentFrame < fl.getDocumentDOM().getTimeline().getLayerProperty("frames").length - 1) {
            // select next keyframe
            selectNextKeyframe();
            var newState = fl.getDocumentDOM().getTimeline().getFrameProperty("elements").length != 0;
            if (state != newState) {
                state = newState
                if (state == EMPTY) { // case 1: empty keyframe after a non-empty keyframe
                    if (fadeOuts[fl.getDocumentDOM().getTimeline().currentFrame] === undefined) {
                        fadeOuts[fl.getDocumentDOM().getTimeline().currentFrame] = [i];
                    } else {
                        fadeOuts[fl.getDocumentDOM().getTimeline().currentFrame].push(i);
                    }
                } else {
                    if (fadeIns[fl.getDocumentDOM().getTimeline().currentFrame] === undefined) {
                        fadeIns[fl.getDocumentDOM().getTimeline().currentFrame] = [i];
                    } else {
                        fadeIns[fl.getDocumentDOM().getTimeline().currentFrame].push(i);
                    }
                }
            }
        }
    }
    // fl.trace("fade ins: " + getKeys(fadeIns));
    // fl.trace("fade outs: " + getKeys(fadeOuts));
    // var strIn = "";
    // var strOut = "";
    fadeIns = sortMap(fadeIns); // sorting so that the offset makes sense
    fadeOuts = sortMap(fadeOuts);
    var inKeys = getKeys(fadeIns);
    var outKeys = getKeys(fadeOuts);
    var frameOffset = 0;
    for (var i = 0; i < inKeys.length || i < outKeys.length; i++) {
        // FADE INS:
        if (inKeys[i] !== undefined) {
            var frame = parseInt(inKeys[i]) + frameOffset; // fade in ith instance
            var layers = fadeIns[inKeys[i]];
            if (layers.length == 1) {
                performFadeIn(selectedLayers[fadeIns[inKeys[i]][0]], frame);
                frameOffset += (CREATE_NEW_FRAMES) ? (FADE_LENGTH + BETWEEN_FADE_LENGTH / 2) : 0;
            } else {
                layers = [];
                for (var j = 0; j < fadeIns[inKeys[i]].length; j++) {
                    layers.push(selectedLayers[fadeIns[inKeys[i]][j]]); // get layers to fade in
                }
                performSimultaneousFadeIns(layers, frame);
                frameOffset += (CREATE_NEW_FRAMES) ? (FADE_LENGTH + BETWEEN_FADE_LENGTH / 2) : 0;
            }
        }
        // FADE OUTS:
        if (outKeys[i] === undefined) {
            continue; // assuming there are always at least as many fade ins as fade outs, may break stuff :D
        }
        frame = parseInt(outKeys[i]) + frameOffset; // fade out ith instance
        layers = fadeOuts[outKeys[i]];
        if (layers.length == 1) {
            performFadeOut(selectedLayers[fadeOuts[outKeys[i]][0]], frame);
            frameOffset += (CREATE_NEW_FRAMES) ? (FADE_LENGTH + BETWEEN_FADE_LENGTH / 2) : 0;
        } else {
            layers = [];
            for (var j = 0; j < fadeOuts[outKeys[i]].length; j++) {
                layers.push(selectedLayers[fadeOuts[outKeys[i]][j]]); // get layers to fade in
            }
            performSimultaneousFadeOuts(layers, frame);
            frameOffset += (CREATE_NEW_FRAMES) ? (FADE_LENGTH + BETWEEN_FADE_LENGTH / 2) : 0;
        }
        // strIn += "(" + inKeys[i] + ", " + fadeIns[inKeys[i]] + "), ";
    }
    var endTime = new Date();
    var timeDiff = endTime - startTime;
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