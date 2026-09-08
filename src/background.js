
// src/background.js

// This script can be used for handling events in the background
chrome.runtime.onInstalled.addListener(() => {
  console.log("Chrome Extension Installed!");
});

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