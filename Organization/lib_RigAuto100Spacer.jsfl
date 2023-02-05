var frameArray = fl.getDocumentDOM().getTimeline().layers[0].frames;
var n = frameArray.length;
var arrEdit = [];

function getDifferenceToNextMultipleOf100(num) {
  var nextMultiple = Math.ceil(num/100) * 100;
  return nextMultiple - num;
}

for (i = 0; i < n; i++) {
	if ((i==frameArray[i].startFrame) && (frameArray[i].labelType == "name")) {
		var frameNum = i+1;
		arrEdit.push(frameNum);
}	}

var offset = 0;
var tmpOffset = 0

for (i = 1; i < arrEdit.length; i++) {
	fl.getDocumentDOM().getTimeline().currentFrame = (arrEdit[i] + offset) - 2;
	fl.getDocumentDOM().getTimeline().insertFrames(getDifferenceToNextMultipleOf100(arrEdit[i]+offset), true);
	offset+=getDifferenceToNextMultipleOf100(arrEdit[i]+offset);
}