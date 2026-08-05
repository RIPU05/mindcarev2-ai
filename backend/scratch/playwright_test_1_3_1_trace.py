import asyncio
import os
import sys
import subprocess
import time

sys.path.insert(0, ".")

from playwright.async_api import async_playwright

def run_cmd_sync(cmd):
    print(f"Executing: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return res.returncode

# Temporary tracing script that starts backend and prints output
TRACER_CODE = r"""# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, ".")

import uvicorn
from app.main import create_app

app = create_app()

class TraceMiddleware:
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            print("\n[TRACER ASGI SCOPE]")
            print("Method:", scope["method"])
            print("Path:", scope["path"])
            print("Scope Headers:", scope["headers"])
            
            # Check contains search
            from starlette.datastructures import Headers
            h = Headers(scope=scope)
            print("Origin in headers:", "origin" in h)
            print("Access-Control-Request-Method in headers:", "access-control-request-method" in h)
            print("Origin Value:", h.get("origin"))
            print("Request Method Value:", h.get("access-control-request-method"))
            
        await self.app(scope, receive, send)

app.add_middleware(TraceMiddleware)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
"""

async def main():
    print("=== HYPOTHESIS TEST: TRACING STARLETTE 1.3.1 PIPELINE ===")
    
    # 1. Write the tracer server script
    with open("scratch/temp_tracer_server.py", "w", encoding="utf-8") as f:
        f.write(TRACER_CODE)
        
    # 2. Install Starlette 1.3.1
    run_cmd_sync('python -m pip install "starlette==1.3.1"')
    
    # 3. Start tracer server
    print("Starting temporary tracer server on port 8001...")
    log_file = open("scratch/tracer_server.log", "w", encoding="utf-8")
    backend_proc = subprocess.Popen(
        "python scratch/temp_tracer_server.py",
        shell=True,
        stdout=log_file,
        stderr=subprocess.STDOUT
    )
    time.sleep(5)
    
    # 4. Run browser fetch targeting 8001
    print("\nStarting Playwright Browser Fetch Test...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        await page.goto("http://localhost:3000/login", wait_until="networkidle")
        
        # Trigger GET request with headers requiring preflight
        fetch_js = """
        fetch("http://127.0.0.1:8001/api/v1/moods", {
            method: "GET",
            headers: {
                "Origin": "http://localhost:3000",
                "Authorization": "Bearer mock-token",
                "Content-Type": "application/json"
            }
        }).then(res => ({
            status: res.status,
            headers: Array.from(res.headers.entries())
        })).catch(err => ({ error: err.message }))
        """
        
        result = await page.evaluate(fetch_js)
        print("Browser Fetch Result under Starlette 1.3.1:", result)
        
        await browser.close()
        
    # 5. Stop tracer server and read logs
    print("Stopping tracer server...")
    backend_proc.terminate()
    backend_proc.wait()
    log_file.close()
    
    print("\n=== TRACER SERVER LOGS ===")
    with open("scratch/tracer_server.log", "r", encoding="utf-8") as f:
        print(f.read())
        
    # 6. Clean up temporary files
    if os.path.exists("scratch/temp_tracer_server.py"):
        os.remove("scratch/temp_tracer_server.py")
    if os.path.exists("scratch/tracer_server.log"):
        os.remove("scratch/tracer_server.log")
        
    # 7. Restore Starlette 0.46.2
    run_cmd_sync('python -m pip install "starlette==0.46.2"')
    
    print("=== HYPOTHESIS TEST COMPLETED ===")

if __name__ == "__main__":
    asyncio.run(main())
