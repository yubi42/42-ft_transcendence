import {getCSRFToken} from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUserData();

    const form = document.getElementById('update-form');
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        updateUserData();
    });
});

document.getElementById('back-button').addEventListener('click', () => {
    window.location.href = 'profile.html';
});

function loadCurrentUserData() {
    fetch('/user-api/profile/', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to load profile data');
        return response.json();
    })
    .then(data => {
        document.getElementById('display-name').value = data.display_name || '';
        document.getElementById('email').value = data.user.email || '';
    })
    .catch(error => console.error('Failed to load user data:', error));
}

function updateUserData() {
    const payload = {
        display_name: document.getElementById('display-name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        confirm_password: document.getElementById('confirm-password').value
    };

    fetch('/user-api/update-profile/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(payload),
        credentials: 'include',
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update profile');
        alert('Profile updated successfully!');
        window.location.href = 'profile.html';
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        alert('Failed to update profile.');
    });
}

