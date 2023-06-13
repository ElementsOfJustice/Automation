var cLib = fl.configURI + "Commands/cLib.jsfl";

function soundAlert(message) {
	fl.runScript(cLib, "soundAlert", message);
}

function replaceTwentyTimes(input) {
	var output = input;
  
	for (var i = 0; i < 20; i++) {
	  output = output.replace("\\n", ' ').replace("\\", "");
	}

	return output;
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

		soundAlert(replaceTwentyTimes(desiredSubstring));
		
	} else if (type == "t") {
		//Two part joke
		
		var startIndex = jsonString.indexOf('"setup": "') + 10; // find the starting index of the substring
		var endIndex = jsonString.indexOf('",\n', startIndex); // find the ending index of the substring
		var desiredSubstring = jsonString.substring(startIndex, endIndex); // extract the substring	

		soundAlert(replaceTwentyTimes(desiredSubstring));
		
		var startIndex = jsonString.indexOf('"delivery": "') + 13; // find the starting index of the substring
		var endIndex = jsonString.indexOf('",\n', startIndex); // find the ending index of the substring
		var desiredSubstring = jsonString.substring(startIndex, endIndex); // extract the substring	
		
		soundAlert(replaceTwentyTimes(desiredSubstring));
	}
}

var joke = Utils.joke();
parseJoke(joke);