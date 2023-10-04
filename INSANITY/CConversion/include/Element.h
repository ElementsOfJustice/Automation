#ifndef ELEMENT_H
#define ELEMENT_H

#include "pugixml.hpp"
#include <optional>
class Element {
    private:
        pugi::xml_node root;
    public:
        Element(pugi::xml_node& elementNode);
        ~Element();
        double getWidth();
        void setWidth(double width);
        double getHeight();
        void setHeight(double height);
        std::string getType();
};

#endif // ELEMENT_H