import { getCSRFToken, logout, getRefreshToken, getAccessToken, removeTokens} from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    fetchProfileData();
    fetchFriends();
	fetchMatchHistory();
    fetchPendingRequests();
    document.getElementById('logout-button').addEventListener('click', logout);
    document.getElementById('settings-button').addEventListener('click', function() {
        window.location.href = 'update-profile.html';
    });
    document.getElementById('home-button').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    document.getElementById('change-avatar-btn').addEventListener('click', function() {
        document.getElementById('avatar-upload').click();
    });
    document.getElementById('avatar-upload').addEventListener('change', uploadAvatar);
    document.getElementById('add-friend-btn').addEventListener('click', addFriend);
    document.getElementById('fetch-pending-requests').addEventListener('click', fetchPendingRequests);
});

function updateFriendsList(friends) {
    let friendsContainer = document.getElementById("friends");
    if (!friendsContainer) return;

    friendsContainer.innerHTML = "";

    friends.forEach(friend => {
        let friendItem = document.createElement("li");
        friendItem.classList.add('friend-item');
        friendItem.id = `friend-${friend.id}`;

        friendItem.innerHTML = `
            <span class="friend-name">${friend.username}</span>
            <button class="remove-friend-btn" data-username="${friend.username}">Remove</button>
            <button class="block-friend-btn" data-username="${friend.username}">Block</button>
        `;

        friendsContainer.appendChild(friendItem);
    });

    document.querySelectorAll('.remove-friend-btn').forEach(button => {
        button.addEventListener('click', function () {
            removeFriend(this.getAttribute('data-username'));
        });
    });

    document.querySelectorAll('.block-friend-btn').forEach(button => {
        button.addEventListener('click', function () {
            blockFriend(this.getAttribute('data-username'));
        });
    });
}

export async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch('/user-api/refresh-token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
            credentials: 'include',
        });

        if (!response.ok) {
            removeTokens();
            return false;
        }

        const data = await response.json();
        if (data.access) {
            localStorage.setItem('accessToken', data.access);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return false;
    }
}

function fetchProfileData() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        console.error("No access token found");
        return;
    }

    fetch('/user-api/profile/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
    })
    .then(response => {
        if (response.status === 401) {
            return refreshAccessToken().then((success) => {
                if (success) return fetchProfileData();
                else throw new Error('Unauthorized');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Profile Data:", data);
    })
    .catch(error => {
        console.error('Error fetching profile data:', error);
    });
}


async function fetchFriends() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        console.warn("No access token found.");
        return;
    }

    try {
        let response = await fetch('/user-api/friends/list/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRFToken': getCSRFToken(),
            },
            credentials: 'include',
        });

        if (response.status === 401) {
            console.warn("Unauthorized. Refreshing token...");
            const refreshed = await refreshAccessToken();
            if (refreshed) return fetchFriends();
        }

        if (!response.ok) throw new Error(`Error fetching friends: ${response.status}`);

        const friends = await response.json();
        displayFriends(friends);
    } catch (error) {
        console.error(error);
        alert('Failed to load friends.');
    }
}

function displayFriends(friends) {
    const friendsList = document.getElementById('friends');
    friendsList.innerHTML = '';
    friends.forEach(friend => {
        const friendItem = document.createElement('li');
        friendItem.classList.add('friend-item');
        friendItem.id = `friend-${friend.id}`;

        friendItem.innerHTML = `
            <span class="friend-name">${friend.username}</span>
            <span class="friend-status" id="user-status-${friend.id}" style="color: ${friend.online_status ? 'green' : 'red'};">
                ${friend.online_status ? 'Online' : 'Offline'}
            </span>
            <button class="remove-friend-btn" data-username="${friend.username}">Remove</button>
            <button class="block-friend-btn" data-username="${friend.username}">Block</button>
        `;

        friendsList.appendChild(friendItem);
    });

    document.querySelectorAll('.remove-friend-btn').forEach(button => {
        button.addEventListener('click', function () {
            removeFriend(this.getAttribute('data-username'));
        });
    });

    document.querySelectorAll('.block-friend-btn').forEach(button => {
        button.addEventListener('click', function () {
            blockFriend(this.getAttribute('data-username'));
        });
    });
}


async function addFriend() {
    const friendUsername = document.getElementById('friend-username').value.trim();
    if (!friendUsername) {
        alert('Please enter a username.');
        return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
        console.warn("No access token found.");
        return;
    }

    try {
        let response = await fetch(`/user-api/friends/add/${friendUsername}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRFToken': getCSRFToken(),
            },
            credentials: 'include',
        });

        if (response.status === 401) {
            console.warn("Unauthorized. Refreshing token...");
            const refreshed = await refreshAccessToken();
            if (refreshed) return addFriend(); // Retry
        }

        const data = await response.json();
        if (response.ok) {
            alert(`${friendUsername} has been added.`);
            fetchFriends();
        } else {
            throw new Error(data.message || 'Failed to add friend.');
        }
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

async function removeFriend(username) {
    if (!confirm(`Are you sure you want to remove ${username} from your friends?`)) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
        console.warn("No access token found.");
        return;
    }

    try {
        let response = await fetch(`/user-api/friends/remove/${username}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRFToken': getCSRFToken(),
            },
            credentials: 'include',
        });

        if (response.status === 401) {
            console.warn("Unauthorized. Refreshing token...");
            const refreshed = await refreshAccessToken();
            if (refreshed) return removeFriend(username); // Retry
        }

        const data = await response.json();
        if (response.ok) {
            alert(`${username} has been removed.`);
            fetchFriends();
        } else {
            throw new Error(data.message || 'Failed to remove friend.');
        }
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}


