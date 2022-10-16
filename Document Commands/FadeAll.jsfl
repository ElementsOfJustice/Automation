FIRST_LAYER_INDEX = 3; // indecies of layers for timeline.getSelectedFrames() for multiple selections
SECOND_LAYER_INDEX = 0;
FIRST_FRAME_INDEX = 4; // indecies of frames for timeline.getSelectedFrames() for multiple selections
SECOND_FRAME_INDEX = 1;
SYMBOL_CONTENT_LAYER = 1;
FADES_FOLDER_NAME = "FADES";
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
function fadeSetup(layer, frame, name, mat, tp) {
    resetSelection(layer, frame);
    fl.getDocumentDOM().setElementProperty('symbolType', 'movie clip'); // convert the frame to movie clip beforehand (this fixes a really weird glitch)
    fl.getDocumentDOM().swapElement(FADES_FOLDER_NAME + "/" + name); // put fading symbol on the timeline
    if (CHANGE_TRANSFORMATION_POINT) { // if the flag is set to true
        fl.getDocumentDOM().setTransformationPoint(tp); // set the tp to the passed in variable
    }
    fl.getDocumentDOM().setElementProperty('matrix', mat); // align new symbol
    fl.getDocumentDOM().addFilter('dropShadowFilter'); // put the drop shadow filter on the fading symbol (necessary for this kind of fade)
    fl.getDocumentDOM().setFilterProperty("strength", 0, 0); // set the drop shadow strength to 0
    if (CREATE_NEW_FRAMES) {
        fl.getDocumentDOM().getTimeline().insertFrames(FADE_LENGTH + (BETWEEN_FADE_LENGTH / 2), true); // insert (fade length + half the frames of emptiness between fades) frames on every layer
    }
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
function makeFadeIn(layer, frame, name, mat, tp) {
    fadeSetup(layer, frame, name, mat, tp);
    if (CREATE_NEW_FRAMES && BETWEEN_FADE_LENGTH != 0) { // if there's no space between fades or if we're not making new frames, no need to run these.
        frame += BETWEEN_FADE_LENGTH / 2;
        resetSelection(layer, frame); // go to beginning of fade 
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // create keyframe for beginning of fade
        frame -= BETWEEN_FADE_LENGTH / 2;
        resetSelection(layer, frame); // go to where empty frames should be
        fl.getDocumentDOM().deleteSelection(); // get it outta here
    }
    frame += FADE_LENGTH + BETWEEN_FADE_LENGTH / 2;
    resetSelection(layer, frame); // go to end of fade
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // put keyframe at end of fade
    frame -= FADE_LENGTH;
    resetSelection(layer, frame); // go to beginning of fade
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
function makeFadeOut(layer, frame, name, mat, tp) {
    if (!CREATE_NEW_FRAMES) {
        frame -= FADE_LENGTH; // put cursor at appropriate spot if we're not making new frames   
    }
    resetSelection(layer, frame);
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // insert keyframe at the cursor
    fadeSetup(layer, frame, name, mat, tp);
    frame += FADE_LENGTH; // move to where end of fade is
    resetSelection(layer, frame);
    fl.getDocumentDOM().getTimeline().insertKeyframe(); // create keyframe for end of fade
    if (CREATE_NEW_FRAMES && BETWEEN_FADE_LENGTH != 0) {
        fl.getDocumentDOM().getTimeline().insertBlankKeyframe(); // create blank keyframe for the emptiness between fades
    }
    resetSelection(layer, frame); // inserting keyframes deselects everything, so it's most efficient to put this here
    fl.getDocumentDOM().setInstanceAlpha(0); // get it outta here
    frame -= FADE_LENGTH; // go to start of fade
    resetSelection(layer, frame);
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

// assuming all relevant layers are selected, iterate through all frames, creating fades in and fades out when blank keyframes are reached
fl.showIdleMessage(false);
var confirmExecution = confirm("Confirm: Every character layer is selected that you want to fade");
if (confirmExecution) {
    var startTime = new Date();
    var selectedLayers = fl.getDocumentDOM().getTimeline().getSelectedLayers(); // get selected layers
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
                    resetSelection(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame - 1) // go to the previous frame, guaranteed to be non-empty
                    var nameIndex = 1;
                    var suggestedName = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedFrames()[0]].name + " Fade";
                    nameIndex = getUniqueNameIndex(suggestedName, nameIndex);
                    fadeOut(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame, suggestedName +  " " + nameIndex);
                    selectNextKeyframe();
                    selectNextKeyframe(); // go two keyframes forward
                } else {
                    var nameIndex = 1;
                    var suggestedName = fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedFrames()[0]].name + " Fade";
                    nameIndex = getUniqueNameIndex(suggestedName, nameIndex);
                    var curFrame = fl.getDocumentDOM().getTimeline().currentFrame; // save currentframe
                    selectNextKeyframe();
                    resetSelection(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame - 1);
                    selectOrMakeKeyframe(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame); // create new keyframe just in case
                    resetSelection(fl.getDocumentDOM().getTimeline().currentLayer, curFrame); // go back
                    fadeIn(fl.getDocumentDOM().getTimeline().currentLayer, fl.getDocumentDOM().getTimeline().currentFrame, suggestedName +  " " + nameIndex);
                }
            }
        }
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