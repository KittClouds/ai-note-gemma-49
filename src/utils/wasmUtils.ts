
// WASM debugging utilities

export const checkWasmSupport = () => {
  console.group('[WASM Utils] Checking WebAssembly support...');
  
  // Check basic WASM support
  const wasmSupported = typeof WebAssembly !== 'undefined';
  console.log('WebAssembly supported:', wasmSupported);
  
  if (wasmSupported) {
    console.log('WebAssembly.validate supported:', typeof WebAssembly.validate === 'function');
    console.log('WebAssembly.instantiate supported:', typeof WebAssembly.instantiate === 'function');
    console.log('WebAssembly.compile supported:', typeof WebAssembly.compile === 'function');
  }
  
  // Check for SharedArrayBuffer support (needed by some WASM modules)
  const sharedArrayBufferSupported = typeof SharedArrayBuffer !== 'undefined';
  console.log('SharedArrayBuffer supported:', sharedArrayBufferSupported);
  
  // Check Cross-Origin headers (fix the variable order issue)
  const crossOriginIsolated = typeof self !== 'undefined' && 'crossOriginIsolated' in self ? self.crossOriginIsolated : false;
  console.log('Cross-origin isolated:', crossOriginIsolated);
  
  console.groupEnd();
  
  return {
    wasmSupported,
    sharedArrayBufferSupported,
    crossOriginIsolated
  };
};

export const testWasmLoading = async () => {
  console.group('[WASM Utils] Testing WASM module loading...');
  
  try {
    // Test basic WASM compilation with a minimal module
    const wasmBytes = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, // magic number
      0x01, 0x00, 0x00, 0x00  // version
    ]);
    
    console.log('Testing minimal WASM compilation...');
    const module = await WebAssembly.compile(wasmBytes);
    console.log('Minimal WASM compilation successful:', module);
    
    const instance = await WebAssembly.instantiate(module);
    console.log('Minimal WASM instantiation successful:', instance);
    
    console.log('WASM loading test passed');
    return true;
  } catch (error) {
    console.error('WASM loading test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('magic word')) {
        console.error('WASM file appears to be corrupted or is not a valid WASM file');
      } else if (error.message.includes('CompileError')) {
        console.error('WASM compilation failed - check file integrity');
      } else if (error.message.includes('fetch')) {
        console.error('WASM file could not be fetched - check server configuration');
      }
    }
    
    return false;
  } finally {
    console.groupEnd();
  }
};

export const debugWasmRequest = async (url: string) => {
  console.group(`[WASM Utils] Debugging WASM request: ${url}`);
  
  try {
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Content-Type:', response.headers.get('Content-Type'));
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Response body (should be WASM binary):', text.substring(0, 200));
      
      if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
        console.error('WASM request returned HTML instead of binary - server misconfiguration detected');
      }
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      console.log('Response size:', bytes.length);
      console.log('First 8 bytes:', Array.from(bytes.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      
      // Check for WASM magic number
      if (bytes.length >= 4) {
        const magic = bytes.slice(0, 4);
        const expectedMagic = [0x00, 0x61, 0x73, 0x6d];
        const isValidWasm = magic.every((byte, index) => byte === expectedMagic[index]);
        console.log('Valid WASM magic number:', isValidWasm);
        
        if (!isValidWasm) {
          console.error('Invalid WASM magic number found. Expected: 00 61 73 6d, Found:', 
            Array.from(magic).map(b => b.toString(16).padStart(2, '0')).join(' '));
        }
      }
    }
  } catch (error) {
    console.error('Failed to debug WASM request:', error);
  } finally {
    console.groupEnd();
  }
};

// Auto-run WASM support check
if (typeof window !== 'undefined') {
  checkWasmSupport();
  testWasmLoading();
}
