"use strict";

const widget = document.querySelector("#clerk-widget");
const hint = document.querySelector("#widget-hint");
const signInLink = document.querySelector("#sign-in-link");
const signUpLink = document.querySelector("#sign-up-link");
const isSignUp = window.location.pathname.startsWith("/sign-up");

function loadScript(src, attributes = {}) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    for (const [name, value] of Object.entries(attributes)) {
      script.setAttribute(name, value);
    }
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load the sign-in service."));
    document.head.appendChild(script);
  });
}

function getFrontendApiDomain(publishableKey) {
  const encodedDomain = publishableKey.split("_")[2];
  if (!encodedDomain) throw new Error("Sign-in is not configured.");
  return window.atob(encodedDomain).replace(/\$$/, "");
}

function updatePageMode() {
  document.title = `${isSignUp ? "Create account" : "Sign in"} · Zaiden Quiz Site`;
  document.querySelector("#auth-heading").textContent = isSignUp
    ? "Create your account"
    : "Welcome back";
  document.querySelector(".panel-copy").textContent = isSignUp
    ? "A few details, then you’re ready to play."
    : "Choose how you’d like to continue.";
  signInLink.classList.toggle("is-current", !isSignUp);
  signUpLink.classList.toggle("is-current", isSignUp);
  if (isSignUp) {
    signInLink.removeAttribute("aria-current");
    signUpLink.setAttribute("aria-current", "page");
  } else {
    signUpLink.removeAttribute("aria-current");
    signInLink.setAttribute("aria-current", "page");
  }
  widget.setAttribute("aria-label", isSignUp ? "Create account form" : "Sign-in form");
}

async function startAuth() {
  updatePageMode();

  try {
    const configResponse = await fetch("/api/auth/config", {
      headers: { Accept: "application/json" },
    });
    const config = await configResponse.json();
    if (!configResponse.ok || !config.publishableKey) {
      throw new Error(config.error || "Sign-in is not configured.");
    }

    const apiBase = config.proxyUrl
      ? config.proxyUrl.replace(/\/$/, "")
      : `https://${getFrontendApiDomain(config.publishableKey)}`;

    await loadScript(`${apiBase}/npm/@clerk/ui@1/dist/ui.browser.js`);

    const clerkAttributes = {
      "data-clerk-publishable-key": config.publishableKey,
    };
    if (config.proxyUrl) {
      clerkAttributes["data-clerk-proxy-url"] = config.proxyUrl;
    }
    await loadScript(
      `${apiBase}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
      clerkAttributes,
    );

    const appearance = {
      variables: {
        colorPrimary: "#fa500f",
        colorForeground: "#f4ede8",
        colorMutedForeground: "#c4b5ac",
        colorDanger: "#ff7c72",
        colorBackground: "#211915",
        colorInput: "#14100e",
        colorInputForeground: "#f4ede8",
        colorNeutral: "#765c4e",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        borderRadius: "12px",
      },
      elements: {
        rootBox: { width: "100%" },
        cardBox: {
          width: "100%",
          maxWidth: "100%",
          backgroundColor: "transparent",
          boxShadow: "none",
          border: "none",
        },
        card: {
          backgroundColor: "transparent",
          boxShadow: "none",
          border: "none",
        },
        headerTitle: { color: "#f4ede8" },
        headerSubtitle: { color: "#c4b5ac" },
        formFieldLabel: { color: "#f4ede8" },
        formFieldInput: {
          color: "#f4ede8",
          backgroundColor: "#14100e",
          border: "1px solid #59483f",
        },
        formButtonPrimary: {
          color: "#20140e",
          backgroundColor: "#fa500f",
          fontWeight: "700",
        },
        footerActionText: { color: "#c4b5ac" },
        footerActionLink: { color: "#ff9a5c" },
        dividerText: { color: "#c4b5ac" },
        socialButtonsBlockButtonText: { color: "#f4ede8" },
      },
    };

    await window.Clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor },
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
      localization: {
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to continue to the quiz",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with the Vibe quiz",
          },
        },
      },
    });

    if (window.Clerk.isSignedIn) {
      window.location.replace("/");
      return;
    }

    hint.remove();
    const mountOptions = {
      routing: "path",
      path: isSignUp ? "/sign-up" : "/sign-in",
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
      forceRedirectUrl: "/",
      fallbackRedirectUrl: "/",
      appearance,
    };

    if (isSignUp) {
      window.Clerk.mountSignUp(widget, mountOptions);
    } else {
      window.Clerk.mountSignIn(widget, mountOptions);
    }
  } catch (error) {
    hint.textContent =
      error instanceof Error
        ? error.message
        : "Sign-in is temporarily unavailable. Please try again.";
    hint.classList.add("widget-error");
  }
}

startAuth();
