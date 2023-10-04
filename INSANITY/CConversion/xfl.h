#include <string>
#include <vector>
#include <map>
#include <memory>
#include <stdexcept>
#include "lib/pugixml.hpp"
#include <optional>

// forward declarations with forward public method declarations

class Point {
    private:
        pugi::xml_node root;
    public:
        Point(pugi::xml_node& pointNode) {
            this->root = pointNode;
        }
        ~Point() {
           
        }
        double getX() {
            return this->root.attribute("x").as_double();
        }
        void setX(double x) {
            this->root.attribute("x").set_value(x);
        }
        double getY() {
            return this->root.attribute("y").as_double();
        }
        void setY(double y) {
            this->root.attribute("y").set_value(y);
        }
};
class Matrix {
    private:
        pugi::xml_node root;
    public:
        Matrix(pugi::xml_node& matrixNode) {
            this->root = matrixNode;
        }
        ~Matrix() {
           
        }
        double getA() {
            return this->root.attribute("a").as_double();
        }
        void setA(double a) {
            this->root.attribute("a").set_value(a);
        }
        double getB() {
            return this->root.attribute("b").as_double();
        }
        void setB(double b) {
            this->root.attribute("b").set_value(b);
        }
        double getC() {
            return this->root.attribute("c").as_double();
        }
        void setC(double c) {
            this->root.attribute("c").set_value(c);
        }
        double getD() {
            return this->root.attribute("d").as_double();
        }
        void setD(double d) {
            this->root.attribute("d").set_value(d);
        }
        double getTx() {
            return this->root.attribute("tx").as_double();
        }
        void setTx(double tx) {
            this->root.attribute("tx").set_value(tx);
        }
        double getTy() {
            return this->root.attribute("ty").as_double();
        }
        void setTy(double ty) {
            this->root.attribute("ty").set_value(ty);
        }
};
class SymbolInstance : Element {
    private:
        pugi::xml_node root;
    public:
        SymbolInstance(pugi::xml_node& elementNode) : Element(elementNode) {
            this->root = elementNode;
        }
        ~SymbolInstance() {
           
        }

        std::string getLibraryItemName() {
            return this->root.attribute("libraryItemName").value();
        }
        void setLibraryItemName(const std::string& libraryItemName) {
            this->root.attribute("libraryItemName").set_value(libraryItemName.c_str());
        }
        bool isSelected() {
            return this->root.attribute("isSelected").as_bool();
        }
        void setSelected(bool selected) {
            this->root.attribute("isSelected").set_value(selected);
        }
        std::string getSymbolType() {
            return this->root.attribute("symbolType").value();
        }
        void setSymbolType(const std::string& symbolType) {
            this->root.attribute("symbolType").set_value(symbolType.c_str());
        }
        unsigned int getFirstFrame() {
            return this->root.attribute("firstFrame").as_int();
        }
        void setFirstFrame(unsigned int firstFrame) {
            this->root.attribute("firstFrame").set_value(firstFrame);
        }
        unsigned int getLastFrame() {
            return this->root.attribute("lastFrame").as_int();
        }
        void setLastFrame(unsigned int lastFrame) {
            this->root.attribute("lastFrame").set_value(lastFrame);
        }
        std::string getLoop() {
            return this->root.attribute("loop").value();
        }
        void setLoop(const std::string& loop) {
            this->root.attribute("loop").set_value(loop.c_str());
        }
};
class Element {
    private:
        pugi::xml_node root;
    public:
        Element(pugi::xml_node& elementNode) {
            this->root = elementNode;
        }
        ~Element() {
           
        }
        double getWidth() {
            return this->root.attribute("width").as_int();
        }
        void setWidth(double width) {
            this->root.attribute("width").set_value(width);
        }
        double getHeight() {
            return this->root.attribute("height").as_int();
        }
        void setHeight(double height) {
            this->root.attribute("height").set_value(height);
        }
        std::string getType() {
            return this->root.name();
        }

};
class Frame {
    private:
        pugi::xml_node root;
        std::vector<std::unique_ptr<Element>> elements;
        void loadElements(pugi::xml_node& frameNode) {
            auto elements = frameNode.child("elements").children();
            for(auto iter = elements.begin(); iter != elements.end(); ++iter) {
                this->elements.push_back(std::make_unique<Element>(*iter));
            }
        }
    public:
        Frame(pugi::xml_node& frameNode) {
            this->root = frameNode;
            loadElements(frameNode);
        }
        ~Frame() {
           
        }
        Element* getElement(int index) {
            return elements[index].get();
        }
        unsigned int getDuration() {
            // duration is empty if it's 1, so we need to check if it's empty
            auto duration = this->root.attribute("duration");
            if(!duration.empty()) {
                return duration.as_int();
            }
            return 1;
        }
        void setDuration(unsigned int duration) {
            // if duration is 1, we need to remove the attribute
            if(duration == 1) {
                this->root.remove_attribute("duration");
            } else {
                this->root.attribute("duration").set_value(duration);
            }
        }
        unsigned int getStartFrame() {
            return this->root.attribute("index").as_int();
        }
        void setStartFrame(unsigned int startFrame) {
            this->root.attribute("index").set_value(startFrame);
        }
        std::optional<std::string> getLabelType() {
            auto label = this->root.attribute("labelType");
            if(!label.empty()) {
                return label.value();
            }
            return std::nullopt;
        }
        void setLabelType(const std::string& labelType) {
            this->root.attribute("labelType").set_value(labelType.c_str());
        }
        std::optional<std::string> getName() {
            auto name = this->root.attribute("name");
            if(!name.empty()) {
                return name.value();
            }
            return std::nullopt;
        }
        void setName(const std::string& name) {
            this->root.attribute("name").set_value(name.c_str());
        }
        bool isEmpty() {
            return this->elements.empty();
        }
};
class Layer {
    private:
        std::vector<std::unique_ptr<Frame>> frames;
        pugi::xml_node root;
        void loadFrames(pugi::xml_node& layerNode) {
            auto frames = layerNode.child("frames").children("DOMFrame");
            for(auto iter = frames.begin(); iter != frames.end(); ++iter) {
                this->frames.push_back(std::make_unique<Frame>(*iter));
            }
        }
    public:
        Layer(pugi::xml_node& layerNode) {
            this->root = layerNode;
            loadFrames(layerNode);
        }
        ~Layer() {
           
        }
        Frame* getFrame(int index) {
            return frames[index].get();
        }

