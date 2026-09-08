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

  const getLinkedInUserDetails = () => {
    userDetails = {}; // Reset the object each time to avoid old data

    const nameElement = document.querySelector('h1.XcqMGBrLgSDsfiaCuMsRfEqqGQIKDfI') as HTMLElement;
    if (nameElement) userDetails.name = nameElement.innerText.trim();

    const locationElement = document.querySelector('div.rKBFpHFpsvBDugPRbIgajakdAUGlocaMVcqC span.text-body-small:first-child') as HTMLElement;
    if (locationElement) userDetails.location = locationElement.innerText.trim();

    const headlineElement = document.querySelector('div.text-body-medium') as HTMLElement;
    if (headlineElement) userDetails.headline = headlineElement.innerText.trim();

    const profilePicElement = document.querySelector('.pv-top-card__non-self-photo-wrapper img') || document.querySelector('.pv-top-card__photo-wrapper img');

    if (profilePicElement instanceof HTMLImageElement) {
      userDetails.profilePic = profilePicElement.src;
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
      const profilePicElement = document.querySelector('img.evi-image') as HTMLImageElement;
      
        // If the profilePic has changed, update the userDetails
        if (profilePicElement && profilePicElement.src !== userDetails.profilePic) {
          userDetails.profilePic = profilePicElement.src; // Update profilePic in the userDetails
          getLinkedInUserDetails(); // Trigger function to update the profilePic and other details
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
