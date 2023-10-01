import xml.etree.ElementTree as ET
ET.register_namespace("", "http://ns.adobe.com/xfl/2008/")

if __name__ == '__main__':
    # Parse the XFL file into an ElementTree instance
    xfl_tree = ET.parse('INSANITY\\test\\DOMDocument.xml')

    # Get the root element
    xfl_root = xfl_tree.getroot()

    # Define the namespace
    ns = {'xfl': 'http://ns.adobe.com/xfl/2008/'}

    # Get the first timeline, layer, and frame elements using their namespaced names
    timeline_element = xfl_root.findall('xfl:timelines/xfl:DOMTimeline', ns)[0]
    print(timeline_element.attrib['name'])
    layer_element = timeline_element.findall('xfl:layers/xfl:DOMLayer', ns)[0]
    frame_element = layer_element.findall('xfl:frames/xfl:DOMFrame', ns)[0]

    # Get the text from the first text run in the first element of the frame
    text_runs_element = frame_element.findall('xfl:elements/xfl:DOMDynamicText/xfl:textRuns', ns)[0]
    text_run_element = text_runs_element.findall('xfl:DOMTextRun', ns)[0]
    characters_element = text_run_element.findall('xfl:characters', ns)[0]

    # Modify the text
    characters_element.text = 'Hello world'

    # Write the modified XFL file to disk
    # xfl_tree.write('INSANITY\\test\\DOMDocument.xml')
    # Print the new text
    print(characters_element.text)