#include <TChar.h>
#include "mm_jsapi.h" 
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// A sample function
// Every implementation of a Javascript function must have this signature
JSBool getFLACLength(JSContext *cx, JSObject *obj,  unsigned int argc,   jsval *argv, jsval *rval)
{
    unsigned int wasteOfMemory = 0; // I suck with C but this works to create a string ;-;
    unsigned short* x = JS_ValueToString(cx, argv[0], &wasteOfMemory);
    char* filename = (char *) malloc(wasteOfMemory); // allocate memory for filename
    FILE* fp; // prepare file to read from
    int c, i, max; // looping variables
    unsigned long sampleRate = 0, samples = 0; // file metadata variables
    for (int i = 0; i < wasteOfMemory; i++) {
        filename[i] = (char)x[i]; // get filename 
    }
    int err = fopen_s(&fp, filename, "rb"); // open the file
    if (err != 0) {
        *rval = JS_IntegerToValue(-1);
        return JS_TRUE; // return -1 as an error value so that it doesn't crash.
    }
    for (i = 0, max = 0x20; i < max && (c = getc(fp)) != EOF; i++) { // loop over first 32 bytes of the file
        if ((i >= 0x12 && i <= 0x14) || (i >= 0x15 && i <= 0x19))
            if (i >= 0x12 && i <= 0x14) { // FLAC documentation says that the sample rate is from byte 0x12 to the first nibble of byte 0x14
                sampleRate <<= (i == 0x14) ? 4 : 8; 
                sampleRate += (i == 0x14) ? c & 0b11110000 : c;
            }
        if (i >= 0x15 && i <= 0x19) { // FLAC documentation says that the number of samples is from the second nibble of byte 0x15 to the end of byte 0x19
            samples <<= 8;
            samples += (i == 0x15) ? c & 0b00001111 : c;
        }

    }
    int time = 1000 * (1.0f * samples / (1.0f * sampleRate)); // the duration of a sound file is the number of samples divided by the sample rate. Truncate to the nearest millisecond
    fclose(fp);
	
	*rval = JS_IntegerToValue(time); // return the duration of the FLAC file in milliseconds
    free(filename); // free memory alloated for the string
	// Indicate success
	return JS_TRUE;
}


// MM_STATE is a macro that expands to some definitions that are
// needed in order interact with Dreamweaver.  This macro must be
// defined exactly once in your library
MM_STATE


// Flash calls MM_Init when your library is loaded
void
MM_Init()
{
	// sample function
	JS_DefineFunction(_T("getFLACLength"),			getFLACLength,			1);
}
	
