from dotenv import load_dotenv

load_dotenv()

import os

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
print(f"S3_BUCKET_NAME: {S3_BUCKET_NAME}")
