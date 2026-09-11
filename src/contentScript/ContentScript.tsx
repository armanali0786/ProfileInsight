import React, { useEffect } from "react";

interface UserDetails {
  name?: string;
  location?: string;
  headline?: string;
  profilePic?: string;
  profileUrl?: string;
}

export const ContentScript = () => {
  let userDetails: UserDetails = {};

  // LinkedIn regenerates its CSS utility classes (e.g. "_3519784e") on every
  // build, so they can't be relied on directly. We anchor on attributes/URL
  // patterns that stay stable across deploys, and fall back to today's
  // snapshot of hashed classes (and older known selectors) when those anchors
  // aren't present.
  const getTopCardRoot = (): HTMLElement | null => {
    const verifiedBadge = document.querySelector('a[componentkey^="ProfileVerificationTriggerRef-"]');
    return (
      (verifiedBadge?.closest('section') as HTMLElement) ||
      (document.querySelector('main') as HTMLElement) ||
      // Last resort: if even <main> is gone, hand Groq the whole page rather than
      // nothing -- getTopCardHtml's attribute-stripping keeps this small enough to send.
      (document.body as HTMLElement) ||
      null
    );
  };

  // Profiles with a photo frame (#OpenToWork, #Hiring, custom frames, etc.)
  // are served from a "profile-framedphoto-*" URL instead of
  // "profile-displayphoto-*", so both need to be matched. Also prefer the
  // highest-resolution entry in srcset over the small default `src`.
  const findProfilePicElement = (): HTMLImageElement | null =>
    (document.querySelector('[componentkey="topcard-logo-image-referencekey"] img') as HTMLImageElement) ||
    (document.querySelector('[aria-label="Profile photo"] img') as HTMLImageElement) ||
    (document.querySelector('img[src*="profile-displayphoto"], img[src*="profile-framedphoto"]') as HTMLImageElement) ||
    (document.querySelector('.pv-top-card__non-self-photo-wrapper img') as HTMLImageElement) ||
    (document.querySelector('.pv-top-card__photo-wrapper img') as HTMLImageElement) ||
    null;

  // Attributes worth keeping when stripping a cloned subtree down for Groq: these carry
  // actual meaning (image URLs, link targets, accessible names) and, unlike LinkedIn's
  // hashed CSS classes, aren't rewritten on every deploy -- breaking them would break
  // screen readers, not just styling. Everything else (class, id, style, data-*, ...) is noise.
  const ATTRS_TO_KEEP = new Set(['src', 'srcset', 'href', 'alt', 'aria-label', 'title']);

  const stripNoisyAttributes = (root: HTMLElement) => {
    root.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (!ATTRS_TO_KEEP.has(attr.name)) el.removeAttribute(attr.name);
      });
    });
  };

  // Snapshot of a page subtree's HTML, sent to the backend so Groq can parse it into
  // structured fields server-side -- more resilient to LinkedIn's regenerated CSS classes
  // than the selector chains above. Stripping presentational attributes/noise elements
  // shrinks the payload enough that we can afford to send a much wider net (up to the
  // whole page) instead of betting everything on one narrow selector staying stable.
  const getTopCardHtml = (topCard: HTMLElement | null): string => {
    const root = topCard || (document.querySelector('main') as HTMLElement | null) || document.body;
    if (!root) return '';
    const clone = root.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style, noscript, svg, iframe').forEach((el) => el.remove());
    stripNoisyAttributes(clone);
    return clone.outerHTML.slice(0, 40000);
  };

  const getBestProfilePicUrl = (img: HTMLImageElement): string => {
    if (!img.srcset) return img.src;
    const candidates = img.srcset
      .split(',')
      .map((entry) => entry.trim().split(/\s+/))
      .filter(([url]) => !!url)
      .map(([url, width]) => ({ url, width: parseInt(width, 10) || 0 }));
    if (candidates.length === 0) return img.src;
    return candidates.reduce((best, candidate) => (candidate.width > best.width ? candidate : best)).url;
  };

  const getLinkedInUserDetails = () => {
    userDetails = {}; // Reset the object each time to avoid old data

    const topCard = getTopCardRoot();

    const nameElement =
      (document.querySelector('a[componentkey^="ProfileVerificationTriggerRef-"] h2') as HTMLElement) ||
      (topCard?.querySelector('h1') as HTMLElement) ||
      (document.querySelector('h1.XcqMGBrLgSDsfiaCuMsRfEqqGQIKDfI') as HTMLElement);
    if (nameElement) userDetails.name = nameElement.innerText.trim();

    const contactInfoLink = topCard?.querySelector('a[href*="/overlay/contact-info/"]');
    const locationElement =
      (contactInfoLink?.closest('div')?.querySelector('p:first-child') as HTMLElement) ||
      (document.querySelector('div.rKBFpHFpsvBDugPRbIgajakdAUGlocaMVcqC span.text-body-small:first-child') as HTMLElement);
    if (locationElement) userDetails.location = locationElement.innerText.trim();

    const headlineElement =
      (topCard?.querySelector('p._7630dc1e') as HTMLElement) ||
      (document.querySelector('div.text-body-medium') as HTMLElement);
    if (headlineElement) userDetails.headline = headlineElement.innerText.trim();

    const profilePicElement = findProfilePicElement();
    if (profilePicElement) {
      userDetails.profilePic = getBestProfilePicUrl(profilePicElement);
    }


    const profileUrl = window.location.href;
    if (profileUrl) userDetails.profileUrl = profileUrl;

    if (Object.keys(userDetails).length > 0) {
      const topCardHtml = getTopCardHtml(topCard);
      chrome.runtime.sendMessage({ userDetails: userDetails, topCardHtml });
    }
  };


  useEffect(() => {
    getLinkedInUserDetails();

    // LinkedIn is a single-page app: navigating from one profile to another
    // updates the URL via history.pushState/replaceState without a full page
    // load, so chrome.tabs.onUpdated's "complete" status often never fires.
    // We patch the History API (and listen for popstate/back-forward) here,
    // in the content script, since it has real-time access to location.href
    // and doesn't have to wait on a tab-level navigation event.
    let lastUrl = window.location.href;
    const notifyUrlChange = () => {
      if (window.location.href === lastUrl) return;
      lastUrl = window.location.href;
      chrome.runtime.sendMessage({ type: "linkedinUrlChanged", url: lastUrl });
      // Give LinkedIn's SPA a moment to render the new profile's DOM before
      // re-scraping it.
      setTimeout(getLinkedInUserDetails, 300);
    };

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);
    history.pushState = (...args) => {
      originalPushState(...args);
      notifyUrlChange();
    };
    history.replaceState = (...args) => {
      originalReplaceState(...args);
      notifyUrlChange();
    };
    window.addEventListener("popstate", notifyUrlChange);

    const observer = new MutationObserver(() => {
      // Opportunistic fallback in case navigation happened through a path
      // that bypassed the History API patch above.
      notifyUrlChange();

      const profilePicElement = findProfilePicElement();

      // If the profilePic has changed, update the userDetails
      if (profilePicElement) {
        const bestUrl = getBestProfilePicUrl(profilePicElement);
        if (bestUrl !== userDetails.profilePic) {
          userDetails.profilePic = bestUrl; // Update profilePic in the userDetails
          getLinkedInUserDetails(); // Trigger function to update the profilePic and other details
        }
      }
    });
    if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", notifyUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return <div className="absolute top-24 left-0 right-0 flex items-center justify-center"></div>;
};
