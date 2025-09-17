
import { useEffect, useState } from 'react';

interface BrowserCompatibilityState {
  hasAdBlocker: boolean;
  canLoadModules: boolean;
  isChecking: boolean;
}

export const useBrowserCompatibility = () => {
  const [state, setState] = useState<BrowserCompatibilityState>({
    hasAdBlocker: false,
    canLoadModules: true,
    isChecking: true,
  });

  useEffect(() => {
    const checkCompatibility = async () => {
      console.log('[Browser Compatibility] Starting checks...');
      
      let hasAdBlocker = false;
      let canLoadModules = true;

      try {
        // Test for ad blocker by trying to load a commonly blocked resource
        const testElement = document.createElement('div');
        testElement.innerHTML = '&nbsp;';
        testElement.className = 'adsbox';
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        document.body.appendChild(testElement);
        
        // Check if the element is hidden (blocked by ad blocker)
        setTimeout(() => {
          if (testElement.offsetHeight === 0) {
            hasAdBlocker = true;
            console.log('[Browser Compatibility] Ad blocker detected');
          }
          document.body.removeChild(testElement);
        }, 100);

        // Test module loading by attempting to create a worker
        try {
          const testWorker = new Worker(
            URL.createObjectURL(new Blob(['self.postMessage("test")'], { type: 'application/javascript' }))
          );
          testWorker.terminate();
        } catch (workerError) {
          console.warn('[Browser Compatibility] Worker creation failed:', workerError);
          canLoadModules = false;
        }

        // Test for LiveStore specific blocking
        try {
          const testUrl = new URL('/node_modules/@livestore/adapter-web/dist/index.js', window.location.origin);
          const response = await fetch(testUrl.href, { method: 'HEAD' });
          if (!response.ok && response.status === 0) {
            console.warn('[Browser Compatibility] LiveStore modules may be blocked');
            canLoadModules = false;
          }
        } catch (fetchError) {
          console.warn('[Browser Compatibility] Module fetch test failed:', fetchError);
          // Don't set canLoadModules to false here as this might be expected in development
        }

      } catch (error) {
        console.warn('[Browser Compatibility] Compatibility check failed:', error);
      }

      setState({
        hasAdBlocker,
        canLoadModules,
        isChecking: false,
      });

      console.log('[Browser Compatibility] Check complete:', { hasAdBlocker, canLoadModules });
    };

    checkCompatibility();
  }, []);

  return state;
};
