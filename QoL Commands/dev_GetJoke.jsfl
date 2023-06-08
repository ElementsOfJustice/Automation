function soundAlert(message) {
	playSound(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\Alert.wav");
	alert(message)

}

function playSound(input) {
	var execString = "Utils.playSound" + "(" + stringToCFunctionString(input) + ");";
	return eval(execString);
}

function stringToCFunctionString(input) {
	var arr = "";
	for (var i = 0; i < input.length; i++) {
		arr += input.charCodeAt(i) + ", ";
	}
	return arr.substring(0, arr.length - 2);
}

function parseJoke(jsonString) {
	// Extract the type
	var typeStartIndex = jsonString.indexOf('"type":') + 8; // The index of the first character after '"type":'
	var typeEndIndex = jsonString.indexOf(',', typeStartIndex); // The index of the comma after the type value
	var type = jsonString.substring(typeStartIndex + 1, typeStartIndex + 2)

	if (type == "s") {
		//Single type joke
		
		var startIndex = jsonString.indexOf('"joke": "') + 9; // find the starting index of the substring
		var endIndex = jsonString.indexOf('",\n', startIndex); // find the ending index of the substring
		var desiredSubstring = jsonString.substring(startIndex, endIndex); // extract the substring	

		soundAlert(desiredSubstring.replace("\\n", ' ').replace("\\", ""));
		
	} else if (type == "t") {
		//Two part joke
		
		var startIndex = jsonString.indexOf('"setup": "') + 10; // find the starting index of the substring
		var endIndex = jsonString.indexOf('",\n', startIndex); // find the ending index of the substring
		var desiredSubstring = jsonString.substring(startIndex, endIndex); // extract the substring	

		soundAlert(desiredSubstring.replace("\\n", ' ').replace("\\", ""));
		
		var startIndex = jsonString.indexOf('"delivery": "') + 13; // find the starting index of the substring
		var endIndex = jsonString.indexOf('",\n', startIndex); // find the ending index of the substring
		var desiredSubstring = jsonString.substring(startIndex, endIndex); // extract the substring	
		
		soundAlert(desiredSubstring.replace("\\n", ' ').replace("\\", ""));
	}

}

var joke = Utils.joke();
fl.trace(joke);
parseJoke(joke);