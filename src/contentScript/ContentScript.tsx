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
    return (verifiedBadge?.closest('section') as HTMLElement) || (document.querySelector('main') as HTMLElement) || null;
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
      chrome.runtime.sendMessage({ userDetails: userDetails });
    }
  };


  useEffect(() => {
    getLinkedInUserDetails();

    const observer = new MutationObserver(() => {
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
    };
  }, []);

  return <div className="absolute top-24 left-0 right-0 flex items-center justify-center"></div>;
};
