from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)
client.get('/metrics')  # Force middleware stack build

print("=== User Middleware List ===")
for idx, m in enumerate(app.user_middleware):
    print(f"{idx}: {m.cls.__name__ if hasattr(m, 'cls') else type(m).__name__}")

print("\n=== Compiled ASGI Middleware Stack ===")
current = app.middleware_stack
depth = 0
while current is not None:
    cls_name = type(current).__name__
    wrapped_cls = getattr(current, "cls", None)
    print(f"Depth {depth}: {cls_name} (wraps: {wrapped_cls.__name__ if wrapped_cls else 'None'})")
    if hasattr(current, "app"):
        current = current.app
        depth += 1
    else:
        current = None
