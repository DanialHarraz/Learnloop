const fetchDashboardData = async () => {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));

        if (!userData || !userData.id) {
            console.error('No userId found in localStorage');
            return;
        }

        const userId = userData.id;
        const response = await fetch(`/progress-tracker/progress/dashboard/${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dashboard Data:', data); 
        console.log('statsByStatus:', data.statsByStatus);


        // Render the bar chart for statsByStatus
        if (data.statsByStatus) {
            const statsByStatus = formatStatsByStatus(data.statsByStatus);
            renderBarChart(statsByStatus);
            displayProgressBreakdown(data.statsByStatus);
            
            
        } else {
            consol
            e.warn('No statsByStatus data available.');
        }
        if (data.progressBreakdown) {
            displayProgressBreakdownFromData(data.progressBreakdown);
        } else {
            console.warn('No progress breakdown data available.');
        }
        

        // Render the line chart for tasksByDate
        if (data.tasksByDate) {
            displayTaskTrends(data.tasksByDate);
            renderLineChart(data.tasksByDate);
            displayHabitInsights(data.tasksByDate);
        }
        else console.warn('No task data by date available.');

        // Display the top trackers
        if (data.topTrackers) displayTopTrackers(data.topTrackers);
        else console.warn('No top trackers data available.');

        

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
};

// Helper function to format statsByStatus for the bar chart
const formatStatsByStatus = (stats) => {
    const labels = Object.keys(stats);
    const data = labels.map(label => (stats[label] ? stats[label].count : 0));
    return { labels, data };
};

const displayProgressBreakdownFromData = (progressBreakdown) => {
    document.getElementById('almostComplete').textContent = `Almost Complete (90%+): ${progressBreakdown.almostComplete}`;
    document.getElementById('halfway').textContent = `Halfway (50-89%): ${progressBreakdown.halfway}`;
    document.getElementById('lowProgress').textContent = `Low Progress (<50%): ${progressBreakdown.lowProgress}`;
};



const displayHabitInsights = (tasksByDate) => {
    const dates = Object.keys(tasksByDate);
    const taskCounts = Object.values(tasksByDate);

    // Find consistent days (days with 5+ tasks completed)
    const consistentDays = taskCounts.filter(count => count >= 5).length;

   
    let longestStreak = 0;
    let currentStreak = 0;
    for (const count of taskCounts) {
        if (count > 0) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }


    document.getElementById('consistentDays').textContent = `Consistent Days (5+ tasks): ${consistentDays}`;
    document.getElementById('longestStreak').textContent = `Longest Streak of Productivity: ${longestStreak} days`;
};



const displayGoalBreakdown = (statsByStatus) => {
    const completedTrackers = statsByStatus.COMPLETED?.count || 0;
    const ongoingTrackers = statsByStatus.ONGOING?.count || 0;
    const notBegunTrackers = statsByStatus.NOT_BEGUN?.count || 0;

    // Calculate progress percentages
    const allTrackers = [...statsByStatus.COMPLETED?.trackers || [], ...statsByStatus.ONGOING?.trackers || [], ...statsByStatus.NOT_BEGUN?.trackers || []];
    const progressPercentages = allTrackers.map(tracker => tracker.progressPercentage); 


    const completed = progressPercentages.filter(p => p = 100).length
    const almostComplete = progressPercentages.filter(p => p >= 90).length; // 90%+
    const halfway = progressPercentages.filter(p => p >= 50 && p < 90).length; // 50-89%
    const lowProgress = progressPercentages.filter(p => p < 50).length; // <50%

    // Display the progress breakdown
    document.getElementById('completed').textContent = `Completed (100%): ${completed}`;
    document.getElementById('almostComplete').textContent = `Almost Complete (90%+): ${almostComplete}`;
    document.getElementById('halfway').textContent = `Halfway (50-89%): ${halfway}`;
    document.getElementById('lowProgress').textContent = `Low Progress (<50%): ${lowProgress}`;
};




// Toggle between themes
const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
};

document.getElementById('themeToggle').addEventListener('click', toggleTheme);


const fetchProgressBreakdown = async (userId) => {
    try {
        const response = await fetch(`/progress-tracker/progress/dashboard/${userId}`);
        if (response.ok) {
            const data = await response.json();
            console.log('Progress Breakdown Data:', data);
            displayGoalBreakdown(data);  
            displayProgressBreakdown(data);
        } else {
            console.error('Failed to fetch progress breakdown');
        }
    } catch (error) {
        console.error('Error fetching progress breakdown:', error);
    }
};


const displayTaskTrends = (tasksByDate) => {
    const dates = Object.keys(tasksByDate);
    const taskCounts = Object.values(tasksByDate);

    // Find the most productive day
    const maxTasks = Math.max(...taskCounts);
    const mostProductiveDay = dates[taskCounts.indexOf(maxTasks)];

    // Calculate average tasks per day
    const totalTasks = taskCounts.reduce((sum, count) => sum + count, 0);
    const averageTasksPerDay = (totalTasks / dates.length).toFixed(1);

    // Update the UI
    document.getElementById('mostProductiveDay').textContent = `Most Productive Day: ${mostProductiveDay} (${maxTasks} tasks)`;
    document.getElementById('averageTasksPerDay').textContent = `Average Tasks Per Day: ${averageTasksPerDay}`;
};



const renderBarChart = (stats) => {
    const { labels, data } = stats;

    new Chart(document.getElementById('statusChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Tasks by Status',
                data,
                backgroundColor: ['#ff9999', '#66b3ff', '#99ff99'],
            }]
        },
    });
};


// // Render the line chart for tasks by date data
// const renderLineChart = (tasksByDate) => {
//     const labels = Object.keys(tasksByDate);
//     const data = Object.values(tasksByDate);

//     new Chart(document.getElementById('trendChart'), {
//         type: 'line',
//         data: {
//             labels,
//             datasets: [{
//                 label: 'Tasks Completed Over Time',
//                 data,
//                 borderColor: '#4caf50',
//                 fill: false,
//             }]
//         },  
//     });
// };

const renderLineChart = (tasksByDate) => {
    const labels = Object.keys(tasksByDate);
    const data = Object.values(tasksByDate);

    new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Tasks Completed Over Time',
                data,
                borderColor: '#4caf50',
                fill: false,
            }]
        },
    });
};


const displayTopTrackers = (topTrackers) => {
    const container = document.getElementById('topTrackers');
    container.innerHTML = topTrackers.map(tracker => {
        return `
            <div class="tracker">
                <h3>${tracker.title}</h3>
                <p>Status: ${tracker.status}</p>
                <p>Progress: ${tracker.completedTasks}/${tracker.totalTasks}</p>
            </div>
        `;
    }).join('');
};




const setLoadingState = (isLoading) => {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = isLoading ? 'block' : 'none';
};


const showError = (message) => {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
};


const hideError = () => {
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'none';
};

const displayProgressBreakdown = (statsByStatus) => {
   
    const completed = statsByStatus.COMPLETED?.count || 0;
    const overdue = statsByStatus.OVERDUE?.count || 0;
    const ongoing = statsByStatus.ONGOING?.count || 0;

    document.getElementById('completedTasks').textContent = `Completed: ${completed}`;
    document.getElementById('overdueTasks').textContent = `Overdue: ${overdue}`;
    document.getElementById('upcomingTasks').textContent = `Ongoing: ${ongoing}`;
};


// Call the fetch function on page load
fetchDashboardData();
