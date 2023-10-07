#include "include/XFLDocument.h"
#include "include/CFile.h"
#include <iostream>

int main() {
    XFLDocument xfl("../test/DOMDocument.xml");
    xfl.getTimeline(0)->getLayer(0)->insertBlankKeyframe(7);
    xfl.write("../test/DOMDocument.xml");
}