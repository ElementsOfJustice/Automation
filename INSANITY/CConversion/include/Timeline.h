#ifndef TIMELINE_H
#define TIMELINE_H
#include "pugixml.hpp"
#include "Layer.h"
#include <vector>
#include <memory>
class Timeline {
    private:
    std::vector<std::unique_ptr<Layer>> layers;
    pugi::xml_node root;
    void loadLayers(pugi::xml_node& timelineNode);
    public:
    Timeline(pugi::xml_node& timelineNode);
    ~Timeline();
    Layer* getLayer(unsigned int index);
    std::string getName();
    void setName(const std::string& name);
};
#endif // TIMELINE_H