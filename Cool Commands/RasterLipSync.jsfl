/******************************************************************************
RASTER LIP SYNC
Description: 
******************************************************************************/

// this script is in testing mode for now
END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;

function arrayContains(array, element) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == element) {
            return true;
        }
    }
    return false;
}

function resetSelection(layer, frame) { // sets selection the desired layer and frame
    fl.getDocumentDOM().selectNone();
    fl.getDocumentDOM().getTimeline().setSelectedLayers(layer * 1);
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select current frame
    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
}


// todo: handle "silence" and "unknown word" shit
function placeKeyframes(startFrame, layer) {
    var diphthongMap = {};
    var mouthShapeMap = {};
    for (var phonemeStartTime in phonemes) {
        resetSelection(layer, startFrame + Math.round((phonemeStartTime * FRAME_RATE)));
        var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
        if (!isKeyFrame) {
            fl.getDocumentDOM().getTimeline().insertKeyframe(); // this logic will replace extremely short phonemes with the next one   
        }
        resetSelection(layer, startFrame + Math.round((phonemeStartTime * FRAME_RATE)));
        fl.getDocumentDOM().setElementProperty("loop", "loop");
        var phoneme = phonemes[phonemeStartTime][WORD_PHONEME_INDEX].substring(0, 2);
        if (arrayContains(DIPHTHONGS, phoneme)) {
            diphthongMap[fl.getDocumentDOM().getTimeline().currentFrame] = phoneme;
            continue;
        }
        var frame = athenaCourtLipsyncs["Idle"][PHONEME_TO_MOUTH_SHAPE[phoneme]] - 1;
        fl.getDocumentDOM().setElementProperty("firstFrame", frame);
        if(phoneme == "") {
            fl.getDocumentDOM().setElementProperty("loop", "single frame");
        }
        mouthShapeMap[fl.getDocumentDOM().getTimeline().currentFrame] = PHONEME_TO_MOUTH_SHAPE[phoneme];
    }
    // handle diphthongs
    for (var frame in diphthongMap) {
        for (var i = 0; i < DIPHTHONG_ORDERING[diphthongMap[frame]].length; i++) { // for each mouth shape in the diphthong
            resetSelection(layer, (parseInt(frame) + i));
            var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame; // if the current frame isn't the first frame in a frame sequence, make a note of that
            if (frame != fl.getDocumentDOM().getTimeline().currentFrame && isKeyFrame) {
                break; // at the next keyframe, abort mission
            }
            if (!isKeyFrame) {
                fl.getDocumentDOM().getTimeline().insertKeyframe();
                resetSelection(layer, (parseInt(frame) + i));
            }
            var firstFrame = athenaCourtLipsyncs["Idle"][DIPHTHONG_ORDERING[diphthongMap[frame]][i]] - 1;
            fl.getDocumentDOM().setElementProperty("firstFrame", firstFrame);
            mouthShapeMap[fl.getDocumentDOM().getTimeline().currentFrame] = DIPHTHONG_ORDERING[diphthongMap[frame]][i];
            var framesToAdvanceBy = Math.round(fl.getDocumentDOM().getTimeline().layers[layer].frames[frame].duration / DIPHTHONG_ORDERING[diphthongMap[frame]].length);
            fl.getDocumentDOM().getTimeline().currentFrame += (framesToAdvanceBy <= 0) ? 1 : framesToAdvanceBy;
        }
    }
}

//MAIN
var cfgPath = fl.browseForFileURL("select"); // get file
var masterRasterLipsyncsPath = fl.browseForFileURL("select");
fl.runScript(cfgPath);
fl.runScript(masterRasterLipsyncsPath);
placeKeyframes(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().getSelectedLayers());