        std::string getColor() {
            return this->root.attribute("color").value();
        }
        void setColor(const std::string& color) {
            this->root.attribute("color").set_value(color.c_str());
        }
        std::optional<std::string> getLayerType() {
            auto layerType = this->root.attribute("layerType");
            if(!layerType.empty()) {
                return layerType.value();
            }
            return std::nullopt;
        }
        void setLayerType(const std::string& layerType) {
            this->root.attribute("layerType").set_value(layerType.c_str());
        }
        std::optional<bool> isLocked() {
            auto locked = this->root.attribute("locked");
            if(!locked.empty()) {
                return locked.as_bool();
            }
            return std::nullopt;
        }
        void setLocked(bool locked) {
            this->root.attribute("locked").set_value(locked);
        }
        std::string getName() {
            return this->root.attribute("name").value();
        }
        void setName(const std::string& name) {
            this->root.attribute("name").set_value(name.c_str());
        }
        std::optional<std::string> getParentLayer() {
            auto parentLayer = this->root.attribute("parentLayer");
            if(!parentLayer.empty()) {
                return parentLayer.value();
            }
            return std::nullopt;
        }

};

class Timeline {
    private:
        std::vector<std::unique_ptr<Layer>> layers;
        pugi::xml_node root;
        void loadLayers(pugi::xml_node& timelineNode) {
            auto layers = timelineNode.child("layers").children("DOMLayer");
            for(auto iter = layers.begin(); iter != layers.end(); ++iter) {
                this->layers.push_back(std::make_unique<Layer>(*iter));
            }
        }
    public:
        Timeline(pugi::xml_node& timelineNode) {
            this->root = timelineNode;
            loadLayers(timelineNode);
        }
        ~Timeline() {
           
        }
        Layer* getLayer(int index) {
            return layers[index].get();
        } 
        std::string getName() {
            return this->root.attribute("name").value();
        }
        void setName(const std::string& name) {
            this->root.attribute("name").set_value(name.c_str());
        }
};

class XFL {
private:
    std::string filename;
    pugi::xml_node root;
    std::unique_ptr<pugi::xml_document> xflTree;
    std::vector<std::unique_ptr<Timeline>> timelines;
    void loadTimelines(pugi::xml_node& root) {
        auto timelines = root.child("timelines").children("DOMTimeline");
        for(auto iter = timelines.begin(); iter != timelines.end(); ++iter) {
            this->timelines.push_back(std::make_unique<Timeline>(*iter));
        }
    }
public:
    XFL(const std::string& filename) {
        this->filename = filename;
        xflTree = std::make_unique<pugi::xml_document>();
        auto result = xflTree->load_file(filename.c_str());
        if (!result) {
            throw std::runtime_error("Failed to load XFL file: " + std::string(result.description()));
        }
        this->root = xflTree->document_element();
        loadTimelines(this->root);
    }
    ~XFL() {
        
    }
    void write(const std::string& filename) {
        xflTree->save_file(filename.c_str());
    }
    Timeline* getTimeline(int index) {
        return timelines[index].get();
    }
};



