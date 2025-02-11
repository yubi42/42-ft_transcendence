import { animate } from "./game_3d";


export function drawGame2d(gameSettings, paddleL, paddleR, ballX, ballY)
{
  const context = gameSettings.canvas.getContext(gameSettings.contextType);
  context.clearRect(0, 0, gameSettings.canvas.width, gameSettings.canvas.height);
  context.fillStyle = 'white';

  // draw paddles
  context.fillRect(0, paddleL, gameSettings.paddle_width, gameSettings.paddle_height);
  context.fillRect(gameSettings.canvas.width - gameSettings.paddle_width, paddleR, gameSettings.paddle_width, gameSettings.paddle_height);

  // draw ball
  context.beginPath();
  context.arc(ballX, ballY, gameSettings.ball_size / 2, 0, Math.PI * 2);
  context.fill();

}

export function drawGame3d(gameSettings, paddleL, paddleR, ballX, ballY) {
  animate();
}
