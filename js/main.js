document.addEventListener("DOMContentLoaded", function () {
  const part1 = document.querySelector(".part1");
  const part2 = document.querySelector(".part2");
  const part2_5 = document.querySelector(".part2_5");
  const part3 = document.querySelector(".part3");
  const part5 = document.querySelector(".part5");
  const part6 = document.querySelector(".part6");

  const queueBtn = document.getElementById("qbtn");
  const nowBtn = document.getElementById("nowbtn");
  const appointBtn = document.getElementById("appointbtn");
  const shsBtn = document.getElementById("shsbtn");
  const collegeBtn = document.getElementById("collegebtn");
  const backArrow = document.getElementById("arrow");
  const priorityBtn = document.getElementById("prioritybtn");

  // Define registrationData if it doesn't exist
  if (typeof window.registrationData === 'undefined') {
    window.registrationData = {
      details: {},
      date: new Date().toISOString().split('T')[0],  // Today's date
      time: new Date().toTimeString().substring(0, 5)  // Current time
    };
  }

  // Hide priority button by default
  if (priorityBtn) {
    priorityBtn.style.display = "none";
  }

  const courseInput = document.getElementById("courseInput"); 

  queueBtn.addEventListener("click", () => {
    // Reset any expired timer states to prevent incorrect status display
    resetQueueState();
    
    // Check if user has pending requests first
    checkPendingRequests().then(hasPendingRequest => {
      if (hasPendingRequest) {
        console.log("User already has a pending request, showing receipt");
        // Stay on the same page but show the receipt
        showExistingRequestReceipt();
      } else {
        // Normal flow if no pending requests
        part1.style.display = "none";
        part2.style.display = "block";
        part3.style.display = "none";
        part5.style.display = "none";
        part6.style.display = "none";
        part2_5.style.display = "none";
      }
    }).catch(error => {
      console.error("Error checking pending requests:", error);
      // Continue with normal flow on error
      part1.style.display = "none";
      part2.style.display = "block";
      part3.style.display = "none";
      part5.style.display = "none";
      part6.style.display = "none";
      part2_5.style.display = "none";
    });
  });

  nowBtn.addEventListener("click", () => {
    part2.style.display = "none";
    part3.style.display = "block";
  });

  appointBtn.addEventListener("click", () => {
    part2.style.display = "none";
    part2_5.style.display = "block";
  });

  shsBtn.addEventListener("click", () => {
    part3.style.display = "none";
    
    // Set level in registrationData
    if (typeof registrationData !== 'undefined') {
      registrationData.details.level = "SHS";
    }
    
    // Skip to payment options (handled by modified requestform.js)
  });

  collegeBtn.addEventListener("click", () => {
    part3.style.display = "none";
    
    // Set level in registrationData
    if (typeof registrationData !== 'undefined') {
      registrationData.details.level = "College";
    }
    
    // Skip to payment options (handled by modified requestform.js)
  });

  backArrow.addEventListener("click", () => {
    part1.style.display = "block";
    part2.style.display = "none";
    part2_5.style.display = "none";
    part3.style.display = "none";
    part5.style.display = "none";
    part6.style.display = "none";
  });

  // Function to check if user has priority access
  function checkUserPriorityAccess() {
    const priorityBtn = document.getElementById('prioritybtn');
    if (!priorityBtn) return;
    
    // Default to hiding the priority button
    priorityBtn.style.display = 'none';
    
    // Get user data from localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      // Check if user has priority_user flag
      if (userData && userData.flags && Array.isArray(userData.flags) && 
          userData.flags.includes('priority_user')) {
        console.log('User has priority access, showing priority button');
        priorityBtn.style.display = 'block';
      } else {
        console.log('User does not have priority access, priority button hidden');
        // Keep priority button hidden
      }
    } catch (e) {
      console.error('Error checking user priority access:', e);
    }
  }

  // Function to check if user has pending requests
  function checkPendingRequests() {
    return new Promise((resolve, reject) => {
      try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userIdno = userData.idno;
        
        if (!userIdno) {
          console.log('No user ID found, cannot check for pending requests');
          resolve(false);
          return;
        }
        
        const baseUrl = 'https://jimboyaczon.pythonanywhere.com';
        
        console.log(`Checking pending requests for user ID: ${userIdno}`);
        
        fetch(`${baseUrl}/api/requests/pending`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(pendingRequests => {
          console.log('All pending requests:', pendingRequests);
          
          // Check if any request belongs to current user using idno field
          const userRequest = pendingRequests.find(req => req.idno === userIdno);
          
          if (userRequest) {
            // Store the pending request in localStorage for later use
            userData.pendingRequest = userRequest;
            localStorage.setItem('userData', JSON.stringify(userData));
            console.log('Found pending request for user:', userRequest);
            resolve(true);
          } else {
            console.log('No pending requests found for this user');
            resolve(false);
          }
        })
        .catch(error => {
          console.error('Failed to fetch pending requests:', error);
          resolve(false);
        });
      } catch (e) {
        console.error('Error in checkPendingRequests:', e);
        resolve(false);
      }
    });
  }
  
  // Function to show receipt for an existing pending request
  function showExistingRequestReceipt() {
    try {
      // Get the stored pending request from userData
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (userData.pendingRequest) {
        console.log('Showing receipt for existing request:', userData.pendingRequest);
        
        // Format the request data for the receipt using idno field
        const requestData = {
          details: {
            // Use request_id for display, not the internal auto-increment id
            requestID: userData.pendingRequest.request_id || '',
            name: userData.pendingRequest.name || userData.name || '',
            id: userData.pendingRequest.idno || userData.idno || '', // Use idno as the ID
            level: userData.pendingRequest.level || userData.level || '',
            course: userData.pendingRequest.course || userData.course || '',
            track: userData.pendingRequest.track || userData.pendingRequest.course || '',
            payment: userData.pendingRequest.payment || '',
            status: userData.pendingRequest.status || 'Pending'
          },
          schedule: userData.pendingRequest.schedule || '',
          date: userData.pendingRequest.date || new Date().toISOString().split('T')[0],
          time: userData.pendingRequest.time || new Date().toTimeString().substring(0, 5)
        };
        
        // Show the receipt
        if (typeof window.showReceipt === 'function') {
          window.showReceipt(requestData);
        } else {
          console.error('showReceipt function not available');
          alert('You already have a pending request in the system.');
        }
      } else {
        console.warn('No pending request found in userData');
        alert('No pending request found.');
      }
    } catch (e) {
      console.error('Error showing existing request receipt:', e);
    }
  }

  const paymentButtons = document.querySelectorAll(".paybtn");

  paymentButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const btnId = btn.id;
      let selected;
      
      if (btnId === 'expressbtn') {
        selected = 'express';
      } else if (btnId === 'promissorybtn') {
        selected = 'regular';
      } else if (btnId === 'prioritybtn') {
        selected = 'priority';
      }
      
      console.log("Payment selected:", selected);
      
      if (typeof registrationData !== 'undefined') {
        registrationData.details.payment = selected;
        
        let requestNumber = registrationData.details.requestID;
        
        if (!requestNumber) {
          // Generate a requestID based on the current time if none exists
          requestNumber = new Date().getTime().toString().slice(-4);
          registrationData.details.requestID = requestNumber;
        }
        
        if (requestNumber && requestNumber.includes('-')) {
          requestNumber = requestNumber.split('-').pop();
        }
        
        if (selected === 'regular') {
          registrationData.details.requestID = `R-${requestNumber}`;
        } else if (selected === 'priority') {
          registrationData.details.requestID = `P-${requestNumber}`;
        } else if (selected === 'express') {
          registrationData.details.requestID = `E-${requestNumber}`;
        }
        
        console.log("Updated request ID:", registrationData.details.requestID);
        
        if (window.registrationData) {
          window.registrationData.details.payment = selected;
          console.log("Set window.registrationData.details.payment =", selected);
        }
      }
      
      part5.style.display = "none";
      part6.style.display = "block";
    });
  });

  // Helper function to reset queue state when starting a new request
  function resetQueueState() {
    console.log("Resetting queue state for new request");
    try {
      // Remove any expired timer data
      localStorage.removeItem('expiredRequests');
      localStorage.removeItem('timerStates');
      
      // Reset notification state if function exists
      if (typeof resetNotificationState === 'function') {
        resetNotificationState();
      }
      
      // Clear any request ID tracking in registration data
      if (window.registrationData && window.registrationData.details) {
        window.registrationData.details.requestID = null;
      }
      
      console.log("Queue state reset complete");
    } catch (e) {
      console.error("Error resetting queue state:", e);
    }
  }
});

function nextAction() {
  document.querySelector(".part2_5").style.display = "none";
  document.querySelector(".part3").style.display = "block";
}


document.getElementById("nowbtn").addEventListener("click", () => {
  const now = new Date();
  setAppointmentDate(now.toISOString());
  document.querySelector('.part2_5').style.display = "none"; 
});

// Add debug function to test receipt display
function testReceiptDisplay() {
    console.log("Testing receipt display");
    const testData = {
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        details: {
            id: "TEST-123",
            name: "Test User",
            requestID: "E-9999",
            level: "College",
            course: "Computer Science",
            track: "IT",
            section: "A",
            payment: "express",
            method: "fullpayment",
            status: "pending"
        }
    };
    
    if (typeof window.showReceipt === 'function') {
        try {
            window.showReceipt(testData);
            console.log("Test receipt displayed successfully");
        } catch (e) {
            console.error("Error displaying test receipt:", e);
        }
    } else {
        console.error("showReceipt function not available for testing");
        alert("Receipt function not available. Check console for details.");
    }
}


