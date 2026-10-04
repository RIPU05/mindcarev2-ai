import subprocess
import sys

def main():
    try:
        res = subprocess.run(["docker", "info"], capture_output=True, text=True)
        combined_output = (res.stdout or "") + (res.stderr or "")
        if res.returncode != 0 or "failed to connect" in combined_output.lower() or "error during connect" in combined_output.lower():
            print("[SKIP] Docker Engine daemon is stopped or unreachable.")
            print("Docker Engine is not running — runtime verification skipped")
            sys.exit(0)
    except Exception as exc:
        print(f"[SKIP] Docker CLI error: {exc}")
        print("Docker Engine is not running — runtime verification skipped")
        sys.exit(0)

    print("[PASS] Docker Engine is running.")
    sys.exit(100)

if __name__ == "__main__":
    main()
