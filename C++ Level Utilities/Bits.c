

#include <windows.h>
#include <stdlib.h>

#include "mm_jsapi.h"





JSBool  getBits(JSContext *cx, JSObject *obj, unsigned int argc, jsval *argv, jsval *rval)
{
	BYTE		*bits, *ptr;
	jsval		bytesObj;
	JSBool 		ok;
	int			i;

	// define the dimensions of the bitmap
	int width = 32,  height = 32;
	int rowBytes = 4*((width*32 + 31) / 32);

	// allocate the bits
	bits = malloc( rowBytes*height );
	if (bits == NULL)  return JS_FALSE;
	memset(bits, 0, rowBytes*height);

	// draw a diagonal in the bitmap
	ptr = bits;
	for (i=0; i<height;  i++)
	{
		*(ptr+2) = 255;		//red
		*(ptr+3) = 255;		//alpha
		
		ptr += rowBytes + 4;
	}
	
	// make a "bytes" object
	ok = JS_BytesToValue(cx, (unsigned char *)bits, rowBytes*height, &bytesObj);
	if (!ok)  return JS_FALSE;

	// return the bits
	*rval = bytesObj;

	// free the bits array
	free(bits);

	return JS_TRUE;
}
