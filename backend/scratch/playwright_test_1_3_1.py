import asyncio
import os
import sys
import subprocess
import time

sys.path.insert(0, r"c:\Users\DELL\Desktop\MindCare AI – Powered by Modern AI (Version 2.0)\ai-mental-health-detection-1\backend")

from playwright.async_api import async_playwright

def run_cmd_sync(cmd):
    print(f"Executing: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    print("STDERR:", res.stderr)
    return res.returncode

async def main():
    print("=== HYPOTHESIS TEST: STARLETTE 1.3.1 E2E VALIDATION ===")
    
    # 1. Stop active uvicorn server if running
    # We will search and stop any active background uvicorn task if we run it ourselves
    
    # 2. Install Starlette 1.3.1
    run_cmd_sync('python -m pip install "starlette==1.3.1"')
    
    # 3. Start a new Uvicorn server on port 8001 (to avoid ports collision with task-530)
    print("Starting temporary backend server on port 8001...")
    backend_proc = subprocess.Popen(
        "python -m uvicorn app.main:app --port 8001 --host 127.0.0.1",
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(5) # Allow server startup
    
    # 4. Check if backend is alive
    try:
        async with httpx_AsyncClient() if "httpx" in sys.modules else None:
            pass
    except Exception:
        pass
        
    # We will use playwright to query http://127.0.0.1:8001/api/v1/moods via browser client simulation!
    # Wait, we want the browser client to query port 8001. But the frontend points to port 8000 by default (NEXT_PUBLIC_API_BASE_URL).
    # Can we run Playwright to fetch http://127.0.0.1:8001/api/v1/moods directly using browser fetch API?
    # Yes! We can evaluate a fetch in the browser context!
    # This simulates a browser-originated fetch with exact browser headers, bypassing Next.js UI routing, targeting port 8001 directly!
    
    print("\nStarting Playwright Browser Fetch Test...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Open a neutral page first to execute script in browser context
        await page.goto("http://localhost:3000/login", wait_until="networkidle")
        
        # We will inject a browser fetch call targeting http://127.0.0.1:8001/api/v1/moods
        # with Origin: http://localhost:3000, Access-Control-Request-Method: GET
        fetch_js = """
        fetch("http://127.0.0.1:8001/api/v1/moods", {
            method: "OPTIONS",
            headers: {
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type"
            }
        }).then(res => ({
            status: res.status,
            headers: Array.from(res.headers.entries())
        })).catch(err => ({ error: err.message }))
        """
        
        print("Executing browser preflight OPTIONS fetch...")
        result = await page.evaluate(fetch_js)
        print("Browser Fetch Result under Starlette 1.3.1:", result)
        
        await browser.close()
        
    # 5. Terminate the backend server
    print("Stopping backend server...")
    backend_proc.terminate()
    backend_proc.wait()
    
    # 6. Restore Starlette 0.46.2
    run_cmd_sync('python -m pip install "starlette==0.46.2"')
    
    print("=== HYPOTHESIS TEST COMPLETED ===")

if __name__ == "__main__":
    asyncio.run(main())
