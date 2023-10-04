#include "../include/Layer.h"
void Layer::loadFrames(pugi::xml_node& layerNode) {
    auto frames = layerNode.child("frames").children("DOMFrame");
    for(auto iter = frames.begin(); iter != frames.end(); ++iter) {
        this->frames.push_back(std::make_unique<Frame>(*iter));
    }
}
Layer::Layer(pugi::xml_node& layerNode) {
    this->root = layerNode;
    loadFrames(layerNode);
}
Layer::~Layer() {
    
}
Frame* Layer::getFrame(unsigned int index) {
    return frames[index].get();
}

std::string Layer::getColor() {
    return this->root.attribute("color").value();
}
void Layer::setColor(const std::string& color) {
    this->root.attribute("color").set_value(color.c_str());
}
std::optional<std::string> Layer::getLayerType() {
    auto layerType = this->root.attribute("layerType");
    if(!layerType.empty()) {
        return layerType.value();
    }
    return std::nullopt;
}
void Layer::setLayerType(const std::string& layerType) {
    this->root.attribute("layerType").set_value(layerType.c_str());
}
std::optional<bool> Layer::isLocked() {
    auto locked = this->root.attribute("locked");
    if(!locked.empty()) {
        return locked.as_bool();
    }
    return std::nullopt;
}
void Layer::setLocked(bool locked) {
    this->root.attribute("locked").set_value(locked);
}
std::string Layer::getName() {
    return this->root.attribute("name").value();
}
void Layer::setName(const std::string& name) {
    this->root.attribute("name").set_value(name.c_str());
}
std::optional<std::string> Layer::getParentLayer() {
    auto parentLayer = this->root.attribute("parentLayer");
    if(!parentLayer.empty()) {
        return parentLayer.value();
    }
    return std::nullopt;
}
