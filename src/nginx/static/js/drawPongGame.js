// drawPongGame.js

// Draws the game using the 2D canvas context.
// This function is called when gameSettings.contextType is '2d'.
export function drawGame2d(gameSettings, paddleL, paddleR, ballX, ballY) {
  // Always get a 2D rendering context regardless of gameSettings.contextType,
  // since this function is only called for 2D drawing.
  const context = gameSettings.canvas.getContext('2d');
  context.clearRect(0, 0, gameSettings.canvas.width, gameSettings.canvas.height);
  context.fillStyle = 'white';

  // Draw the left paddle at the left edge.
  context.fillRect(0, paddleL, gameSettings.paddle_width, gameSettings.paddle_height);
  // Draw the right paddle at the right edge.
  context.fillRect(
    gameSettings.canvas.width - gameSettings.paddle_width,
    paddleR,
    gameSettings.paddle_width,
    gameSettings.paddle_height
  );

  // Draw the ball as a circle.
  context.beginPath();
  context.arc(ballX, ballY, gameSettings.ball_size / 2, 0, Math.PI * 2);
  context.fill();
}

// Import the updateGameState function
import { updateGameState } from './game_3d.js';

// Update the drawGame3d function
export function drawGame3d(gameSettings, paddleL, paddleR, ballX, ballY) {
    updateGameState(gameSettings, paddleL, paddleR, ballX, ballY);
}
