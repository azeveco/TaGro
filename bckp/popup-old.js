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

  // Fetch and display tab groups
  async function fetchTabGroups() {
    const tabGroups = await chrome.tabGroups.query({});
    displayTabGroups(tabGroups);
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

      // Map predefined color names to their hex values
      const colorMap = {
        blue: '#8AB4F8',
        red: '#F28B82',
        yellow: '#FDD663',
        green: '#81C995',
        pink: '#FF8BCB',
        purple: '#C58AF9',
        cyan: '#78D9EC',
        orange: '#FCAD70',
        gray: '#DADCE0',
      };

      // colorMap = {
        //   grey: {backgroundColor: `rgba(107, 114, 128, 0.1)`, borderColor: "#6b7280", color: "#67738a"},
        //   blue: {backgroundColor: `rgba(59, 130, 246, 0.15)`, borderColor: "#60a5fa", color: "#3b82f6"},
        //   red: {backgroundColor: `rgba(239, 68, 68, 0.15)`, borderColor: "#ef4444", color: "#dc2626"},
        //   yellow: {backgroundColor: `rgba(251, 191, 36, 0.15)`, borderColor: "#fbbf24", color: "#eeb31f"},
        //   green: {backgroundColor: `rgba(34, 197, 94, 0.15)`, borderColor: "#22c55e", color: "#15803d"},
        //   pink: {backgroundColor: `rgba(236, 72, 153, 0.15)`, borderColor: "#ec4899", color: "#be185d"},
        //   purple: {backgroundColor: `rgba(168, 85, 247, 0.15)`, borderColor: "#c084fc", color: "#a855f7"},
        //   cyan: {backgroundColor: `rgba(20, 184, 166, 0.15)`, borderColor: "#14b8a6", color: "#0f766e"},
        //   orange: {backgroundColor: `rgba(255, 153, 0, 0.15)`, borderColor: "#FF9900", color: "#FF9900"},
        // };

      const hexColor = colorMap[group.color] || '#FFFFFF'; // Default to white if color is unknown
      // if (isDarkMode) {
      //   li.style.backgroundColor = hexToRgba(hexColor, 0.2); // 50% transparency
      // } else {
      //   li.style.backgroundColor = hexToRgba(hexColor, 0.7); // 50% transparency
      // }

      // li.style.backgroundColor = hexToRgba(hexColor, 0.2); // 50% transparency
      li.style.color = hexColor; // Set the text color to match the group color

      if (isDarkMode) {
        li.style.backgroundColor = hexToRgba(hexColor, 0.2); // 50% transparency
        li.style.borderColor = hexToRgba(hexColor, 0.7); // Set the border color to match the group color
      } else {
        li.style.backgroundColor = hexToRgba(hexColor, 0.3); // 50% transparency
        li.style.borderColor = hexToRgba(hexColor, 1); // Set the border color to match the group color
      }

      li.addEventListener('click', () => {
        chrome.tabs.query({ groupId: group.id }, tabs => {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
          }
        });
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
    chrome.tabGroups.query({}, tabGroups => {
      const filteredGroups = tabGroups.filter(group =>
        (group.title || `Group ${group.id}`).toLowerCase().includes(query)
      );
      displayTabGroups(filteredGroups);
      autoHighlightFirstItem();
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

  // tabGroupsList.addEventListener('mouseout', (event) => {
  //   const items = Array.from(tabGroupsList.querySelectorAll('li'));
  //   items.forEach((item, index) => {
  //     item.style.opacity = index === currentIndex ? '1' : '0.6'; // Restore highlight to the current item
  //   });
  // });

  // Call autoHighlightFirstItem after fetching tab groups
  fetchTabGroups().then(autoHighlightFirstItem);
});
