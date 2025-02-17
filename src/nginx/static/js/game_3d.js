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

    // Scene with darker background
    scene = new THREE.Scene();
    scene.background = new THREE.Color('rgb(77, 76, 76)');

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(-3, 5, 1);
    mainLight.castShadow = true;
    scene.add(mainLight);

    // Add point lights for dramatic effect
    const pointLight1 = new THREE.PointLight(0x00ff00, 0.5, 10);
    pointLight1.position.set(-5, 2, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff0000, 0.5, 10);
    pointLight2.position.set(5, 2, 0);
    scene.add(pointLight2);

    // Define world dimensions to match 2D aspect ratio
    const worldWidth = 20;  // For 1000 pixels
    const worldDepth = 10;  // For 500 pixels

    // Enhanced ball with glow effect
    const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        metalness: 0.3,
        roughness: 0.4,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.castShadow = true;
    ball.position.y = 0.3; // Lift ball slightly above ground
    scene.add(ball);

    // Enhanced paddles with metallic effect
    const paddleGeometry = new THREE.BoxGeometry(2, 0.2, 1);
    const paddleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        metalness: 0.6,
        roughness: 0.2,
        emissive: 0x00ff00,
        emissiveIntensity: 0.2
    });

    playerPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    playerPaddle.position.set(-10, 0.5, 0); // Adjust x to worldWidth/2
    playerPaddle.rotation.y = Math.PI / 2;
    playerPaddle.castShadow = true;
    scene.add(playerPaddle);

    player2Paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    player2Paddle.position.set(10, 0.5, 0); // Adjust x to -worldWidth/2
    player2Paddle.rotation.y = Math.PI / 2;
    player2Paddle.castShadow = true;
    scene.add(player2Paddle);

    // Floor (matches world dimensions)
    const floorGeometry = new THREE.PlaneGeometry(worldWidth, worldDepth, 40, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 0.8,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Solid floor beneath wireframe
    const solidFloorGeometry = new THREE.PlaneGeometry(worldWidth, worldDepth);
    const solidFloorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 0.8
    });
    const solidFloor = new THREE.Mesh(solidFloorGeometry, solidFloorMaterial);
    solidFloor.rotation.x = Math.PI / 2;
    solidFloor.position.y = -0.01;
    solidFloor.receiveShadow = true;
    scene.add(solidFloor);

    // Walls (match world dimensions)
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        metalness: 0.5,
        roughness: 0.5,
        emissive: 0x222222,
        emissiveIntensity: 0.5
    });

    const topWall = new THREE.Mesh(new THREE.BoxGeometry(worldWidth, 0.5, 0.1), wallMaterial);
    topWall.position.set(0, 0.25, -worldDepth/2);
    topWall.castShadow = true;
    topWall.receiveShadow = true;
    scene.add(topWall);

    const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(worldWidth, 0.5, 0.1), wallMaterial);
    bottomWall.position.set(0, 0.25, worldDepth/2);
    bottomWall.castShadow = true;
    bottomWall.receiveShadow = true;
    scene.add(bottomWall);

    // Enable shadow mapping in renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Camera - adjust to view from front
    camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 12); // Position camera in front
    camera.lookAt(0, 0, 0);        // Look at the center

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

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 }); // Yellow color

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

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 }); // Yellow color

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
        textMaterial
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
        textMaterial
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

    const worldWidth = 20;  // Match the initialization values
    const worldDepth = 10;

    // Update paddles
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
    window.animationFrameId = requestAnimationFrame(animate);
}

export function resizeRenderer(width, height) {
    if (!renderer || !camera) return;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
}

// Add cleanup function
export function cleanup() {
    // Cancel any pending animation frame
    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
        window.animationFrameId = null;
    }

    if (scene) {
        // Dispose of all meshes, materials, and geometries
        scene.traverse((object) => {
            if (object.isMesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });

        // Clear the scene
        while(scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    }
    
    if (controls) {
        controls.dispose();
        controls = null;
    }

    // Reset all variables but keep renderer and scene
    camera = null;
    ball = null;
    playerPaddle = null;
    player2Paddle = null;
    playerScoreText = null;
    player2ScoreText = null;
    font = null;
    currentScore = { left: 0, right: 0 };
}