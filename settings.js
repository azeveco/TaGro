document.addEventListener('DOMContentLoaded', () => {
  const lightBgColorInput = document.getElementById('lightBgColor');
  const darkBgColorInput = document.getElementById('darkBgColor');
  const saveBtn = document.getElementById('saveBtn');

  const defaultLightColor = '#F9F9F9'; // Default light mode color
  const defaultDarkColor = '#1E1E1E'; // Default dark mode color

  // Load the saved colors or set defaults
  chrome.storage.sync.get(['lightPopupBgColor', 'darkPopupBgColor'], (data) => {
    lightBgColorInput.value = data.lightPopupBgColor || defaultLightColor;
    darkBgColorInput.value = data.darkPopupBgColor || defaultDarkColor;
  });

  // Save the selected colors
  saveBtn.addEventListener('click', () => {
    const lightColor = lightBgColorInput.value;
    const darkColor = darkBgColorInput.value;
    chrome.storage.sync.set({ lightPopupBgColor: lightColor, darkPopupBgColor: darkColor }, () => {
      alert('Background colors saved!');
    });
  });
});
