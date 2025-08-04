let scene, camera, renderer, controls;
let spheres = [];
let halos = [];
let submarine = null;
let raycaster;
let mouse = new THREE.Vector2();
let lastHighlightedObject = null;
let lastHaloSize = 0;
let highlightRing = null;

const moveSpeed = 2.0;
var controlPanelShow = false;
var objets = [];

function init() {
    const canvas = document.getElementById('threeJsCanvas');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xE6E6E6);

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
    submarine = createSubMarine();
    setupCameraControls();
    setupClickHandling();
    setupControlPanel();
    window.addEventListener('resize', onWindowResize, false);

    // Set current datetime
    updateDateTime();
    setInterval(updateDateTime, 1000);

    animate();
}

function updateDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR');
    const time = now.toLocaleTimeString('fr-FR');
    document.getElementById('datetime').textContent = 
        `Dernière mise à jour: ${date} ${time}`;
}

function createSphereCloud() {
    const objects = [];
    const numSpheres = 20;
    const boxSize = 100;
    const spriteScale = 4;
    const baseSpriteSize = 2;
    const maxHaloSizeOffset = 15;

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
            new THREE.SphereGeometry(haloSize/2, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        halo.position.copy(sprite.position);
        halo.visible = false; // Hidden by default

        const text = createTextSprite(type.displayName);
        text.position.set(x, y - spriteScale - 0.5, z);

        sprite.userData = {
            id: i + 1,
            displayName: type.displayName,
            position: sprite.position.clone(),
            timestamp: getRandomDateTimeWithinFrame(),
            coteShark: getRandomCoteShark(type.displayName),
            rayon: haloSize,
            halo: halo,
            text: text
        };

        scene.add(sprite);
        scene.add(halo);
        scene.add(text);
        spheres.push(sprite);
        halos.push(halo);
    }

    return spheres;
}

function getRandomCoteShark(type) {
    switch(type) {
        case "Gate": return ["LEFT", "RIGHT"][Math.floor(Math.random() * 2)];
        case "Torpille": return ["UP", "DOWN"][Math.floor(Math.random() * 2)];
        case "Bin": return ["Q1-2", "Q3-4"][Math.floor(Math.random() * 2)];
        default: return "";
    }
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
    context.strokeText(text, canvas.width/2, canvas.height/2);
    context.fillText(text, canvas.width/2, canvas.height/2);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(canvas.width * 0.05, canvas.height * 0.05, 1);
    return sprite;
}

function createSubMarine() {
    const textureLoader = new THREE.TextureLoader();
    const sousmar = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: textureLoader.load("./assets/submarine.png"),
            transparent: true,
            alphaTest: 0.1
        })
    );
    sousmar.position.set(0, 0, 0);
    sousmar.scale.set(15, 15, 1);
    sousmar.visible = false; // Hidden by default

    const text = createTextSprite("AUV");
    text.position.set(0, -8, 0);
    text.userData = { isAUVText: true };
    text.visible = false; // Hidden by default

    scene.add(sousmar);
    scene.add(text);
    return sousmar;
}

function createGroundPlane() {
    const boxSize = 200;
    const gridSize = boxSize;
    const divisions = boxSize;
    
    // Create the main bounding box helper
    const box = new THREE.Box3(
        new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2),
        new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2)
    );
    
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(boxSize, boxSize, boxSize));
    const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x28a745, transparent: true, opacity: 0.5 })
    );
    scene.add(line);
    
    const axisSize = boxSize * 0.8;
    const lineThickness = 1.5;
    const headLength = 4;
    const headWidth = 2;

    // Helper function to create a thick arrow
