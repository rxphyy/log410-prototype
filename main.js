let scene, camera, renderer, controls;
let spheres = [];
let raycaster;
let mouse = new THREE.Vector2();

const moveSpeed = 2.0;

var controlPanelShow = false;

var objets = [];

function init() {
    const canvas = document.getElementById('threeJsCanvas');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xC3E4F1);
    //scene.fog = new THREE.Fog(0x000055, 10, 400);

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
    objets = createSphereCloud();
    createGroundPlane();
    createSubMarine();
    setupCameraControls();
    setupClickHandling();
    setupControlPanel();
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
                color: 0xFFFfff, // soft blue halo color
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );

        halo.position.copy(sprite.position);



        /*
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
        */


        const text = createTextSprite(type.displayName);
        text.position.set(x, y - spriteScale - 0.5, z);

        sprite.userData = {
            id: i + 1,
            displayName: type.displayName,
            position: sprite.position.clone(),
            lastKnown: "", // You can remove this if not using it
            timestamp: getRandomDateTimeWithinFrame(),
            //connectorSphere: connectorSphere, // This stores the reference
            //connectorLine: connectorLine,
            coteShark: "",
            description: "", // Optional: you can add a description here if needed
            rayon: haloSize
        };

        switch (sprite.userData.displayName) {
            case "Gate":
                sprite.userData.coteShark = ["LEFT", "RIGHT"][Math.floor(Math.random() * 2)]
                break;
            case "Torpille":
                sprite.userData.coteShark = ["UP", "DOWN"][Math.floor(Math.random() * 2)]
                break;
            case "Bin":
                sprite.userData.coteShark = ["Q1-2", "Q3-4"][Math.floor(Math.random() * 2)]
                break;
            default:
                break;
        }


        scene.add(sprite);
        scene.add(halo);
        // scene.add(connectorSphere);
        //scene.add(connectorLine);
        scene.add(text);
        spheres.push(sprite);
    }

    return spheres;
}

function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fontSize = 45;
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

function createSubMarine() {
    const textureLoader = new THREE.TextureLoader();

    // Position the submarine at the center (0,0,0)
    const sousmar = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: textureLoader.load("./assets/submarine.png"),
            transparent: true,
            alphaTest: 0.1
        })
    );

    const text = createTextSprite("AUV")
    text.position.set(0, -8, 0); // Position text below the submarine
    sousmar.position.set(0, 0, 0); // Center position
    sousmar.scale.set(15, 15, 1);
    scene.add(sousmar);
    scene.add(text)
}

