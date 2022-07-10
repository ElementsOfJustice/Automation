
// The following ifdef block is the standard way of creating macros which make exporting 
// from a DLL simpler. All files within this DLL are compiled with the SAMPLE_EXPORTS
// symbol defined on the command line. this symbol should not be defined on any project
// that uses this DLL. This way any other project whose source files include this file see 
// SAMPLE_API functions as being imported from a DLL, wheras this DLL sees symbols
// defined with this macro as being exported.
#ifdef SAMPLE_EXPORTS
#define SAMPLE_API __declspec(dllexport)
#else
#define SAMPLE_API __declspec(dllimport)
#endif

// This class is exported from the Sample.dll
class SAMPLE_API CSample {
public:
	CSample(void);
	// TODO: add your methods here.
};

extern SAMPLE_API int nSample;

SAMPLE_API int fnSample(void);

