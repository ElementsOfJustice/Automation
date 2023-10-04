#include "../include/Element.h"
Element::Element(pugi::xml_node& elementNode) {
    this->root = elementNode;
}
Element::Element(const Element& element) {
    pugi::xml_document doc;
    doc.append_copy(element.root);
    this->root = doc.first_child();
}
Element::~Element() {
}
std::string Element::getType() {
    return this->root.name();
}
