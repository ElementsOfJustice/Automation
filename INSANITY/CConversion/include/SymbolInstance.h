#ifndef SYMBOLINSTANCE_H
#define SYMBOLINSTANCE_H

#include "Element.h"

class SymbolInstance : public Element {
    public:
        SymbolInstance(pugi::xml_node& elementNode);
        ~SymbolInstance();
        std::string getLibraryItemName();
        void setLibraryItemName(const std::string& libraryItemName);
        bool isSelected();
        void setSelected(bool selected);
        std::string getSymbolType();
        void setSymbolType(const std::string& symbolType);
        unsigned int getFirstFrame();
        void setFirstFrame(unsigned int firstFrame);
        unsigned int getLastFrame();
        void setLastFrame(unsigned int lastFrame);
        std::string getLoop();
        void setLoop(const std::string& loop);
        double getWidth() override;
        void setWidth(double width) override;
        double getHeight() override;
        void setHeight(double height) override;
};

#endif // SYMBOLINSTANCE_H