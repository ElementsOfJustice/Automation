//TODO: iterate through the selection, noting keyframes with firstFrames in looping/stillframe sequences
var selFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();

function matrixEquals(left, right) {
    var tol = 0.005;
    if(left === undefined || right === undefined) {
        return false;
    }
    return (Math.abs(left.a - right.a) < tol &&
        Math.abs(left.b - right.b) < tol &&
        Math.abs(left.c - right.c) < tol &&
        Math.abs(left.d - right.d) < tol &&
        Math.abs(left.tx - right.tx) < tol &&
        Math.abs(left.ty - right.ty) < tol);
}


function findFirstEmptyKeyframeIndexInRange(layer, firstFrame, lastFrame) {
    for (var i = firstFrame; i < lastFrame; i += fl.getDocumentDOM().getTimeline().layers[layer].frames[i].duration - (i - fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame)) {
        var isKeyFrame = i == fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame;
        if (fl.getDocumentDOM().getTimeline().layers[layer].frames[i].isEmpty && isKeyFrame) {
            return i;
        }
    }
    return -1;
}

function findFirstNonEmptyKeyframeIndexInRange(layer, firstFrame, lastFrame) {
    for (var i = firstFrame; i < lastFrame; i += fl.getDocumentDOM().getTimeline().layers[layer].frames[i].duration - (i - fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame)) {
        var isKeyFrame = i == fl.getDocumentDOM().getTimeline().layers[layer].frames[i].startFrame;
        if (!fl.getDocumentDOM().getTimeline().layers[layer].frames[i].isEmpty && isKeyFrame) {
            return i;
        }
    }
    return -1;
}
var totalCleared = 0;
for (var i = 0; i < selFrames.length / 3; i++) {
    var layerIndex = selFrames[3 * i] * 1;
    var firstFrame = selFrames[3 * i + 1];
    var lastFrame = selFrames[3 * i + 2];
    var framesToClear = [];
    // remove redundant blank keyframes:
    var previousEmpty = true;
    var firstEmptyKeyframe = findFirstEmptyKeyframeIndexInRange(layerIndex, firstFrame, lastFrame);
    var emptyDur = (firstEmptyKeyframe == -1) ? 0: fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[firstEmptyKeyframe].duration;
    for (var j = firstEmptyKeyframe + emptyDur; j < lastFrame; j += emptyDur) {
        if (j == -1) break; // no empty keyframes in range
        if (previousEmpty) {
            if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].isEmpty && fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].name == "") {
                framesToClear.push(j);
            }
        }
        previousEmpty = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].isEmpty;
        emptyDur = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].duration;
    }

    firstFrame = findFirstNonEmptyKeyframeIndexInRange(layerIndex, firstFrame, lastFrame);
    if (firstFrame != -1) { // non-empty keyframes in range
        /*
        There are three cases: frame-by-frame keyframes that have increasing firstFrame can be reduced to a single keyframe in the "loop" looping type.
        Frame-by-frame keyframes that have the same firstFrame can be reduced to a single keyframe in the "single frame" looping type.
        Contiguous keyframes that are all in "single frame" that all  have the same firstFrame can be reduced to a single keyframe in the "single frame" looping type.
        */
        var prevFrame = firstFrame;
        var prevFirstFrame = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[firstFrame].elements[0].firstFrame;
        var prevLoopType = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[firstFrame].elements[0].loop;
        var prevDuration = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[firstFrame].duration;
        var prevStartFrame = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[firstFrame].startFrame;
        var prevMatrix = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[firstFrame].elements[0].matrix;
        for (var j = firstFrame + prevDuration; j < lastFrame; j += prevDuration) {
            if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].isEmpty) {
                prevFirstFrame = undefined;
                prevLoopType = undefined;
                prevDuration = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].duration;
                prevStartFrame = undefined;
                prevMatrix = undefined;
                prevFrame = j;
                continue; // ignore empty keyframes  
            }
            var curFirstFrame = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].elements[0].firstFrame;
            var curLoopType = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].elements[0].loop;
            var curDuration = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].duration;
            var curStartFrame = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].startFrame;
            var curMatrix = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].elements[0].matrix;
            if (fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[j].actionScript == "") { // do not want to be clearing actionscript
                if (prevDuration == 1 && curDuration == 1 && prevFirstFrame == curFirstFrame - 1 && matrixEquals(prevMatrix, curMatrix)) { // frame by frame sequence moment
                    fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[prevFrame].elements[0].loop = "loop"; // should have a cascade effect
                    framesToClear.push(j);
                }
                else if (prevDuration == 1 && curDuration == 1 && prevFirstFrame == curFirstFrame && matrixEquals(prevMatrix, curMatrix)) {
                    fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[prevFrame].elements[0].loop = "single frame";
                    framesToClear.push(j);
                }
                else if (prevLoopType == "single frame" && curLoopType == "single frame" && curFirstFrame == prevFirstFrame && matrixEquals(prevMatrix, curMatrix)) {
                    framesToClear.push(j);
                }
            }
            prevFirstFrame = curFirstFrame;
            prevLoopType = curLoopType;
            prevDuration = curDuration;
            prevStartFrame = curStartFrame;
            prevMatrix = curMatrix;
            prevFrame = j;
        }
    }
    fl.getDocumentDOM().getTimeline().currentLayer = layerIndex;
    for (var k = 0; k < framesToClear.length; k++) {
        fl.getDocumentDOM().getTimeline().clearKeyframes(framesToClear[k]);
    }
    totalCleared += framesToClear.length;
}

fl.getDocumentDOM().getTimeline().setSelectedFrames(selFrames);
alert("Number of keyframes cleared: " + totalCleared);