"""CommerceOS automated QA — runs against the local Vite dev server."""
import json, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/commerceos/"
ROUTES = [
    ("Marketing /", "#/", "One intelligent platform"),
    ("Dashboard", "#/app", "Welcome back"),
    ("Products", "#/app/products", "products in your catalog"),
    ("Product new", "#/app/products/new", "Create Product"),
    ("Inventory", "#/app/inventory", "Stock Movement History"),
    ("Orders", "#/app/orders", "Total Orders (all time)"),
    ("Order detail", "#/app/orders/COS-1001", "Order Items"),
    ("Customers", "#/app/customers", "Lifetime Customer Spend"),
    ("Customer detail", "#/app/customers/cus-1", "Order History"),
    ("Suppliers", "#/app/suppliers", "active suppliers"),
    ("Analytics", "#/app/analytics", "Product Performance"),
    ("Finance", "#/app/finance", "Profit & Loss"),
    ("Reports", "#/app/reports", "Report type"),
    ("Notifications", "#/app/notifications", "Notifications"),
    ("Settings", "#/app/settings", "Restore demonstration data"),
]

results, console_errors = [], []
def check(name, ok, detail=""):
    results.append({"test": name, "pass": bool(ok), "detail": detail})
    print(("PASS " if ok else "FAIL ") + name + (f" — {detail}" if detail else ""))

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(str(e)))

    # 1. Every route renders its expected content
    for name, route, needle in ROUTES:
        try:
            page.goto(BASE + route, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(500)
            check(f"Route: {name}", needle in page.inner_text("body"), "" if needle in page.inner_text("body") else f"missing '{needle}'")
        except Exception as e:
            check(f"Route: {name}", False, str(e)[:140])

    # 2. Global search (Ctrl+K) finds a product
    try:
        page.goto(BASE + "#/app", wait_until="networkidle"); page.wait_for_timeout(400)
        page.keyboard.press("Control+k"); page.wait_for_timeout(400)
        page.keyboard.type("headphones"); page.wait_for_timeout(500)
        check("Global search finds product", "Headphones" in page.inner_text("body"))
        page.keyboard.press("Escape")
    except Exception as e:
        check("Global search finds product", False, str(e)[:140])

    # 3. Inventory adjustment flow (validation + apply)
    try:
        page.goto(BASE + "#/app/inventory", wait_until="networkidle"); page.wait_for_timeout(400)
        page.get_by_role("button", name="Adjust").first.click(); page.wait_for_timeout(400)
        page.fill("#delta", "10"); page.wait_for_timeout(250)
        sees_preview = "New stock level will be" in page.inner_text("body")
        page.get_by_role("button", name="Apply adjustment").click(); page.wait_for_timeout(600)
        check("Inventory adjust + toast", sees_preview and "Dashboard & valuation updated" in page.inner_text("body"))
    except Exception as e:
        check("Inventory adjust + toast", False, str(e)[:140])

    # 4. Create product via form (with validation present)
    try:
        page.goto(BASE + "#/app/products/new", wait_until="networkidle"); page.wait_for_timeout(400)
        page.fill("#name", "QA Test Widget Pro"); page.fill("#sku", "QA-9999")
        page.fill("#description", "Widget created by the automated QA suite.")
        page.fill("#price", "59.99"); page.fill("#cost", "30"); page.fill("#stock", "42")
        page.get_by_role("button", name="Create product").click(); page.wait_for_timeout(800)
        ok = "added to your catalog" in page.inner_text("body") or "QA Test Widget" in page.inner_text("body")
        check("Product create flow", ok)
    except Exception as e:
        check("Product create flow", False, str(e)[:140])

    # 5. Persistence: reload and confirm created product survived
    try:
        page.goto(BASE + "#/app/products", wait_until="networkidle"); page.wait_for_timeout(400)
        page.reload(wait_until="networkidle"); page.wait_for_timeout(600)
        page.fill("input[aria-label='Search products']", "QA Test Widget"); page.wait_for_timeout(600)
        check("localStorage persistence after reload", "QA Test Widget Pro" in page.inner_text("body"))
    except Exception as e:
        check("localStorage persistence after reload", False, str(e)[:140])

    # 6. Order status update from Orders table
    try:
        page.goto(BASE + "#/app/orders", wait_until="networkidle"); page.wait_for_timeout(400)
        sel = page.locator("select[aria-label^='Update status']").first
        sel.select_option("delivered"); page.wait_for_timeout(600)
        check("Order status update + toast", "moved to delivered" in page.inner_text("body"))
    except Exception as e:
        check("Order status update + toast", False, str(e)[:140])

    # 7. Report generation + CSV export triggers download
    try:
        page.goto(BASE + "#/app/reports", wait_until="networkidle"); page.wait_for_timeout(400)
        with page.expect_download(timeout=8000) as dl:
            page.get_by_role("button", name="Export CSV").click()
        check("CSV export downloads", dl.value.suggested_filename.endswith(".csv"), dl.value.suggested_filename)
    except Exception as e:
        check("CSV export downloads", False, str(e)[:140])

    # 8. Theme toggle flips the dark class
    try:
        before = page.evaluate("document.documentElement.classList.contains('dark')")
        page.get_by_role("button", name="Toggle theme").click(); page.wait_for_timeout(400)
        after = page.evaluate("document.documentElement.classList.contains('dark')")
        page.get_by_role("button", name="Toggle theme").click()
        check("Theme toggle (dark/light)", before != after)
    except Exception as e:
        check("Theme toggle (dark/light)", False, str(e)[:140])

    # 9. Screenshots — desktop + mobile
    page.goto(BASE + "#/", wait_until="networkidle"); page.wait_for_timeout(900)
    page.screenshot(path="docs/screenshots/marketing-hero.png")
    page.goto(BASE + "#/app", wait_until="networkidle"); page.wait_for_timeout(900)
    page.screenshot(path="docs/screenshots/dashboard.png")
    mob = browser.new_page(viewport={"width": 390, "height": 844})
    mob.goto(BASE + "#/app", wait_until="networkidle"); mob.wait_for_timeout(900)
    mob.screenshot(path="docs/screenshots/dashboard-mobile.png")
    check("Screenshots captured", True)

    check("No console errors", len(console_errors) == 0, "; ".join(console_errors[:3])[:200])
    browser.close()

passed = sum(1 for r in results if r["pass"])
print(json.dumps({"passed": passed, "total": len(results), "console_errors": console_errors[:5]}))
sys.exit(0 if passed == len(results) else 1)
