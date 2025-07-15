// Global variables for Three.js scene components
let scene, camera, renderer, controls;
let spheres = []; // Stores the individual sphere Mesh objects
let raycaster; // Used for detecting intersections with objects
let mouse = new THREE.Vector2(); // Stores mouse coordinates for raycasting

// Camera movement speed
const moveSpeed = 2.0;

// Function to initialize the Three.js scene
function init() {
    // Get the canvas element
    const canvas = document.getElementById('threeJsCanvas');

    // Scene setup
    scene = new THREE.Scene();
    // Set a deep blue background color to simulate underwater
    scene.background = new THREE.Color(0x000033);
    // Add fog to simulate depth and atmosphere in the underwater environment
    scene.fog = new THREE.Fog(0x000055, 10, 200); // Color, near, far

    // Add ambient light to illuminate all objects equally
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light, increased intensity
    scene.add(ambientLight);

    // Add a directional light to simulate a main light source (e.g., sun from above)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // White light, increased intensity
    directionalLight.position.set(0, 50, 50); // Position the light
    directionalLight.castShadow = true; // Enable shadows (requires renderer.shadowMap.enabled = true)
    scene.add(directionalLight);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 50); // Initial camera position

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Enable shadow mapping in the renderer
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soften shadows

    // OrbitControls for camera rotation via click and drag
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Prevent panning with right-click
    controls.minDistance = 1; // Minimum zoom distance
    controls.maxDistance = 500; // Maximum zoom distance

    // Raycaster for detecting clicks on spheres
    raycaster = new THREE.Raycaster();

    // Generate the cloud of spheres
    createSphereCloud();

    // Add a ground plane to give more context to the 3D space
    createGroundPlane();

    // Add event listeners for camera controls
    setupCameraControls();

    // Set up reliable click handling
    setupClickHandling();

    // Handle window resizing
    window.addEventListener('resize', onWindowResize, false);

    // Start the animation loop
    animate();
}

// Function to create the cloud of 3D spheres with labels
function createSphereCloud() {
    const numSpheres = 45; // Reduced number of spheres (between 50 and 100)
    const sphereRadius = 0.8; // Increased sphere size
    const boxSize = 100; // Reduced scattering area

    for (let i = 0; i < numSpheres; i++) {
        // Randomly position spheres within the reduced box size
        const x = (Math.random() - 0.5) * boxSize;
        const y = (Math.random() - 0.5) * boxSize;
        const z = (Math.random() - 0.5) * boxSize;

        // Assign a random blueish color to each sphere
        const r = 0.1 + Math.random() * 0.2; // Red component (low for blue)
        const g = 0.3 + Math.random() * 0.4; // Green component
        const b = 0.6 + Math.random() * 0.4; // Blue component (high for blue)
        const color = new THREE.Color(r, g, b);

        // Create SphereGeometry and MeshLambertMaterial (for lighting interaction)
        const geometry = new THREE.SphereGeometry(sphereRadius, 16, 16); // Radius, width segments, height segments
        const material = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.8 });

        // Create the Mesh object
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.castShadow = true; // Spheres will cast shadows
        sphere.receiveShadow = true; // Spheres will receive shadows

        // Store dummy data for each sphere directly on the mesh's userData
        sphere.userData = {
            id: i + 1,
            name: `Obstacle ${i + 1}`, // Renamed to reflect "obstacle course" context
            description: `This obstacle is located at (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}). It presents a unique challenge in the course.`,
            position: new THREE.Vector3(x, y, z)
        };

        // Add the sphere to the scene and to our spheres array
        scene.add(sphere);
        spheres.push(sphere);

        // Create a text label for the sphere
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const labelText = `Obstacle ${i + 1}`;
        const fontSize = 32; // Pixels
        const font = `${fontSize}px Inter`;

        context.font = font;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = 'white'; // Text color
        context.strokeStyle = 'black'; // Outline color
        context.lineWidth = 4; // Outline width

        // Measure text to size the canvas appropriately
        const metrics = context.measureText(labelText);
        const textWidth = metrics.width;
        const textHeight = fontSize * 1.2; // Approximate height including line spacing

        canvas.width = textWidth + 20; // Add padding
        canvas.height = textHeight + 10; // Add padding

        // Redraw text on the resized canvas
        context.font = font;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 4;
        context.strokeText(labelText, canvas.width / 2, canvas.height / 2);
        context.fillText(labelText, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true; // Important for dynamic textures

        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        // Scale the sprite based on the canvas size to make it readable in 3D space
        sprite.scale.set(canvas.width * 0.05, canvas.height * 0.05, 1); // Adjust multiplier for desired size

        // Position the sprite slightly below the sphere
        sprite.position.set(x, y - sphereRadius - (sprite.scale.y / 2) - 1, z); // Adjust offset as needed

        scene.add(sprite);
    }
}

// Function to create a simple ground plane
function createGroundPlane() {
    const planeGeometry = new THREE.PlaneGeometry(200, 200); // Large plane
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x001122, side: THREE.DoubleSide }); // Dark blue, two-sided
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    plane.position.y = -50; // Position below the spheres
    plane.receiveShadow = true; // Plane will receive shadows
    scene.add(plane);
}

