"""
**********************************************************************
*                            TO-DO LIST                              *
**********************************************************************

[1] - Task 1: Implement keyframe manipulation functions for Layers.
    - Assigned to: Conzor & CoPilot!

[2] - Task 2: Implement Library & Item class.
    - Assigned to: Soundman & OpenAI!

[3] - Task 3: Fill out XFL class.
    - Assigned to: Conzor & Soundman

[4] - Task 4: Functions that create layers and timelines, need to
        create the proper XML structure, complete with correct
        indents and correct XML end tags.

**********************************************************************
*                           SOME QUESTIONS                           *
**********************************************************************

[Q1] -  I want camelCase variable and function names, for brevity. 
        Underscores are weird and unintuitive for me. We'll refactor
        after we have a decent base.

[Q2] -  Let's abolish timeline/layer indexes as a concept. Instead,
        our functions only take in timeline and layer objects. We
        spend more time working in a productive mindset, and spend
        less time thinking about where the stuff we're working with
        is.

[Q3] -  I want to minimize the verbosity of our heiarchy. We're
        currently at:
                xfl.timelines[0].layers[1][2].elements[3]
        This isn't too bad, but the fact that frames[] accesses
        keyframes instead of frames is still weird to me!
"""

from pydub import AudioSegment
import xml.etree.ElementTree as ET
import datetime
import shutil
import copy
import os

ET.register_namespace("", "http://ns.adobe.com/xfl/2008/")

# Namespace constant
ns = {'xfl': 'http://ns.adobe.com/xfl/2008/'}


class PyFile:
    def __init__(self, filename):
        self.filename = filename
    def exists(filename):
        return os.path.exists(filename)
    def getSize(filename):
        if os.path.exists(filename):
            return os.path.getsize(filename)
        else:
            return None
    def read(filename):
        if os.path.exists(filename):
            with open(filename, 'r') as file:
                return file.read()
        else:
            return None
    def remove(filename):
        if os.path.exists(filename):
            os.remove(filename)
            return True
        else:
            return False
    def write(filename, content, mode='w'):
        with open(filename, mode) as file:
            file.write(content)
    def get_audio_format_string(filename):
        print(filename)
        audio = AudioSegment.from_file(filename)
        sample_width = audio.sample_width * 8  # Convert sample width to bit depth
        sample_rate = audio.frame_rate
        num_channels = audio.channels
        format_string = f"{sample_rate/1000:.0f}kHz {sample_width}bit "
        if num_channels == 1:
            format_string += "Mono"
        elif num_channels == 2:
            format_string += "Stereo"
        else:
            format_string += f"{num_channels} channels"
        return format_string
    def get_total_samples(filename):
        audio = AudioSegment.from_file(filename)
        return len(audio)


