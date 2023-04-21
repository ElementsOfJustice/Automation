#include "mm_jsapi.h"
#include <Windows.h>
#include <string>
#include <codecvt>
#include <fstream>
#include <sstream>
#include <vector>
#include <thread>

#pragma comment(lib, "winmm.lib")  // Link with winmm.lib to use the Windows multimedia functions

std::vector<std::string> splitOnQuestionMark(std::string input) {
    std::vector<std::string> substrings;

    size_t startPos = 0;
    size_t endPos = input.find('?');
    while (endPos != std::string::npos) {
        substrings.push_back(input.substr(startPos, endPos - startPos));
        startPos = endPos + 1;
        endPos = input.find('?', startPos);
    }
    substrings.push_back(input.substr(startPos));

    return substrings;
}

wchar_t* stringToWide(const std::string& str) {
    wchar_t* wideStr = new wchar_t[str.size() + 1];
    std::copy(str.begin(), str.end(), wideStr);
    wideStr[str.size()] = L'\0';
    return wideStr;
}

std::string wideToString(wchar_t* wideStr) {
    std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;
    std::wstring wstr(wideStr);
    return converter.to_bytes(wstr);
}

std::string arrToString(std::vector<int> input) {
    std::ostringstream oss;
    for (int i = 0; i < input.size(); i++) {
        oss << static_cast<char>(input[i]);
    }
    return oss.str();
}

JSBool beep(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {

    long arg1, arg2;

    JS_ValueToInteger(cx, argv[0], &arg1);
    JS_ValueToInteger(cx, argv[2], &arg2);

    std::thread t([arg1, arg2]() {
        Beep((DWORD)arg1, (DWORD)arg2);
    });

    t.detach();

    return JS_TRUE;
}

JSBool playSound(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
    // AIDS METHOD: because JS_ValueToString causes read access violations, we take each character as its own argument and build a string from that.
    std::vector<int> inpString;

    for (unsigned int i = 0; i < argc * 2; i += 2) {
        inpString.push_back((argv[i] - 1) / 2);
    }

    std::string str = arrToString(inpString);
    auto wideStr = stringToWide(str);

    std::thread t([wideStr]() {
        PlaySound(wideStr, NULL, SND_FILENAME | SND_SYNC);
    });

    t.detach();

    return JS_TRUE;
}

extern "C" {
    // MM_STATE is a macro that expands to some definitions that are
    // needed in order interact with Dreamweaver.  This macro must be
    // defined exactly once in your library
    MM_STATE

        // Flash calls MM_Init when your library is loaded
        void
        MM_Init()
    {
        JS_DefineFunction(L"beep", beep, 512);
        JS_DefineFunction(L"playSound", playSound, 512);
    }
}