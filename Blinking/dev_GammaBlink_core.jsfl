/******************************************************************************
 NAME BLINK FRAME
 Description: 
 Name frames for blinking pseudo-randomly according to a gamma distribution. 
 ActionScript will later be used to make the blinking actually happen.
 ******************************************************************************/

/*
Function: gammaVariable
Variables: 
    mean [The mean average of the distribution]
    k    [The higher it is, the smaller the variance]
Description: 
*/
function gammaVariable(mean, k) {
    var theta = mean / k;
    var sum = 0;
    for (var i = 0; i < k; i++) {
        sum -= Math.log(Math.random()) * theta;
    }
    return sum;
}

function autoBlink(mean) {
    var k = 25;
    var FPS = fl.getDocumentDOM().frameRate;

    var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
    var selLayerIndex = frameSelection[0];
    var startFrame = frameSelection[1] + 1;
    var endFrame = frameSelection[2];
    var curLayer = fl.getDocumentDOM().getTimeline().layers[selLayerIndex];

    if (startFrame > endFrame) { // if selection is backwards, fix it
        var temp = endFrame;
        endFrame = startFrame;
        startFrame = temp;
    }
    // TODO: iterate through whole selection and add blinks
    var i = startFrame;
    while (i < endFrame) {
        var stare = Math.round(gammaVariable(mean, k) * FPS);
        // now we need to add stare to i, but disregard any empty frames!
        while (stare > 0) {
            if (i >= endFrame) return;
            var remainingFramesInKeyframe = curLayer.frames[i].duration - (i - curLayer.frames[i].startFrame);
            if (curLayer.frames[i].isEmpty) {
                i += remainingFramesInKeyframe; // go to next keyframe
                continue;
            }
            var diff = Math.min(remainingFramesInKeyframe, stare);
            i += diff;
            stare -= diff;
        }
        fl.getDocumentDOM().getTimeline().convertToKeyframes(i);
        fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].name = 'Blink';
        fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[i].labelType = 'anchor';
    }
}