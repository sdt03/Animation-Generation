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
        self.installed_packages = set()
        self.output_dir = output_dir or os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(self.output_dir, exist_ok=True)
        
    def extract_imports(self, code: str) -> List[str]:
        """Extract all import statements from the code"""
        imports = []
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name.split('.')[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module.split('.')[0])
        except SyntaxError:
            # If AST parsing fails, use regex as fallback
            import_pattern = r'(?:from\s+(\w+)|import\s+(\w+))'
            matches = re.findall(import_pattern, code)
            for match in matches:
                imports.extend([m for m in match if m])
        
        return list(set(imports))
    
    def extract_requirements_from_comments(self, code: str) -> List[str]:
        """Extract requirements from comments like # pip install package"""
        requirements = []
        lines = code.split('\n')
        
        for line in lines:
            line = line.strip()
            # Look for pip install commands in comments
            if line.startswith('#') and 'pip install' in line:
                # Extract package names after pip install
                parts = line.split('pip install', 1)
                if len(parts) > 1:
                    packages = parts[1].strip().split()
                    requirements.extend(packages)
            # Look for requirements in comments like # requirements: package1, package2
            elif line.startswith('#') and 'requirements:' in line:
                parts = line.split('requirements:', 1)
                if len(parts) > 1:
                    packages = [pkg.strip() for pkg in parts[1].split(',')]
                    requirements.extend(packages)
        
        return requirements
    
    def map_import_to_package(self, import_name: str) -> str:
        """Map import names to actual package names"""
        # Common mappings where import name differs from package name
        import_to_package = {
            'cv2': 'opencv-python',
            'PIL': 'Pillow',
            'sklearn': 'scikit-learn',
            'yaml': 'PyYAML',
            'bs4': 'beautifulsoup4',
            'requests': 'requests',
            'numpy': 'numpy',
            'pandas': 'pandas',
            'matplotlib': 'matplotlib',
            'seaborn': 'seaborn',
            'scipy': 'scipy',
            'plotly': 'plotly',
            'dash': 'dash',
            'flask': 'Flask',
            'django': 'Django',
            'fastapi': 'fastapi',
            'uvicorn': 'uvicorn',
            'sqlalchemy': 'SQLAlchemy',
            'psycopg2': 'psycopg2-binary',
            'pymongo': 'pymongo',
            'redis': 'redis',
            'celery': 'celery',
            'jwt': 'PyJWT',
            'dateutil': 'python-dateutil',
            'dotenv': 'python-dotenv',
            'tqdm': 'tqdm',
            'rich': 'rich',
            'click': 'click',
            'typer': 'typer',
            'pydantic': 'pydantic',
            'httpx': 'httpx',
            'aiohttp': 'aiohttp',
            'websockets': 'websockets',
            'streamlit': 'streamlit',
            'gradio': 'gradio',
            'transformers': 'transformers',
            'torch': 'torch',
            'tensorflow': 'tensorflow',
            'keras': 'keras',
            'gym': 'gymnasium',
            'stable_baselines3': 'stable-baselines3',
            'manim': 'manim',
            # Note: Manim has system dependency issues on some systems
            # We'll skip auto-installation and provide helpful error messages
        }
        
        return import_to_package.get(import_name, import_name)
    
    def setup_manim_working_directory(self, temp_dir: str) -> str:
        """Setup proper working directory for Manim with config"""
        # Create media directory structure that Manim expects
        media_dir = os.path.join(temp_dir, "media")
        videos_dir = os.path.join(media_dir, "videos")
        os.makedirs(videos_dir, exist_ok=True)
        
        # Create a simple manim config file
        config_content = f"""
[CLI]
media_dir = {media_dir}
video_dir = {videos_dir}
quality = medium_quality
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
                # Add rendering code
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
        
        for ext in video_extensions:
            files = glob.glob(os.path.join(temp_dir, "**", ext), recursive=True)
            generated_files.extend(files)
        
        return generated_files
    
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
    
    def install_package(self, package: str) -> bool:
        """Install a single package using pip"""
        if package in self.installed_packages:
            return True
            
        try:
            # Skip built-in modules
            builtin_modules = {
                'os', 'sys', 'json', 'time', 'datetime', 'random', 'math', 
                'collections', 'itertools', 'functools', 'operator', 'typing',
                'pathlib', 'urllib', 'http', 'email', 'html', 'xml', 'csv',
                'sqlite3', 'pickle', 'base64', 'hashlib', 'hmac', 'secrets',
                'uuid', 'decimal', 'fractions', 'statistics', 'enum', 'dataclasses',
                'contextlib', 'copy', 'pprint', 'reprlib', 'weakref', 'gc',
                'inspect', 'dis', 'ast', 'importlib', 'pkgutil', 'modulefinder',
                'runpy', 'site', 'sysconfig', 'platform', 'errno', 'io', 'codecs',
                'locale', 'gettext', 'argparse', 'optparse', 'logging', 'getpass',
                'curses', 'shutil', 'glob', 'fnmatch', 'linecache', 'tempfile',
                'gzip', 'bz2', 'lzma', 'zipfile', 'tarfile', 'configparser',
                'netrc', 'xdrlib', 'plistlib', 'calendar', 'zoneinfo', 'threading',
                'multiprocessing', 'concurrent', 'subprocess', 'sched', 'queue',
                'select', 'selectors', 'asyncio', 'socket', 'ssl', 'signal',
                'mmap', 'array', 'struct', 'ctypes', 'unicodedata', 'stringprep',
                'readline', 'rlcompleter', 'cmd', 'shlex', 'tkinter', 'turtle',
                'pydoc', 'doctest', 'unittest', 'test', 'lib2to3', 'venv',
                'ensurepip', 'zipapp', 'trace', 'tabnanny', 'compileall', 'py_compile',
                'pyclbr', 'tokenize', 'keyword', 'symbol', 'token', 'parser'
            }
            
            if package in builtin_modules:
                self.installed_packages.add(package)
                return True
            
            print(f"Installing package: {package}")
            result = subprocess.run(
                [sys.executable, '-m', 'pip', 'install', package],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                self.installed_packages.add(package)
                print(f"Successfully installed: {package}")
                return True
            else:
                print(f"Failed to install {package}: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"Timeout while installing {package}")
            return False
        except Exception as e:
            print(f"Error installing {package}: {str(e)}")
            return False
    
    def install_requirements(self, code: str) -> Tuple[List[str], List[str]]:
        """Install all required packages for the code"""
        # Extract imports and requirements
        imports = self.extract_imports(code)
        comment_requirements = self.extract_requirements_from_comments(code)
        
        all_requirements = imports + comment_requirements
        
        # Map imports to actual package names
        packages_to_install = []
        for req in all_requirements:
            package_name = self.map_import_to_package(req)
            packages_to_install.append(package_name)
        
        # Remove duplicates while preserving order
        packages_to_install = list(dict.fromkeys(packages_to_install))
        
        successful_installs = []
        failed_installs = []
        
        for package in packages_to_install:
            if self.install_package(package):
                successful_installs.append(package)
            else:
                failed_installs.append(package)
        
        return successful_installs, failed_installs
    
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
            'installed_packages': [],
            'failed_packages': [],
            'generated_files': []
        }
        
        # Create temporary directory for execution
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                import time
                start_time = time.time()
                
                # Install requirements
                print("Installing requirements...")
                successful_installs, failed_installs = self.install_requirements(code)
                result['installed_packages'] = successful_installs
                result['failed_packages'] = failed_installs
                
                if failed_installs:
                    result['error'] = f"Failed to install packages: {', '.join(failed_installs)}"
                    return result
                
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
                        generated_files = self.find_generated_files(temp_dir)
                        if generated_files:
                            copied_files = self.copy_generated_files(generated_files, temp_dir)
                            result['generated_files'] = copied_files
                            print(f"Found and copied {len(copied_files)} generated files")
                    
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
    Main function to execute code with automatic requirement installation
    
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
        - installed_packages (list): Successfully installed packages
        - failed_packages (list): Packages that failed to install
        - generated_files (list): List of generated file names (for Manim)
    """
    executor = CodeExecutor()
    return executor.execute_code(code, timeout, is_manim)


# Example usage and testing
if __name__ == "__main__":
    # Test code with various requirements
    test_code = """
# pip install requests beautifulsoup4
import requests
from bs4 import BeautifulSoup
import json

# Simple example
print("Hello, World!")
print("Testing code execution with requirements")

# Test with installed packages
try:
    response = requests.get("https://httpbin.org/json")
    data = response.json()
    print(f"API Response: {data}")
except Exception as e:
    print(f"Error with requests: {e}")

# Test with math operations
import math
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
    print(f"Installed packages: {result['installed_packages']}")
    print(f"Failed packages: {result['failed_packages']}")
    print(f"Output:\n{result['output']}")
    if result['error']:
        print(f"Errors:\n{result['error']}")
