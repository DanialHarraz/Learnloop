document.addEventListener("DOMContentLoaded", function () {
    fetchAllLeaderboards();

    async function fetchAllLeaderboards() {
        try {
            
            const currentResponse = await fetch('/streak/leaderboard/current');
            if (!currentResponse.ok) throw new Error('Failed to fetch current streak leaderboard');
            const currentData = await currentResponse.json();

            
            const longestResponse = await fetch('/streak/leaderboard/longest');
            if (!longestResponse.ok) throw new Error('Failed to fetch longest streak leaderboard');
            const longestData = await longestResponse.json();

            
            const partnerResponse = await fetch('/streak/leaderboard/partner');
            if (!partnerResponse.ok) throw new Error('Failed to fetch partner streak leaderboard');
            const partnerData = await partnerResponse.json();

            
            renderCurrentStreakLeaderboard(currentData);
            renderLongestStreakLeaderboard(longestData);
            renderPartnerLeaderboard(partnerData);
        } catch (error) {
            console.error("Error fetching leaderboard data:", error);
            displayNoDataMessage();
        }
    }

    function renderCurrentStreakLeaderboard(data) {
        console.log("Current Streak Leaderboard Data:", data);
        const currentStreakList = document.getElementById('currentStreakList');
        populateLeaderboard(currentStreakList, data, "currentStreak");
    }

    function renderLongestStreakLeaderboard(data) {
        console.log("Longest Streak Leaderboard Data:", data);
        const longestStreakList = document.getElementById('longestStreakList');
        populateLeaderboard(longestStreakList, data, "longestStreak");
    }

    function renderPartnerLeaderboard(data) {
        console.log("Partner Streak Leaderboard Data:", data);
        const partnerList = document.getElementById('partnerStreakList');
        partnerList.innerHTML = '';

        if (!data || data.length === 0) {
            partnerList.innerHTML = `<li class="no-data">No partner streak data available</li>`;
            return;
        }

        data.forEach((entry, index) => {
            const li = document.createElement('li');
            li.classList.add('leaderboard-item');

            const userAvatar = entry.user.avatar || 'https://via.placeholder.com/50';
            const userName = entry.user.name || 'Unknown User';
            const partnerAvatar = entry.partner.avatar || 'https://via.placeholder.com/50';
            const partnerName = entry.partner.name || 'Unknown Partner';
            const partnerStreak = entry.partnerStreak || 0;

            li.innerHTML = `
                <span class="rank">${index + 1}</span>
                <img src="${userAvatar}" alt="${userName}">
                <span class="vs-text"> & </span>
                <img src="${partnerAvatar}" alt="${partnerName}">
                <div class="details">
                    <strong>${userName} & ${partnerName}</strong>
                    <span class="streak">Streak: ${partnerStreak}</span>
                </div>
            `;

            partnerList.appendChild(li);
        });
    }

    function populateLeaderboard(listElement, data, key) {
        listElement.innerHTML = ''; 

        if (data.length === 0) {
            listElement.innerHTML = `<li class="no-data">No data available</li>`;
            return;
        }

        data.forEach((user, index) => {
            const li = document.createElement('li');
            li.classList.add('leaderboard-item');

            const avatar = user.user.avatar || 'https://via.placeholder.com/50';
            const name = user.user.name || 'Unknown User';
            const value = user[key] || 0; 
            
            li.innerHTML = `
                <span class="rank">${index + 1}</span>
                <img src="${avatar}" alt="${name}">
                <div class="details">
                    <strong>${name}</strong>
                    <span class="streak">${value}</span>
                </div>
            `;

            listElement.appendChild(li);
        });
    }

    function displayNoDataMessage() {
        const currentList = document.getElementById('currentStreakList');
        const longestList = document.getElementById('longestStreakList');
        const partnerList = document.getElementById('partnerStreakList');
    
        if (currentList) currentList.innerHTML = `<li class="no-data">No leaderboard data available</li>`;
        if (longestList) longestList.innerHTML = `<li class="no-data">No leaderboard data available</li>`;
        if (partnerList) partnerList.innerHTML = `<li class="no-data">No partner leaderboard data available</li>`;
    }
    
});
