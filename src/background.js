
// src/background.js
import { API_BASE_URL, AuthData } from "./config";

// This script can be used for handling events in the background
chrome.runtime.onInstalled.addListener(() => {
  console.log("Chrome Extension Installed!");
});

// Once-a-day (per profile) sync via the Groq-backed /admin/api/profile/sync endpoint.
// A service worker can't crawl profiles with no tab open for them, so "refresh every
// morning" is implemented as: the first time a given profile is viewed after 24h have
// passed, re-send its current top-card HTML so the backend re-parses and updates it.
const PROFILE_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

function getProfileIdFromUrl(url) {
  try {
    const match = new URL(url).pathname.match(/\/in\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

async function maybeSyncProfileWithGroq(userDetails, topCardHtml) {
  const profileId = userDetails && getProfileIdFromUrl(userDetails.profileUrl);
  if (!profileId || !topCardHtml) return;

  const storageKey = `profileSyncedAt_${profileId}`;
  const stored = await chrome.storage.local.get(storageKey);
  const lastSyncedAt = stored[storageKey];
  const isStale = !lastSyncedAt || Date.now() - lastSyncedAt > PROFILE_SYNC_INTERVAL_MS;
  if (!isStale) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/api/profile/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authtoken: AuthData.token },
      body: JSON.stringify({
        profile_id: profileId,
        profile_url: userDetails.profileUrl,
        html: topCardHtml,
      }),
    });
    if (response.ok) {
      await chrome.storage.local.set({ [storageKey]: Date.now() });
    }
  } catch (error) {
    console.error("ProfileInsight: Groq profile sync failed", error);
  }
}

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

let injectedTabs = {};

  // Listener for tab activation (switching between tabs)
// chrome.tabs.onActivated.addListener((activeInfo) => {
//   chrome.tabs.get(activeInfo.tabId, (tab) => {
//     if (tab.url && tab.url.includes("linkedin.com/in/")) {
//       // Inject the content script to get username
//       chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         files: ["contentScript.js"],
//       });
      
//     }
//   });
// });


chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && tab.url.includes("linkedin.com/in/") && !injectedTabs[tab.id]) {
      // Inject the content script to get username
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["contentScript.js"],
      });
      injectedTabs[tab.id] = true; // Mark the tab as injected
    }
  });
});

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   // Check if the tab's URL matches LinkedIn's profile URL structure
//   if (
//     tab.url &&
//     tab.url.includes("linkedin.com/in/") &&
//     changeInfo.status === "complete"
//   ) {
//     // Inject the content script into the active tab
//     chrome.scripting.executeScript({
//       target: { tabId: tabId },
//       files: ["contentScript.js"],
//     });
//   }
// });


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    tab &&
    tab.url &&
    tab.url.includes("linkedin.com/in/") &&
    changeInfo.status === "complete" &&
    !injectedTabs[tabId]
  ) {
    // Inject the content script if not already injected
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["contentScript.js"],
    });
    injectedTabs[tabId] = true; // Mark the tab as injected
  }
});


// Listener for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.userDetails) {
    chrome.storage.local.set({ linkedinUserDetails: request.userDetails }, () => {
    });
    maybeSyncProfileWithGroq(request.userDetails, request.topCardHtml);
    // Send a response back if needed
    sendResponse({ status: "success", userDetails: request.userDetails });
  }
  return true; 
});


// chrome.runtime.onMessage.addListener((message) => {
//   if (message.userDetails) {
//     setLinkedInUserDetails(message.userDetails); 
//   }
// });


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "linkedinCode") {
    const { code, state } = message;
    // Forward the message to the side panel
    chrome.runtime.sendMessage({ type: "authCodeReceived", code, state });
  }
});

// Runs the OAuth popup from the background service worker instead of the side
// panel: launchWebAuthFlow ties its "one flow at a time" lock to the calling
// window, and side panels aren't a real window, which made it fail immediately.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "launchLinkedInAuth") {
    chrome.identity.launchWebAuthFlow(
      { url: message.url, interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          sendResponse({
            error: chrome.runtime.lastError?.message || "No redirect URL returned",
          });
          return;
        }
        sendResponse({ redirectUrl });
      }
    );
    return true; // keep the message channel open for the async sendResponse
  }
});