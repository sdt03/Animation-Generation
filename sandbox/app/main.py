from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn
from worker import execute_code_with_requirements
import logging
import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError

load_dotenv()

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

print(S3_BUCKET_NAME)
# Initialize S3 client
try:
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
    else:
        s3_client = boto3.client(
            's3',
            region_name=AWS_REGION
        )

    logger.info("Successfully initialized S3 client")
    logger.info(f"S3 client: {s3_client}")
except Exception as e:
    logger.error(f"Failed to initialize S3 client: {str(e)}")
    s3_client = None

def upload_file_to_s3(file_path: str, object_name: str = None) -> Dict[str, Any]:
    """
    Upload a file to an S3 bucket
    
    Args:
        file_path (str): Path to the file to upload
        object_name (str): S3 object name. If not specified, file_path is used
    
    Returns:
        dict: Response containing upload status and file URL
        {
            'success': bool,
            'url': str,
            'error': str
        }
    """
    # If S3 client initialization failed, return error
    if s3_client is None:
        return {
            'success': False,
            'url': None,
            'error': 'S3 client not initialized'
        }

    # If object_name not specified, use file_path
    if object_name is None:
        object_name = os.path.basename(file_path)

    try:
        # Upload the file
        s3_client.upload_file(file_path, S3_BUCKET_NAME, object_name)
        
        # Generate the URL for the uploaded file
        url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{object_name}"
        
        logger.info(f"Successfully uploaded file to S3: {url}")
        return {
            'success': True,
            'url': url,
            'error': None
        }
        
    except ClientError as e:
        logger.error(f"Failed to upload file to S3: {str(e)}")
        return {
            'success': False,
            'url': None,
            'error': str(e)
        }

def upload_files_to_s3(file_paths: List[str]) -> List[Dict[str, Any]]:
    """
    Upload multiple files to S3 bucket
    
    Args:
        file_paths (List[str]): List of file paths to upload
    
    Returns:
        List[Dict[str, Any]]: List of upload results for each file
    """
    results = []
    for file_path in file_paths:
        result = upload_file_to_s3(file_path)
        results.append(result)
    return results

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
    This endpoint is specifically designed for animation generation and uploads results to S3
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
        
        # Upload generated files to S3
        s3_upload_results = []
        main_video_url = None
        
        if result['success'] and result.get('generated_files'):
            # Get full paths of generated files (should be only one now)
            file_paths = [os.path.join(OUTPUT_DIR, filename) for filename in result['generated_files']]
            
            # Upload files to S3
            logger.info(f"Uploading {len(file_paths)} file(s) to S3...")
            s3_upload_results = upload_files_to_s3(file_paths)
            
            # Get the main video URL (should be only one)
            successful_uploads = [upload for upload in s3_upload_results if upload['success']]
            if successful_uploads:
                main_video_url = successful_uploads[0]['url']
                logger.info(f"Main video URL: {main_video_url}")
            
            # Clean up local files after successful upload
            for file_path in file_paths:
                try:
                    os.remove(file_path)
                    logger.info(f"Cleaned up local file: {file_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean up local file {file_path}: {str(e)}")
        
        # Prepare response with single video URL
        response = {
            "success": result['success'],
            "output": result['output'],
            "error": result['error'],
            "execution_time": result['execution_time'],
            "installed_packages": result['installed_packages'],
            "failed_packages": result['failed_packages'],
            "generated_files": result.get('generated_files', []),
            "s3_uploads": s3_upload_results,
            "video_url": main_video_url,  # Single video URL
            "video_urls": [main_video_url] if main_video_url else [],  # Array with one URL for backward compatibility
            "thumbnailUrl": main_video_url  # Use the same URL as thumbnail
        }
        
        logger.info("Manim execution and S3 upload completed")
        logger.info(f"✅ Success: {result['success']}")
        logger.info(f"⏱️  Execution time: {result['execution_time']:.2f}s")
        logger.info(f"🎥 Generated files: {result.get('generated_files', [])}")
        logger.info(f"☁️  S3 Upload results: {s3_upload_results}")
        
        print(f"\n🎯 MANIM EXECUTION RESULT:")
        print(f"✅ Success: {result['success']}")
        print(f"⏱️  Time: {result['execution_time']:.2f}s")
        print(f"🎥 Generated files: {result.get('generated_files', [])}")
        print(f"☁️  S3 Upload results: {s3_upload_results}")
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