

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


export function drawGame3d(gameSettings, paddleL, paddleR, ballX, ballY)
{

/* gameSettings.scoreBoard <-- gets updated in drawGame already
gameSettings.canvas <-- canvas element 
gameSettings.contextType <-- updates when the player clicks on 3d or 2d to toggle mode 
gameSettings.paddle_width 
gameSettings.paddle_height
gameSettings.ball_size
gameSettings.player <- says if the player is 'p1' or 'p2' we can adjust the camera depending on it.  

paddleL <- y position of paddleL (x is as left as possible) aka 0 
paddleR <- y position of paddleR (x is as right as possible) aka gameSettings.canvas.width - gameSettings.paddle_width
ballX
ballY
*/
}