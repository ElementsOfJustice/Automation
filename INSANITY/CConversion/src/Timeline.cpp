#include "../include/Timeline.h"
void Timeline::loadLayers(pugi::xml_node& timelineNode) {
    auto layers = timelineNode.child("layers").children("DOMLayer");
    for(auto iter = layers.begin(); iter != layers.end(); ++iter) {
        this->layers.push_back(std::make_unique<Layer>(*iter));
    }
}
Timeline::Timeline(pugi::xml_node& timelineNode) {
    this->root = timelineNode;
    loadLayers(timelineNode);
}
Timeline::~Timeline() {
    
}
Layer* Timeline::getLayer(unsigned int index) {
    return layers[index].get();
} 
std::string Timeline::getName() {
    return this->root.attribute("name").value();
}
void Timeline::setName(const std::string& name) {
    this->root.attribute("name").set_value(name.c_str());
}