const createThickArrow = (direction, color, origin = new THREE.Vector3(0, 0, 0)) => {
    const group = new THREE.Group();
    const length = axisSize / 2;
    const arrowDir = direction.clone().normalize();
    
    // Line part (using cylinder)
    const lineGeometry = new THREE.CylinderGeometry(
        lineThickness / 2, 
        lineThickness / 2, 
        length - headLength, 
        8
    );
    lineGeometry.translate(0, (length - headLength) / 2, 0);
    const lineMaterial = new THREE.MeshBasicMaterial({ color: color });
    const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
    
    // Arrowhead part (using cone)
    const coneGeometry = new THREE.ConeGeometry(headWidth, headLength, 16);
    coneGeometry.translate(0, length - headLength / 2, 0);
    const coneMesh = new THREE.Mesh(coneGeometry, lineMaterial);
    
    // Fix: Add a check for the negative Y-axis to handle the rotation correctly
    let axis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), arrowDir);
    let angle = Math.acos(new THREE.Vector3(0, 1, 0).dot(arrowDir));
    
    // If the axis of rotation is a zero vector (e.g., for negative Y),
    // use an alternative axis and angle
    if (axis.lengthSq() === 0 && arrowDir.y < 0) {
        // The direction is (0, -1, 0), so we can rotate around the X-axis by PI
        axis.set(1, 0, 0);
        angle = Math.PI;
    }
    
    lineMesh.quaternion.setFromAxisAngle(axis, angle);
    coneMesh.quaternion.setFromAxisAngle(axis, angle);
    
    group.add(lineMesh);
    group.add(coneMesh);
    group.position.copy(origin);
    
    return group;
};

    // Create all axes
    scene.add(createThickArrow(new THREE.Vector3(1, 0, 0), 0xff0000)); // X
    scene.add(createThickArrow(new THREE.Vector3(0, 1, 0), 0x00ff00)); // Y
    scene.add(createThickArrow(new THREE.Vector3(0, 0, 1), 0x0000ff)); // Z
    scene.add(createThickArrow(new THREE.Vector3(-1, 0, 0), 0x990000)); // -X
    scene.add(createThickArrow(new THREE.Vector3(0, -1, 0), 0x009900)); // -Y
    scene.add(createThickArrow(new THREE.Vector3(0, 0, -1), 0x000099)); // -Z

    // Add major grids
    const majorGridColor = new THREE.Color(0x222222);
    const majorDivisions = divisions / 10;
    
    // XY Major
    const majorXY = new THREE.GridHelper(gridSize, majorDivisions, majorGridColor, majorGridColor);
    majorXY.position.y = 0.01;
    majorXY.material.opacity = 0.3;
    majorXY.material.transparent = true;
    scene.add(majorXY);
    
    // XZ Major
    const majorXZ = new THREE.GridHelper(gridSize, majorDivisions, majorGridColor, majorGridColor);
    majorXZ.rotation.x = Math.PI / 2;
    majorXZ.position.y = 0.01;
    majorXZ.material.opacity = 0.3;
    majorXZ.material.transparent = true;
    scene.add(majorXZ);
    
    // YZ Major
    const majorYZ = new THREE.GridHelper(gridSize, majorDivisions, majorGridColor, majorGridColor);
    majorYZ.rotation.z = Math.PI / 2;
    majorYZ.position.y = 0.01;
    majorYZ.material.opacity = 0.3;
    majorYZ.material.transparent = true;
    scene.add(majorYZ);

    // Add axis labels at the ends
    const createAxisLabel = (text, color, position) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 48;
        canvas.width = 128;
        canvas.height = 128;

        context.font = `bold ${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.strokeStyle = 'black';
        context.lineWidth = 10;
        context.strokeText(text, canvas.width / 2, canvas.height / 2);

        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(10, 10, 1);
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
        unhighlightObject();
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
    const controlPanelToggle = document.getElementById('controlPanelToggle');
    controlPanelToggle.addEventListener('click', showControlPanel);

    // Controls toggle (hidden by default)
    const controlsDiv = document.getElementById('controls');
    const controlPanelControls = document.getElementById('controlPanelControls');
    controlsDiv.classList.add('hidden-controls');
    controlPanelControls.checked = false;
    controlPanelControls.addEventListener('change', (e) => {
        controlsDiv.classList.toggle('hidden-controls', !e.target.checked);
    });

    // Zones toggle (hidden by default)
    const controlPanelZones = document.getElementById('controlPanelZones');
    controlPanelZones.checked = false;
    controlPanelZones.addEventListener('change', (e) => {
        halos.forEach(halo => halo.visible = e.target.checked);
    });

    // AUV toggle (hidden by default)
    const controlPanelAUV = document.getElementById('controlPanelAUV');
    controlPanelAUV.checked = false;
    controlPanelAUV.addEventListener('change', (e) => {
        if (submarine) {
            submarine.visible = e.target.checked;
            scene.children.forEach(child => {
                if (child.userData?.isAUVText) {
                    child.visible = e.target.checked;
                }
            });
        }
    });

    // Populate object list
    const controlPanelList = document.getElementById('controlPanelList');
    controlPanelList.innerHTML = "";
    
    objets.forEach((obj) => {
        const card = document.createElement('div');
        card.classList.add('control-card');
        card.dataset.id = obj.userData.id;

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
            highlightObject(obj);
        });

        controlPanelList.appendChild(card);
    });
}

function highlightObject(object) {
    if (lastHighlightedObject) {
        unhighlightObject();
    }

    if (!object) return;

    lastHighlightedObject = object;

    // Create a canvas for the ring sprite
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = 256; // Canvas size
    canvas.width = size;
    canvas.height = size;

    // Draw red ring
    const center = size / 2;
    const radius = size * 0.4;
    const thickness = size * 0.1;
    
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.lineWidth = thickness;
    context.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    context.stroke();

    // Create sprite material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
    });

    // Create sprite
    highlightRing = new THREE.Sprite(material);
    highlightRing.scale.set(8, 8, 1); // Adjust size as needed
    highlightRing.position.copy(object.position);
    highlightRing.position.y += 0.1; // Slight offset to prevent z-fighting
    
    // Make sprite always face camera
    highlightRing.onBeforeRender = function() {
        this.quaternion.copy(camera.quaternion);
    };

    scene.add(highlightRing);

    // Highlight in control panel
    const cards = document.querySelectorAll('.control-card');
    cards.forEach(card => {
        if (card.dataset.id == object.userData.id) {
            card.style.backgroundColor = '#84a9be';
            card.style.border = '6px solid #ff3434';
        } else {
            card.style.backgroundColor = '';
            card.style.border = '';
        }
    });
}

function unhighlightObject() {
    if (highlightRing) {
        scene.remove(highlightRing);
        highlightRing = null;
    }

    const cards = document.querySelectorAll('.control-card');
    cards.forEach(card => {
        card.style.backgroundColor = '';
        card.style.border = '';
    });

    lastHighlightedObject = null;
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
                    const object = intersects[0].object;
                    displaySphereInfo(object.userData);
                    highlightObject(object);
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
    const fiveMinutesLater = now + (5 * 60 * 1000);
    const randomTimestamp = Math.random() * (fiveMinutesLater - now) + now;
    const randomDate = new Date(randomTimestamp);

    const day = String(randomDate.getDate()).padStart(2, '0');
    const month = String(randomDate.getMonth() + 1).padStart(2, '0');
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
    document.getElementById('dotPosition').textContent = 
        `(${data.position.x.toFixed(2)}, ${data.position.y.toFixed(2)}, ${data.position.z.toFixed(2)})`;
    document.getElementById('dotRayon').textContent = data.rayon.toFixed(2);
    document.getElementById('dotTimestamp').textContent = data.timestamp;

    if (data.coteShark) {
        customFieldLabel.textContent = "Côté Shark:";
        dotCustomLabelText.textContent = data.coteShark;
    } else {
        customFieldLabel.textContent = "";
        dotCustomLabelText.textContent = "";
    }

    if (infoPanel.classList.contains('info-panel-leave-to')) {
        infoPanel.classList.remove('info-panel-leave-to');
        infoPanel.classList.add('info-panel-enter-active');
    }

    // Scroll to the highlighted card
    const selected_card = document.querySelector(`.control-card[data-id="${data.id}"]`);
    if (selected_card) {
        selected_card.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }
}

function closeInfoPanel() {
    const infoPanel = document.getElementById('infoPanel');
    infoPanel.classList.remove('info-panel-enter-active');
    infoPanel.classList.add('info-panel-leave-to');
    unhighlightObject();
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