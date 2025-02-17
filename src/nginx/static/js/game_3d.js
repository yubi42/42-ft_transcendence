import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Move all initialization into a function
let scene, camera, renderer, controls, ball, playerPaddle, player2Paddle;
let playerScoreText, player2ScoreText;
let font;
let currentScore = { left: 0, right: 0 };

export function initGame3D(canvas) {
    // Initialize renderer
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.shadowMap.enabled = true;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('rgb(105, 104, 104)');

    // Camera - adjust to view from side
    camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(12, 5, 0); // Position camera on the side
    camera.lookAt(0, 0, 0);        // Look at the center

    // Lights
    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(-3, 5, 1);
    scene.add(directionalLight);

    // Ball
    const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    scene.add(ball);

    // Paddles - rotated 90 degrees
    const paddleGeometry = new THREE.BoxGeometry(2, 0.2, 1);
    const paddleMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    playerPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    playerPaddle.position.set(-5, 0.5, 0);
    playerPaddle.rotation.y = Math.PI / 2;
    scene.add(playerPaddle);

    player2Paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    player2Paddle.position.set(5, 0.5, 0);
    player2Paddle.rotation.y = Math.PI / 2;
    scene.add(player2Paddle);

    // Floor (game field)
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    // Side Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 0.1), wallMaterial);
    topWall.position.set(0, 0.25, -5);
    scene.add(topWall);

    const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 0.1), wallMaterial);
    bottomWall.position.set(0, 0.25, 5);
    scene.add(bottomWall);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2;

    // Load Font and create score displays
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (loadedFont) => {
        font = loadedFont;
        createScoreDisplays();
        createInstructionsText();
    });
}

function createScoreDisplays() {
    if (!font) return;

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Create initial score texts
    playerScoreText = new THREE.Mesh(
        new TextGeometry(currentScore.left.toString(), {
            font: font,
            size: 0.8,
            height: 0.1,
        }),
        textMaterial
    );
    playerScoreText.position.set(-2, 3, 0);
    scene.add(playerScoreText);

    player2ScoreText = new THREE.Mesh(
        new TextGeometry(currentScore.right.toString(), {
            font: font,
            size: 0.8,
            height: 0.1,
        }),
        textMaterial
    );
    player2ScoreText.position.set(2, 3, 0);
    scene.add(player2ScoreText);
}

function updateScoreDisplays() {
    if (!font || !scene) return;

    // Update left score
    if (playerScoreText) {
        scene.remove(playerScoreText);
        playerScoreText.geometry.dispose();
    }
    playerScoreText = new THREE.Mesh(
        new TextGeometry(currentScore.left.toString(), {
            font: font,
            size: 0.8,
            height: 0.1,
        }),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    playerScoreText.position.set(-2, 3, 0);
    scene.add(playerScoreText);

    // Update right score
    if (player2ScoreText) {
        scene.remove(player2ScoreText);
        player2ScoreText.geometry.dispose();
    }
    player2ScoreText = new THREE.Mesh(
        new TextGeometry(currentScore.right.toString(), {
            font: font,
            size: 0.8,
            height: 0.1,
        }),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    player2ScoreText.position.set(2, 3, 0);
    scene.add(player2ScoreText);
}

// Add function to create instructions text
function createInstructionsText() {
    if (!font) return;

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const instructionsText = new THREE.Mesh(
        new TextGeometry('Score 10 points to win!', {
            font: font,
            size: 0.5,
            height: 0.1,
        }),
        textMaterial
    );
    instructionsText.position.set(-3, 3, -4);
    scene.add(instructionsText);
}

export function updateGameState(gameSettings, paddleL, paddleR, ballX, ballY) {
    if (!scene || !ball || !playerPaddle || !player2Paddle) return;

    // Convert 2D coordinates to 3D space
    const worldWidth = 10;  // Our 3D world is 10 units wide
    const worldDepth = 10;  // and 10 units deep

    // Update paddles - convert vertical 2D position to horizontal 3D position
    playerPaddle.position.z = ((paddleL / gameSettings.canvas.height) * worldDepth) - (worldDepth / 2);
    player2Paddle.position.z = ((paddleR / gameSettings.canvas.height) * worldDepth) - (worldDepth / 2);

    // Update ball position
    ball.position.z = ((ballY / gameSettings.canvas.height) * worldDepth) - (worldDepth / 2);
    ball.position.x = ((ballX / gameSettings.canvas.width) * worldWidth) - (worldWidth / 2);

    // Update scores
    const scoreText = gameSettings.scoreBoard.textContent;
    const scores = scoreText.match(/(\d+)\s*\|\s*(\d+)/);
    if (scores) {
        currentScore.left = parseInt(scores[1]);
        currentScore.right = parseInt(scores[2]);
        updateScoreDisplays();
    }
}

export function animate() {
    if (!renderer || !scene || !camera) return;
    
    controls?.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

export function resizeRenderer(width, height) {
    if (!renderer || !camera) return;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
}