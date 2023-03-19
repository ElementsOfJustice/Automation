function trim(input) {
    var len = input.length;
    var st = 0;
    var val = input;

    while ((st < len) && (val.charAt(st) <= ' ')) {
        st++;
    }
    while ((st < len) && (val.charAt(len - 1) <= ' ')) {
        len--;
    }
    return ((st > 0) || (len < input.length)) ? input.substring(st, len) : input;
}

function findAllLayerIndicesBySubstring(layerName) {
    var toReturn = [];
    for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
        if (fl.getDocumentDOM().getTimeline().layers[i].name.indexOf(layerName) != -1) {
            toReturn.push(i);
        }
    }
    return toReturn;
}


// var confirmed = confirm("Confirm: Text layer is called \"TEXT\" and every sfx layer starts with \"SFX\".");
var textLayerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT");
if (textLayerIndex == undefined) {
    throw new Error("Error: text layer is not named \"TEXT\".");
}
var sfxLayerIndices = findAllLayerIndicesBySubstring("SFX");
if (sfxLayerIndices.length == 0) {
    throw new Error("Error: no sfx layers found.");
}
fl.outputPanel.clear();
var textLayer = fl.getDocumentDOM().getTimeline().layers[textLayerIndex];
// idempotent preprocessing: clear extraneous keyframes from text (same text back to back, not good)
var prevText = "";
fl.getDocumentDOM().getTimeline().currentLayer = textLayerIndex * 1;
for (var i = 0; i < textLayer.frames.length; i += textLayer.frames[i].duration - (i - textLayer.frames[i].startFrame)) {
    if (textLayer.frames[i].elements.length == 0 || !(textLayer.frames[i].elements[0] instanceof Text)) {
        continue; // ignore empty text/non-text keyframes...
    }
    var curText = textLayer.frames[i].elements[0].getTextString();
    if (curText == prevText) {
        // clear keyframe of duplicate text
        fl.getDocumentDOM().getTimeline().clearKeyframes(i);
    }
    prevText = curText;
}
// secondary preprocessing: remove typewriter sequences
var isTypeWriterSequence = false;
var typeWriterSequenceStartFrame = -1;
var typeWriterSequenceEndFrame = -1;
var typeWriterSequenceLength = 0;
prevText = "";
TYPEWRITER_LENGTH_THRESHOLD = 10;
var prevI = 0;
for (var i = 0; i < textLayer.frames.length; i += textLayer.frames[i].duration - (i - textLayer.frames[i].startFrame)) {
    if (textLayer.frames[i].elements.length == 0 || !(textLayer.frames[i].elements[0] instanceof Text)) {
        continue; // ignore empty text/non-text keyframes...
    }
    var curText = textLayer.frames[i].elements[0].getTextString();
    if (!isTypeWriterSequence)
        typeWriterSequenceStartFrame = prevI; // previous keyframe 
    if (curText.indexOf(prevText) != -1) { // previous text is contained within current text, potential typewriter sequence
        isTypeWriterSequence = true;
        typeWriterSequenceLength++;
    } else if (isTypeWriterSequence) { // end of potential typewriter sequence, determine if it actually is one and if it is, delete it. 
        typeWriterSequenceEndFrame = i;
        if (typeWriterSequenceLength >= TYPEWRITER_LENGTH_THRESHOLD) { // if there are many many items in a row with each being a substring of the next, it must be a typewriter sequence.
            //fl.trace("Removing typewriter sequence of length " + typeWriterSequenceLength + " from frame " + typeWriterSequenceStartFrame + " to frame " + typeWriterSequenceEndFrame);
            fl.getDocumentDOM().getTimeline().clearKeyframes(typeWriterSequenceStartFrame, typeWriterSequenceEndFrame);
            fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(typeWriterSequenceStartFrame);
        }
        typeWriterSequenceLength = 0;
        isTypeWriterSequence = false;
    }
    prevText = curText;
    prevI = i;
}
// main execution: iterate over all text keyframes, find sound effects that correspond to that text, and output i
for (var i = 0; i < textLayer.frames.length; i += textLayer.frames[i].duration - (i - textLayer.frames[i].startFrame)) {
    var curKeyframeDuration = textLayer.frames[i].duration;
    if (textLayer.frames[i].elements.length == 0 || !(textLayer.frames[i].elements[0] instanceof Text)) {
        continue; // ignore empty text/non-text keyframes...
    }
    var curText = textLayer.frames[i].elements[0].getTextString();
    var curSpeaker = undefined;
    try {
        curSpeaker = textLayer.frames[i].elements[1].getTextString(); // could be undeifned for no character textbox
    } catch (e) { }
    var sfxs = [];
    for (var j = 0; j < sfxLayerIndices.length; j++) {
        var curSfxLayer = fl.getDocumentDOM().getTimeline().layers[sfxLayerIndices[j]];
        for (var k = i; k < i + curKeyframeDuration; k += curSfxLayer.frames[k].duration - (k - curSfxLayer.frames[k].startFrame)) {
            var isKeyFrame = k == curSfxLayer.frames[k].startFrame;
            if (isKeyFrame && curSfxLayer.frames[k].soundLibraryItem != null) {
                // fl.trace(curSpeaker + " says " + "\"" + curText + "\"" + " with " + curSfxLayer.frames[k].soundName);
                sfxs.push(curSfxLayer.frames[k].soundName);
            }
        }
    }
    if (curSpeaker === undefined) curSpeaker = "";
    fl.trace("\"" + trim(curSpeaker) + "\",\"" + trim(curText) + "\"," + ((sfxs.length == 0) ? "" : "\"" + sfxs + "\""));
}