document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search');
  const tabGroupsList = document.getElementById('tabGroupsList');
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Set the background color based on user preference
  chrome.storage.sync.get(['lightPopupBgColor', 'darkPopupBgColor'], (data) => {
    if (isDarkMode && data.darkPopupBgColor) {
      document.body.style.backgroundColor = data.darkPopupBgColor;
    } else if (!isDarkMode && data.lightPopupBgColor) {
      document.body.style.backgroundColor = data.lightPopupBgColor;
    }
  });

  // Auto-focus on the search input when the popup is opened
  searchInput.focus();

  // Fetch and display both open and saved tab groups, ensuring uniqueness
  async function fetchTabGroups() {
    const openTabGroups = await chrome.tabGroups.query({});
    chrome.storage.sync.get(['savedTabGroups'], (data) => {
      const savedTabGroups = data.savedTabGroups || [];

      // Combine and ensure unique tab groups by ID and title
      const allTabGroupsMap = new Map();

      // Add open tab groups to the map
      openTabGroups.forEach(group => {
        const uniqueKey = group.id || group.title; // Use ID if available, fallback to title
        allTabGroupsMap.set(uniqueKey, { ...group, isOpen: true });
      });

      // Add saved tab groups to the map only if they are not already present
      savedTabGroups.forEach(group => {
        const uniqueKey = group.id || group.title; // Use ID if available, fallback to title
        if (!allTabGroupsMap.has(uniqueKey)) {
          allTabGroupsMap.set(uniqueKey, { ...group, isOpen: false });
        }
      });

      const allTabGroups = Array.from(allTabGroupsMap.values());
      displayTabGroups(allTabGroups);
      autoHighlightFirstItem(); // Call autoHighlightFirstItem after displaying tab groups
    });
  }

  // Display tab groups in the list
  function displayTabGroups(tabGroups) {
    tabGroupsList.innerHTML = '';
    tabGroups.forEach(group => {
      const li = document.createElement('li');
      li.textContent = group.title || `Group ${group.id}`;

      // Convert the group color to RGBA with transparency
      const hexToRgba = (hex, alpha) => {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      let colorMap;

      // Map predefined color names
      if (isDarkMode) {
        colorMap = {
          grey: { backgroundColor: `rgba(75,85,99,0.2)`, borderColor: "#9ca3af", color: "#e5e7eb" },
          blue: { backgroundColor: `rgba(37,99,235,0.2)`, borderColor: "#60a5fa", color: "#bfdbfe" },
          red: { backgroundColor: `rgba(185,28,28,0.2)`, borderColor: "#ef4444", color: "#fecaca" },
          yellow: { backgroundColor: `rgba(202,138,4,0.2)`, borderColor: "#fbbf24", color: "#fde68a" },
          green: { backgroundColor: `rgba(21,128,61,0.2)`, borderColor: "#22c55e", color: "#bbf7d0" },
          pink: { backgroundColor: `rgba(190,24,93,0.2)`, borderColor: "#ec4899", color: "#fbcfe8" },
          purple: { backgroundColor: `rgba(147,51,234,0.2)`, borderColor: "#c084fc", color: "#e9d5ff" },
          cyan: { backgroundColor: `rgba(14,116,144,0.2)`, borderColor: "#14b8a6", color: "#a5f3fc" },
          orange: { backgroundColor: `rgba(194,65,12,0.2)`, borderColor: "#f97316", color: "#fed7aa" }
        }
      } else {
        colorMap = {
          grey: { backgroundColor: `rgba(107, 114, 128, 0.15)`, borderColor: "#6b7280", color: "#374151" },
          blue: { backgroundColor: `rgba(59, 130, 246, 0.15)`, borderColor: "#60a5fa", color: "#2563eb" },
          red: { backgroundColor: `rgba(239, 68, 68, 0.15)`, borderColor: "#ef4444", color: "#b91c1c" },
          yellow: { backgroundColor: `rgba(251, 191, 36, 0.15)`, borderColor: "#fbbf24", color: "#b45309" },
          green: { backgroundColor: `rgba(34, 197, 94, 0.15)`, borderColor: "#22c55e", color: "#15803d" },
          pink: { backgroundColor: `rgba(236, 72, 153, 0.15)`, borderColor: "#ec4899", color: "#be185d" },
          purple: { backgroundColor: `rgba(168, 85, 247, 0.15)`, borderColor: "#c084fc", color: "#9333ea" },
          cyan: { backgroundColor: `rgba(20, 184, 166, 0.15)`, borderColor: "#14b8a6", color: "#0e7490" },
          orange: { backgroundColor: `rgba(249, 115, 22, 0.15)`, borderColor: "#f97316", color: "#c2410c" }
        };
      }

      const hexColor = colorMap[group.color].color || '#FFFFFF'; // Default to white if color is unknown
      const hexBackgroundColor = colorMap[group.color].backgroundColor || '#FFFFFF'; // Default to white if color is unknown
      const hexBorderColor = colorMap[group.color].borderColor || '#FFFFFF'; // Default to white if color is unknown

      li.style.color = hexColor; // Set the text color to match the group color

      if (isDarkMode) {
        li.style.backgroundColor = hexBackgroundColor; // 50% transparency
        li.style.borderColor = hexToRgba(hexBorderColor, 0.7); // Set the border color to match the group color
      } else {
        li.style.backgroundColor = hexBackgroundColor; // 50% transparency
        li.style.borderColor = hexToRgba(hexBorderColor, 1); // Set the border color to match the group color
      }

      li.addEventListener('click', () => {
        if (group.id) {
          // If the group is open, activate the first tab in the group
          chrome.tabs.query({ groupId: group.id }, tabs => {
            if (tabs.length > 0) {
              chrome.tabs.update(tabs[0].id, { active: true });
            }
          });
        } else {
          // If the group is saved but not open, recreate the group
          chrome.tabs.create({ url: 'about:blank' }, (tab) => {
            chrome.tabs.group({ tabIds: tab.id }, (groupId) => {
              chrome.tabGroups.update(groupId, { title: group.title, color: group.color }, () => {
                // Update the saved tab group with the new group ID
                chrome.storage.sync.get(['savedTabGroups'], (data) => {
                  const savedTabGroups = data.savedTabGroups || [];
                  const updatedGroups = savedTabGroups.map(savedGroup => {
                    if (savedGroup.title === group.title) {
                      return { ...savedGroup, id: groupId };
                    }
                    return savedGroup;
                  });
                  chrome.storage.sync.set({ savedTabGroups: updatedGroups });
                });
              });
            });
          });
        }
      });
      tabGroupsList.appendChild(li);
    });
  }

  // Auto-highlight the first item when the popup is opened
  function autoHighlightFirstItem() {
    const items = Array.from(tabGroupsList.querySelectorAll('li'));
    if (items.length > 0) {
      currentIndex = 0;
      items.forEach((item, index) => {
        item.style.opacity = index === currentIndex ? '1' : '0.6';
      });
    }
  }

  // Filter tab groups based on search input
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    chrome.storage.sync.get(['savedTabGroups'], (data) => {
      const savedTabGroups = data.savedTabGroups || [];
      const allTabGroupsMap = new Map();

      // Combine open and saved tab groups
      chrome.tabGroups.query({}).then(openTabGroups => {
        openTabGroups.forEach(group => {
          allTabGroupsMap.set(group.id, { ...group, isOpen: true });
        });

        savedTabGroups.forEach(group => {
          if (!allTabGroupsMap.has(group.id)) {
            allTabGroupsMap.set(group.id, { ...group, isOpen: false });
          }
        });

        const allTabGroups = Array.from(allTabGroupsMap.values());
        const filteredGroups = allTabGroups.filter(group =>
          (group.title || `Group ${group.id}`).toLowerCase().includes(query)
        );
        displayTabGroups(filteredGroups);
        autoHighlightFirstItem();
      });
    });
  });

  // Handle keyboard navigation for tab groups
  let currentIndex = -1;

  document.addEventListener('keydown', (event) => {
    const items = Array.from(tabGroupsList.querySelectorAll('li'));

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      currentIndex = (currentIndex + 1) % items.length;
      items.forEach((item, index) => {
        item.style.opacity = index === currentIndex ? '1' : '0.6';
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      items.forEach((item, index) => {
        item.style.opacity = index === currentIndex ? '1' : '0.6';
      });
    } else if (event.key === 'Enter' && currentIndex >= 0) {
      items[currentIndex].click();
    }
  });

  tabGroupsList.addEventListener('mouseover', (event) => {
    const items = Array.from(tabGroupsList.querySelectorAll('li'));
    items.forEach(item => item.style.opacity = '0.6'); // Reset all items

    if (event.target.tagName === 'LI') {
      event.target.style.opacity = '1'; // Highlight the hovered item
    }
  });

  // Resets the highlighted item when mouse left the TaGro's Tab Group menu
  // tabGroupsList.addEventListener('mouseout', (event) => {
  //   const items = Array.from(tabGroupsList.querySelectorAll('li'));
  //   items.forEach((item, index) => {
  //     item.style.opacity = index === currentIndex ? '1' : '0.6'; // Restore highlight to the current item
  //   });
  // });

  // Call autoHighlightFirstItem after fetching tab groups
  fetchTabGroups().then(autoHighlightFirstItem);

  // Centralized function to update saved tab groups
  function updateSavedTabGroups(groupId, updatedProperties) {
    chrome.storage.sync.get(['savedTabGroups'], (data) => {
      const savedTabGroups = data.savedTabGroups || [];
      const updatedGroups = savedTabGroups.map(savedGroup => {
        if (savedGroup.id === groupId) {
          return { ...savedGroup, ...updatedProperties };
        }
        return savedGroup;
      });

      // Add new group if it doesn't exist
      if (!updatedGroups.some(group => group.id === groupId)) {
        updatedGroups.push({ id: groupId, ...updatedProperties });
      }

      chrome.storage.sync.set({ savedTabGroups: updatedGroups });
    });
  }

  // Listen for tab group creation
  chrome.tabGroups.onCreated.addListener((group) => {
    updateSavedTabGroups(group.id, { title: group.title, color: group.color });
  });

  // Listen for tab group updates
  chrome.tabGroups.onUpdated.addListener((group) => {
    updateSavedTabGroups(group.id, { title: group.title, color: group.color });
  });

  // Listen for tab group removal
  chrome.tabGroups.onRemoved.addListener((groupId) => {
    chrome.storage.sync.get(['savedTabGroups'], (data) => {
      const savedTabGroups = data.savedTabGroups || [];
      const updatedGroups = savedTabGroups.filter(savedGroup => savedGroup.id !== groupId);
      chrome.storage.sync.set({ savedTabGroups: updatedGroups });
    });
  });
});