class XFL:
    def __init__(self, file_path):
        self.xfl_tree = ET.parse(file_path)
        self.timelines = [Timeline(timeline) for timeline in self.xfl_tree.findall('.//xfl:DOMTimeline', ns)]
    def find_timeline_element(self):
        timelines = self.xfl_tree.findall('.//xfl:DOMTimeline[@name="{}"]'.format(self.timeline_name), ns)
        return timelines[0] if timelines else None
    def write(self, file_path):
        self.xfl_tree.write(file_path)
    def read(self, file_path):
        self.xfl_tree = ET.parse(file_path)
        self.timelines = [Timeline(timeline) for timeline in self.xfl_tree.findall('.//xfl:DOMTimeline', ns)]
    def delete_Timelines(self, index):
        if index < 0 or index >= len(self.timelines):
            raise IndexError("Index out of range")
        timeline_to_delete = self.timelines[index]
        self.xfl_tree.find('xfl:timelines', namespaces=ns).remove(timeline_to_delete.timeline_element)
        del self.timelines[index]
    def duplicate_Timelines(self, timeline_to_duplicate):
        index_to_duplicate = None
        for i, timeline in enumerate(self.timelines):
            if timeline == timeline_to_duplicate:
                index_to_duplicate = i
                break
        if index_to_duplicate is not None:
            duplicated_timeline_element = copy.deepcopy(timeline_to_duplicate.timeline_element)
            new_timeline_name = f"{timeline_to_duplicate.name}_copy"
            duplicated_timeline_element.attrib['name'] = new_timeline_name
            self.xfl_tree.find('xfl:timelines', namespaces=ns).insert(index_to_duplicate + 1, duplicated_timeline_element)
            self.timelines.insert(index_to_duplicate + 1, Timeline(duplicated_timeline_element))
        else:
            raise ValueError("Timeline not found in the XFL document.")
    def reorder_Timelines(self, custom_sort_key):
        self.timelines = sorted(self.timelines, key=lambda timeline: custom_sort_key(timeline.name))

        # Rebuild the timelines in the XML structure based on the new order
        timelines_element = self.xfl_tree.find('.//xfl:timelines', namespaces=ns)
        for timeline in self.timelines:
            if timeline.timeline_element in timelines_element:
                timelines_element.remove(timeline.timeline_element)
            timelines_element.append(timeline.timeline_element)
    def import_Sound(self, audio_path, folderName=""):      
        # Duplicate the audio file
        audio_filename = os.path.basename(audio_path)
        library_path = os.path.join("INSANITY", "test", "LIBRARY", folderName)
        os.makedirs(library_path, exist_ok=True)
        audio_duplicate_path = os.path.join(library_path, audio_filename)
        shutil.copy2(audio_path, audio_duplicate_path)

        # Create XML entry
        media_element = ET.Element("DOMSoundItem")
        media_element.set("name", audio_filename)
        media_element.set("sourceExternalFilepath", f"./LIBRARY/{folderName}/{audio_filename}")
        media_element.set("sourceLastImported", str(int(datetime.datetime.now().timestamp())))
        media_element.set("externalFileSize", str(os.path.getsize(audio_duplicate_path)))
        media_element.set("href", audio_filename)
        media_element.set("format", str(PyFile.get_audio_format_string(os.path.abspath(audio_path))))
        media_element.set("sampleCount", str(PyFile.get_total_samples(os.path.abspath(audio_path))))
        media_element.set("dataLength", str(os.path.getsize(audio_duplicate_path)))

        # Add the XML entry
        media_parent = self.xfl_tree.find(".//xfl:media", namespaces=ns)
        if media_parent is not None:
            media_parent.append(media_element)


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
        self.attrib['name'] = str(value)

    def delete_Layers(self, index):
        if index < 0 or index >= len(self.layers):
            raise IndexError("Index out of range")
        layer_to_delete = self.layers[index]
        self.timeline_element.find('xfl:layers', namespaces=ns).remove(layer_to_delete.layer_element)
        del self.layers[index]

    def get_Layer_From_Name(self, name):
        matching_layers = []
        for layer in self.layers:
            if layer.name == name:
                matching_layers.append(layer)
        return matching_layers if matching_layers else None
    
    def add_Layers(self, layer_name, layer_color=None):
        new_layer = ET.Element('DOMLayer')
        new_layer.tail = '\n\t\t'   
        new_layer.attrib['name'] = layer_name
        if layer_color is not None:
            new_layer.attrib['color'] = layer_color
        self.timeline_element.find('xfl:layers', namespaces=ns).append(new_layer)
        new_layer_obj = Layer(new_layer)
        self.layers.append(new_layer_obj)
        return new_layer_obj
    
    def reorder_Layers(self, custom_sort_key):
        self.layers = sorted(self.layers, key=lambda layer: custom_sort_key(layer.name))
        # Rebuild the layers in the XML structure based on the new order
        layers_element = self.timeline_element.find('xfl:layers', namespaces=ns)
        for layer in self.layers:
            if layer.layer_element in layers_element:
                layers_element.remove(layer.layer_element)
            layers_element.append(layer.layer_element)
            """def custom_sort_key(layer_name):
                    order = {
                        "Layer_2": 0,
                        "Layer_1": 1,
                        "Layer_3": 2
                    }

                    if layer_name in order:
                        return (order[layer_name], layer_name) """

    def duplicate_Layers(self, layer_to_duplicate):
        index_to_duplicate = None
        for i, layer in enumerate(self.layers):
            if layer == layer_to_duplicate:
                index_to_duplicate = i
                break

        if index_to_duplicate is not None:
            duplicated_layer_element = copy.deepcopy(layer_to_duplicate.layer_element)
            new_layer_name = f"{layer_to_duplicate.name}_copy"
            duplicated_layer_element.attrib['name'] = new_layer_name
            self.layers.insert(index_to_duplicate + 1, Layer(duplicated_layer_element))
            layers_element = self.timeline_element.find('xfl:layers', namespaces=ns)
            layers_element.insert(index_to_duplicate + 1, duplicated_layer_element)
        else:
            raise ValueError("Layer not found in the timeline.")
        
    def findLayerIndex(self, layerName):
        for i, layer in enumerate(self.layers):
            if layer.name == layerName:
                return i
        return None
        
    