function createGroundPlane() {
    const boxSize = 200;
    const gridSize = boxSize; // Grid matches bounding box size
    const divisions = boxSize; // 1m divisions (since boxSize is 200m)
    
    // Create the main bounding box helper (color-coded to match axes)
    const box = new THREE.Box3(
        new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2),
        new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2)
    );
    
    // Create colored box faces that match the axis colors
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(boxSize, boxSize, boxSize));
    const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x28a745, transparent: true, opacity: 0.5 })
    );
    scene.add(line);
    
    // Create color-coded axes centered at (0,0,0) where submarine is
    const axisSize = boxSize * 0.8; // Make axes slightly smaller than bounding box
    
    // X-axis (Red)
    const xAxis = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        axisSize/2,
        0xff0000,
        2,  // headLength
        1   // headWidth
    );
    scene.add(xAxis);
    
    // Y-axis (Green)
    const yAxis = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        axisSize/2,
        0x00ff00,
        2,
        1
    );
    scene.add(yAxis);
    
    // Z-axis (Blue)
    const zAxis = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        axisSize/2,
        0x0000ff,
        2,
        1
    );
    scene.add(zAxis);
    
    // Negative X-axis (Darker Red)
    const negXAxis = new THREE.ArrowHelper(
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        axisSize/2,
        0x990000,
        2,
        1
    );
    scene.add(negXAxis);
    
    // Negative Y-axis (Darker Green)
    const negYAxis = new THREE.ArrowHelper(
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 0),
        axisSize/2,
        0x009900,
        2,
        1
    );
    scene.add(negYAxis);
    
    // Negative Z-axis (Darker Blue)
    const negZAxis = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 0, 0),
        axisSize/2,
        0x000099,
        2,
        1
    );
    scene.add(negZAxis);

    // Create a 3D grid centered at submarine position (0,0,0)
    const gridColor = new THREE.Color(0x888888);
    const gridOpacity = 0.2;
    const gridTransparent = true;
    
    // XY Plane (horizontal at y=0)
    const gridXY = new THREE.GridHelper(gridSize, divisions, gridColor, gridColor);
    gridXY.position.y = 0; // Centered at submarine's y position
    gridXY.material.opacity = gridOpacity;
    gridXY.material.transparent = gridTransparent;
    scene.add(gridXY);
    
    // XZ Plane (vertical)
    const gridXZ = new THREE.GridHelper(gridSize, divisions, gridColor, gridColor);
    gridXZ.rotation.x = Math.PI / 2;
    gridXZ.position.y = 0; // Centered at submarine's y position
    gridXZ.material.opacity = gridOpacity;
    gridXZ.material.transparent = gridTransparent;
    scene.add(gridXZ);
    
    // YZ Plane (vertical)
    const gridYZ = new THREE.GridHelper(gridSize, divisions, gridColor, gridColor);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.position.y = 0; // Centered at submarine's y position
    gridYZ.material.opacity = gridOpacity;
    gridYZ.material.transparent = gridTransparent;
    scene.add(gridYZ);
    
    // Add thicker lines every 10 meters
    const majorGridColor = new THREE.Color(0x444444);
    const majorDivisions = divisions / 10;
    
    // XY Major
    const majorXY = new THREE.GridHelper(gridSize, majorDivisions, majorGridColor, majorGridColor);
    majorXY.position.y = 0.01; // Slightly above to prevent z-fighting
    majorXY.material.opacity = 0.5;
    majorXY.material.transparent = true;
    scene.add(majorXY);
    
    // XZ Major
    const majorXZ = new THREE.GridHelper(gridSize, majorDivisions, majorGridColor, majorGridColor);
    majorXZ.rotation.x = Math.PI / 2;
    majorXZ.position.y = 0.01;
    majorXZ.material.opacity = 0.5;
    majorXZ.material.transparent = true;
    scene.add(majorXZ);
    
    // YZ Major
    const majorYZ = new THREE.GridHelper(gridSize, majorDivisions, majorGridColor, majorGridColor);
    majorYZ.rotation.z = Math.PI / 2;
    majorYZ.position.y = 0.01;
    majorYZ.material.opacity = 0.5;
    majorYZ.material.transparent = true;
    scene.add(majorYZ);

    // Add axis labels at the ends
    const createAxisLabel = (text, color, position) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        context.font = '24px Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(5, 5, 1);
        return sprite;
    };

    const labelOffset = axisSize/2 + 5;
    scene.add(createAxisLabel('X', '#ff0000', new THREE.Vector3(labelOffset, 0, 0)));
    scene.add(createAxisLabel('Y', '#00ff00', new THREE.Vector3(0, labelOffset, 0)));
    scene.add(createAxisLabel('Z', '#0000ff', new THREE.Vector3(0, 0, labelOffset)));
    scene.add(createAxisLabel('-X', '#990000', new THREE.Vector3(-labelOffset, 0, 0)));
    scene.add(createAxisLabel('-Y', '#009900', new THREE.Vector3(0, -labelOffset, 0)));
    scene.add(createAxisLabel('-Z', '#000099', new THREE.Vector3(0, 0, -labelOffset)));
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

