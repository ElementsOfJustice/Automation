/*				ELEMENTS OF JUSTICE C LIBRARY
											5/10/2023
							
	Contains C wrapper functions that other JSFL code can refer
	to without having to include the same functions in other files
	a thousand times. Can also be pre-empted by flags present in a
	Settings.txt, allowing video editors to customize their
	BetterAnimate experience.
													-Soundman
*/

var settings = FLfile.read(fl.configURI + "Settings.txt");

/*
Function: isSubstringPresent

Variables: 
    string string
	substring string

Description: Use this to see if flags are present in the Settings
file. This is good for turning features on and off at will.
*/
function isSubstringPresent(string, substring) {
	if (typeof string !== 'string' || typeof substring !== 'string') {
		throw new TypeError('Both arguments must be strings.');
	}

	return string.indexOf(substring) !== -1;
}

/*
Function: validationCheck

Variables: 
	none

Description: Confirm code exists, or otherwise warn the user.
*/
function validationCheck() {
	if (!FLfile.exists(fl.configURI + "Settings.txt")) {
		throw new Error("Settings.txt does not exist in the user's configuration directory.");
	}
}

//		= = = C++ WRAPPER FUNCTIONS = = = 

/*
Function: stringToCFunctionString

Variables: 
    input string

Description: Converts JSFL strings into C++ compatible strings
that are then decoded properly in Utils.dll
*/
function stringToCFunctionString(input) {
	var arr = "";
	for (var i = 0; i < input.length; i++) {
		arr += input.charCodeAt(i) + ", ";
	}
	return arr.substring(0, arr.length - 2);
}

/*
Function: beep

Variables: 
    frequency int
	duration int

Description: Plays a harsh beep through Windows.h's PlaySound function.
Used for conditioning video editors to not do silly things like turning
on advanced layers.
*/

function beep(frequency, duration) {
	validationCheck()
	if (!(isSubstringPresent(settings, "noSounds") || isSubstringPresent(settings, "noDLLs"))) {
		var execString = "Sound.beep" + "(" + frequency + ", " + duration + ");";
		return eval(execString);
	}
}

/*
Function: playSound

Variables: 
    input string

Description: Plays a sound through Windows.h's PlaySound function.
If the input does not exist, no sound will be played.
*/
function playSound(input) {
	validationCheck()
	if (!(isSubstringPresent(settings, "noSounds") || isSubstringPresent(settings, "noDLLs"))) {
		var execString = "Sound.playSound" + "(" + stringToCFunctionString(input) + ");";
		return eval(execString);
	}
}

/*
Function: soundError

Variables: 
	none

Description: Plays the BetterAnimate error sound. We do not throw
new error here, because then the error code would link to this line,
thus obfuscating the true error. Use this for long-execution code where
you want to be notified of an error, and remember to throw new error after
calling this.
*/
function soundError() {
	validationCheck()
	if (!(isSubstringPresent(settings, "noSounds") || isSubstringPresent(settings, "noDLLs"))) {
		playSound(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\Error.wav");
	}
}

/*
Function: soundAlert

Variables: 
    message string

Description: Plays the BetterAnimate notification sound, followed
by a message. Use this to notify the user that your clunky ass code
has finally finished executing.
*/
function soundAlert(message) {
	validationCheck()
	if (!(isSubstringPresent(settings, "noSounds") || isSubstringPresent(settings, "noDLLs"))) {
		playSound(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\Alert.wav");
	}
	alert(message)
}