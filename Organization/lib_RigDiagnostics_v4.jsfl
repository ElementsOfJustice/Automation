var selItem = fl.getDocumentDOM().library.getSelectedItems();
var charIndex = fl.getDocumentDOM().library.findItemIndex(selItem[0].name);
var symbols = ["button", "graphic", "movie clip"];

fl.showIdleMessage(false);
fl.outputPanel.clear();

var pgBreak = "█████████████████████████████████████████████████████████████████████████████████████"
var pgBreak2 = "▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀"

var editRig = true;

//SCORES
var stageTime = 0;
var fullCount = 0;
var fullTweens = 0;
var emptyLayerCount = 0;
var totalLayerCount = 0;
var layerData = [];

var fuzzyReplace = [
"xsheet:xSheet",
"Layer_:UNNAMED",
"layer_:UNNAMED",
"_:UNNAMED"
];

function levenshteinRatio(s, t) {
    var d = []; //2d matrix

    // Step 1
    var n = s.length;
    var m = t.length;

    if (n == 0) return m;
    if (m == 0) return n;

    //Create an array of arrays in javascript
    for (var i = n; i >= 0; i--) d[i] = [];

    // Step 2
    for (var i = n; i >= 0; i--) d[i][0] = i;
    for (var j = m; j >= 0; j--) d[0][j] = j;

    // Step 3
    for (var i = 1; i <= n; i++) {
        var s_i = s.charAt(i - 1);

        // Step 4
        for (var j = 1; j <= m; j++) {

            //Check the jagged ld total so far
            if (i == j && d[i][j] > 4) return n;

            var t_j = t.charAt(j - 1);
            var cost = (s_i == t_j) ? 0 : 1; // Step 5

            //Calculate the minimum
            var mi = d[i - 1][j] + 1;
            var b = d[i][j - 1] + 1;
            var c = d[i - 1][j - 1] + cost;

            if (b < mi) mi = b;
            if (c < mi) mi = c;

            d[i][j] = mi; // Step 6

            //Damerau transposition
            if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }

    return ((s.length + t.length - d[n][m]) / (s.length + t.length));
}

function percentage(partialValue, totalValue) {
	return (100 * partialValue) / totalValue;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function searchLibrary() {
	var i, total, item;

	for (i = 0, total = items.length; i < total; i++) {
		item = items[i];

		if (symbols.indexOf(item.itemType) > -1)
			searchTimeline(item.timeline);
	}
}

function searchTimeline(timeline) {
	var layers = timeline.layers.reverse();
	var count = 0;
	var i, total, layer;

	for (i = 0, total = layers.length; i < total; i++) {
		layer = layers[i];
		layersCount++;
		totalLayerCount++;
		count++;

		if (layer.layerType !== "folder") {

			var layers = timeline.layers;

			for (var i = 0; i < timeline.layerCount; i++) {

				var frameArray = layers[i].frames;
				var keyCount = 0;
				var tweenCount = 0;

				for (n = 0; n < frameArray.length; n++) {
					if ((n == frameArray[n].startFrame) && (frameArray[n].isEmpty == false)) {
						keyCount++;
						fullCount++;

						if (frameArray[n].tweenType != "none") {
							tweenCount++;
							fullTweens++;
						}
					}
				}
				
				if (editRig) {
					layers[i].name = capitalizeFirstLetter(layers[i].name);
					for (n = 0; n < fuzzyReplace.length; n++) {
						if (levenshteinRatio(layers[i].name, fuzzyReplace[n].split(":")[0]) > 0.82) {
							layers[i].name = fuzzyReplace[n].split(":")[1];
						}
					}
				/*
					if(layers[i].name == "xSheet") {
						var xSheetIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("xSheet")
						fl.getDocumentDOM().getTimeline().reorderLayer(xSheetIndex, 0); 
					} */
				}

				var layerName = layers[i].name

				if (layerName.length >= 1) {
					intelTab = "\t\t\t\t"
				}
				if (layerName.length >= 3) {
					intelTab = "\t\t\t\t"
				}
				if (layerName.length >= 4) {
					intelTab = "\t\t\t"
				}
				if (layerName.length >= 8) {
					intelTab = "\t\t"
				}
				if (layerName.length >= 12) {
					intelTab = "\t"
				}

				if (layerName.length >= 9) {
					layerName = layerName.substring(0, 9);
					layerName = layerName += "...";
					intelTab = "\t"
				}
			
				

				fl.trace("Layer " + i + " : " + "\t" + layerName + intelTab + " : " + "\t" + keyCount + "\t" + " keyframes & " + tweenCount + " \t" + " tweens. " + timeline.name);
				layerData.push(layers[i].name + ":" + timeline.name + ";" + keyCount);
			
				var isEmpty = layer.frames.every(function (frame) {
					return frame.isEmpty;
				});

				if (isEmpty) {
					emptyLayerCount++;
					
					if (editRig) {
						timeline.deleteLayer(total - count);
					}
				}
			}
		}
	}
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

	for (var i = 0; i < timeline.layerCount; i++) {

		var frameArray = layers[i].frames;
		var keyCount = 0;
		var tweenCount = 0;

		for (n = 0; n < frameArray.length; n++) {
			if ((n == frameArray[n].startFrame) && (frameArray[n].isEmpty == false)) {
				keyCount++;
				fullCount++;

				if (frameArray[n].tweenType != "none") {
					tweenCount++;
					fullTweens++;
				}
			}
		}

		var layerName = layers[i].name

		if (layerName.length >= 3) {
			intelTab = "\t\t\t\t"
		}
		if (layerName.length >= 4) {
			intelTab = "\t\t\t"
		}
		if (layerName.length >= 8) {
			intelTab = "\t\t"
		}
		if (layerName.length >= 12) {
			intelTab = "\t"
		}

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
	fl.trace("SCORE: " + ((stageTime / 1000) * (fullCount / frameArray.length)).toFixed(2));
	fl.trace(pgBreak2);

	fl.getDocumentDOM().exitEditMode();

}

function advise() {
	
	layerData.sort(compare);
	
	fl.trace("REQUEST FOR ACTION, RESOLVE LAYER COMPLEXITY")
	fl.trace(pgBreak2);
	
	for (var i = 0; i < 5; i++) {
		fl.trace("Layer " + layerData[layerData.length-(i+1)].split(":")[0] + " within symbol " + layerData[layerData.length-(i+1)].split(":")[1].split(";")[0] + " with key count " + layerData[layerData.length-(i+1)].split(";")[1]);
	}
	
}

function compare(a , b) {
	return parseInt(a.split(";")[1]) - parseInt(b.split(";")[1])
}

function rigDiagnostics() {
	fl.trace("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄");
	fl.trace("██░▄▄▀█▄░▄██░▄▄░████░▄▄▀█▄░▄█░▄▄▀██░▄▄░██░▀██░██░▄▄▄░██░▄▄▄░█▄▄░▄▄█▄░▄██░▄▄▀██░▄▄▄░██");
	fl.trace("██░▀▀▄██░███░█▀▀████░██░██░██░▀▀░██░█▀▀██░█░█░██░███░██▄▄▄▀▀███░████░███░█████▄▄▄▀▀██");
	fl.trace("██░██░█▀░▀██░▀▀▄████░▀▀░█▀░▀█░██░██░▀▀▄██░██▄░██░▀▀▀░██░▀▀▀░███░███▀░▀██░▀▀▄██░▀▀▀░██");
	fl.trace(pgBreak);
	addRigToStage(charIndex);
	fl.trace(pgBreak);

	dom = fl.getDocumentDOM();

	if (!dom) {
		alert("Please open up a document first.");
		return;
	}

	var i, total;

	library = dom.library;
	items = library.items;
	layersCount = 0;
	deleted = 0;
	searchLibrary();

	for (i = 0, total = dom.timelines.length; i < total; i++)
		searchTimeline(dom.timelines[i]);

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
	fl.trace("TOTAL LAYERS: \t\t\t\t" + totalLayerCount);
	fl.trace("EMPTY LAYERS: \t\t\t\t" + emptyLayerCount);
	fl.trace("TOTAL KEYFRAMES: \t\t\t" + fullCount);
	fl.trace("TOTAL TWEENS: \t\t\t\t" + fullTweens);
	fl.trace("TWEEN PERCENTAGE: \t\t\t" + Math.round(percentage(fullTweens, fullCount)));
	fl.trace(pgBreak);
	
	advise();
	
	fl.trace(pgBreak);

	fl.getDocumentDOM().exitEditMode();
	
	if (editRig) {
		alert(deleted + " layers of " + layersCount + " have been deleted");
	}

}

rigDiagnostics();