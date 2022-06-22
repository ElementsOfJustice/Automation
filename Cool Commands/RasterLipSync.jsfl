/******************************************************************************
RASTER LIP SYNC
Description: 
******************************************************************************/

// this script is in testing mode for now
END_INDEX = 0;
WORD_PHONEME_INDEX = 1;
FRAME_RATE = fl.getDocumentDOM().frameRate;


function resetSelection(layer, frame) { // sets selection the desired layer and frame
    fl.getDocumentDOM().selectNone();
    fl.getDocumentDOM().getTimeline().setSelectedLayers(layer * 1);
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select current frame
    fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
}

function placeKeyframes(startFrame, layer) {
    for (var phonemeStartTime in phonemes) {
        resetSelection(layer, startFrame + Math.round((phonemeStartTime * FRAME_RATE)));
        fl.getDocumentDOM().getTimeline().insertKeyframe();
        resetSelection(layer, startFrame + Math.round((phonemeStartTime * FRAME_RATE)));
        var frame = athenaCourtLipsyncs["Idle Talk Neutral"][phonemes[phonemeStartTime][WORD_PHONEME_INDEX].substring(0, 2)] - 1;
        fl.getDocumentDOM().setElementProperty("firstFrame", frame);
        fl.trace(phonemes[phonemeStartTime][1].substring(0, 2) + ", " + frame);
    }
}

//MAIN
var cfgPath = fl.browseForFileURL("select"); // get file
var masterRasterLipsyncsPath = fl.browseForFileURL("select");
fl.runScript(cfgPath);
fl.runScript(masterRasterLipsyncsPath);
placeKeyframes(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().getSelectedLayers());