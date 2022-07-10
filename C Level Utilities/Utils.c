#include <TChar.h>
#include "mm_jsapi.h" 
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// A sample function
// Every implementation of a Javascript function must have this signature
JSBool getFLACLength(JSContext *cx, JSObject *obj,  unsigned int argc,   jsval *argv, jsval *rval)
{
    unsigned int wasteOfMemory = 0;
    unsigned short* x = JS_ValueToString(cx, argv[0], &wasteOfMemory);
    char* filename = (char *) malloc(wasteOfMemory);
    FILE* fp;
    int c, i, max;
    unsigned long sampleRate = 0, samples = 0;
    for (int i = 0; i < wasteOfMemory; i++) {
        filename[i] = (char)x[i];
    }
    int err = fopen_s(&fp, filename, "rb");
    if (err != 0) {
        return JS_FALSE;
    }
    for (i = 0, max = 0x20; i < max && (c = getc(fp)) != EOF; i++) {
        if ((i >= 0x12 && i <= 0x14) || (i >= 0x15 && i <= 0x19))
            if (i >= 0x12 && i <= 0x14) {
                sampleRate <<= (i == 0x14) ? 4 : 8;
                sampleRate += (i == 0x14) ? c & 0b11110000 : c;
            }
        if (i >= 0x15 && i <= 0x19) {
            samples <<= 8;
            samples += (i == 0x15) ? c & 0b00001111 : c;
        }

    }
    int time = 1000 * (1.0f * samples / (1.0f * sampleRate));
    fclose(fp);
	
	*rval = JS_IntegerToValue(time);
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
	
