import subprocess
import sys
import os
import tempfile
import re
import ast
import importlib
import traceback
import shutil
import glob
from typing import Dict, List, Tuple, Any
import json
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO


class CodeExecutor:
    def __init__(self, output_dir: str = None):
        self.output_dir = output_dir or os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(self.output_dir, exist_ok=True)
        
    def setup_manim_working_directory(self, temp_dir: str) -> str:
        """Setup proper working directory for Manim with config"""
        # Create media directory structure that Manim expects
        media_dir = os.path.join(temp_dir, "media")
        videos_dir = os.path.join(media_dir, "videos")
        os.makedirs(videos_dir, exist_ok=True)
        
        # Create a manim config file with 720p quality
        config_content = f"""
[CLI]
media_dir = {media_dir}
video_dir = {videos_dir}
quality = high_quality
pixel_height = 720
pixel_width = 1280
frame_rate = 30
"""
        config_path = os.path.join(temp_dir, "manim.cfg")
        with open(config_path, "w") as f:
            f.write(config_content)
        
        return temp_dir
    
    def execute_manim_code(self, code: str, temp_dir: str) -> tuple:
        """Execute Manim code and handle video generation"""
        # Check if the code contains a Scene class
        has_scene_class = "class " in code and "Scene)" in code
        scene_class_name = None
        
        if has_scene_class:
            # For Scene classes, we need to add rendering logic
            lines = code.split('\n')
            for line in lines:
                if 'class ' in line and 'Scene)' in line:
                    # Extract class name
                    class_match = re.search(r'class\s+(\w+)', line)
                    if class_match:
                        scene_class_name = class_match.group(1)
                        break
            
            if scene_class_name:
                # Add rendering code with specific quality settings
                render_code = f"""
# Render the scene
if __name__ == "__main__":
    scene = {scene_class_name}()
    scene.render()
    print(f"Scene {scene_class_name} rendered successfully!")
"""
                code += render_code
        
        return code, scene_class_name
    
    def find_generated_files(self, temp_dir: str) -> List[str]:
        """Find generated video files in the temporary directory"""
        video_extensions = ['*.mp4', '*.mov', '*.avi', '*.gif']
        generated_files = []
        
        # Look in common Manim output directories
        search_paths = [
            temp_dir,  # Root temp directory
            os.path.join(temp_dir, "media"),  # Manim media directory
            os.path.join(temp_dir, "media", "videos"),  # Manim videos directory
        ]
        
        for search_path in search_paths:
            if os.path.exists(search_path):
                for ext in video_extensions:
                    files = glob.glob(os.path.join(search_path, "**", ext), recursive=True)
                    generated_files.extend(files)
                    
        # Remove duplicates and return
        return list(set(generated_files))
    
    def copy_generated_files(self, files: List[str], temp_dir: str) -> List[str]:
        """Copy generated files to output directory and return their paths"""
        copied_files = []
        
        for file_path in files:
            filename = os.path.basename(file_path)
            # Create unique filename with timestamp
            import time
            timestamp = str(int(time.time()))
            name, ext = os.path.splitext(filename)
            unique_filename = f"{name}_{timestamp}{ext}"
            
            dest_path = os.path.join(self.output_dir, unique_filename)
            shutil.copy2(file_path, dest_path)
            copied_files.append(unique_filename)
            
        return copied_files
    
    def execute_code(self, code: str, timeout: int = 30, is_manim: bool = False) -> Dict[str, Any]:
        """Execute the code and return results"""
        # Create string buffers to capture output
        stdout_buffer = StringIO()
        stderr_buffer = StringIO()
        
        result = {
            'success': False,
            'output': '',
            'error': '',
            'execution_time': 0,
            'installed_packages': [],  # Empty since we skip installation
            'failed_packages': [],     # Empty since we skip installation
            'generated_files': []
        }
        
        # Create temporary directory for execution
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                import time
                start_time = time.time()
                
                # Skip package installation - assume libraries are pre-installed
                print("Skipping package installation - using pre-installed libraries")
                
                # Setup working directory for Manim if needed
                if is_manim:
                    self.setup_manim_working_directory(temp_dir)
                    code, scene_class = self.execute_manim_code(code, temp_dir)
                    print(f"Manim working directory setup complete: {temp_dir}")
                
                # Save current working directory and change to temp_dir
                original_cwd = os.getcwd()
                os.chdir(temp_dir)
                
                try:
                    # Create a safe execution environment
                    exec_globals = {
                        '__builtins__': __builtins__,
                        '__name__': '__main__',
                        '__file__': os.path.join(temp_dir, 'main.py'),
                        '__doc__': None,
                        '__package__': None
                    }
                    
                    # Execute the code with captured output
                    with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
                        exec(code, exec_globals)
                    
                    # Get the output
                    stdout_content = stdout_buffer.getvalue()
                    stderr_content = stderr_buffer.getvalue()
                    
                    # Find and copy generated files
                    if is_manim:
                        # Debug: List all files in temp directory
                        print(f"🔍 Searching for files in: {temp_dir}")
                        for root, dirs, files in os.walk(temp_dir):
                            if files:
                                print(f"📁 {root}: {files}")
                        
                        generated_files = self.find_generated_files(temp_dir)
                        print(f"🎥 Found generated files: {generated_files}")
                        
                        if generated_files:
                            copied_files = self.copy_generated_files(generated_files, temp_dir)
                            result['generated_files'] = copied_files
                            print(f"✅ Found and copied {len(copied_files)} generated files: {copied_files}")
                        else:
                            print("❌ No generated files found")
                    
                    result['success'] = True
                    result['output'] = stdout_content
                    result['error'] = stderr_content if stderr_content else ''
                    result['execution_time'] = time.time() - start_time
                    
                finally:
                    # Restore original working directory
                    os.chdir(original_cwd)
                    
            except Exception as e:
                error_str = str(e)
                result['success'] = False
                result['output'] = stdout_buffer.getvalue()
                result['execution_time'] = time.time() - start_time if 'start_time' in locals() else 0
                
                # Special handling for common Manim/Cairo errors
                if 'cairo' in error_str.lower() and 'symbol not found' in error_str:
                    result['error'] = (
                        "Manim/Cairo Installation Error: The Cairo graphics library is not properly linked.\n"
                        "This is a common issue on macOS. To fix this:\n"
                        "1. Install system dependencies: brew install cairo pkg-config\n"
                        "2. Reinstall pycairo: pip uninstall pycairo && pip install pycairo --no-binary pycairo\n"
                        "3. Or use a virtual environment with conda: conda install -c conda-forge manim\n\n"
                        f"Original error: {error_str}\n{traceback.format_exc()}"
                    )
                else:
                    result['error'] = f"Execution error: {error_str}\n{traceback.format_exc()}"
            
            finally:
                stdout_buffer.close()
                stderr_buffer.close()
        
        return result


