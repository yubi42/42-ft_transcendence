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
  document.querySelectorAll('.online').forEach(content => 
    {
      content.classList.remove('active');
    }
  );
  document.getElementById('option-choose').classList.add('active');
  closeSocket();
}

function prepareLobby() 
{
  document.querySelectorAll('.online').forEach(content => 
    {
      content.classList.remove('active');
    }
  );  
  document.querySelector('form.online').classList.add('active');
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
        joinLobby(response.lobby, response.lobby_name);
    })
    .catch(error => {
      console.log('Fetch error: ' + error);
    }
  );
}

function lobbyFull(lobby_id)
{
  return fetch(`/lobby/${lobby_id}/`, 
    {
      method: 'GET'
    })
    .then(data => data.json())
    .then(response =>
    {
      if(response.error)
      {
        console.log('Error: ' + response.error);
        return true ;
      }
      return response.lobby.current_player_count >= 2;
    })
    .catch(error => {
      console.log('Fetch error: ' + error);
    }
  );
}

function selectPlayer(role, name, db_value) {
  if (socket && socket.readyState === WebSocket.OPEN) {
      if (db_value === "None")
      {
          const message = {
          action: `${role}_select`
          };
          socket.send(JSON.stringify(message));
      }
      else if (db_value === name)
      {
        const message = {
        action: `${role}_deselect`
        };
        socket.send(JSON.stringify(message));
    }

  }
}

function generateGuestName() {
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
  return `guest${randomNumber}`;
}

function joinLobby(lobby_id, lobby_name)
{
  lobbyFull(lobby_id).then(is_full => {
    if (is_full) {
      alert('Lobby is full. Cannot join.');
      return;
    }

  const name = generateGuestName();
  const url = `/ws/lobby/${lobby_id}/${name}/`;
  const p1 = document.getElementById('p1');
  const p2 = document.getElementById('p2');
  let roles = {
    p1: "None",
    p2: "None"
  };

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('WebSocket connected');
    document.getElementById('lobby-header').textContent = `Lobby: ${lobby_name}`;
    socket.send(JSON.stringify({
      action: 'init_player_roles',
    }));
    document.querySelectorAll('.online').forEach(content => 
      {
        content.classList.remove('active');
      }
    );
    document.getElementById('lobby').classList.add('active')
    p1.addEventListener('click', () => selectPlayer('p1', name, roles.p1));
    p2.addEventListener('click', () => selectPlayer('p2', name, roles.p2));    
  };

  socket.onmessage = (e) => {
      console.log("Raw WebSocket message received:", e.data);
      const data = JSON.parse(e.data);
      if (data.type === 'start_game')
      {
          console.log('Game starting...');
      } 
      else if (data.type === 'enable_start_button')
      {
          enableStartButton(lobby_id);
      }
      else if (data.type === 'disable_start_button')
        {
            disableStartButton();
        }
      else if (data.type === 'update_roles') {
        roles = data.roles;
        // p1.onclick = selectPlayer.bind(null, 'p1', name, roles.p1);
        // p2.onclick = selectPlayer.bind(null, 'p2', name, roles.p1);

        if (roles.p1 != "None") {
            p1.classList.add('player_selected');
            p1.innerHTML = `<p>P1</p>${roles.p1}`
        } else {
            p1.classList.remove('player_selected');
            p1.innerHTML = `<p>P1</p>`
        }

        if (roles.p2 != "None") {
            p2.classList.add('player_selected');
            p2.innerHTML = `<p>P2</p>${roles.p2}`
        } else {
            p2.classList.remove('player_selected');
            p2.innerHTML = `<p>P2</p>`
        }
    }
  };
  
  socket.onerror = console.error;
  socket.onclose = () => console.log('WebSocket closed');
  
  window.addEventListener('beforeunload', closeSocket);
  });
}

function closeSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
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
      lobbyDiv.onclick = () => joinLobby(lobby.id, lobby.name);
      lobbyList.appendChild(lobbyDiv);
      });
    })
    .catch(error => {
      console.log('Error: ', error);
    });
} 


function enableStartButton(lobby_id) {
  const start_button = document.getElementById('start_game');
  start_button.classList.add('start_enabled');
  start_button.addEventListener('click', () => startGame(lobby_id))
}

function disableStartButton() {
  const start_button = document.getElementById('start_game');
  start_button.classList.remove('start_enabled');
  start_button.onclick = null;
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
