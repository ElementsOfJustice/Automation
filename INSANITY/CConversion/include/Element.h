#ifndef ELEMENT_H
#define ELEMENT_H

#include "pugixml.hpp"
#include <optional>
class Element {
    protected:
        pugi::xml_node root;
    public:
        Element(pugi::xml_node& elementNode);
        ~Element();
        Element(const Element& element);
        virtual double getWidth() = 0;
        virtual void setWidth(double width) = 0;
        virtual double getHeight() = 0;
        virtual void setHeight(double height) = 0;
        std::string getType();
};

#endif // ELEMENT_H