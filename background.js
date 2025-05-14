chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-tab-groups-menu') {
    chrome.action.openPopup().catch((error) => {
      console.error('Error opening popup:', error);
    });
  }
});
