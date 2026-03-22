from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1280, "height": 800})

    # Navigate to the app
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # Wait a bit for the page to fully render
    page.wait_for_timeout(2000)

    # Take a screenshot of initial state
    page.screenshot(path='/tmp/initial_state.png')

    # Look for the "保存为笔记" button and click it to open the dialog
    # Try different selectors
    selectors_to_try = [
        'button:has-text("保存为笔记")',
        'button:has-text("笔记")',
        '[data-testid="save-note"]',
    ]

    dialog_opened = False
    for selector in selectors_to_try:
        try:
            if page.locator(selector).count() > 0:
                page.locator(selector).first.click()
                dialog_opened = True
                print(f"Clicked button with selector: {selector}")
                break
        except:
            continue

    if not dialog_opened:
        # Try to find any button that might open the dialog
        print("Looking for buttons on page...")
        buttons = page.locator('button').all()
        for btn in buttons:
            text = btn.inner_text()
            print(f"Found button: {text}")

    # Wait for dialog to appear
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path='/tmp/dialog_state.png', full_page=True)

    # If dialog is open, inspect the scroll area
    if page.locator('[role="dialog"]').count() > 0:
        print("\n=== Dialog found! Inspecting scroll area ===\n")

        # Find the scroll area viewport
        scroll_area_viewport = page.locator('[data-slot="scroll-area-viewport"]')

        if scroll_area_viewport.count() > 0:
            # Get viewport dimensions
            viewport_box = scroll_area_viewport.bounding_box()
            print(f"ScrollArea Viewport: {viewport_box}")

            # Get scroll info
            scroll_info = scroll_area_viewport.evaluate('''
                (el) => {
                    return {
                        scrollWidth: el.scrollWidth,
                        clientWidth: el.clientWidth,
                        scrollHeight: el.scrollHeight,
                        clientHeight: el.clientHeight,
                        overflowX: getComputedStyle(el).overflowX,
                        overflowY: getComputedStyle(el).overflowY,
                    }
                }
            ''')
            print(f"ScrollArea Viewport scroll info: {json.dumps(scroll_info, indent=2)}")

        # Inspect the inner container
        inner_container = page.locator('[data-slot="scroll-area-viewport"] > div').first
        if inner_container:
            inner_info = inner_container.evaluate('''
                (el) => {
                    const styles = getComputedStyle(el);
                    return {
                        width: el.offsetWidth,
                        scrollWidth: el.scrollWidth,
                        className: el.className,
                        overflow: styles.overflow,
                        overflowX: styles.overflowX,
                    }
                }
            ''')
            print(f"\nInner container info: {json.dumps(inner_info, indent=2)}")

        # Inspect message items
        message_items = page.locator('[data-slot="scroll-area-viewport"] > div > div').all()
        print(f"\n=== Found {len(message_items)} message item wrappers ===\n")

        for i, item in enumerate(message_items[:3]):  # Check first 3 items
            item_info = item.evaluate('''
                (el) => {
                    const styles = getComputedStyle(el);
                    return {
                        tagName: el.tagName,
                        className: el.className,
                        width: el.offsetWidth,
                        scrollWidth: el.scrollWidth,
                        overflow: styles.overflow,
                        minWidth: styles.minWidth,
                    }
                }
            ''')
            print(f"Message wrapper {i}: {json.dumps(item_info, indent=2)}")

        # Check the actual message item (flex container)
        flex_items = page.locator('[data-slot="scroll-area-viewport"] .flex.items-center').all()
        print(f"\n=== Found {len(flex_items)} flex message items ===\n")

        for i, item in enumerate(flex_items[:3]):
            item_info = item.evaluate('''
                (el) => {
                    const styles = getComputedStyle(el);
                    const children = Array.from(el.children).map(child => ({
                        tagName: child.tagName,
                        className: child.className,
                        width: child.offsetWidth,
                        text: child.innerText?.substring(0, 30)
                    }));
                    return {
                        width: el.offsetWidth,
                        scrollWidth: el.scrollWidth,
                        minWidth: styles.minWidth,
                        flexWrap: styles.flexWrap,
                        children: children
                    }
                }
            ''')
            print(f"Flex item {i}: {json.dumps(item_info, indent=2)}")

    else:
        print("Dialog not found. Taking full page screenshot for debugging.")
        page.screenshot(path='/tmp/full_page.png', full_page=True)

    browser.close()
