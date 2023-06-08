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

/*
Function: testDistribution
Variables: 
    mean [The mean average of the distribution]
    k    [The higher it is, the smaller the variance]
Description: A function, purely for testing purposes, to find the minimum,
     maximum, and mean of our gamma distribution.
*/
function testDistribution(mean, k) {
    var sum = 0;
    var count = 100000;
    var min = 2147483647;
    var max = -2147483648;
    for (var i = 0; i < count; i++) {
        var randomVar = gammaVariable(mean, k);
        sum += randomVar;
        if (min > randomVar) {
            min = randomVar;
        }
        if (max < randomVar) {
            max = randomVar;
        }
    }
    fl.trace("mean: " + sum / count);
    fl.trace("min: " + min);
    fl.trace("max: " + max);
}

/*
Function Group: Getters and setters for the current frame
*/
function getCurrentFrame() {
    return fl.getDocumentDOM().getTimeline().currentFrame;
}

function setCurrentFrame(frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
}

function addToCurrentFrame(num) {
    fl.getDocumentDOM().getTimeline().currentFrame += num;
}

function getCurrentLayer() {
    return fl.getDocumentDOM().getTimeline().currentLayer;
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

/*
Function: autoBlink
Variables: 
    layerIndex	int
    mean		int
Description: Runs automatic blinking for a selection, with a mean.
*/
function autoBlink(mean) {

    var k = 25;
    var FPS = fl.getDocumentDOM().frameRate;

    var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
    var selLayerIndex = frameSelection[0];
    var startFrame = frameSelection[1] + 1;
    var endFrame = frameSelection[2];

    if (startFrame > endFrame) { // if selection is backwards, fix it
        var temp = endFrame;
        endFrame = startFrame;
        startFrame = temp;
    }

    // ♫Let's start at the very beginning...♫
    setCurrentFrame(startFrame);

    // Until we reach the end frame...
    while (getCurrentFrame() < endFrame) {
        // pick a number of frames via gamma distribution for eyes to remain open 
        var stare = gammaVariable(mean, k) * FPS
        if ((getCurrentFrame() + stare) >= endFrame) { // if we've gone outside of our selection, we're done
            break;
        }

        addToCurrentFrame(Math.round(stare));

        var totalFramesOnLayer = fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frameCount;
        for (var i = getCurrentFrame(); i < getCurrentFrame() + 6 && i < totalFramesOnLayer; i++) {
            if (fl.getDocumentDOM().getTimeline().layers[getCurrentLayer()].frames[i].isEmpty) { // if any of them are
                setCurrentFrame(i); // go to that frame
                continue;
            }
        }

        // if we're still on an empty frame even after all that mess, advance so long as we're still in our selection
        while (fl.getDocumentDOM().getTimeline().layers[getCurrentLayer()].frames[getCurrentFrame()] == 0 && getCurrentFrame() < endFrame) {
            // advance frames
            addToCurrentFrame(1);
        }

        if (!fl.getDocumentDOM().getTimeline().layers[selLayerIndex].frames[getCurrentFrame()].isEmpty) {

            // if the current frame isn't the first frame in a frame sequence, make a note of that
            var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
            // if it's not
            if (!isKeyFrame) {
                // convert it to keyframe
                selectOrMakeKeyframe(selLayerIndex, getCurrentFrame());
            }

            // give it the frame name Blink
            fl.getDocumentDOM().getTimeline().layers[getCurrentLayer()].frames[getCurrentFrame()].name = 'Blink';
            fl.getDocumentDOM().getTimeline().layers[getCurrentLayer()].frames[getCurrentFrame()].labelType = 'anchor';
            // we use anchor because no one else does to avoid conflicts
        }
    }

    fl.getDocumentDOM().getTimeline().setSelectedFrames(frameSelection);

}