var selItem = fl.getDocumentDOM().library.getSelectedItems();
var charIndex = fl.getDocumentDOM().library.findItemIndex(selItem[0].name);

fl.outputPanel.clear(); 
var pgBreak = "█████████████████████████████████████████████████████████████████████████████████████"
var pgBreak2 = "▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀"

//SCORES
var stageTime = 0;

function percentage(partialValue, totalValue) {
   return (100 * partialValue) / totalValue;
} 

function addRigToStage(charIndex) {

	var startTime = new Date();
	
	var item = fl.getDocumentDOM().library.items[charIndex];
		fl.getDocumentDOM().addItem({
			x: 0,
			y: 0
        }, item);
		
	stageTime = endDate(startTime);
		
	fl.trace("Rig Load Time is: " + "\t\t\t" + stageTime + " ms.");
		
	fl.getDocumentDOM().exitEditMode();
		
    }
	
function endDate(startTime) {
	
	var endTime = new Date();
	var timeDiff = endTime - startTime;
	
	timeDiff /= 1000;
	var seconds = Math.round(timeDiff);
	
	return (endTime - startTime);

}

function initializeSymbol() {
	
	var startTime = new Date();
	
	fl.getDocumentDOM().enterEditMode('inPlace');
	
	fl.trace("ENTER EDIT MODE: \t\t\t" + endDate(startTime) + "ms.");
	
	fl.getDocumentDOM().exitEditMode();
	
	return
}

function copyTime() {
	var startTime = new Date();
	
	fl.getDocumentDOM().getTimeline().copyFrames();
	
	fl.trace("COPY SYMBOL: \t\t\t\t" + endDate(startTime) + "ms.");
}

function layerData(charIndex) {
	
	fl.getDocumentDOM().enterEditMode('inPlace');
	var timeline = document.getTimeline()
	var layers = timeline.layers;
	var fullCount = 0;
	var fullTweens = 0;
	
	for (var i = 0; i < timeline.layerCount; i++) {
		
		var frameArray = layers[i].frames;
		var keyCount = 0;
		var tweenCount = 0;
		
			for (n = 0; n < frameArray.length; n++) {
				if ((n==frameArray[n].startFrame) && (frameArray[n].isEmpty == false)) {
					keyCount++;
					fullCount++;
					
					if(frameArray[n].tweenType != "none") {
						tweenCount++;
						fullTweens++;
					}
				}
			}
			
		var layerName = layers[i].name

		if (layerName.length >= 3) {intelTab = "\t\t\t\t"}
		if (layerName.length >= 4) {intelTab = "\t\t\t"}
		if (layerName.length >= 8) {intelTab = "\t\t"}
		if (layerName.length >= 12) {intelTab = "\t"}
		
		if (layerName.length >= 9) {
			layerName = layerName.substring(0, 9);
			layerName = layerName += "...";
			intelTab = "\t"
		}
		
		fl.trace("Layer " + i + " : " + "\t" + layerName + intelTab + "of rig has" + "\t" + keyCount + "\t" + " non-empty keyframes and " + tweenCount + " \t" + " tweens.");
		
		fl.getDocumentDOM().exitEditMode();
		
	}
	
	fl.trace(pgBreak);
	fl.trace("RIG SUMMARY:" + "\t\t\t\t" + selItem[0].name);
	fl.trace(pgBreak);
	fl.trace("LOAD TIMES");
	fl.trace(pgBreak);
	fl.getDocumentDOM().exitEditMode();
	initializeSymbol();
	copyTime();
	fl.trace(pgBreak);
	fl.trace("SYMBOL COMPOSITION");
	fl.trace(pgBreak2);
	fl.trace("TOTAL KEYFRAMES: \t\t\t" + fullCount);
	fl.trace("TOTAL TWEENS: \t\t\t\t" + fullTweens);
	fl.trace("TWEEN PERCENTAGE: \t\t\t" + Math.round(percentage(fullTweens, fullCount)));
	fl.trace(pgBreak);
	fl.trace("SCORE: " + ((stageTime/1000) * (fullCount/frameArray.length)).toFixed(2));
	fl.trace(pgBreak2);
	
	fl.getDocumentDOM().exitEditMode();	
	
}

function rigDiagnostics() {
	fl.trace("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄");
	fl.trace("██░▄▄▀█▄░▄██░▄▄░████░▄▄▀█▄░▄█░▄▄▀██░▄▄░██░▀██░██░▄▄▄░██░▄▄▄░█▄▄░▄▄█▄░▄██░▄▄▀██░▄▄▄░██");
	fl.trace("██░▀▀▄██░███░█▀▀████░██░██░██░▀▀░██░█▀▀██░█░█░██░███░██▄▄▄▀▀███░████░███░█████▄▄▄▀▀██");
	fl.trace("██░██░█▀░▀██░▀▀▄████░▀▀░█▀░▀█░██░██░▀▀▄██░██▄░██░▀▀▀░██░▀▀▀░███░███▀░▀██░▀▀▄██░▀▀▀░██");
	fl.trace(pgBreak);
	addRigToStage(charIndex);
	fl.trace(pgBreak);
	layerData(charIndex)
}

rigDiagnostics();