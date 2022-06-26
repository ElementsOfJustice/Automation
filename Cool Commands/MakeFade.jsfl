/******************************************************************************
MAKE FADE
Description: 
******************************************************************************/

FIRST_LAYER_INDEX = 3; // indecies of layers for timeline.getSelectedFrames() for multiple selections
SECOND_LAYER_INDEX = 0;
FIRST_FRAME_INDEX = 4; // indecies of frames for timeline.getSelectedFrames() for multiple selections
SECOND_FRAME_INDEX = 1;
SYMBOL_CONTENT_LAYER = 1;
FADES_FOLDER_NAME = "FADES";
SLOW_ASS_CHARACTERS = ["SONATA", "TWILIGHT_SPARKLE", "FAIR_DEVOTION"];

// USER OPTIONS 

FADE_LENGTH = 4; // length of each fade in frames
BETWEEN_FADE_LENGTH = 4; // number of frames of blankness between fades (standard is 4)
CREATE_NEW_FRAMES = true; // if this is true, make fades by inserting frames; if this is false, creates no new frames (overrides BETWEEN_FADE_LENGTH as if it were 0)
CHANGE_TRANSFORMATION_POINT = false; // if this is true, do shenanigains with the transformation point. Sometimes this causes misalignments, other times it doesn't.
function setup() {
    for (var i = 0; i < fl.getDocumentDOM().getTimeline().getSelectedLayers().length; i++) {
        fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[i] * 1].locked = false; // unlock layer
    }
}

function resetSelection(layer, frame) { // sets selection the desired layer and frame
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true); // select frame on the layer and replace current selection
}

