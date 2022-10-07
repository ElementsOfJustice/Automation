#include <TChar.h>
#include "mm_jsapi.h" 
#include <stdio.h>
#include <Python.h>
#include <stdlib.h>
#include <string.h>

double call_func(PyObject* func, double x, double y) {
    PyObject* args;
    PyObject* kwargs;
    PyObject* result = 0;
    double retval;

    // Make sure we own the GIL
    PyGILState_STATE state = PyGILState_Ensure();


    // Verify that func is a proper callable
    if (!PyCallable_Check(func))
    {
        fprintf(stderr, "call_func: expected a callable\n");
        goto fail;
    }
    // Step3
    args = Py_BuildValue("(dd)", x, y);
    kwargs = NULL;

    // Step 4
    result = PyObject_Call(func, args, kwargs);
    Py_DECREF(args);
    Py_XDECREF(kwargs);

    // Step 5
    if (PyErr_Occurred())
    {
        PyErr_Print();
        goto fail;
    }

    // Verify the result is a float object 
    if (!PyFloat_Check(result))
    {
        fprintf(stderr, "call_func: callable didn't return a float\n");
        goto fail;
    }

    // Step 6
    retval = PyFloat_AsDouble(result);
    Py_DECREF(result);

    // Step 7
    PyGILState_Release(state);
    return retval;
fail:
    Py_XDECREF(result);
    PyGILState_Release(state);
    abort();
}

PyObject* import_name(const char* modname, const char* symbol) {
    PyObject* u_name, * module;
    u_name = PyUnicode_FromString(modname);
    module = PyImport_Import(u_name);
    Py_DECREF(u_name);

    return PyObject_GetAttrString(module, symbol);
}


// A sample function
// Every implementation of a Javascript function must have this signature
JSBool getFLACLength(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval)
{
    unsigned int wasteOfMemory = 0; // I suck with C but this works to create a string ;-;
    unsigned short* x = JS_ValueToString(cx, argv[0], &wasteOfMemory);
    char* filename = (char*)malloc(wasteOfMemory + 1); // allocate memory for filename
    FILE* fp; // prepare file to read from
    int c, i, max; // looping variables
    unsigned long sampleRate = 0, samples = 0; // file metadata variables
    for (int i = 0; i < wasteOfMemory; i++) {
        filename[i] = (char)x[i]; // get filename 
    }
    filename[wasteOfMemory] = '\0'; // null terminator at the end of string
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
// Takes in a string from JSFL and returns it to JSFL
JSBool stringExample(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
    unsigned int size = 0;
    unsigned short* jsString = JS_ValueToString(cx, argv[0], &size);
    char* toReturn = malloc(size);
    for (int i = 0; i < size; i++) {
        toReturn[i] = (char)jsString[i];
    }
    JS_StringToValue(cx, toReturn, size, rval);
    free(toReturn);
    return JS_TRUE;
}

// testing with python, taking in two arguments
JSBool pythonTest(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
    PyObject* pow_func;
    double x = 0, y = 0;
    JSObject* args = JS_NewArrayObject(cx, argc, argv);
    jsval arg1, arg2;
    JS_GetElement(cx, args, 0, &arg1);
    JS_GetElement(cx, args, 1, &arg2);
    JS_ValueToDouble(cx, arg1, &x);
    JS_ValueToDouble(cx, arg2, &y);

    Py_Initialize();

    // Get a reference to the math.pow function
    pow_func = import_name("math", "pow");

    // Call it using our call_func() code 
    double result = call_func(pow_func, x, y);
    JS_DoubleToValue(cx, result, rval);
    Py_DECREF(pow_func);
    Py_Finalize();
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
    JS_DefineFunction(_T("getFLACLength"), getFLACLength, 1);
    JS_DefineFunction(_T("stringExample"), stringExample, 1);
    JS_DefineFunction(_T("pythonTest"), pythonTest, 2);
}