function setupControlPanel() {
    const controlPanel = document.getElementById('controlPanelToggle');
    controlPanel.addEventListener('click', () => showControlPanel());

    const controlPanelControls = document.getElementById('controlPanelControls');
    const controls = document.getElementById('controls');
    if (controls.classList.contains('hidden-controls')) {
        controlPanelControls.checked = false;
    } else {
        controlPanelControls.checked = true;
    }
    controlPanelControls.addEventListener('click', () => {
        console.log("yaya");
        const controls = document.getElementById('controls');
        if (controls.classList.contains('hidden-controls')) {
            controls.classList.remove('hidden-controls');
        } else {
            controls.classList.add('hidden-controls');
        }
    });

    const controlPanelZones = document.getElementById('controlPanelZones');
    controlPanelZones.addEventListener('click', () => console.log("yaya"));

    const controlPanelList = document.getElementById('controlPanelList');
    controlPanelList.innerHTML = ""; // Clear existing content

    objets.forEach((obj) => {
        const card = document.createElement('div');
        card.classList.add('control-card');

        const title = document.createElement('h4');
        const pos = obj.userData.position;
        title.textContent = obj.userData.displayName + ` (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
        card.appendChild(title);

        if (obj.userData.coteShark) {
            const custom = document.createElement('p');
            custom.textContent = `Côté Shark: ${obj.userData.coteShark}`;
            card.appendChild(custom);
        }

        const time = document.createElement('p');
        time.textContent = `${obj.userData.timestamp}`;
        card.appendChild(time);

        card.addEventListener('click', () => {
            displaySphereInfo(obj.userData);
        });

        controlPanelList.appendChild(card);
    });
}


function showControlPanel() {
    const controlPanel = document.getElementById('controlPanel');

    if (!controlPanelShow) {
        controlPanel.classList.remove("control-panel-leave-to");
        controlPanel.classList.add("control-panel-enter-active");
        controlPanelShow = true;
    } else {
        controlPanel.classList.remove("control-panel-enter-active");
        controlPanel.classList.add("control-panel-leave-to");
        controlPanelShow = false;
    }
}

function setupClickHandling() {
    const canvas = renderer.domElement;
    let clickTimeout;

    let pointerDownMouseX = 0;
    let pointerDownMouseY = 0;

    canvas.addEventListener('pointerdown', (event) => {
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
                    displaySphereInfo(intersects[0].object.userData);
                } else {
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

    /*
    // Show connector sphere position in "Dernière position connue"
    if (data.connectorSphere) {
        const connPos = data.connectorSphere.position;
        document.getElementById('dotLastKnown').textContent =
            `(${connPos.x.toFixed(2)}, ${connPos.y.toFixed(2)}, ${connPos.z.toFixed(2)})`;
    } else {
        document.getElementById('dotLastKnown').textContent = data.description || "N/A";
    }
        */

    document.getElementById('dotTimestamp').textContent = data.timestamp;
    document.getElementById('dotRayon').textContent = data.rayon.toFixed(2);

    switch (data.displayName) {
        case "Gate":
            customFieldLabel.innerText = "Côté Shark:"
            dotCustomLabelText.innerText = data.coteShark;
            break;
        case "Torpille":
            customFieldLabel.innerText = "Côté Shark:"
            dotCustomLabelText.innerText = data.coteShark;
            break;
        case "Bin":
            customFieldLabel.innerText = "Côté Shark:"
            dotCustomLabelText.innerText = data.coteShark;
            break;
        default:
            customFieldLabel.innerText = ""
            dotCustomLabelText.innerText = ""
            break;
    }

    infoPanel.classList.remove('info-panel-leave-to');
    infoPanel.classList.add('info-panel-enter-active');
}

function displayControlPanel() {
    const infoPanel = document.getElementById('infoPanel');
    const customFieldLabel = document.getElementById('customFieldLabel');
    const dotCustomLabelText = document.getElementById('dotCustomLabelText');

    document.getElementById('dotName').textContent = data.displayName;
    document.getElementById('dotId').textContent = data.id;
    document.getElementById('dotPosition').textContent = `(${data.position.x.toFixed(2)}, ${data.position.y.toFixed(2)}, ${data.position.z.toFixed(2)})`;

    /*
    // Show connector sphere position in "Dernière position connue"
    if (data.connectorSphere) {
        const connPos = data.connectorSphere.position;
        document.getElementById('dotLastKnown').textContent =
            `(${connPos.x.toFixed(2)}, ${connPos.y.toFixed(2)}, ${connPos.z.toFixed(2)})`;
    } else {
        document.getElementById('dotLastKnown').textContent = data.description || "N/A";
    }
        */

    document.getElementById('dotTimestamp').textContent = data.timestamp;
    document.getElementById('dotRayon').textContent = data.rayon.toFixed(2);

    switch (data.displayName) {
        case "Gate":
            customFieldLabel.innerText = "Côté Shark:"
            dotCustomLabelText.innerText = data.coteShark;
            break;
        case "Torpille":
            customFieldLabel.innerText = "Côté Shark:"
            dotCustomLabelText.innerText = data.coteShark;
            break;
        case "Bin":
            customFieldLabel.innerText = "Côté Shark:"
            dotCustomLabelText.innerText = data.coteShark;
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