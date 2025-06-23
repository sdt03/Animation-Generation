from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uvicorn
from worker import execute_code_with_requirements
import logging
import os
import json

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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
    logger.info("Health check endpoint accessed")
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
        logger.info("=" * 80)
        logger.info("EXECUTE ENDPOINT CALLED")
        logger.info(f"Timeout: {request.timeout}s")
        logger.info("Code received:")
        logger.info("-" * 40)
        logger.info(request.code)
        logger.info("-" * 40)
        
        # Pretty print the code for better readability
        print("\n🔥 CODE EXECUTION REQUEST:")
        print(f"📝 Code Length: {len(request.code)} characters")
        print(f"⏱️  Timeout: {request.timeout}s")
        print("\n📋 CODE TO EXECUTE:")
        print("=" * 60)
        print(request.code)
        print("=" * 60)
        
        # Execute the code
        logger.info("Starting code execution...")
        result = execute_code_with_requirements(request.code, request.timeout)
        
        logger.info("Code execution completed")
        logger.info(f"✅ Success: {result['success']}")
        logger.info(f"⏱️  Execution time: {result['execution_time']:.2f}s")
        logger.info(f"📦 Installed packages: {result['installed_packages']}")
        logger.info(f"❌ Failed packages: {result['failed_packages']}")
        
        print(f"\n🎯 EXECUTION RESULT:")
        print(f"✅ Success: {result['success']}")
        print(f"⏱️  Time: {result['execution_time']:.2f}s")
        print(f"📤 Output: {result['output'][:200]}..." if len(result['output']) > 200 else f"📤 Output: {result['output']}")
        if result['error']:
            print(f"❌ Error: {result['error'][:200]}..." if len(result['error']) > 200 else f"❌ Error: {result['error']}")
        
        return CodeExecutionResponse(**result)
        
    except Exception as e:
        error_msg = f"Internal server error: {str(e)}"
        logger.error(f"❌ EXECUTION ERROR: {error_msg}")
        print(f"\n💥 FATAL ERROR: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/run-manim")
async def run_manim(request: CodeExecutionRequest):
    """
    Specialized endpoint for running Manim animations
    This endpoint is specifically designed for animation generation
    """
    try:
        logger.info("=" * 80)
        logger.info("MANIM ENDPOINT CALLED")
        logger.info(f"Timeout: {request.timeout}s")
        logger.info("Manim code received:")
        logger.info("-" * 40)
        logger.info(request.code)
        logger.info("-" * 40)
        
        print("\n🎬 MANIM ANIMATION REQUEST:")
        print(f"📝 Code Length: {len(request.code)} characters")
        print(f"⏱️  Timeout: {request.timeout}s")
        print("\n📋 MANIM CODE TO EXECUTE:")
        print("=" * 60)
        print(request.code)
        print("=" * 60)
        
        # Add manim-specific imports and setup if not present
        manim_code = request.code
        if "from manim import *" not in manim_code and "import manim" not in manim_code:
            manim_code = "from manim import *\n" + manim_code
            logger.info("Added 'from manim import *' to code")
            print("📦 Added 'from manim import *' to code")
        
        # Execute the code with Manim-specific handling
        logger.info("Starting Manim code execution...")
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
        
        logger.info("Manim execution completed")
        logger.info(f"✅ Success: {result['success']}")
        logger.info(f"⏱️  Execution time: {result['execution_time']:.2f}s")
        logger.info(f"🎥 Generated files: {result.get('generated_files', [])}")
        
        print(f"\n🎯 MANIM EXECUTION RESULT:")
        print(f"✅ Success: {result['success']}")
        print(f"⏱️  Time: {result['execution_time']:.2f}s")
        print(f"🎥 Generated files: {result.get('generated_files', [])}")
        print(f"📤 Output: {result['output'][:200]}..." if len(result['output']) > 200 else f"📤 Output: {result['output']}")
        if result['error']:
            print(f"❌ Error: {result['error'][:200]}..." if len(result['error']) > 200 else f"❌ Error: {result['error']}")
        
        return response
        
    except Exception as e:
        error_msg = f"Internal server error: {str(e)}"
        logger.error(f"❌ MANIM EXECUTION ERROR: {error_msg}")
        print(f"\n💥 MANIM FATAL ERROR: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    try:
        logger.info("Health check endpoint called")
        print("\n🏥 HEALTH CHECK CALLED")
        
        # Test basic functionality
        test_result = execute_code_with_requirements("print('Health check')", 5)
        
        health_status = {
            "status": "healthy",
            "test_execution": test_result['success'],
            "message": "Code execution service is operational"
        }
        
        logger.info(f"Health check result: {health_status}")
        print(f"🏥 Health check result: {health_status}")
        
        return health_status
    except Exception as e:
        error_status = {
            "status": "unhealthy",
            "error": str(e),
            "message": "Code execution service is experiencing issues"
        }
        logger.error(f"Health check failed: {error_status}")
        print(f"💔 Health check failed: {error_status}")
        return error_status

if __name__ == "__main__":
    logger.info("Starting FastAPI server...")
    print("🚀 Starting Code Execution API Server...")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 