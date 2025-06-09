document.addEventListener('DOMContentLoaded', function() {
    console.log("Login.js - Document ready event fired");
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        console.log("Login form submitted");

        const loginData = {
            idno: document.getElementById('idno').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
        console.log("Login data:", JSON.stringify(loginData));

        const submitButton = this.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;

        fetch('https://jimboyaczon.pythonanywhere.com/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        })
        .then(response => {
            const statusCode = response.status;
            return response.json().then(data => {
                return { status: statusCode, data: data };
            });
        })
        .then(result => {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            
            try {
                console.log("Raw login response:", result.data);
                
                if (result.status === 200) {
                    localStorage.setItem('userToken', result.data.user.id || '');
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userId', result.data.user.id || '');
                    localStorage.setItem('userData', JSON.stringify(result.data.user));
                    
                    // Mark this as a fresh login so notifications will be reset
                    localStorage.setItem('freshLogin', 'true');
                    // Clear any previous request state
                    localStorage.removeItem('hadActiveRequests');
                    
                    setTimeout(() => {
                        console.log("Redirecting to main.html");
                        window.location.replace('main.html');
                    }, 200);
                } else {
                    console.error("Login failed with status:", result.status);
                    alert('Login failed: ' + (result.data.message || 'Unknown error'));
                }
            } catch (err) {
                console.error('Error processing login response:', err);
                alert('Unexpected error during login. Please try again.');
            }
        })
        .catch(error => {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
            
            console.error('Login request failed:', error);
            alert('Network error. Please check your connection and try again.');
        });
    });
});
