// Use baseUrl defined in index.html

// Global function to update notification badge count
function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return; // Safety check
    
    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Function to fetch notifications (pending and on-call requests)
function fetchNotifications() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        showEmptyMessage('waiting-list', 'Authentication required');
        showEmptyMessage('oncall-list', 'Authentication required');
        return;
    }
    
    // Show loading state
    showEmptyMessage('waiting-list', 'Loading requests...');
    showEmptyMessage('oncall-list', 'Loading requests...');
    
    // Fetch requests using the user-specific endpoint
    fetch(`${baseUrl}/api/user/requests`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Split the data into pending and on-call
        const pendingRequests = data.filter(req => req.status === 'pending');
        const oncallRequests = data.filter(req => req.status === 'oncall');
        
        // Sort requests by schedule time
        const sortByTime = (a, b) => {
            const timeA = a.schedule ? new Date(a.schedule).getTime() : 0;
            const timeB = b.schedule ? new Date(b.schedule).getTime() : 0;
            return timeA - timeB;
        };
        
        pendingRequests.sort(sortByTime);
        oncallRequests.sort(sortByTime);
        
        // Update notification badge count
        updateNotificationBadge(pendingRequests.length + oncallRequests.length);
        
        // Render the requests
        renderNotificationList('waiting-list', pendingRequests);
        renderNotificationList('oncall-list', oncallRequests);
    })
    .catch(error => {
        console.error('Error fetching requests:', error);
        showEmptyMessage('waiting-list', 'Error loading requests');
        showEmptyMessage('oncall-list', 'Error loading requests');
    });
}

// Function to render notification list
function renderNotificationList(containerId, requests) {
    const container = document.getElementById(containerId);
    
    if (requests.length === 0) {
        if (containerId === 'waiting-list') {
            showEmptyMessage(containerId, 'No pending requests at this time');
        } else {
            showEmptyMessage(containerId, 'No on-call requests at this time');
        }
        return;
    }
    
    // Get current user data to highlight their requests
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentUserId = userData.id;
    
    let html = '';
    requests.forEach(request => {
        // Format the schedule time
        const scheduleDate = request.schedule ? new Date(request.schedule) : new Date();
        const scheduleTime = scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Format the date for display
        const scheduleDay = scheduleDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        // Check if this is the current user's request - use the is_current_user flag if available
        // Fall back to comparing IDs if the flag is not present
        const isCurrentUser = request.is_current_user === true || 
                             (currentUserId && (request.user_id === currentUserId || request.id === currentUserId));
        const currentUserClass = isCurrentUser ? 'current-user' : '';
        
        // Add countdown timer if status is oncall and counter exists
        let timerHtml = '';
        if (request.status === 'oncall' && request.counter) {
            // Add warning class if less than 3 minutes remain
            const warningClass = request.counter <= 3 ? 'warning' : '';
            timerHtml = `<span class="timer ${warningClass}">${request.counter}m left</span>`;
        }
        
        // Create a more structured notification item
        html += `
            <div class="notification-item ${currentUserClass}" data-id="${request.id}">
                ${timerHtml}
                <div class="name">${request.name || 'Unknown'}</div>
                <div class="details">
                    <span class="request-id-text">${request.request_id || ''}</span>
                    <span>${scheduleDay} at ${scheduleTime}</span>
                </div>
                <div class="info-display" style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <span class="info-label">Status:</span>
                    <span class="info-value status ${request.status === 'pending' ? 'waiting' : ''}">${request.status === 'pending' ? 'Waiting' : 'On Call'}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Helper function to show empty message
function showEmptyMessage(containerId, message) {
    document.getElementById(containerId).innerHTML = `
        <div class="empty-message">
            <i class="fas ${message.includes('Error') ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <p>${message}</p>
        </div>
    `;
}

// Initialize notification functionality
function initNotifications() {
    // Close notification panel
    document.getElementById('close-notification-btn').addEventListener('click', function() {
        // Close the notifications expanded state
        document.body.classList.remove('notifications-expanded');
                        // Re-enable scrolling
                        document.body.style.overflow = '';
        // Re-enable scrolling
        document.body.style.overflow = '';
    });
    
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
            // Show the selected tab content
            const tabName = this.getAttribute('data-tab');
            document.getElementById(tabName + '-tab').classList.remove('hidden');
        });
    });
    
    // Notification icon functionality
    document.getElementById('notification-icon').addEventListener('click', function() {
        try {
            // Toggle the notifications expanded state
            document.body.classList.add('notifications-expanded');
            // Disable scrolling
            document.body.style.overflow = 'hidden';
            
            // Fetch pending and on-call requests
            fetchNotifications();
        } catch (error) {
            console.error('Error opening notification panel:', error);
            
            // Show a generic error message
            showEmptyMessage('waiting-list', 'Error loading notifications');
            showEmptyMessage('oncall-list', 'Error loading notifications');
        }
    });
    
    // Check for notifications periodically
    setInterval(() => {
        if (document.body.classList.contains('notifications-expanded')) {
            fetchNotifications();
        }
    }, 10000);
    
    // Check for notifications on page load
    setTimeout(fetchNotifications, 1000);
}

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', initNotifications);
