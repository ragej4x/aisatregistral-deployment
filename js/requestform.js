let currentUserData = null;

// Load user data at startup
document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUserData();
});

function loadCurrentUserData() {
    // Try to get user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            currentUserData = JSON.parse(userData);
            console.log("User data loaded:", currentUserData);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    } else {
        console.log('No user data found in localStorage');
        return null;
    }
    return currentUserData;
}

function checkUserPriorityAccess() {
    const priorityBtn = document.getElementById('prioritybtn');
    
    // Default to hiding the priority button
    if (priorityBtn) {
        priorityBtn.style.display = 'none';
    }
    
    // If no user data, try to get it from localStorage
    if (!currentUserData) {
        loadCurrentUserData();
    }
    
    // Check if user has priority_user flag
    if (currentUserData && currentUserData.flags && currentUserData.flags.includes('priority_user')) {
        console.log('User has priority access');
        if (priorityBtn) {
            priorityBtn.style.display = 'block';
        }
    } else {
        console.log('User does not have priority access');
    }
}

function showPaymentOptions() {
    // Make sure registration data is initialized
    if (typeof registrationData === 'undefined') {
        registrationData = {
            details: {}
        };
    }
    
    // Auto-fill registration data from the user's profile
    const userData = loadCurrentUserData();
    if (userData) {
        registrationData.details.name = userData.name || '';
        registrationData.details.id = userData.idno || '';
        
        // Get the level (SHS or College) from the currently active button
        const shsActive = document.querySelector('.part3').style.display === 'none' && 
                          document.getElementById('shsbtn').classList.contains('active');
        
        registrationData.details.level = shsActive ? 'SHS' : 'College';
        
        // Use course/strand from user data if available
        registrationData.details.course = userData.course || '';
        registrationData.details.track = registrationData.details.course;
        
        // Provide default section even though we don't collect it from the UI
        registrationData.details.section = userData.section || 'Default';
        
        console.log("Auto-filled registration data:", registrationData.details);
    }
    
    // Skip part4 (form) and go directly to payment options
    document.querySelector('.part5').style.display = 'block';
    
    // Check if user has priority access
    checkUserPriorityAccess();
}

// Modify the flow to skip part4 and go straight to payment options
function skipToPaymentOptions() {
    // Hide part3
    document.querySelector('.part3').style.display = 'none';
    
    // Show payment options directly
    showPaymentOptions();
}

// Override the event listeners to skip part4
document.addEventListener('DOMContentLoaded', function() {
    const shsBtn = document.getElementById('shsbtn');
    const collegeBtn = document.getElementById('collegebtn');
    
    if (shsBtn) {
        // Remove old listener
        const newShs = shsBtn.cloneNode(true);
        shsBtn.parentNode.replaceChild(newShs, shsBtn);
        
        // Add new listener that skips part4
        newShs.addEventListener('click', function() {
            if (typeof registrationData === 'undefined') {
                registrationData = { details: {} };
            }
            registrationData.details.level = "SHS";
            skipToPaymentOptions();
        });
    }
    
    if (collegeBtn) {
        // Remove old listener
        const newCollege = collegeBtn.cloneNode(true);
        collegeBtn.parentNode.replaceChild(newCollege, collegeBtn);
        
        // Add new listener that skips part4
        newCollege.addEventListener('click', function() {
            if (typeof registrationData === 'undefined') {
                registrationData = { details: {} };
            }
            registrationData.details.level = "College";
            skipToPaymentOptions();
        });
    }
});

function submitRequest() {
  // Ensure we have valid userData before proceeding
  const userData = loadCurrentUserData() || {};
  
  if (!registrationData.details) {
    registrationData.details = {};
  }
  
  // Make sure the ID in registrationData matches the logged in user's ID
  registrationData.details.id = userData.idno || '';
  registrationData.details.name = userData.name || '';
  
  // Use course/program from userData if available
  if (!registrationData.details.course && userData.course) {
    registrationData.details.course = userData.course;
  }
  
  if (!registrationData.details.track && userData.course) {
    registrationData.details.track = userData.course;
  }

  // Ensure section has a default value
  if (!registrationData.details.section) {
    registrationData.details.section = userData.section || 'Default';
  }

  const postData = {
    idno: registrationData.details.id,
    request_id: registrationData.details.requestID,
    track: registrationData.details.track,
    section: registrationData.details.section, // Will now always have a value
    student_id: registrationData.details.id,
    schedule: `${registrationData.date} ${registrationData.time}:00`,
    method: registrationData.details.method,
    payment: registrationData.details.payment,
    status: registrationData.details.status
  };

  fetch('https://jimboyaczon.pythonanywhere.com/api/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log("Request submitted:", data);
    // Don't use alert - the receipt will be shown
  })
  .catch(error => {
    console.error("Request submission failed:", error);
    alert("Request submission failed. Please try again.");
  });
}