async function blockFriend(username) {
    if (!confirm(`Are you sure you want to block ${username}? This action cannot be undone.`)) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
        console.warn("No access token found.");
        return;
    }

    try {
        const response = await fetch(`/user-api/block-user/${username}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRFToken': getCSRFToken(),
            },
            credentials: 'include',
        });

        const data = await response.json();
        if (response.ok) {
            alert(`${username} has been blocked.`);
            fetchFriends();
        } else {
            throw new Error(data.message || 'Failed to block user.');
        }
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function getGameStatus(score, playerIdx){
	const gameStatusCell = document.createElement('td');
	const opponentIdx = (playerIdx + 1) % 2;
	if (score[playerIdx] == score[opponentIdx]){
		gameStatusCell.textContent = 'Draw';
		gameStatusCell.style.color = 'yellow';
	} else if (score[playerIdx] > score[opponentIdx]){
		gameStatusCell.textContent = 'Win';
		gameStatusCell.style.color = 'green';
	} else {
		gameStatusCell.textContent = 'Lost';
		gameStatusCell.style.color = 'red';
	}
	return (gameStatusCell);
}

async function fetchMatchHistory() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        console.warn("No access token found.");
        return;
    }

    const tableBody = document.getElementById('match-history-body');
    try {
        let response = await fetch('/user-api/game-history?' +
            new URLSearchParams({ limit: '10' }).toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-CSRFToken': getCSRFToken(),
                },
                credentials: 'include',
            });

        if (response.status === 401) {
            console.warn("Unauthorized. Refreshing token...");
            const refreshed = await refreshAccessToken();
            if (refreshed) return fetchMatchHistory(); // Retry
        }

        if (!response.ok) throw new Error(`Failed to fetch match history: ${response.status}`);

        const json = await response.json();
        const games = json.results;
        tableBody.innerHTML = '';

        games.forEach(game => {
            const row = document.createElement('tr');

            const dateCell = document.createElement('td');
            dateCell.textContent = new Date(game.dateTime).toLocaleString();
            row.appendChild(dateCell);

            const gameModeCell = document.createElement('td');
            gameModeCell.textContent = game.gameMode;
            row.appendChild(gameModeCell);

            const opponentCell = document.createElement('td');
            const scoreCell = document.createElement('td');
            let gameStatusCell;
            const username = document.getElementById('username').textContent;

            if (game.players[0] == username) {
                opponentCell.textContent = game.players[1];
                scoreCell.textContent = game.score[0].toString() + '-' + game.score[1].toString();
                gameStatusCell = getGameStatus(game.score, 0);
            } else if (game.players[1] == username) {
                opponentCell.textContent = game.players[0];
                scoreCell.textContent = game.score[1].toString() + '-' + game.score[0].toString();
                gameStatusCell = getGameStatus(game.score, 1);
            } else {
                console.error(`Game with id ${game.id} can't be connected to current user: ${username}. PLAYERS: ${game.players[0]}, ${game.players[1]}`);
            }

            row.appendChild(opponentCell);
            row.appendChild(scoreCell);
            row.appendChild(gameStatusCell);
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error(error.message);
    }
}

function uploadAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('avatar', file);

        fetch('/user-api/upload-avatar/', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if(data.message) {
                document.getElementById('avatar').src = window.URL.createObjectURL(file);
                alert('Avatar uploaded successfully!');
            } else {
                throw new Error(data.error || 'Failed to upload avatar');
            }
        })
        .catch(error => {
            console.error('Error uploading avatar:', error);
            alert(error.message);
        });
    }
}

async function fetchPendingRequests() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        console.warn("No access token found.");
        return;
    }

    try {
        let response = await fetch('/user-api/friend-requests/pending/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRFToken': getCSRFToken(),
            },
            credentials: 'include',
        });

        if (response.status === 401) {
            console.warn("Unauthorized. Refreshing token...");
            const refreshed = await refreshAccessToken();
            if (refreshed) return fetchPendingRequests(); // Retry
        }

        if (!response.ok) throw new Error('Failed to fetch pending requests.');

        const data = await response.json();
        displayPendingRequests(data.pending_requests);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}


async function acceptFriendRequest(requestId) {
    const accessToken = getAccessToken();
    if (!accessToken) {
        console.warn("No access token found.");
        return;
    }

    try {
        const response = await fetch(`/user-api/friend-requests/accept/${requestId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRFToken': getCSRFToken(),
            },
            credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to accept friend request.');

        alert('Friend request accepted.');
        fetchFriends();
        fetchPendingRequests();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}


async function declineFriendRequest(requestId) {
    const accessToken = getAccessToken();
    if (!accessToken) {
        console.warn("No access token found.");
        return;
    }

    try {
        const response = await fetch(`/user-api/friend-requests/decline/${requestId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRFToken': getCSRFToken(),
            },
            credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to decline friend request.');

        alert('Friend request declined.');
        fetchPendingRequests();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}


function displayPendingRequests(requests) {
    const requestsList = document.getElementById('pending-requests');
    requestsList.innerHTML = '';

    if (requests.length === 0) {
        requestsList.innerHTML = '<p>No pending friend requests.</p>';
        return;
    }

    requests.forEach(request => {
        const requestItem = document.createElement('li');
        requestItem.innerHTML = `
            ${request.from_user}
            <button onclick="acceptFriendRequest(${request.id})">Accept</button>
            <button onclick="declineFriendRequest(${request.id})">Decline</button>
        `;
        requestsList.appendChild(requestItem);
    });

     document.querySelectorAll('.accept-btn').forEach(button => {
        button.addEventListener('click', function () {
            acceptFriendRequest(this.getAttribute('data-id'));
        });
    });

    document.querySelectorAll('.decline-btn').forEach(button => {
        button.addEventListener('click', function () {
            declineFriendRequest(this.getAttribute('data-id'));
        });
    });
}


