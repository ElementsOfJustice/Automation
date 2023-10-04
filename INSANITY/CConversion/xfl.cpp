#include "include/XFLDocument.h"
#include "include/CFile.h"
#include <iostream>

int main() {
/*  std::string fileName = "Examples.txt";
    CFile file(fileName);

    if (file.exists(fileName)) {
        std::cout << "File exists." << std::endl;
    } else {
        std::cout << "File does not exist." << std::endl;
    }

    return 0; */

    std::string fileName = "example.txt";
    CFile file(fileName);

    // Call the write function with an in-line string content
    if (file.write(fileName, "Inline content goes here.")) {
        std::cout << "Write successful!" << std::endl;
    } else {
        std::cout << "Write failed." << std::endl;
    }

    return 0;

}