// Function to set up camera movement controls (buttons and keyboard)
function setupCameraControls() {
    // Get button elements
    const moveForwardBtn = document.getElementById('moveForward');
    const moveBackwardBtn = document.getElementById('moveBackward');
    const moveLeftBtn = document.getElementById('moveLeft');
    const moveRightBtn = document.getElementById('moveRight');
    const moveUpBtn = document.getElementById('moveUp');
    const moveDownBtn = document.getElementById('moveDown');
    const closeInfoPanelBtn = document.getElementById('closeInfoPanel');
    const infoPanel = document.getElementById('infoPanel');

    // Event listeners for buttons
    moveForwardBtn.addEventListener('click', () => moveCamera('forward'));
    moveBackwardBtn.addEventListener('click', () => moveCamera('backward'));
    moveLeftBtn.addEventListener('click', () => moveCamera('left'));
    moveRightBtn.addEventListener('click', () => moveCamera('right'));
    moveUpBtn.addEventListener('click', () => moveCamera('up'));
    moveDownBtn.addEventListener('click', () => moveCamera('down'));
    closeInfoPanelBtn.addEventListener('click', () => {
        infoPanel.classList.remove('info-panel-enter-active');
        infoPanel.classList.add('info-panel-leave-to');
    });

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                moveCamera('forward');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                moveCamera('backward');
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                moveCamera('left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                moveCamera('right');
                break;
            case 'q':
            case 'Q': // Move up
                moveCamera('up');
                break;
            case 'e':
            case 'E': // Move down
                moveCamera('down');
                break;
        }
    });
}

// Reliable click handling setup
function setupClickHandling() {
    const canvas = renderer.domElement;
    let clickTimeout; // To help distinguish clicks from drags

    // Store mouse position on pointer down
    let pointerDownMouseX = 0;
    let pointerDownMouseY = 0;

    canvas.addEventListener('pointerdown', (event) => {
        // Only process left mouse button clicks
        if (event.button !== 0) return;

        pointerDownMouseX = event.clientX;
        pointerDownMouseY = event.clientY;

        // Clear any previous timeout
        clearTimeout(clickTimeout);

        // Set a short timeout to check if it's a click or drag
        // This gives OrbitControls a chance to start a drag if the user intends to
        clickTimeout = setTimeout(() => {
            // If the mouse hasn't moved much, treat it as a click
            const deltaX = Math.abs(event.clientX - pointerDownMouseX);
            const deltaY = Math.abs(event.clientY - pointerDownMouseY);
            const tolerance = 5; // Pixels of allowed movement for a click

            if (deltaX < tolerance && deltaY < tolerance) {
                // Calculate normalized mouse coordinates
                mouse.x = (event.clientX / canvas.clientWidth) * 2 - 1;
                mouse.y = -(event.clientY / canvas.clientHeight) * 2 + 1;

                // Update the raycaster
                raycaster.setFromCamera(mouse, camera);

                // Check for intersections with spheres
                const intersects = raycaster.intersectObjects(spheres);

                if (intersects.length > 0) {
                    // Sphere was clicked
                    displaySphereInfo(intersects[0].object.userData);
                } else {
                    // Background was clicked
                    closeInfoPanel();
                }
            }
        }, 200); // 200ms delay to distinguish click from drag
    }, false); // Use bubble phase here, and let OrbitControls handle its drag

    // It's also good practice to handle pointerup to clear the timeout
    canvas.addEventListener('pointerup', () => {
        clearTimeout(clickTimeout);
    });

    // Prevent context menu on right click (if OrbitControls isn't already doing this)
    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
}


// Function to move the camera based on direction
function moveCamera(direction) {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection); // Get the current direction the camera is looking

    switch (direction) {
        case 'forward':
            camera.position.addScaledVector(cameraDirection, moveSpeed);
            break;
        case 'backward':
            camera.position.addScaledVector(cameraDirection, -moveSpeed);
            break;
        case 'left':
            // Get the right vector and cross it with the up vector to get left
            const right = new THREE.Vector3();
            right.crossVectors(camera.up, cameraDirection);
            camera.position.addScaledVector(right, moveSpeed);
            break;
        case 'right':
            // Get the right vector
            const rightDir = new THREE.Vector3();
            rightDir.crossVectors(cameraDirection, camera.up);
            camera.position.addScaledVector(rightDir, moveSpeed);
            break;
        case 'up':
            camera.position.y += moveSpeed;
            break;
        case 'down':
            camera.position.y -= moveSpeed;
            break;
    }
    controls.update(); // Update controls after manual camera movement
}

// Function to display sphere information in the panel
function displaySphereInfo(data) {
    const infoPanel = document.getElementById('infoPanel');
    document.getElementById('dotName').textContent = data.name;
    document.getElementById('dotId').textContent = data.id;
    document.getElementById('dotPosition').textContent = `(${data.position.x.toFixed(2)}, ${data.position.y.toFixed(2)}, ${data.position.z.toFixed(2)})`;
    document.getElementById('dotDescription').textContent = data.description;

    // Show the info panel with a slide-in effect
    infoPanel.classList.remove('info-panel-leave-to');
    infoPanel.classList.add('info-panel-enter-active');
}

// Function to close the info panel
function closeInfoPanel() {
    const infoPanel = document.getElementById('infoPanel');
    infoPanel.classList.remove('info-panel-enter-active');
    infoPanel.classList.add('info-panel-leave-to');
}

// Handle window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate); // Request the next frame
    controls.update(); // Update OrbitControls (for damping and smooth movement)
    renderer.render(scene, camera); // Render the scene
}

// Initialize the scene when the window loads
window.onload = init;