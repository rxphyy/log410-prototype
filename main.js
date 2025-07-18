let scene, camera, renderer, controls;
let spheres = [];
let raycaster;
let mouse = new THREE.Vector2();

const moveSpeed = 2.0;

function init() {
    const canvas = document.getElementById('threeJsCanvas');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000033);
    scene.fog = new THREE.Fog(0x000055, 10, 400);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(0, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 50);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 500;
    raycaster = new THREE.Raycaster();
    createSphereCloud();
    createGroundPlane();
    setupCameraControls();
    setupClickHandling();
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function createSphereCloud() {
    const objects = [];
    const numSpheres = 20;
    const sphereRadius = 1;
    const boxSize = 100;
    const spriteScale = 4;
    const baseSpriteSize = 2;
    const maxHaloSizeOffset = 15;
    const connectorSphereRadius = 1;
    const connectorLineColor = 0x000000;

    const dataTypes = [
        { displayName: "Gate", icon: "./assets/Gate.png" },
        { displayName: "Torpille", icon: "./assets/Torpille.png" },
        { displayName: "Bin", icon: "./assets/Bin.png" },
        { displayName: "Slalom Blanc", icon: "./assets/SlalomBlanc.png" },
        { displayName: "Slalom Rouge", icon: "./assets/SlalomRouge.png" },
        { displayName: "Table", icon: "./assets/Table.png" },
        { displayName: "Octogone", icon: "./assets/Octogone.png" }
    ];

    const textureLoader = new THREE.TextureLoader();

    for (let i = 0; i < numSpheres; i++) {
        const x = (Math.random() - 0.5) * boxSize;
        const y = (Math.random() - 0.5) * boxSize;
        const z = (Math.random() - 0.5) * boxSize;

        const type = dataTypes[Math.floor(Math.random() * dataTypes.length)];

        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: textureLoader.load(type.icon),
                transparent: true,
                alphaTest: 0.1
            })
        );
        sprite.position.set(x, y, z);
        sprite.scale.set(spriteScale, spriteScale, 1);

        const haloSize = baseSpriteSize + Math.random() * maxHaloSizeOffset;
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(haloSize / 2, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.1
            })
        );
        halo.position.copy(sprite.position);

        const offsetDirection = new THREE.Vector3(
            Math.random() * 3 - 1,
            Math.random() * 3 - 1,
            Math.random() * 3 - 1
        ).normalize().multiplyScalar(haloSize * 0.8);

        const connectorSphere = new THREE.Mesh(
            new THREE.SphereGeometry(connectorSphereRadius, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0x000099, 
                transparent: true,
                opacity: 1
            })
        );
        connectorSphere.position.copy(sprite.position).add(offsetDirection);

        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            sprite.position,
            connectorSphere.position
        ]);
        const connectorLine = new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({
                color: connectorLineColor,
                linewidth: 2
            })
        );

        const text = createTextSprite(type.displayName);
        text.position.set(x, y - spriteScale - 0.5, z);

        sprite.userData = {
            id: i + 1,
            displayName: type.displayName,
            position: sprite.position.clone(),
            lastKnown: "", // You can remove this if not using it
            timestamp: getRandomDateTimeWithinFrame(),
            connectorSphere: connectorSphere, // This stores the reference
            connectorLine: connectorLine,
            description: "" // Optional: you can add a description here if needed
        };

        scene.add(sprite);
        scene.add(halo);
        scene.add(connectorSphere);
        scene.add(connectorLine);
        scene.add(text);
        spheres.push(sprite);
    }

    return spheres;
}

function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fontSize = 32;
    const font = `${fontSize}px Inter`;

    context.font = font;
    const textWidth = context.measureText(text).width;
    canvas.width = textWidth + 20;
    canvas.height = fontSize * 1.4;

    context.font = font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'white';
    context.strokeStyle = 'black';
    context.lineWidth = 4;
    context.strokeText(text, canvas.width / 2, canvas.height / 2);
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture })
    );
    sprite.scale.set(canvas.width * 0.05, canvas.height * 0.05, 1);
    return sprite;
}

function createGroundPlane() {
    const planeGeometry = new THREE.PlaneGeometry(200, 200); // Large plane
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x001122, side: THREE.DoubleSide }); // Dark blue, two-sided
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -100;
    plane.receiveShadow = true;
    scene.add(plane);
}

function setupCameraControls() {
    const moveForwardBtn = document.getElementById('moveForward');
    const moveBackwardBtn = document.getElementById('moveBackward');
    const moveLeftBtn = document.getElementById('moveLeft');
    const moveRightBtn = document.getElementById('moveRight');
    const moveUpBtn = document.getElementById('moveUp');
    const moveDownBtn = document.getElementById('moveDown');
    const closeInfoPanelBtn = document.getElementById('closeInfoPanel');
    const infoPanel = document.getElementById('infoPanel');

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
            case 'Q':
                moveCamera('up');
                break;
            case 'e':
            case 'E':
                moveCamera('down');
                break;
        }
    });
}

