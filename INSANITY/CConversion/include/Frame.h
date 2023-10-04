#ifndef FRAME_H
#define FRAME_H
#include "pugixml.hpp"
#include "Element.h"
#include <vector>
#include <memory>
#include <optional>
class Frame {
    private:
        pugi::xml_node root;
        std::vector<std::unique_ptr<Element>> elements;
        void loadElements(pugi::xml_node& frameNode);
    public:
        Frame(pugi::xml_node& frameNode);
        ~Frame();
        Element* getElement(unsigned int index);
        unsigned int getDuration();
        void setDuration(unsigned int duration);
        unsigned int getStartFrame();
        void setStartFrame(unsigned int startFrame);
        std::optional<std::string> getLabelType();
        void setLabelType(const std::string& labelType);
        std::optional<std::string> getName();
        void setName(const std::string& name);
        bool isEmpty();
};
#endif // FRAME_H