#Trying to set parentLayer to a string caused an XFL wipe
#Need a way to dynamically access layer index. Want to do this by accessing layer's timeline parent and counting which layer it is, but don't know how to get parent.
class Layer:
    def __init__(self, layer_element):
        self.layer_element = layer_element
        self.attrib = layer_element.attrib
        self.frames = [Frame(frame) for frame in layer_element.findall('xfl:frames/xfl:DOMFrame', ns)]
    @property
    def color(self):
        return self.attrib['color']
    @color.setter
    def color(self, value):
        self.attrib['color'] = str(value)        
    @property
    def layerType(self):
        return self.attrib['layerType'] if 'layerType' in self.attrib else None
    @layerType.setter
    def layerType(self, value):
        self.attrib['layerType'] = value
    @property
    def locked(self):
        return self.attrib['locked'] if 'locked' in self.attrib else None
    @locked.setter
    def locked(self, value):
        self.attrib['locked'] = value
    @property
    def name(self):
        return self.attrib['name']
    @name.setter
    def name(self, value):
        self.attrib['name'] = value
    @property
    def parentLayer(self):
        return self.attrib['parentLayer'] if 'parentLayer' in self.attrib else None
    @parentLayer.setter
    def parentLayer(self, value):
        self.attrib['parentLayer'] = value
    @property
    def frameCount(self):
        return int(self.frames[-1].startFrame) + int(self.frames[-1].duration)

    def __getitem__(self, key):
        # return the nth keyframe where n.startFrame <= key < (n+1).startFrame
        if isinstance(key, int):
            for i, frame in enumerate(self.frames):
                if int(frame.startFrame) <= key < int(self.frames[i+1].startFrame):
                    return frame
        else:
            raise TypeError('Layer indices must be integers')

    def clear_Keyframe(self, start_frame):
        for i, frame in enumerate(self.frames):
            if frame.startFrame == str(start_frame):
                self.layer_element.find('xfl:frames', namespaces=ns).remove(frame.frame_element)
                self.frames.remove(frame)
                self.frames[i-1].duration = str(int(self.frames[i-1].duration) + int(frame.duration))
                return True
        return False
    
    def insert_Blank_Keyframe(self, index):
        new_frame = ET.Element('DOMFrame')
        new_frame.tail = '\n\t\t\t'
        new_frame.attrib['index'] = str(index)
    
        # Find the correct position to insert the new frame based on the index
        for i, frame in enumerate(self.frames):
            if int(frame.startFrame) > index:
                new_frame.attrib['duration'] = str(int(self.frames[i-1].startFrame) - index + int(self.frames[i-1].duration))
                self.frames[i-1].duration = str(index - int(self.frames[i-1].startFrame))
                self.frames.insert(i, Frame(new_frame))
                self.layer_element.find('xfl:frames', namespaces=ns).insert(i, new_frame)
                return True

        # If no frames with a greater index were found, append the new frame to the end
        new_frame.attrib['duration'] = str(int(self.frames[-1].startFrame) - index + int(self.frames[-1].duration))
        self.frames[-1].duration = str(index - int(self.frames[-1].startFrame))
        self.frames.append(Frame(new_frame))
        self.layer_element.find('xfl:frames', namespaces=ns).append(new_frame)
        return True
    
    def insert_Keyframe(self, index):
        # get copy of keyframe before index
        new_frame = copy.deepcopy(self[index])
        if index == int(new_frame.startFrame):
            index += 1
        # return if new index already has a keyframe
        if index == int(self[index].startFrame):
            return False
        new_frame.duration = str(int(self[index].duration) - index + int(self[index].startFrame))
        self[index].duration = str(index - int(self[index].startFrame))
        new_frame.startFrame = str(index)
        # get keyframe index
        for i, frame in enumerate(self.frames):
            if int(frame.startFrame) > index:
                self.frames.insert(i, new_frame)
                self.layer_element.find('xfl:frames', namespaces=ns).insert(i, new_frame.frame_element)
                return True
        self.frames.append(new_frame)
        self.layer_element.find('xfl:frames', namespaces=ns).append(new_frame.frame_element)
        return True



