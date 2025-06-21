from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uvicorn
from worker import execute_code_with_requirements
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create output directory for generated files
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI(
    title="Code Execution API",
    description="API for executing Python code with automatic requirement installation",
    version="1.0.0"
)

# Mount static files to serve generated videos
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

class CodeExecutionRequest(BaseModel):
    code: str
    timeout: Optional[int] = 30

class CodeExecutionResponse(BaseModel):
    success: bool
    output: str
    error: str
    execution_time: float
    installed_packages: list
    failed_packages: list

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Code Execution API is running", "status": "healthy"}

@app.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest) -> CodeExecutionResponse:
    """
    Execute Python code with automatic requirement installation
    
    Args:
        request: CodeExecutionRequest containing the code and optional timeout
        
    Returns:
        CodeExecutionResponse with execution results
    """
    try:
        logger.info(f"Executing code with timeout: {request.timeout}s")
        logger.debug(f"Code to execute: {request.code[:100]}...")
        
        # Execute the code
        result = execute_code_with_requirements(request.code, request.timeout)
        
        logger.info(f"Execution completed. Success: {result['success']}")
        
        return CodeExecutionResponse(**result)
        
    except Exception as e:
        logger.error(f"Error executing code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/run-manim")
async def run_manim(request: CodeExecutionRequest):
    """
    Specialized endpoint for running Manim animations
    This endpoint is specifically designed for animation generation
    """
    try:
        logger.info("Running Manim animation code")
        
        # Add manim-specific imports and setup if not present
        manim_code = request.code
        if "from manim import *" not in manim_code and "import manim" not in manim_code:
            manim_code = "from manim import *\n" + manim_code
        
        # Execute the code with Manim-specific handling
        result = execute_code_with_requirements(manim_code, request.timeout, is_manim=True)
        
        # For manim, we want to return video file information
        response = {
            "success": result['success'],
            "output": result['output'],
            "error": result['error'],
            "execution_time": result['execution_time'],
            "installed_packages": result['installed_packages'],
            "failed_packages": result['failed_packages'],
            "generated_files": result.get('generated_files', []),
            "video_urls": [f"/output/{filename}" for filename in result.get('generated_files', [])],
            "thumbnailUrl": f"/output/{result.get('generated_files', [None])[0]}" if result.get('generated_files') else None
        }
        
        logger.info(f"Manim execution completed. Success: {result['success']}")
        if result.get('generated_files'):
            logger.info(f"Generated files: {result['generated_files']}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error running Manim code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    try:
        # Test basic functionality
        test_result = execute_code_with_requirements("print('Health check')", 5)
        return {
            "status": "healthy",
            "test_execution": test_result['success'],
            "message": "Code execution service is operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Code execution service is experiencing issues"
        }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 