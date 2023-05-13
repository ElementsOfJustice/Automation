/*							EXAMPLE FILE
											5/10/2023
							
	An example file of how to invoke cLib.jsfl!
													-Soundman
*/

var cLib = fl.configURI + "cLib.jsfl";

/*
Function: validationCheck

Variables: 
	none
	
Description: Confirm code exists, or otherwise warn the user.
*/
function validationCheck() {
	if (!FLfile.exists(cLib)) {
		throw new Error("cLib.jsfl does not exist in the user's configuration directory.");
	}
}

// === C LIB WRAPPERS START HERE ===

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
	fl.runScript(cLib, "beep", frequency, duration);
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
	fl.runScript(cLib, "playSound", input);
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
	fl.runScript(cLib, "soundError");
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
	fl.runScript(cLib, "soundAlert", message);
}

// === C LIB WRAPPERS END HERE ===

//Some examples of execution.

//soundError();
//throw new Error("Uh uh uh! You didn't say the magic word!'");

soundAlert("Notification! Your two hour scene generation code just completed!");

//playSound(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\Loadup.wav");

//beep(500, 500)