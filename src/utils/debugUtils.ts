
import { getBatchingInfo } from './reactCompat';

// Analyze page state
const analyzePageState = () => {
  console.group('🔬 Page State Analysis');
  
  // Check for common issues
  if (document.readyState !== 'complete') {
    console.warn('Document is not in a complete state. Some resources may not be fully loaded.');
  }
  
  // Analyze loaded resources (basic check)
  const images = document.querySelectorAll('img');
  console.log(`Found ${images.length} images.`);
  images.forEach((img, index) => {
    if (!img.complete) {
      console.warn(`Image ${index + 1} is not fully loaded:`, img.src);
    }
  });
  
  // Analyze styles (basic check)
  const stylesheets = Array.from(document.styleSheets);
  console.log(`Found ${stylesheets.length} stylesheets.`);
  stylesheets.forEach((sheet, index) => {
    try {
      if (!sheet.cssRules) {
        console.warn(`Stylesheet ${index + 1} cannot be accessed due to CORS or other reasons:`, sheet.href);
      }
    } catch (e) {
      console.error(`Error accessing stylesheet ${index + 1}:`, sheet.href, e);
    }
  });
  
  // Analyze scripts (basic check)
  const scripts = document.querySelectorAll('script');
  console.log(`Found ${scripts.length} scripts.`);
  scripts.forEach((script, index) => {
    if (!script.src && !script.innerHTML) {
      console.warn(`Script ${index + 1} has no source or inline code.`);
    }
  });
  
  console.groupEnd();
};

// Report environment information
const reportEnvironmentInfo = () => {
  console.group('🌍 Environment Information');
  
  // Browser details
  console.log('Browser Name:', navigator.appName);
  console.log('Browser Version:', navigator.appVersion);
  console.log('User Agent:', navigator.userAgent);
  console.log('Platform:', navigator.platform);
  
  // Screen information
  console.log('Screen Width:', screen.width);
  console.log('Screen Height:', screen.height);
  console.log('Color Depth:', screen.colorDepth);
  
  // Network information (limited due to security)
  console.log('Online Status:', navigator.onLine);
  
  // Cookies
  console.log('Cookies Enabled:', navigator.cookieEnabled);
  
  // Batching info
  console.log('Batching Info:', getBatchingInfo());
  
  console.groupEnd();
};

import { checkWasmSupport, testWasmLoading } from './wasmUtils';

// Enhanced environment diagnostics with WASM support
const performEnvironmentDiagnostics = async () => {
  console.group('🔧 Environment Diagnostics');
  
  // Basic environment info
  console.log('User Agent:', navigator.userAgent);
  console.log('Platform:', navigator.platform);
  console.log('Language:', navigator.language);
  console.log('Online:', navigator.onLine);
  console.log('Cookie Enabled:', navigator.cookieEnabled);
  
  // Storage capabilities
  console.log('Local Storage available:', typeof localStorage !== 'undefined');
  console.log('Session Storage available:', typeof sessionStorage !== 'undefined');
  console.log('IndexedDB available:', typeof indexedDB !== 'undefined');
  
  // Worker support
  console.log('Web Workers supported:', typeof Worker !== 'undefined');
  console.log('Shared Workers supported:', typeof SharedWorker !== 'undefined');
  
  // WASM support
  const wasmInfo = checkWasmSupport();
  console.log('WASM Support Summary:', wasmInfo);
  
  // Test WASM loading
  const wasmLoadingWorks = await testWasmLoading();
  console.log('WASM Loading Test:', wasmLoadingWorks ? 'PASSED' : 'FAILED');
  
  // Test dynamic imports (removed problematic test-import)
  console.log('Dynamic import capability test skipped to avoid module errors');
  
  console.groupEnd();
};

// Log performance metrics
const logPerformanceMetrics = () => {
  if (performance && performance.getEntriesByType) {
    console.group('⏱️ Performance Metrics');
    
    // Measure page load time
    const navigationTiming = performance.getEntriesByType('navigation');
    if (navigationTiming && navigationTiming.length > 0) {
      const navTiming = navigationTiming[0];
      console.log('Page Load Time (Navigation):', navTiming.duration, 'ms');
    }
    
    // Measure resource load times
    const resourceTiming = performance.getEntriesByType('resource');
    console.log(`Loaded ${resourceTiming.length} resources.`);
    resourceTiming.forEach((resource, index) => {
      console.log(`Resource ${index + 1}:`, resource.name, 'Duration:', resource.duration, 'ms');
    });
    
    // Measure memory usage (with proper type checking)
    const perfWithMemory = performance as any;
    if (perfWithMemory.memory) {
      console.log('Memory Usage:', perfWithMemory.memory.usedJSHeapSize / 1024 / 1024, 'MB');
      console.log('Memory Limit:', perfWithMemory.memory.jsHeapSizeLimit / 1024 / 1024, 'MB');
    } else {
      console.log('Memory API not available in this browser');
    }
    
    console.groupEnd();
  } else {
    console.warn('Performance API not supported in this environment.');
  }
};

// Auto-run diagnostics
if (typeof window !== 'undefined') {
  console.log('🚀 Debug Utils Loaded');
  performEnvironmentDiagnostics();
}
