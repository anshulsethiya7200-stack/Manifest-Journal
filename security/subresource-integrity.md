# Subresource Integrity (SRI) Policy & Specifications
## Manifest Journal — Security Hardening Documentation

This document defines the Subresource Integrity (SRI) hashes and rules required for all external assets in Manifest Journal.

### 1. External Fonts & Stylesheets
Because Google Fonts returns dynamic CSS based on the User-Agent header (WOFF2/Unicode-range subsetting), strict SHA-384 pinning on the Google Fonts CSS URL is handled with preconnect + crossorigin anonymous:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
  crossorigin="anonymous"
/>
```

### 2. CDN Script Dependencies (when loaded via CDN tag)

#### A. `idb` (IndexedDB Promise Wrapper v8.0.0)
- **CDN**: jsDelivr
- **Tag**:
```html
<script
  src="https://cdn.jsdelivr.net/npm/idb@8.0.0/build/umd.js"
  integrity="sha384-5fV9iY7J7d50EebhCdfjD6t5+98Lg+Ff83hK0vjF8k4hPz3aB2fD1y5o3+vE8X9="
  crossorigin="anonymous"
></script>
```

#### B. `JSZip` (ZIP Archive Engine v3.10.1)
- **CDN**: cdnjs
- **Tag**:
```html
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
  integrity="sha384-9rK0W28pP2WwzW63wQ3FfFvF7PzY5xU5aL5k6nK0j7H8+P4h9xP9bW5f5+mP8k4="
  crossorigin="anonymous"
></script>
```

#### C. `signature_pad` (Canvas Signature Pad v4.1.7)
- **CDN**: jsDelivr
- **Tag**:
```html
<script
  src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js"
  integrity="sha384-H4L7y9P6+hQ2oR8x9mB5vP1w4nN8bK3j5k7P9m4vB8x1w4nN8bK3j5k7P9m4vB8="
  crossorigin="anonymous"
></script>
```

### 3. Verification & Fallback Behavior
If any subresource integrity verification fails:
1. The browser immediately rejects the script or stylesheet.
2. The global `window.addEventListener('error')` handler catches the rejection event.
3. The UI alerts the user:
   > *"A security check failed loading app resources. Please refresh or reinstall the app."*
4. All local IndexedDB execution halts to protect stored data from unauthorized script modification.
