// add functions to html elements
let socket;

document.querySelectorAll('.game-tab').forEach(tab => 
  {
  tab.addEventListener('click', generateTab);
  }
);

document.getElementById('prepare-lobby').addEventListener('click', prepareLobby);

document.getElementById('list-lobbies').addEventListener('click', listLobbies);

document.getElementById('lobby-form').addEventListener('submit', createLobby);

document.getElementById('p1').addEventListener('click', () => selectPlayer('p1'));
document.getElementById('p2').addEventListener('click', () => selectPlayer('p2'));

// functions
function generateTab() 
{
  document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
  this.classList.add('active');
  const tabName = this.id.replace('-tab', '');
  document.querySelectorAll('.game-selector').forEach(content => 
    {
      content.classList.remove('active');
    }
  );
  document.getElementById(tabName).classList.add('active');
}

function prepareLobby() 
{
  document.querySelectorAll('.online').forEach(content => 
    {
      content.classList.remove('active');
    }
  );  document.querySelector('form.online').classList.add('active');
}

function createLobby(event)
{
  event.preventDefault();
  const formData = new FormData(document.getElementById('lobby-form'));

  fetch('/lobby/create/', 
    {
      method: 'POST',
      // headers: {
      //   'X-CSRFToken': getCookie('csrftoken'), // Ensure CSRF token is sent
      // },
      body: formData,
    })
    .then(data => data.json())
    .then(response =>
    {
      if(response.error)
        console.log('Error: ' + response.error);
      else 
        joinLobby(response.lobby);
    })
    .catch(error => {
      console.log('Fetch error: ' + error);
    }
  );
}

function generateGuestName() {
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
  return `guest${randomNumber}`;
}

function joinLobby(lobby_id)
{
  const name = generateGuestName();
  const url = `/ws/lobby/${lobby_id}/${name}/`;
  socket = new WebSocket(url);

  socket.onopen = () => console.log('WebSocket connected');

  socket.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'start_game') {
          console.log('Game starting...');
      } else if (data.type === 'enable_start_button') {
          enableStartButton(lobby_id);
      }
      else if (data.type === 'update_roles') {
        const roles = data.roles;

        // For Player 1
        if (roles.p1) {
            document.getElementById('p1-btn').classList.add('player_selected');
            document.getElementById('p1-btn').onclick = null;  // Disable click
        } else {
            document.getElementById('p1-btn').classList.remove('player_selected');
            document.getElementById('p1-btn').onclick = selectPlayer.bind(null, 'p1');  // Enable click
        }

        // For Player 2
        if (roles.p2) {
            document.getElementById('p2-btn').classList.add('player_selected');
            document.getElementById('p2-btn').onclick = null;
        } else {
            document.getElementById('p2-btn').classList.remove('player_selected');
            document.getElementById('p2-btn').onclick = selectPlayer.bind(null, 'p2');
        }
    }
  };

  socket.onerror = console.error;
  socket.onclose = () => console.log('WebSocket closed');
}

document.getElementById('test-api').addEventListener('click', async () => {
  const response = await fetch('/lobby/all/');
  const data = await response.json();
  document.getElementById('output').textContent = JSON.stringify(data, null, 2);
});

function listLobbies()
{
  document.querySelectorAll('.online').forEach(content => 
    {
      content.classList.remove('active');
    }
  );
  var lobbyList = document.getElementById("lobby-list");
  lobbyList.classList.add('active');

  fetch('/lobby/all/')
    .then(response => response.json())
    .then(lobbies => {
      lobbyList.innerHTML = '';
      lobbies.forEach(lobby => {
        let lobbyDiv = document.createElement('div');
        lobbyDiv.classList.add('lobby-item');
        lobbyDiv.innerHTML = `
        <p>${lobby.current_player_count} / 2</p>
        <h3>${lobby.name}</h3>
        ${lobby.password ? '<img src="/svg/lock.svg" alt="password required">' : '<img src="/svg/lock-open.svg" alt="no password required">'}
      `;
      lobbyList.appendChild(lobbyDiv);
      });
    })
    .catch(error => {
      console.log('Error: ', error);
    });
} 

function selectPlayer(playerId) {
  if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
          action: `${playerId}_select`
      };

      socket.send(JSON.stringify(message));
  }
}

function enableStartButton(lobby_id) {
  const start_button = document.getElementById('start_game');
  start_button.classList.add('start-enabled');
  start_button.addEventListener('click', () => startGame(lobby_id))
}

function startGame(lobby_id)
{
  console.log(`Rdy to start game for ${lobby_id}`)
}

// helper functions
function getCookie(name) {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
  return cookieValue || '';
}

