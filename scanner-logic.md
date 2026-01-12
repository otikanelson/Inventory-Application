# Smart Inventory Scanner Logic Flow

### 1. The Trigger
* **Action:** User scans a barcode.
* **Feedback:** Device Beeps (Success or Warning sound) + Haptic Vibration + Camera Freezes.

### 2. The Registry Lookup (Background)
* **Check:** `GET /api/products/registry/lookup/{barcode}`
* **Branch A (Found):** - Toast: "Registered Product Found"
    - Modal: "Add new batch of [Product Name]?"
    - Choice NO: Unfreezes camera.
    - Choice YES: Navigates to `add-products` in **Inventory Mode**.
* **Branch B (Not Found):**
    - Toast: "Unregistered Product" (Beep-Beep sound)
    - Modal: "Do you want to register this product?"
    - Choice NO: Unfreezes camera.
    - Choice YES: Prompts Admin PIN Modal.
        - Correct PIN: Navigates to `add-products` in **Registry Mode**.
        - Wrong PIN: Toast "Incorrect Password" -> Unfreezes camera.

### 3. The Form (Add Products)
* **Registry Mode:**
    - Fields: Name, Category, isPerishable (Toggle).
    - Button: "Add to Registry"
* **Inventory Mode:**
    - Fields: Name (Locked), Category (Locked), Quantity, Expiry Date (Visible only if isPerishable=true).
    - Button: "Add to Inventory"
* **Manual Entry:**
    - User types everything.
    - Button: "Complete Entry" -> System checks registry again at save time.