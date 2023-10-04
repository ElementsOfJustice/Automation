#include "include/XFLDocument.h"
#include <iostream>

int main() {
    XFLDocument xfl("../test/DOMDocument.xml");
    // print name of first timeline
    std::cout << xfl.getTimeline(0)->getName() << std::endl;
    xfl.getTimeline(0)->setName("New Timeline Name");
    xfl.write("../test/DOMDocument2.xml");
}