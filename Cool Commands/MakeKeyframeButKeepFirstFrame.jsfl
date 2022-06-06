var firstFrame = fl.getDocumentDOM().getElementProperty('firstFrame');
fl.getDocumentDOM().getTimeline().insertKeyframe();
fl.getDocumentDOM().getTimeline().setSelectedFrames(fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1);
fl.getDocumentDOM().setElementProperty('firstFrame', firstFrame);