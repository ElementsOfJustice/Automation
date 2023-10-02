import xml.etree.ElementTree as ET
ET.register_namespace("", "http://ns.adobe.com/xfl/2008/")

# Namespace constant
ns = {'xfl': 'http://ns.adobe.com/xfl/2008/'}

class XFL:
    def __init__(self, file_path):
        self.xfl_tree = ET.parse(file_path)
        self.timelines = [Timeline(timeline) for timeline in self.xfl_tree.findall('.//xfl:DOMTimeline', ns)]
    def find_timeline_element(self):
        timelines = self.xfl_tree.findall('.//xfl:DOMTimeline[@name="{}"]'.format(self.timeline_name), ns)
        return timelines[0] if timelines else None
class Timeline:
    def __init__(self, timeline_element):
        self.timeline_element = timeline_element
        self.attrib = timeline_element.attrib
        self.layers = [Layer(layer) for layer in timeline_element.findall('xfl:layers/xfl:DOMLayer', ns)]

    @property
    def name(self):
        return self.attrib['name']
    @name.setter
    def name(self, value):
        self.attrib['name'] = value

    def get_layer_by_name(self, layer_name):
        if self.timeline_element is not None:
            layers = self.timeline_element.findall('.//xfl:DOMLayer[@name="{}"]'.format(layer_name), ns)
            if layers:
                return Layer(layers[0])
        return None
    
class Layer:
    def __init__(self, layer_element):
        self.layer_element = layer_element
        self.attrib = layer_element.attrib
        self.frames = [Frame(frame) for frame in layer_element.findall('xfl:frames/xfl:DOMFrame', ns)]
    @property
    def name(self):
        return self.attrib['name']
    @name.setter
    def name(self, value):
        self.attrib['name'] = value
    @property
    def color(self):
        return self.attrib['color']
    @color.setter
    def color(self, value):
        self.attrib['color'] = value


class Frame:
    def __init__(self, frame_element):
        self.frame_element = frame_element
        self.attrib = frame_element.attrib
        self.elements = [Element(element) for element in frame_element.findall('xfl:elements/*', ns)]

    @property
    def duration(self):
        return self.attrib['duration']
    @duration.setter
    def duration(self, value):
        self.attrib['duration'] = value
    @property
    def startFrame(self):
        return self.attrib['index']
    @startFrame.setter
    def startFrame(self, value):
        self.attrib['index'] = value
    @property
    def labelType(self):
        return self.attrib['labelType'] if 'labelType' in self.frame_element.attrib else None
    @labelType.setter
    def labelType(self, value):
        self.attrib['labelType'] = value
    @property
    def name(self):
        return self.attrib['name'] if 'name' in self.frame_element.attrib else None
    @name.setter
    def name(self, value):
        self.attrib['name'] = value
class Element:
    def __init__(self, element_element):
        self.element_element = element_element
        self.attrib = element_element.attrib
        self.type = element_element.tag.split('}', 1)[-1]
    @property
    def width(self):
        return self.attrib['width']
    @width.setter
    def width(self, value):
        self.attrib['width'] = value
    @property
    def height(self):
        return self.attrib['height']
    @height.setter
    def height(self, value):
        self.attrib['height'] = value


if __name__ == '__main__':
    # This works!
    # xfl = XFL('INSANITY\\test\\DOMDocument.xml')
    # print(xfl.timelines[0].layers[0].name)
    # xfl.timelines[0].layers[0].name = 'Test!'
    # print(xfl.timelines[0].layers[0].name)
    # xfl.xfl_tree.write('INSANITY\\test\\DOMDocument.xml')
    # xfl = XFL('INSANITY\\test\\DOMDocument.xml')
    # print(xfl.timelines[0].layers[0].name)
    # print everything
    xfl = XFL('INSANITY\\test\\DOMDocument.xml')
    for timeline in xfl.timelines:
        print(timeline.name)
        for layer in timeline.layers:
            print(layer.name)
            for frame in layer.frames:
                print(frame.startFrame)
                for element in frame.elements:
                    print(element.type)
                    if element.type == 'DOMDynamicText':
                        print(element.element_element.findall('xfl:textRuns/xfl:DOMTextRun/xfl:characters', ns)[0].text)