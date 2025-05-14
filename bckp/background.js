chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-tab-groups-menu') {
    chrome.action.openPopup().catch((error) => {
      console.error('Error opening popup:', error);
    });
  }
});

// Listen for tab group creation, updates, and removal
chrome.tabGroups.onCreated.addListener((group) => {
  saveTabGroup(group);
});

chrome.tabGroups.onUpdated.addListener((group) => {
  saveTabGroup(group);
});

chrome.tabGroups.onRemoved.addListener((groupId) => {
  removeTabGroup(groupId);
});

// Save tab group to storage
function saveTabGroup(group) {
  chrome.storage.sync.get(['savedTabGroups'], (data) => {
    const savedTabGroups = data.savedTabGroups || [];
    const updatedGroups = savedTabGroups.filter(g => g.id !== group.id);
    updatedGroups.push(group);
    chrome.storage.sync.set({ savedTabGroups: updatedGroups });
  });
}

// Remove tab group from storage
function removeTabGroup(groupId) {
  chrome.storage.sync.get(['savedTabGroups'], (data) => {
    const savedTabGroups = data.savedTabGroups || [];
    const updatedGroups = savedTabGroups.filter(g => g.id !== groupId);
    chrome.storage.sync.set({ savedTabGroups: updatedGroups });
  });
}

// Save all currently open tab groups to storage
function saveAllOpenTabGroups() {
  chrome.tabGroups.query({}, (openTabGroups) => {
    chrome.storage.sync.get(['savedTabGroups'], (data) => {
      const savedTabGroups = data.savedTabGroups || [];
      const updatedGroups = [...savedTabGroups];

      openTabGroups.forEach(group => {
        const existingIndex = updatedGroups.findIndex(g => g.id === group.id);
        if (existingIndex !== -1) {
          updatedGroups[existingIndex] = group; // Update existing group
        } else {
          updatedGroups.push(group); // Add new group
        }
      });

      chrome.storage.sync.set({ savedTabGroups: updatedGroups });
    });
  });
}

// Call saveAllOpenTabGroups periodically to ensure all open tab groups are saved
setInterval(saveAllOpenTabGroups, 5000); // Save every 5 seconds
