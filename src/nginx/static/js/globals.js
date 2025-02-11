import { getAccessToken } from "./auth.js";

export let lobby_socket;

export let gameplay_socket;

export let name;



export function initLobbySocket(url)
{
  const accessToken = getAccessToken();
    if (!lobby_socket)
        lobby_socket = new WebSocket(url, ["Authorization", accessToken]);
    else
        console.warn("Lobby socket already initialized.");
}

export function initGameplaySocket(url)
{
  const accessToken = getAccessToken();
  if (!accessToken)
    console.log(`jess no token`);
  else
  console.log(`accessToken: ${accessToken}`);
  gameplay_socket = null;
    if (!gameplay_socket)
        gameplay_socket = new WebSocket(url, ["Authorization", accessToken]);
    else
        console.warn("Gameplaylocket socket already initialized.");
}

export function closeGameplaySocket()
{
  console.log("in close gameplay socket");
  if (gameplay_socket && gameplay_socket.readyState === WebSocket.OPEN) {
    console.log("closing socket...");
    gameplay_socket.close();
  }
  gameplay_socket = null;
}

export function closeSockets() {
    if (lobby_socket && lobby_socket.readyState === WebSocket.OPEN) {
      lobby_socket.close();
    }
    lobby_socket = null;
    closeGameplaySocket();
  }

export function setName(_name) {
  name = _name;
  }

export function unsetName() {
  name = "";
}