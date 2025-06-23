#!/usr/bin/env python3
"""
Test script for the code execution functionality
This demonstrates how to use the execute_code_with_requirements function
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.worker import execute_code_with_requirements

def test_basic_execution():
    """Test basic Python code execution"""
    print("=== Testing Basic Execution ===")
    
    code = """
print("Hello from executed code!")
import math
result = math.pi * 2
print(f"2π = {result}")

# Test data structures
data = [1, 2, 3, 4, 5]
squared = [x**2 for x in data]
print(f"Squared numbers: {squared}")
"""
    
    result = execute_code_with_requirements(code)
    print(f"Success: {result['success']}")
    print(f"Output:\n{result['output']}")
    if result['error']:
        print(f"Errors: {result['error']}")
    print(f"Execution time: {result['execution_time']:.2f}s")
    print()

def test_package_installation():
    """Test automatic package installation"""
    print("=== Testing Package Installation ===")
    
    code = """
# pip install requests
import requests
import json

try:
    response = requests.get("https://httpbin.org/json", timeout=10)
    data = response.json()
    print("Successfully made HTTP request!")
    print(f"Response status: {response.status_code}")
    print(f"Sample data: {json.dumps(data, indent=2)}")
except Exception as e:
    print(f"Error making request: {e}")
"""
    
    result = execute_code_with_requirements(code)
    print(f"Success: {result['success']}")
    print(f"Installed packages: {result['installed_packages']}")
    print(f"Failed packages: {result['failed_packages']}")
    print(f"Output:\n{result['output']}")
    if result['error']:
        print(f"Errors: {result['error']}")
    print(f"Execution time: {result['execution_time']:.2f}s")
    print()

def test_data_science_code():
    """Test data science related code"""
    print("=== Testing Data Science Code ===")
    
    code = """
# pip install numpy pandas matplotlib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64

# Create sample data
np.random.seed(42)
data = {
    'x': np.random.randn(100),
    'y': np.random.randn(100) * 2 + 1
}

df = pd.DataFrame(data)

# Basic statistics
print("Data Statistics:")
print(df.describe())

# Calculate correlation
correlation = df['x'].corr(df['y'])
print(f"\\nCorrelation between x and y: {correlation:.3f}")

# Create a simple plot (saved to buffer)
plt.figure(figsize=(8, 6))
plt.scatter(df['x'], df['y'], alpha=0.6)
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Scatter Plot of Random Data')
plt.grid(True, alpha=0.3)

# Save plot to buffer instead of displaying
buffer = io.BytesIO()
plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
buffer.seek(0)
plt.close()

print(f"\\nPlot created successfully! Buffer size: {len(buffer.getvalue())} bytes")
"""
    
    result = execute_code_with_requirements(code)
    print(f"Success: {result['success']}")
    print(f"Installed packages: {result['installed_packages']}")
    print(f"Failed packages: {result['failed_packages']}")
    print(f"Output:\n{result['output']}")
    if result['error']:
        print(f"Errors: {result['error']}")
    print(f"Execution time: {result['execution_time']:.2f}s")
    print()

def test_error_handling():
    """Test error handling"""
    print("=== Testing Error Handling ===")
    
    code = """
print("This will work fine")

# This will cause an error
result = undefined_variable + 5

print("This won't be reached")
"""
    
    result = execute_code_with_requirements(code)
    print(f"Success: {result['success']}")
    print(f"Output:\n{result['output']}")
    print(f"Errors:\n{result['error']}")
    print(f"Execution time: {result['execution_time']:.2f}s")
    print()

def test_manim_code():
    """Test Manim animation code"""
    print("=== Testing Manim Code ===")
    
    code = """
# This is a basic Manim scene
from manim import *

class SimpleScene(Scene):
    def construct(self):
        # Create a circle
        circle = Circle()
        circle.set_fill(PINK, opacity=0.5)
        
        # Create text
        text = Text("Hello Manim!")
        
        # Add objects to scene
        self.add(circle, text)
        
        print("Manim scene created successfully!")
        print("Circle and text objects added to scene")

# Note: This won't actually render a video without proper Manim setup
# but it will test the import and basic object creation
scene = SimpleScene()
print("Scene instance created")
"""
    
    result = execute_code_with_requirements(code, timeout=60)  # Longer timeout for Manim
    print(f"Success: {result['success']}")
    print(f"Installed packages: {result['installed_packages']}")
    print(f"Failed packages: {result['failed_packages']}")
    print(f"Output:\n{result['output']}")
    if result['error']:
        print(f"Errors: {result['error']}")
    print(f"Execution time: {result['execution_time']:.2f}s")
    print()

if __name__ == "__main__":
    print("Code Execution Test Suite")
    print("=" * 50)
    
    # Run all tests
    test_basic_execution()
    test_package_installation()
    test_data_science_code()
    test_error_handling()
    test_manim_code()
    
    print("All tests completed!") 