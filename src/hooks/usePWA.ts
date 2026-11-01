import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);

  // Check if running in standalone mode (already installed PWA)
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();
    window.matchMedia("(display-mode: standalone)").addEventListener("change", checkStandalone);

    return () => {
      window.matchMedia("(display-mode: standalone)").removeEventListener("change", checkStandalone);
    };
  }, []);

  // Monitor Online/Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Register Service Worker and listen for updates
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered with scope:", registration.scope);
            setSwRegistration(registration);

            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("[PWA] New version ready for activation");
                    setHasUpdate(true);
                    // Automatically inform worker to skip waiting if desirable
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                });
              }
            });

            // Listen for controllerchange
            let refreshing = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
              console.log("[PWA] Service Worker controller changed - new version active");
              if (!refreshing) {
                refreshing = true;
                window.location.reload();
              }
            });
          })
          .catch((error) => {
            console.warn("[PWA] Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      console.log("[PWA] beforeinstallprompt event captured - App is installable");
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] App successfully installed to device home screen");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Function to trigger native installation dialog
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { success: false, outcome: "no-prompt" };
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);

      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        return { success: true, outcome: "accepted" };
      }
      return { success: false, outcome: "dismissed" };
    } catch (err) {
      console.error("[PWA] Error prompting install:", err);
      return { success: false, outcome: "error" };
    }
  }, [deferredPrompt]);

  // Function to apply SW update
  const applyUpdate = useCallback(() => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  }, [swRegistration]);

  return {
    isInstallable,
    isInstalled,
    isOffline,
    hasUpdate,
    promptInstall,
    applyUpdate,
  };
}