function setupClickHandling() {
    const canvas = renderer.domElement;
    let clickTimeout;

    let pointerDownMouseX = 0;
    let pointerDownMouseY = 0;

    canvas.addEventListener('pointerdown', (event) => {
        console.log("click", event);

        if (event.button !== 0) return;

        pointerDownMouseX = event.clientX;
        pointerDownMouseY = event.clientY;

        clearTimeout(clickTimeout);

        clickTimeout = setTimeout(() => {
            const deltaX = Math.abs(event.clientX - pointerDownMouseX);
            const deltaY = Math.abs(event.clientY - pointerDownMouseY);
            const tolerance = 5;

            if (deltaX < tolerance && deltaY < tolerance) {
                mouse.x = (event.clientX / canvas.clientWidth) * 2 - 1;
                mouse.y = -(event.clientY / canvas.clientHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);

                const intersects = raycaster.intersectObjects(spheres);

                if (intersects.length > 0) {
                    console.log("sphere was clicked");
                    displaySphereInfo(intersects[0].object.userData);
                } else {
                    console.log("NOOOOOO");
                    closeInfoPanel();
                }
            }
        }, 20);
    }, false);

    canvas.addEventListener('pointerup', () => {
        clearTimeout(clickTimeout);
    });

    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
}

function moveCamera(direction) {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    switch (direction) {
        case 'forward':
            camera.position.addScaledVector(cameraDirection, moveSpeed);
            break;
        case 'backward':
            camera.position.addScaledVector(cameraDirection, -moveSpeed);
            break;
        case 'left':
            const right = new THREE.Vector3();
            right.crossVectors(camera.up, cameraDirection);
            camera.position.addScaledVector(right, moveSpeed);
            break;
        case 'right':
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
    controls.update();
}

function getRandomDateTimeWithinFrame() {
    const now = Date.now();

    const nbMinutesPlus = 5;
    const fiveMinutesLater = now + (nbMinutesPlus * 60 * 1000);

    const randomTimestamp = Math.random() * (fiveMinutesLater - now) + now;

    const randomDate = new Date(randomTimestamp);

    const day = String(randomDate.getDate()).padStart(2, '0');
    const month = String(randomDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = randomDate.getFullYear();

    const hours = String(randomDate.getHours()).padStart(2, '0');
    const minutes = String(randomDate.getMinutes()).padStart(2, '0');
    const seconds = String(randomDate.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

function displaySphereInfo(data) {
    const infoPanel = document.getElementById('infoPanel');
    const customFieldLabel = document.getElementById('customFieldLabel');
    const dotCustomLabelText = document.getElementById('dotCustomLabelText');

    document.getElementById('dotName').textContent = data.displayName;
    document.getElementById('dotId').textContent = data.id;
    document.getElementById('dotPosition').textContent = `(${data.position.x.toFixed(2)}, ${data.position.y.toFixed(2)}, ${data.position.z.toFixed(2)})`;

    // Show connector sphere position in "Dernière position connue"
    if (data.connectorSphere) {
        const connPos = data.connectorSphere.position;
        document.getElementById('dotLastKnown').textContent =
            `(${connPos.x.toFixed(2)}, ${connPos.y.toFixed(2)}, ${connPos.z.toFixed(2)})`;
    } else {
        document.getElementById('dotLastKnown').textContent = data.description || "N/A";
    }

    document.getElementById('dotTimestamp').textContent = data.timestamp;

    // Rest of your existing switch case...
    switch (data.displayName) {
        case "Gate":
            customFieldLabel.innerText = "Côté Shark:"
            dotCustomLabelText.innerText = ["LEFT", "RIGHT"][Math.floor(Math.random() * 2)]
            break;
        case "Torpille":
            customFieldLabel.innerText = "Côté Shark:"
            dotCustomLabelText.innerText = ["UP", "DOWN"][Math.floor(Math.random() * 2)]
            break;
        case "Bin":
            customFieldLabel.innerText = "Côté Shark:"
            dotCustomLabelText.innerText = ["Q1-2", "Q3-4"][Math.floor(Math.random() * 2)]
            break;
        default:
            customFieldLabel.innerText = ""
            dotCustomLabelText.innerText = ""
            break;
    }

    infoPanel.classList.remove('info-panel-leave-to');
    infoPanel.classList.add('info-panel-enter-active');
}

function closeInfoPanel() {
    const infoPanel = document.getElementById('infoPanel');
    infoPanel.classList.remove('info-panel-enter-active');
    infoPanel.classList.add('info-panel-leave-to');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.onload = init;