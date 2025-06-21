# Code Execution Sandbox

A comprehensive Python code execution environment that automatically handles dependency installation and provides safe code execution with detailed feedback.

## Features

- **Automatic Dependency Installation**: Automatically detects and installs required packages
- **Smart Import Mapping**: Maps import names to correct package names (e.g., `cv2` → `opencv-python`)
- **Safe Execution Environment**: Isolated execution with timeout protection
- **Comprehensive Error Handling**: Detailed error messages with helpful suggestions
- **FastAPI Web Interface**: RESTful API for remote code execution
- **Support for Multiple Libraries**: Works with data science, web development, and animation libraries

## Quick Start

### 1. Direct Function Usage

```python
from app.worker import execute_code_with_requirements

# Execute simple code
result = execute_code_with_requirements("""
print("Hello, World!")
import math
print(f"Pi = {math.pi}")
""")

print(f"Success: {result['success']}")
print(f"Output: {result['output']}")
```

### 2. With Automatic Package Installation

```python
# The function will automatically install requests
code = """
# pip install requests
import requests
import json

response = requests.get("https://httpbin.org/json")
data = response.json()
print(f"Status: {response.status_code}")
print(f"Data: {json.dumps(data, indent=2)}")
"""

result = execute_code_with_requirements(code)
print(f"Installed packages: {result['installed_packages']}")
```

### 3. FastAPI Web Server

Start the server:
```bash
cd sandbox
python3 app/main.py
```

Test via HTTP:
```bash
curl -X POST "http://localhost:8000/execute" \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello from API!\")", "timeout": 30}'
```

## API Endpoints

### POST `/execute`
Execute Python code with automatic dependency installation.

**Request Body:**
```json
{
  "code": "print('Hello, World!')",
  "timeout": 30
}
```

**Response:**
```json
{
  "success": true,
  "output": "Hello, World!\n",
  "error": "",
  "execution_time": 0.002,
  "installed_packages": [],
  "failed_packages": []
}
```

### POST `/run-manim`
Specialized endpoint for Manim animation code.

**Request Body:**
```json
{
  "code": "circle = Circle()\ntext = Text('Hello!')",
  "timeout": 60
}
```

### GET `/health`
Health check endpoint that tests basic functionality.

## Supported Package Mappings

The system automatically maps import names to correct package names:

| Import Name | Package Name |
|-------------|--------------|
| `cv2` | `opencv-python` |
| `PIL` | `Pillow` |
| `sklearn` | `scikit-learn` |
| `bs4` | `beautifulsoup4` |
| `yaml` | `PyYAML` |
| `jwt` | `PyJWT` |
| `dotenv` | `python-dotenv` |

## Installation Requirements

### System Dependencies (macOS)
```bash
brew install pkg-config cairo
```

### Python Dependencies
```bash
pip install -r requirements.txt
```

## Usage Examples

### Data Science Code
```python
code = """
# pip install pandas numpy matplotlib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Create sample data
data = pd.DataFrame({
    'x': np.random.randn(100),
    'y': np.random.randn(100)
})

print("Data shape:", data.shape)
print("Correlation:", data.corr().iloc[0, 1])
"""

result = execute_code_with_requirements(code)
```

### Web Scraping Code
```python
code = """
# pip install requests beautifulsoup4
import requests
from bs4 import BeautifulSoup

response = requests.get("https://httpbin.org/html")
soup = BeautifulSoup(response.text, 'html.parser')
title = soup.find('title').text
print(f"Page title: {title}")
"""

result = execute_code_with_requirements(code)
```

### Machine Learning Code
```python
code = """
# pip install scikit-learn
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Load data
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# Train model
clf = RandomForestClassifier(random_state=42)
clf.fit(X_train, y_train)

# Evaluate
accuracy = clf.score(X_test, y_test)
print(f"Accuracy: {accuracy:.2f}")
"""

result = execute_code_with_requirements(code)
```

## Error Handling

The system provides detailed error messages for common issues:

### Manim/Cairo Issues
If you encounter Cairo library issues with Manim:
```
Manim/Cairo Installation Error: The Cairo graphics library is not properly linked.
This is a common issue on macOS. To fix this:
1. Install system dependencies: brew install cairo pkg-config
2. Reinstall pycairo: pip uninstall pycairo && pip install pycairo --no-binary pycairo
3. Or use a virtual environment with conda: conda install -c conda-forge manim
```

### Package Installation Failures
```json
{
  "success": false,
  "error": "Failed to install packages: some-invalid-package",
  "failed_packages": ["some-invalid-package"]
}
```

## Security Considerations

- Code execution is sandboxed but not completely isolated
- Timeout protection prevents infinite loops
- No file system restrictions (use with caution)
- Suitable for trusted code execution environments

## Testing

Run the test suite:
```bash
python3 test_execution.py
```

This will test:
- Basic code execution
- Automatic package installation
- Data science libraries
- Error handling
- Manim integration (with known Cairo issues)

## Integration with Your Application

To integrate with your existing Next.js application, the `generateVideo` function in `app/api/send-message/route.ts` now points to:
```typescript
const video = await axios.post("http://localhost:8000/run-manim", {
    code: code,
    conversationId: conversationId
});
```

Make sure the sandbox server is running on port 8000 for your application to work properly.

## Troubleshooting

### Common Issues

1. **Port 8000 already in use**
   ```bash
   lsof -ti:8000 | xargs kill -9
   ```

2. **Python package conflicts**
   ```bash
   python3 -m pip install --upgrade pip
   python3 -m pip install --force-reinstall -r requirements.txt
   ```

3. **System dependencies missing**
   ```bash
   brew install pkg-config cairo pango
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

This project is part of the animation-generation application. 