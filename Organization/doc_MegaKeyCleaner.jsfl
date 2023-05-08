//TODO: iterate through the selection, noting keyframes with firstFrames in looping/stillframe sequences

function matrixEquals(left, right) {
    var tol = 0.005;
    if (left === undefined || right === undefined) {
        return false;
    }
    return (Math.abs(left.a - right.a) < tol &&
        Math.abs(left.b - right.b) < tol &&
        Math.abs(left.c - right.c) < tol &&
        Math.abs(left.d - right.d) < tol &&
        Math.abs(left.tx - right.tx) < tol &&
        Math.abs(left.ty - right.ty) < tol);
}


function findFirstEmptyKeyframeIndexInRange(timeline, layer, firstFrame, lastFrame) {
    for (var i = firstFrame; i < lastFrame; i += timeline.layers[layer].frames[i].duration - (i - timeline.layers[layer].frames[i].startFrame)) {
        var isKeyFrame = i == timeline.layers[layer].frames[i].startFrame;
        if (timeline.layers[layer].frames[i].isEmpty && isKeyFrame) {
            return i;
        }
    }
    return -1;
}

function findFirstNonEmptyKeyframeIndexInRange(timeline, layer, firstFrame, lastFrame) {
    for (var i = firstFrame; i < lastFrame; i += timeline.layers[layer].frames[i].duration - (i - timeline.layers[layer].frames[i].startFrame)) {
        var isKeyFrame = i == timeline.layers[layer].frames[i].startFrame;
        if (!timeline.layers[layer].frames[i].isEmpty && isKeyFrame) {
            return i;
        }
    }
    return -1;
}
function keyClean(timeline) {

    for (var i = 0; i < timeline.layers.length; i++) {
        if (timeline.layers[i].layerType == "folder") {
            continue;
        }
        fl.trace("NOW CLEANING: " + timeline.name);
        var layerIndex = i;
        var firstFrame = 0;
        var lastFrame = timeline.layers[i].frameCount;
        var framesToClear = [];
        // remove redundant blank keyframes:
        var previousEmpty = true;
        var firstEmptyKeyframe = findFirstEmptyKeyframeIndexInRange(timeline, layerIndex, firstFrame, lastFrame);
        var emptyDur = (firstEmptyKeyframe == -1) ? 0 : timeline.layers[layerIndex].frames[firstEmptyKeyframe].duration;
        for (var j = firstEmptyKeyframe + emptyDur; j < lastFrame; j += emptyDur) {
            if (j == -1) break; // no empty keyframes in range
            if (previousEmpty) {
                if (timeline.layers[layerIndex].frames[j].isEmpty && timeline.layers[layerIndex].frames[j].name == "") {
                    framesToClear.push(j);
                }
            }
            previousEmpty = timeline.layers[layerIndex].frames[j].isEmpty;
            emptyDur = timeline.layers[layerIndex].frames[j].duration;
        }

        firstFrame = findFirstNonEmptyKeyframeIndexInRange(timeline, layerIndex, firstFrame, lastFrame);
        if (firstFrame != -1) { // non-empty keyframes in range
            /*
            There are three cases: frame-by-frame keyframes that have increasing firstFrame can be reduced to a single keyframe in the "loop" looping type.
            Frame-by-frame keyframes that have the same firstFrame can be reduced to a single keyframe in the "single frame" looping type.
            Contiguous keyframes that are all in "single frame" that all  have the same firstFrame can be reduced to a single keyframe in the "single frame" looping type.
            */
            var prevFrame = firstFrame;
            var prevFirstFrame = timeline.layers[layerIndex].frames[firstFrame].elements[0].firstFrame;
            var prevLoopType = timeline.layers[layerIndex].frames[firstFrame].elements[0].loop;
            var prevDuration = timeline.layers[layerIndex].frames[firstFrame].duration;
            var prevStartFrame = timeline.layers[layerIndex].frames[firstFrame].startFrame;
            var prevMatrix = timeline.layers[layerIndex].frames[firstFrame].elements[0].matrix;
            var prevHasNoTween = timeline.layers[layerIndex].frames[firstFrame].tweenType == "none";
            for (var j = firstFrame + prevDuration; j < lastFrame; j += prevDuration) {
                if (timeline.layers[layerIndex].frames[j].isEmpty) {
                    prevFirstFrame = undefined;
                    prevLoopType = undefined;
                    prevDuration = timeline.layers[layerIndex].frames[j].duration;
                    prevStartFrame = undefined;
                    prevMatrix = undefined;
                    prevHasNoTween = true;
                    prevFrame = j;
                    continue; // ignore empty keyframes  
                }
                var curFirstFrame = timeline.layers[layerIndex].frames[j].elements[0].firstFrame;
                var curLoopType = timeline.layers[layerIndex].frames[j].elements[0].loop;
                var curDuration = timeline.layers[layerIndex].frames[j].duration;
                var curStartFrame = timeline.layers[layerIndex].frames[j].startFrame;
                var curMatrix = timeline.layers[layerIndex].frames[j].elements[0].matrix;
                var hasNoActionScript = timeline.layers[layerIndex].frames[j].actionScript == "";
                var isInstance = timeline.layers[layerIndex].frames[j].elements[0].elementType == "instance";
                var isGraphic = timeline.layers[layerIndex].frames[j].elements[0].symbolType == "graphic";
                var curHasNoTween = timeline.layers[layerIndex].frames[j].tweenType == "none";
                if (hasNoActionScript && isInstance && isGraphic && curHasNoTween && prevHasNoTween) {
                    if (prevDuration == 1 && curDuration == 1 && prevFirstFrame == curFirstFrame - 1 && matrixEquals(prevMatrix, curMatrix)) { // frame by frame sequence moment
                        timeline.layers[layerIndex].frames[prevFrame].elements[0].loop = "loop"; // should have a cascade effect
                        framesToClear.push(j);
                    }
                    else if (prevDuration == 1 && curDuration == 1 && prevFirstFrame == curFirstFrame && matrixEquals(prevMatrix, curMatrix)) {
                        timeline.layers[layerIndex].frames[prevFrame].elements[0].loop = "single frame";
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
                prevHasNoTween = curHasNoTween;
                prevFrame = j;
            }
        }
        timeline.currentLayer = layerIndex;
        for (var k = 0; k < framesToClear.length; k++) {
            timeline.clearKeyframes(framesToClear[k]);
        }
        totalCleared += framesToClear.length;
    }
}
var execute = confirm("This operation will clear all redundant keyframes in EVERY LIBRARY ITEM. Continue?");
if (execute) {
    fl.showIdleMessage(false);
    var totalCleared = 0;
    var symbols = ["button", "graphic", "movie clip"];
    for (var i = 0; i < fl.getDocumentDOM().library.items.length; i++) {
        var item = fl.getDocumentDOM().library.items[i];
        if (symbols.indexOf(item.itemType) > -1) {
            keyClean(item.timeline);
        }
    }
    alert("Number of keyframes cleared: " + totalCleared);
}