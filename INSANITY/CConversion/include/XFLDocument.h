#ifndef XFLDOCUMENT_H
#define XFLDOCUMENT_H

#include "pugixml.hpp"
#include "SymbolInstance.h"
#include <memory>
#include <vector>
#include "Timeline.h"
class XFLDocument {
    private:
        std::string filename;
        pugi::xml_document doc;
        std::unique_ptr<pugi::xml_document> xflTree;
        std::vector<std::unique_ptr<Timeline>> timelines;
        pugi::xml_node root;
        void loadTimelines(pugi::xml_node& root);
    public:
        XFLDocument(const std::string& filename);
        ~XFLDocument();
        void write(const std::string& filename);
        SymbolInstance getSymbolInstance(const std::string& name);
        Timeline* getTimeline(int index);
};

#endif // XFLDOCUMENT_H