function makeFadeSymbol(layer, frame, name) { // creates a fade symbol of the specified frame and name
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

function fadeSetup(layer, frame, name, mat, tp) {
    resetSelection(layer, frame);
    fl.getDocumentDOM().setElementProperty('symbolType', 'movie clip'); // convert the frame to movie clip beforehand (this fixes a really weird glitch)
    fl.getDocumentDOM().swapElement(FADES_FOLDER_NAME + "/" + name); // put fading symbol on the timeline
    if (CHANGE_TRANSFORMATION_POINT) {
        fl.getDocumentDOM().setTransformationPoint(tp);
    }
    fl.getDocumentDOM().setElementProperty('matrix', mat); // align new symbol
    fl.getDocumentDOM().addFilter('dropShadowFilter'); // put the drop shadow filter on the fading symbol (necessary for this kind of fade)
    fl.getDocumentDOM().setFilterProperty("strength", 0, 0); // set the drop shadow strength to 0
    if (CREATE_NEW_FRAMES) {
        fl.getDocumentDOM().getTimeline().insertFrames(FADE_LENGTH + (BETWEEN_FADE_LENGTH / 2), true); // insert (fade length + half the frames of emptiness between fades) frames on every layer
    }
}

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

function fadeOutAndIn(fadeOutLayer, fadeOutFrame, fadeOutName, fadeInLayer, fadeInFrame, fadeInName) {
    fadeInFrame += (CREATE_NEW_FRAMES) ? (FADE_LENGTH + (BETWEEN_FADE_LENGTH / 2)) : 0; // we sometimes insert frames during makeFadeOut(), so we gotta consider that
    var info = makeFadeSymbol(fadeOutLayer, fadeOutFrame, fadeOutName); // make fade out symbol
    makeFadeOut(fadeOutLayer, fadeOutFrame, fadeOutName, info[0], info[1]); // make fade out
    info = makeFadeSymbol(fadeInLayer, fadeInFrame, fadeInName); // make fade in symbol
    makeFadeIn(fadeInLayer, fadeInFrame, fadeInName, info[0], info[1]); // make fade in
}

function fadeOut(fadeOutLayer, fadeOutFrame, fadeOutName) {
    var info = makeFadeSymbol(fadeOutLayer, fadeOutFrame, fadeOutName); // make fade out symbol
    makeFadeOut(fadeOutLayer, fadeOutFrame, fadeOutName, info[0], info[1]); // make fade out
}

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

// MAIN
setup();
if (!CREATE_NEW_FRAMES) {
    BETWEEN_FADE_LENGTH = 0;
}
var startTime = new Date();
var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
// input validation and processing
var continueAnyway = true;
if (selectedFrames.length == 3 && selectedFrames[2] - selectedFrames[1] == 1) { // in this case, selectedFrames[1] is the first frame and selectedFrames[2] is the second frame. selections should be one frame long.
    for (var i = 0; i < SLOW_ASS_CHARACTERS.length; i++) {
        if (fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]].name.indexOf(SLOW_ASS_CHARACTERS[i]) != -1) {
            continueAnyway = confirm("WARNING! Fading a slow-ass rig: " + SLOW_ASS_CHARACTERS[i] + ". This operation may take several minutes. Continue anyway?");
        }
    }
    if (continueAnyway) {
        var doFadeOut = confirm("Click OK for a fade out, click Cancel for a fade in.");
        // programatically assign unique names for suggestion
        var nameIndex = 1;
        var suggestedName = fl.getDocumentDOM().getTimeline().layers[selectedFrames[0]].name + " Fade";
        nameIndex = getUniqueNameIndex(suggestedName, nameIndex);
        var fadeName = prompt("Enter fade name (Fade symbols go/are in the FADES folder.)", suggestedName + " " + nameIndex);
        if (fadeName != null) {
            while (fadeName == "" || fl.getDocumentDOM().library.itemExists(FADES_FOLDER_NAME + "/" + fadeName)) {
                fadeName += "_copy"; // if a non-unique name is entered, then append "_copy" to the end
            }
            if (doFadeOut) {
                fadeOut(selectedFrames[0], selectedFrames[1], fadeName);
            } else {
                fadeIn(selectedFrames[0], selectedFrames[1], fadeName);
            }
        }
    }
} else if (selectedFrames.length == 6 && selectedFrames[2] - selectedFrames[1] == 1 && selectedFrames[5] - selectedFrames[4] == 1) { // two edges selected, do both fades
    for (var i = 0; i < SLOW_ASS_CHARACTERS.length; i++) {
        if (fl.getDocumentDOM().getTimeline().layers[selectedFrames[FIRST_LAYER_INDEX]].name.indexOf(SLOW_ASS_CHARACTERS[i]) != -1 || fl.getDocumentDOM().getTimeline().layers[selectedFrames[SECOND_LAYER_INDEX]].name.indexOf(SLOW_ASS_CHARACTERS[i]) != -1) {
            continueAnyway = confirm("WARNING! Fading a slow-ass rig: " + SLOW_ASS_CHARACTERS[i] + ". This operation may take several minutes. Continue anyway?");
        }
    }
    if (continueAnyway) {
        if (selectedFrames[FIRST_FRAME_INDEX] > selectedFrames[SECOND_FRAME_INDEX]) { // get the selection correct if it's backwards
            var temp = [FIRST_LAYER_INDEX, FIRST_FRAME_INDEX];
            FIRST_LAYER_INDEX = SECOND_LAYER_INDEX;
            FIRST_FRAME_INDEX = SECOND_FRAME_INDEX;
            SECOND_LAYER_INDEX = temp[0];
            SECOND_FRAME_INDEX = temp[1];
        }
        // programatically assign unique names for suggestion
        var outNameIndex = 1, inNameIndex = 1;
        var suggestedOutName = fl.getDocumentDOM().getTimeline().layers[selectedFrames[FIRST_LAYER_INDEX]].name + " Fade";
        var suggestedInName = fl.getDocumentDOM().getTimeline().layers[selectedFrames[SECOND_LAYER_INDEX]].name + " Fade";
        outNameIndex = getUniqueNameIndex(suggestedOutName, outNameIndex);
        inNameIndex = getUniqueNameIndex(suggestedInName, inNameIndex);
        var fadeOutName = prompt("Enter fade OUT name (Fade symbols go/are in the FADES folder.)", suggestedOutName + " " + outNameIndex);
        var fadeInName = prompt("Enter fade IN name (Fade symbols go/are in the FADES folder.)", suggestedInName + " " + inNameIndex);
        if (fadeOutName != null && fadeInName != null) {
            while (fadeOutName == "" || fl.getDocumentDOM().library.itemExists(FADES_FOLDER_NAME + "/" + fadeOutName)) {
                fadeOutName += "_copy"; // if a non-unique name is entered, then append "_copy" to the end
            }
            while (fadeInName == "" || fadeInName == fadeOutName || fl.getDocumentDOM().library.itemExists(FADES_FOLDER_NAME + "/" + fadeInName)) {
                fadeInName += "_copy"; // if a non-unique name is entered, then append "_copy" to the end
            }
            fadeOutAndIn(selectedFrames[FIRST_LAYER_INDEX], selectedFrames[FIRST_FRAME_INDEX], fadeOutName, selectedFrames[SECOND_LAYER_INDEX], selectedFrames[SECOND_FRAME_INDEX], fadeInName);
        }
    }
} else {
    alert("Invalid selection. Select either the edge of a keyframe or two adjacent edges of two keyframes.")
}