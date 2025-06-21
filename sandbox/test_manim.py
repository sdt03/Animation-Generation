#!/usr/bin/env python3
"""
Test script specifically for Manim functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.worker import execute_code_with_requirements

def test_manim_execution():
    """Test Manim code execution with video generation"""
    print("=== Testing Manim Execution ===")
    
    manim_code = """
from manim import *

class SimpleCircle(Scene):
    def construct(self):
        # Create a circle
        circle = Circle()
        circle.set_fill(PINK, opacity=0.5)
        
        # Create text
        text = Text("Hello Manim!")
        text.next_to(circle, DOWN)
        
        # Add animations
        self.play(Create(circle))
        self.play(Write(text))
        self.wait(1)
        
        print("Manim scene constructed successfully!")
"""
    
    print("Executing Manim code...")
    result = execute_code_with_requirements(manim_code, timeout=120, is_manim=True)
    
    print(f"Success: {result['success']}")
    print(f"Installed packages: {result['installed_packages']}")
    print(f"Failed packages: {result['failed_packages']}")
    print(f"Generated files: {result.get('generated_files', [])}")
    print(f"Output:\n{result['output']}")
    if result['error']:
        print(f"Errors: {result['error']}")
    print(f"Execution time: {result['execution_time']:.2f}s")
    print()

if __name__ == "__main__":
    print("Manim Test Suite")
    print("=" * 50)
    test_manim_execution() 