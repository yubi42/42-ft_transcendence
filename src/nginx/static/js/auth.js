import { showLoginForm } from './dom-utils.js';
import { unsetName } from './globals.js';

export function getCSRFToken() {
    let csrfToken = null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        if (cookie.trim().startsWith('csrftoken=')) {
            csrfToken = cookie.trim().substring('csrftoken='.length);
        }
    }
    return csrfToken;
}

export async function postAPI(url, data, authRequired = false) {
    let headers = {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
    };

    if (authRequired) {
        const token = getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    let response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
        credentials: 'include',
    });

    if (response.status === 401 && authRequired) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${getAccessToken()}`;
            response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data),
                credentials: 'include',
            });
        }
    }

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}


export async function login(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await postAPI('/user-api/login/', data, false);

        if (response.two_fa_required) {
            alert('2FA required. Check your email for the OTP.');
            show2FAForm(response.username);
        } else if (response.tokens) {
            saveTokens(response.tokens);
            window.location.href = '/';
        } else {
            alert(response.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

export async function verify2FA(event, username) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const otp = formData.get('otp');

    try {
        const response = await postAPI('/user-api/2fa/verify/', { otp, username });  // ✅ Send username

        if (response.tokens) {
            saveTokens(response.tokens);
            alert('2FA verification successful!');
            window.location.href = '/';
        } else {
            alert(response.error || '2FA verification failed');
        }
    } catch (error) {
        console.error('2FA verification error:', error);
        alert('2FA verification failed: ' + error.message);
    }
}


export async function resendOTP(event) {
    event.preventDefault();
    try {
        const response = await postAPI('/user-api/2fa/resend-otp/', {});
        if (response.message) {
            alert('A new OTP has been sent to your email.');
        } else {
            alert(response.error || 'Failed to resend OTP.');
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        alert('Failed to resend OTP: ' + error.message);
    }
}

export function show2FAForm(username) {
    const mainContent = document.querySelector('body');
    mainContent.innerHTML = `
        <h1>Verify OTP</h1>
        <form id="2fa-form">
            <input type="text" name="otp" placeholder="Enter OTP" required>
            <button type="submit">Verify</button>
        </form>
        <button id="resend-otp">Resend OTP</button>
    `;

    const twoFAForm = document.getElementById('2fa-form');
    twoFAForm.addEventListener('submit', (event) => verify2FA(event, username));

    document.getElementById('resend-otp').addEventListener('click', resendOTP);
}

export async function signup(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await postAPI('/user-api/signup/', data, false);
        if (response.message === 'User created successfully') {
            alert('Signup successful! Please log in.');
            showLoginForm();
        } else {
            alert(response.error || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    }
}

export async function logout() {
    try {
        await postAPI('/user-api/logout/', {}, true);
        removeTokens();
        unsetName();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
}


export function saveTokens(tokens) {
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
}

export function getAccessToken() {
    return localStorage.getItem('accessToken');
}

export function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

export function removeTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}
