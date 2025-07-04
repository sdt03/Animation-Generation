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
        images_dir = os.path.join(media_dir, "images")
        temp_dir_media = os.path.join(media_dir, "temp")
        
        # Create all necessary directories
        for directory in [videos_dir, images_dir, temp_dir_media]:
            os.makedirs(directory, exist_ok=True)
            print(f"📁 Created directory: {directory}")
        
        # Create a manim config file with comprehensive settings
        config_content = f"""
[CLI]
media_dir = {media_dir}
video_dir = {videos_dir}
images_dir = {images_dir}
temp_dir = {temp_dir_media}
quality = medium_quality
format = mp4
save_last_frame = false
write_to_movie = true
pixel_height = 720
pixel_width = 1280
frame_rate = 30
background_color = BLACK
preview = false
disable_caching = true
save_sections = false
write_all = false
"""
        config_path = os.path.join(temp_dir, "manim.cfg")
        with open(config_path, "w") as f:
            f.write(config_content)
        print(f"✅ Created Manim config at: {config_path}")
        
        return temp_dir
    
    def execute_manim_code(self, code: str, temp_dir: str) -> tuple:
        """Execute Manim code and handle video generation"""
        scene_class_name = None
        
        try:
            # Parse the code into an AST
            tree = ast.parse(code)
            
            # Look for Scene subclasses
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    for base in node.bases:
                        if isinstance(base, ast.Name) and base.id == 'Scene':
                            scene_class_name = node.name
                            break
            
            if scene_class_name:
                # Check if the construct method has sufficient content for video
                # If not, we'll add a minimum wait time
                render_code = f"""
# Render the scene
if __name__ == "__main__":
    from manim import config
    import os
    
    # Force video generation settings
    config.media_dir = r"{os.path.join(temp_dir, 'media')}"
    config.video_dir = r"{os.path.join(temp_dir, 'media', 'videos')}"
    config.quality = "medium_quality"
    config.format = "mp4"
    config.save_last_frame = False  # Don't save PNG frames
    config.write_to_movie = True    # Force video generation
    config.disable_caching = True   # Disable caching to ensure fresh render
    config.preview = False          # Don't open preview
    
    # Create the scene
    scene = {scene_class_name}()
    
    # Override construct to ensure minimum video duration
    original_construct = scene.construct
    def construct_with_video(self):
        original_construct()
        # Ensure minimum duration for video generation
        if self.renderer.time < 1.0:  # If less than 1 second
            print("Adding extra wait time to ensure video generation...")
            self.wait(1)  # Add 1 second minimum
    
    # Replace the construct method
    scene.construct = lambda: construct_with_video(scene)
    
    scene.render()
    print(f"Scene {scene_class_name} rendered successfully!")
    print(f"Video output directory: {{config.get_dir('video_dir')}}")
    
    # List all files in video directory
    video_dir = config.get_dir('video_dir')
    if os.path.exists(video_dir):
        print(f"Files in video directory: {{os.listdir(video_dir)}}")
        for root, dirs, files in os.walk(video_dir):
            for file in files:
                if file.endswith(('.mp4', '.mov', '.avi')):
                    print(f"Generated video file: {{os.path.join(root, file)}}")
"""
                code += render_code
                
            return code, scene_class_name
            
        except SyntaxError as e:
            print(f"Error parsing code: {e}")
            return code, None
    
    def find_generated_files(self, temp_dir: str) -> List[str]:
        """Find generated video files in the temporary directory"""
        video_extensions = ['*.mp4', '*.mov', '*.avi', '*.gif']  # Removed PNG - only videos
        generated_files = []
        
        # Look in common Manim output directories
        search_paths = [
            temp_dir,  # Root temp directory
            os.path.join(temp_dir, "media"),  # Manim media directory
            os.path.join(temp_dir, "media", "videos"),  # Manim videos directory
            os.path.join(temp_dir, "media", "videos", "1080p60"),  # High quality
            os.path.join(temp_dir, "media", "videos", "720p30"),   # Medium quality
            os.path.join(temp_dir, "media", "images"),  # Images directory
            os.path.join(temp_dir, "media", "temp")     # Temporary files
        ]
        
        for search_path in search_paths:
            if os.path.exists(search_path):
                print(f"🔍 Searching in: {search_path}")
                for ext in video_extensions:
                    pattern = os.path.join(search_path, "**", ext)
                    files = glob.glob(pattern, recursive=True)
                    if files:
                        print(f"📁 Found {len(files)} files with extension {ext} in {search_path}")
                        print(f"   Files: {files}")
                    generated_files.extend(files)
                    
        # Remove duplicates and return
        unique_files = list(set(generated_files))
        print(f"🎥 Total unique files found: {len(unique_files)}")
        return unique_files
    
    def select_main_video_file(self, files: List[str]) -> str:
        """Select the main video file from a list of generated files"""
        if not files:
            return None
            
        # Filter only video files
        video_files = [f for f in files if f.lower().endswith(('.mp4', '.mov', '.avi'))]
        
        if not video_files:
            return None
            
        if len(video_files) == 1:
            return video_files[0]
            
        # If multiple videos, prefer based on priority:
        # 1. Files containing the scene name
        # 2. Larger files (usually higher quality)
        # 3. MP4 format over others
        
        # Sort by file size (descending) and prefer mp4
        def video_priority(filepath):
            filename = os.path.basename(filepath).lower()
            size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
            
            priority = 0
            if filename.endswith('.mp4'):
                priority += 1000
            if size > 0:
                priority += size
                
            return priority
        
        sorted_videos = sorted(video_files, key=video_priority, reverse=True)
        print(f"🎯 Selected main video: {sorted_videos[0]} from {len(video_files)} videos")
        return sorted_videos[0]
    
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
                        print(f"🎬 Executing Manim code in directory: {temp_dir}")
                        print(f"📂 Working directory files before execution: {os.listdir(temp_dir)}")
                        exec(code, exec_globals)
                        print(f"📂 Working directory files after execution: {os.listdir(temp_dir)}")
                        if os.path.exists(os.path.join(temp_dir, 'media')):
                            print(f"📂 Media directory contents: {os.listdir(os.path.join(temp_dir, 'media'))}")
                            videos_path = os.path.join(temp_dir, 'media', 'videos')
                            if os.path.exists(videos_path):
                                print(f"📂 Videos directory contents: {os.listdir(videos_path)}")
                                for item in os.listdir(videos_path):
                                    subdir_path = os.path.join(videos_path, item)
                                    if os.path.isdir(subdir_path):
                                        print(f"📂 {item} subdirectory contents: {os.listdir(subdir_path)}")
                    
                    # Get the output
                    stdout_content = stdout_buffer.getvalue()
                    stderr_content = stderr_buffer.getvalue()
                    
                    print(f"📤 Stdout: {stdout_content}")
                    if stderr_content:
                        print(f"⚠️  Stderr: {stderr_content}")
                    
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
                            # Select only the main video file
                            main_video = self.select_main_video_file(generated_files)
                            if main_video:
                                copied_files = self.copy_generated_files([main_video], temp_dir)
                                result['generated_files'] = copied_files
                                print(f"✅ Found and copied main video file: {copied_files}")
                            else:
                                print("❌ No suitable video file found")
                                result['generated_files'] = []
                        else:
                            print("❌ No generated files found")
                            result['generated_files'] = []
                    
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