# frames[1] will get second keyframe, layers[14] will get the 14th frame in the layer
class Frame:
    def __init__(self, frame_element):
        self.frame_element = frame_element
        self.attrib = frame_element.attrib
        self.elements = [Element(element) for element in frame_element.findall('xfl:elements/*', ns)]
        for i, element in enumerate(self.elements):
            if element.type == 'DOMSymbolInstance':
                self.elements[i] = SymbolInstance(element.element_element)
    @property
    def duration(self):
        return self.attrib['duration']
    @duration.setter
    def duration(self, value):
        self.attrib['duration'] = str(value)
    @property
    def startFrame(self):
        return self.attrib['index']
    @startFrame.setter
    def startFrame(self, value):
        self.attrib['index'] = str(value)
    @property
    def labelType(self, value):
        return self.attrib['labelType'] if 'labelType' in self.frame_element.attrib else None
    @labelType.setter
    def labelType(self, value):
        self.attrib['labelType'] = str(value)
    @property
    def name(self):
        return self.attrib['name'] if 'name' in self.frame_element.attrib else None
    @name.setter
    def name(self, value):
        self.attrib['name'] = str(value)
        if "labelType" not in self.attrib:
            self.attrib['labelType'] = "name"
    @property
    def is_empty(self):
        return len(self.elements) == 0
    

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
        self.attrib['width'] = str(value)
    @property
    def height(self):
        return self.attrib['height']
    @height.setter
    def height(self, value):
        self.attrib['height'] = str(value)


class SymbolInstance(Element):
    def __init__(self, symbolInstance_element):
        self.symbolInstance_element = symbolInstance_element
        self.attrib = symbolInstance_element.attrib
        self.matrix = Matrix(symbolInstance_element.find('xfl:matrix/xfl:Matrix', ns))
        self.transformation_point = Point(symbolInstance_element.find('xfl:transformationPoint/xfl:Point', ns))
    @property
    def libraryItemName(self):
        return self.attrib['libraryItemName']
    @libraryItemName.setter
    def libraryItemName(self, value):
        self.attrib['libraryItemName'] = str(value)
    @property
    def selected(self):
        return self.attrib['selected']
    @selected.setter
    def selected(self, value):
        self.attrib['selected'] = str(value)
    @property
    def symbolType(self):
        return self.attrib['symbolType']
    @symbolType.setter
    def symbolType(self, value):
        self.attrib['symbolType'] = str(value)
    @property
    def firstFrame(self):
        return self.attrib['firstFrame']
    @firstFrame.setter
    def firstFrame(self, value):
        self.attrib['firstFrame'] = str(value)
    @property
    def loop(self):
        return self.attrib['loop']
    @loop.setter
    def loop(self, value):
        self.attrib['loop'] = str(value)


class Matrix():
    def __init__(self, matrix_element):
        self.matrix_element = matrix_element
        self.attrib = matrix_element.attrib
    @property
    def a(self):
        return self.attrib['a']
    @a.setter
    def a(self, value):
        self.attrib['a'] = str(value)
    @property
    def b(self):
        return self.attrib['b']
    @b.setter
    def b(self, value):
        self.attrib['b'] = str(value)
    @property
    def c(self):
        return self.attrib['c']
    @c.setter
    def c(self, value):
        self.attrib['c'] = str(value)
    @property
    def d(self):
        return self.attrib['d']
    @d.setter
    def d(self, value):
        self.attrib['d'] = str(value)
    @property
    def tx(self):
        return self.attrib['tx']
    @tx.setter
    def tx(self, value):
        self.attrib['tx'] = str(value)
    @property
    def ty(self):
        return self.attrib['ty']
    @ty.setter
    def ty(self, value):
        self.attrib['ty'] = str(value)


class Point():
    def __init__(self, point_element):
        self.transformation_point_element = point_element
        self.attrib = point_element.attrib
    @property
    def x(self):
        return self.attrib['x']
    @x.setter
    def x(self, value):
        self.attrib['x'] = str(value)
    @property
    def y(self):
        return self.attrib['y']
    @y.setter
    def y(self, value):
        self.attrib['y'] = str(value)

if __name__ == '__main__':
    xfl = XFL('INSANITY\\test\\DOMDocument.xml')

    print(PyFile.exists('INSANITY\\Innovations.mp3'))
    print(PyFile.get_audio_format_string('INSANITY\\Innovations.mp3'))
    xfl.import_Sound('INSANITY\\Innovations.mp3')
    xfl.write('INSANITY\\test\\DOMDocument.xml')
    xfl.read('INSANITY\\test\\DOMDocument.xml')