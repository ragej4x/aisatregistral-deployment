document.addEventListener('DOMContentLoaded', function() {
    const profileModal = document.getElementById('profileModal');
    const closeBtn = document.getElementById('closeProfileModal');
    const gearIcon = document.getElementById('gear');
    const logoutBtn = document.getElementById('logoutBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    
    const profileFirstName = document.getElementById('profileFirstName');
    const profileMiddleName = document.getElementById('profileMiddleName');
    const profileLastName = document.getElementById('profileLastName');
    const profileIdno = document.getElementById('profileIdno');
    const profileCell = document.getElementById('profileCell');
    const profileEmail = document.getElementById('profileEmail');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    gearIcon.addEventListener('click', function() {
        loadUserProfile();
        profileModal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', function() {
        profileModal.style.display = 'none';
        clearPasswordFields();
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === profileModal) {
            profileModal.style.display = 'none';
            clearPasswordFields();
        }
    });
    
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });
    
    saveProfileBtn.addEventListener('click', function() {
        saveProfile();
    });
    
    function loadUserProfile() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!userData.id) {
            fetchUserData();
        } else {
            splitAndSetNameFields(userData.name || '');
            profileIdno.value = userData.idno || '';
            profileCell.value = userData.cell || '';
            profileEmail.value = userData.email || '';
        }
    }
    
    function splitAndSetNameFields(fullName) {
        const nameParts = fullName.trim().split(' ');
        
        if (nameParts.length === 1) {
            profileFirstName.value = nameParts[0] || '';
            profileMiddleName.value = '';
            profileLastName.value = '';
        } else if (nameParts.length === 2) {
            profileFirstName.value = nameParts[0] || '';
            profileMiddleName.value = '';
            profileLastName.value = nameParts[1] || '';
        } else if (nameParts.length >= 3) {
            profileFirstName.value = nameParts[0] || '';
            
            if (nameParts.length > 3) {
                profileMiddleName.value = nameParts.slice(1, -1).join(' ');
            } else {
                profileMiddleName.value = nameParts[1] || '';
            }
            
            profileLastName.value = nameParts[nameParts.length - 1] || '';
        }
    }
    
    function combineNameFields() {
        const firstName = profileFirstName.value.trim();
        const middleName = profileMiddleName.value.trim();
        const lastName = profileLastName.value.trim();
        
        let fullName = firstName;
        
        if (middleName) {
            fullName += ' ' + middleName;
        }
        
        if (lastName) {
            fullName += ' ' + lastName;
        }
        
        return fullName;
    }
    
    function fetchUserData() {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            alert('Error: User information not found. Please login again.');
            return;
        }
        
        saveProfileBtn.disabled = true;
        profileFirstName.disabled = true;
        profileMiddleName.disabled = true;
        profileLastName.disabled = true;
        profileIdno.disabled = true;
        profileCell.disabled = true;
        profileEmail.disabled = true;
        
        profileFirstName.placeholder = "Loading...";
        profileMiddleName.placeholder = "Loading...";
        profileLastName.placeholder = "Loading...";
        profileIdno.placeholder = "Loading...";
        profileCell.placeholder = "Loading...";
        profileEmail.placeholder = "Loading...";
        
        fetch(`https://jimboyaczon.pythonanywhere.com/api/user/${userId}`, {
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
        .then(result => {
            if (result.user) {
                if (!result.user.flags) {
                    result.user.flags = [];
                }
                
                localStorage.setItem('userData', JSON.stringify(result.user));
                console.log('User data with flags saved:', result.user);
                
                splitAndSetNameFields(result.user.name || '');
                profileIdno.value = result.user.idno || '';
                profileCell.value = result.user.cell || '';
                profileEmail.value = result.user.email || '';
                
                profileFirstName.placeholder = "First Name";
                profileMiddleName.placeholder = "Middle Name";
                profileLastName.placeholder = "Surname";
                profileIdno.placeholder = "ID Number";
                profileCell.placeholder = "Cell Phone (e.g., 09XX XXX XXXX)";
                profileEmail.placeholder = "Email";
            } else {
                alert('Error: ' + (result.message || 'Failed to load profile data'));
                
                profileFirstName.placeholder = "First Name";
                profileMiddleName.placeholder = "Middle Name";
                profileLastName.placeholder = "Surname";
                profileIdno.placeholder = "ID Number";
                profileCell.placeholder = "Cell Phone (e.g., 09XX XXX XXXX)";
                profileEmail.placeholder = "Email";
            }
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            
            let errorMessage = 'Failed to load profile data';
            if (error.status) {
                errorMessage += ` (Status: ${error.status})`;
            }
            
            alert('Error: ' + errorMessage);
            
            profileFirstName.placeholder = "First Name";
            profileMiddleName.placeholder = "Middle Name";
            profileLastName.placeholder = "Surname";
            profileIdno.placeholder = "ID Number";
            profileCell.placeholder = "Cell Phone (e.g., 09XX XXX XXXX)";
            profileEmail.placeholder = "Email";
        })
        .finally(() => {
            saveProfileBtn.disabled = false;
            profileFirstName.disabled = false;
            profileMiddleName.disabled = false;
            profileLastName.disabled = false;
            profileIdno.disabled = false;
            profileCell.disabled = false;
            profileEmail.disabled = false;
        });
    }
    
    function saveProfile() {
        if (!profileFirstName.value.trim()) {
            alert('Error: First Name is required');
            profileFirstName.focus();
            return;
        }
        
        if (!profileLastName.value.trim()) {
            alert('Error: Surname is required');
            profileLastName.focus();
            return;
        }
        
        if (!profileIdno.value.trim()) {
            alert('Error: ID Number is required');
            profileIdno.focus();
            return;
        }
        
        if (!profileEmail.value.trim()) {
            alert('Error: Email is required');
            profileEmail.focus();
            return;
        }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(profileEmail.value.trim())) {
            alert('Error: Please enter a valid email address');
            profileEmail.focus();
            return;
        }
        
        if (currentPassword.value || newPassword.value || confirmPassword.value) {
            if (!currentPassword.value) {
                alert('Error: Current password is required when updating password');
                currentPassword.focus();
                return;
            }
            
            if (!newPassword.value) {
                alert('Error: New password is required when updating password');
                newPassword.focus();
                return;
            }
            
            if (!confirmPassword.value) {
                alert('Error: Please confirm your new password');
                confirmPassword.focus();
                return;
            }
            
            if (newPassword.value !== confirmPassword.value) {
                alert('Error: New passwords do not match');
                confirmPassword.focus();
                return;
            }
        }
        
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userId = userData.id;
        
        if (!userId) {
            alert('Error: User information not found. Please login again.');
            return;
        }
        
        updateProfileData(userId);
    }
    
    function updateProfileData(userId) {
        const fullName = combineNameFields();
        
        const profileData = {
            userId: userId,
            name: fullName,
            idno: profileIdno.value.trim(),
            cell: profileCell.value.trim(),
            email: profileEmail.value.trim()
        };
        
        if (currentPassword.value && newPassword.value) {
            if (newPassword.value !== confirmPassword.value) {
                alert('Error: New passwords do not match. Please try again.');
                return;
            }
            
            profileData.currentPassword = currentPassword.value;
            profileData.newPassword = newPassword.value;
        }
        
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = 'Saving...';
        
        fetch('https://jimboyaczon.pythonanywhere.com/api/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        })
        .then(response => {
            return response.json().then(data => {
                return { status: response.status, data };
            });
        })
        .then(result => {
            if (result.status === 200) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                userData.name = profileData.name;
                userData.idno = profileData.idno;
                userData.cell = profileData.cell;
                userData.email = profileData.email;
                localStorage.setItem('userData', JSON.stringify(userData));
                
                alert('Profile updated successfully');
                clearPasswordFields();
                profileModal.style.display = 'none';
            } else {
                alert('Error: ' + (result.data.message || 'Failed to update profile'));
            }
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            
            let errorMessage = 'Failed to update profile';
            
            if (error.status === 400) {
                try {
                    if (error.data && error.data.message) {
                        switch (error.data.message) {
                            case 'ID number already in use':
                                errorMessage = 'The ID number you entered is already being used by another account';
                                break;
                            case 'Email already in use':
                                errorMessage = 'The email address you entered is already being used by another account';
                                break;
                            case 'Current password is incorrect':
                                errorMessage = 'The current password you entered is incorrect';
                                break;
                            default:
                                errorMessage = error.data.message;
                        }
                    }
                } catch (e) {
                    errorMessage = error.message || errorMessage;
                }
            }
            
            alert('Error: ' + errorMessage);
        })
        .finally(() => {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save Changes';
        });
    }
    
    function clearPasswordFields() {
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
    }
});