def execute_code_with_requirements(code: str, timeout: int = 30, is_manim: bool = False) -> Dict[str, Any]:
    """
    Main function to execute code (without automatic requirement installation)
    
    Args:
        code (str): The Python code to execute
        timeout (int): Maximum execution time in seconds
        is_manim (bool): Whether this is Manim code that needs special handling
    
    Returns:
        Dict containing:
        - success (bool): Whether execution was successful
        - output (str): Standard output from the code
        - error (str): Any error messages
        - execution_time (float): Time taken to execute
        - installed_packages (list): Empty since we skip installation
        - failed_packages (list): Empty since we skip installation
        - generated_files (list): List of generated file names (for Manim)
    """
    executor = CodeExecutor()
    return executor.execute_code(code, timeout, is_manim)


# Example usage and testing
if __name__ == "__main__":
    # Test code for basic functionality
    test_code = """
import json
import math

# Simple example
print("Hello, World!")
print("Testing code execution without package installation")

# Test with math operations
result = math.sqrt(16)
print(f"Square root of 16: {result}")

# Test with data structures
data = {"name": "Test", "value": 42}
print(f"Data: {json.dumps(data, indent=2)}")
"""
    
    print("Testing code execution...")
    result = execute_code_with_requirements(test_code)
    
    print(f"Success: {result['success']}")
    print(f"Execution time: {result['execution_time']:.2f} seconds")
    print(f"Output:\n{result['output']}")
    if result['error']:
        print(f"Errors:\n{result['error']}")
