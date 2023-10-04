import re

def process_number(match):
    number = float(match.group()) / 20  # Divide by 20
    rounded_number = round(number, 4)  # Round to four decimal places
    
    # Check if rounded_number is a float with a .0 decimal component
    if rounded_number.is_integer():
        return str(int(rounded_number))  # Convert to int and then to str
    else:
        return str(rounded_number)

def format_svg(input_str):
    # Replace '!' with 'M'
    svg_str = input_str.replace('!', 'M')
    
    # Replace '[' with ' Q' and split the string into parts
    parts = re.split(r'\[', svg_str)
    
    # Process each part
    for i in range(1, len(parts)):
        part = parts[i]
        
        # Replace '#' with an empty space and split by whitespace
        values = part.split()
        
        # Convert hexadecimal values to decimals and round to thousands place
        for j in range(len(values)):
            if values[j].startswith('#'):
                values[j] = values[j][1:]
                decimal_value = float.fromhex(values[j])
                values[j] = str(decimal_value)
        
        # Join the values back together with spaces
        parts[i] = ' '.join(values)
    
    # Join the parts back together with ' Q' and round all numbers to thousands place
    svg_result = ' Q'.join(parts)
    
    # Round all numbers in the SVG string to thousands place
    svg_result = re.sub(r'\d+(\.\d+)?', process_number, svg_result)
    
    return svg_result

# Example usage
input_str = "!0 0[#4DD3.FF #1A0.7E 25600 14400"
formatted_svg = format_svg(input_str)
print(formatted_svg)