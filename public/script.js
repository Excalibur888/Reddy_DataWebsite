import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import CanvasJS from '@canvasjs/charts';

const refreshRate = 100;
const USE_MOCK_DATA = true;

const rocketObj = 'assets/Reddy.obj'

const rocketPicture = document.getElementById("rocket-picture");
const altitudeGraphicDiv = document.getElementById("rocket-altitude-container");
const renderDiv = document.getElementById("rocket-render");
const phaseSteps = document.getElementsByClassName("rocket-phase-step");
const parachuteDiv = document.getElementById("parachute-status");
const rawDataDiv = document.getElementById("raw-data");

const MAX_ALTITUDE = 4000;
const INIT_EPOCH = Date.now();

let rocketModel;

const data = {
    altitude: [],
    accelerationX: [],
    accelerationY: [],
    accelerationZ: [],
    angularVelocityX: [],
    angularVelocityY: [],
    angularVelocityZ: [],
    parachute: false,
    phase: 3
}


data.altitude.push({
    x: Date.now() - INIT_EPOCH,
    y: 0
});
data.accelerationX.push({
    x: Date.now() - INIT_EPOCH,
    y: 8.9
});
data.accelerationY.push({
    x: Date.now() - INIT_EPOCH,
    y: 8.9
});
data.accelerationZ.push({
    x: Date.now() - INIT_EPOCH,
    y: 8.9
});
data.angularVelocityX.push({
    x: Date.now() - INIT_EPOCH,
    y: 0.01
});
data.angularVelocityY.push({
    x: Date.now() - INIT_EPOCH,
    y: 0.01
});
data.angularVelocityZ.push({
    x: Date.now() - INIT_EPOCH,
    y: 0.01
});

// Mock data generation
let mockTime = 0;
const FLIGHT_DURATION = 60000; // 1 minute total
const MAX_DATA_POINTS = 50;
const APOGEE_TIME = 8000; // Apogee at 8s
const TARGET_APOGEE = 3700; // 3.7km
let flightEnded = false;
let velocity = 0;
let currentAltitude = 0;

// Quaternion state (w, x, y, z) - starts pointing up (rotated 90° on X axis)
const sqrt2 = Math.sqrt(2) / 2;
let quat = { w: sqrt2, x: sqrt2, y: 0, z: 0 };
let rollAngle = 0;

function normalizeQuat(q) {
    const mag = Math.sqrt(q.w*q.w + q.x*q.x + q.y*q.y + q.z*q.z);
    return { w: q.w/mag, x: q.x/mag, y: q.y/mag, z: q.z/mag };
}

function multiplyQuat(a, b) {
    return {
        w: a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z,
        x: a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y,
        y: a.w*b.y - a.x*b.z + a.y*b.w + a.z*b.x,
        z: a.w*b.z + a.x*b.y - a.y*b.x + a.z*b.w
    };
}

function quatFromAxisAngle(ax, ay, az, angle) {
    const half = angle / 2;
    const s = Math.sin(half);
    return { w: Math.cos(half), x: ax * s, y: ay * s, z: az * s };
}

function generateMockData() {
    const dt = refreshRate / 1000;
    mockTime += refreshRate;
    const t = mockTime / 1000;

    if (mockTime >= FLIGHT_DURATION) flightEnded = true;

    let accZ, phase;
    const BURN_START = 0.5;
    const BURN_END = 2.2;
    const BURN_PEAK = 0.7;
    const PEAK_ACC = 280;
    
    let rollSpeed = 0;
    let tiltX = 0, tiltZ = 0;
    
    if (t < BURN_START) {
        accZ = 0;
        phase = 1;
        rollSpeed = 0;
    } else if (t < BURN_END) {
        const burnT = t - BURN_START;
        const peakT = BURN_PEAK - BURN_START;
        const decayT = BURN_END - BURN_PEAK;
        if (t < BURN_PEAK) {
            accZ = PEAK_ACC * Math.pow(burnT / peakT, 0.2);
        } else {
            accZ = PEAK_ACC * Math.exp(-(t - BURN_PEAK) / (decayT * 0.6));
        }
        accZ += (Math.random() - 0.5) * 10;
        phase = t < 1 ? 2 : 3;
        rollSpeed = 5.0;
        tiltX = 0.015 * Math.sin(t * 4);
        tiltZ = 0.015 * Math.cos(t * 3);
    } else if (velocity > 0) {
        accZ = -9.81 + (Math.random() - 0.5) * 0.3;
        phase = 4;
        rollSpeed = 2.5;
        tiltX = 0.05 * Math.sin(t * 1.5);
        tiltZ = 0.05 * Math.cos(t * 1.2);
    } else if (currentAltitude > 10) {
        data.parachute = true;
        const terminalVel = -8;
        accZ = (velocity < terminalVel) ? 3 : -0.5;
        phase = velocity < -5 ? 6 : 5;
        rollSpeed = 0.2;
        tiltX = 0.2 * Math.sin(t * 0.4);
        tiltZ = 0.2 * Math.cos(t * 0.35);
    } else {
        accZ = 0;
        velocity = 0;
        currentAltitude = 0;
        phase = 7;
        rollSpeed = 0;
    }

    velocity += accZ * dt;
    currentAltitude = Math.max(0, currentAltitude + velocity * dt);

    // Quaternion: roll sur l'axe longitudinal (Z du modèle) puis rotation pour pointer vers le haut
    rollAngle += rollSpeed * dt;
    const rollQuat = quatFromAxisAngle(0, 0, 1, rollAngle); // Roll autour de Z (axe long du modèle)
    const baseUp = { w: sqrt2, x: -sqrt2, y: 0, z: 0 }; // Rotation pour pointer vers le haut
    const tiltQuat = quatFromAxisAngle(tiltX, 0, tiltZ, Math.sqrt(tiltX*tiltX + tiltZ*tiltZ));
    quat = normalizeQuat(multiplyQuat(multiplyQuat(baseUp, tiltQuat), rollQuat));

    const vibration = phase === 3 ? 10 : 0.5;
    const accX = (Math.random() - 0.5) * vibration;
    const accY = (Math.random() - 0.5) * vibration;

    data.phase = phase;
    return { 
        altitude: currentAltitude, 
        accX, accY, accZ, 
        gyroX: tiltX, gyroY: rollSpeed, gyroZ: tiltZ,
        quat: { ...quat }
    };
}

function pushMockData() {
    if (flightEnded) return;
    const mock = generateMockData();
    const now = Date.now() - INIT_EPOCH;

    while (data.altitude.length >= MAX_DATA_POINTS) data.altitude.shift();
    data.altitude.push({ x: now, y: mock.altitude });

    while (data.accelerationX.length >= MAX_DATA_POINTS) data.accelerationX.shift();
    data.accelerationX.push({ x: now, y: mock.accX });
    while (data.accelerationY.length >= MAX_DATA_POINTS) data.accelerationY.shift();
    data.accelerationY.push({ x: now, y: mock.accY });
    while (data.accelerationZ.length >= MAX_DATA_POINTS) data.accelerationZ.shift();
    data.accelerationZ.push({ x: now, y: mock.accZ });

    while (data.angularVelocityX.length >= MAX_DATA_POINTS) data.angularVelocityX.shift();
    data.angularVelocityX.push({ x: now, y: mock.gyroX });
    while (data.angularVelocityY.length >= MAX_DATA_POINTS) data.angularVelocityY.shift();
    data.angularVelocityY.push({ x: now, y: mock.gyroY });
    while (data.angularVelocityZ.length >= MAX_DATA_POINTS) data.angularVelocityZ.shift();
    data.angularVelocityZ.push({ x: now, y: mock.gyroZ });
}

async function fetchData() {
    const response = await fetch("/data");
    const liveData = await response.json();
    if (!liveData) return null;
    console.log("Data retrieved");
    if (liveData.Baro) {
        if (data.altitude.length > 80 * refreshRate ) data.altitude.shift();
        data.altitude.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.Baro
        });
    }
    if (liveData.AccX) {
        if (data.accelerationX.length > 80 * refreshRate ) data.accelerationX.shift();
        data.accelerationX.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.AccX
        });
    }
    if (liveData.AccY) {
        if (data.accelerationY.length > 80 * refreshRate ) data.accelerationY.shift();
        data.accelerationY.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.AccY
        });
    }
    if (liveData.AccZ) {
        if (data.accelerationZ.length > 80 * refreshRate ) data.accelerationZ.shift();
        data.accelerationZ.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.AccZ
        });
    }
    if (liveData.GyroX) {
        if (data.angularVelocityX.length > 80 * refreshRate ) data.angularVelocityX.shift();
        data.angularVelocityX.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.GyroX
        });
    }
    if (liveData.GyroY) {
        if (data.angularVelocityY.length > 80 * refreshRate ) data.angularVelocityY.shift();
        data.angularVelocityY.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.GyroY
        });
    }
    if (liveData.GyroZ) {
        if (data.angularVelocityZ.length > 80 * refreshRate ) data.angularVelocityZ.shift();
        data.angularVelocityZ.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.GyroZ
        });
    }
}

//*****************
// Rocket altitude
//*****************

for (let i = 0; i < 11; i++) {
    const mark = document.createElement("span");
    mark.style.bottom = `${i * 10}%`;
    const label = document.createElement("p");
    label.appendChild(document.createTextNode(`${MAX_ALTITUDE * ((i * 10) / 100)} m`));
    mark.appendChild(label);
    altitudeGraphicDiv.appendChild(mark);
}


//*****************
// Rocket render
//*****************

const container = renderDiv;
const scene = new THREE.Scene();

const light = new THREE.HemisphereLight(0xffffff, 0x9e9e9e, 5);
scene.add(light);

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.x = 500;
camera.position.y = 0;
camera.position.z = 0;
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 1);

container.appendChild(renderer.domElement);

const objLoader = new OBJLoader()
objLoader.load(rocketObj, (object) => {
    rocketModel = object;
    rocketModel.traverse(function (obj) {
        if (obj instanceof THREE.Mesh) {
            obj.material.color = new THREE.Color(0xffffff);
        }
    });
    scene.add(rocketModel);
}, (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
}, (error) => {
    console.log(error);
});

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    render();
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
}

animate()


//*****************
// Rocket stats
//*****************

let altitudeChart = new CanvasJS.Chart("altitude", {
    title: { text: "Altitude (m)", fontColor: "white", fontFamily: "sans-serif", fontWeight: "normal" },
    data: [{ type: "spline", markerType: "none", dataPoints: data.altitude, color: "green" }],
    backgroundColor: "#000000",
    axisX: { labelFontColor: "white" },
    axisY: { labelFontColor: "white", labelMaxWidth: 20 }
});

let accelerationChart = new CanvasJS.Chart("acceleration", {
    title: { text: "Acceleration (m/s²)", fontColor: "white", fontFamily: "sans-serif", fontWeight: "normal" },
    toolTip: { shared: true },
    data: [
        { name: "accX", type: "spline", markerType: "none", dataPoints: data.accelerationX, color: "red", showInLegend: true },
        { name: "accY", type: "spline", markerType: "none", dataPoints: data.accelerationY, color: "yellow", showInLegend: true },
        { name: "accZ", type: "spline", markerType: "none", dataPoints: data.accelerationZ, color: "blue", showInLegend: true }
    ],
    backgroundColor: "#000000",
    axisX: { labelFontColor: "white" },
    axisY: { labelFontColor: "white", labelMaxWidth: 20 }
});

let angularVelocityChart = new CanvasJS.Chart("angularVelocity", {
    title: { text: "Angular Velocity (rad/s)", fontColor: "white", fontFamily: "sans-serif", fontWeight: "normal" },
    toolTip: { shared: true },
    data: [
        { name: "gyroX", type: "spline", markerType: "none", dataPoints: data.angularVelocityX, color: "red", showInLegend: true },
        { name: "gyroY", type: "spline", markerType: "none", dataPoints: data.angularVelocityY, color: "yellow", showInLegend: true },
        { name: "gyroZ", type: "spline", markerType: "none", dataPoints: data.angularVelocityZ, color: "blue", showInLegend: true }
    ],
    backgroundColor: "#000000",
    axisX: { labelFontColor: "white" },
    axisY: { labelFontColor: "white", labelMaxWidth: 20 }
});

const parachuteField = document.createElement("p");
parachuteDiv.appendChild(parachuteField);

//*****************
// Loop
//*****************

function update() {
    let i = 0;
    setInterval(function () {

        if (USE_MOCK_DATA) {
            pushMockData();
        } else {
            fetchData();
        }

        parachuteField.innerHTML = '';
        parachuteField.appendChild(document.createTextNode(`Parachute status : ${data.parachute ? "ejected" : "standby"}`));
        parachuteDiv.style.backgroundColor = data.parachute ? "#407500" : "#750000";

        rawDataDiv.innerHTML = '';
        for (const property in data) {
            let node;
            if (Array.isArray(data[property]))
                node = document.createTextNode(`${property} = ${data[property][data[property].length-1].y}\t`);
            else
                node = document.createTextNode(`${property} = ${data[property]}\t`);
            let rawDataP = document.createElement("p");
            rawDataP.appendChild(node);
            rawDataDiv.appendChild(rawDataP);
        }

        rocketPicture.style.bottom = `${(data.altitude[data.altitude.length - 1].y / MAX_ALTITUDE * 100)}%`;

        if (rocketModel && USE_MOCK_DATA) {
            rocketModel.quaternion.set(quat.x, quat.y, quat.z, quat.w);
        } else if (rocketModel) {
            rocketModel.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 1), i * Math.PI / 24);
            i++;
        }

        altitudeChart.render();
        accelerationChart.render();
        angularVelocityChart.render();

        for (let j = 0; j < data.phase; j++) {
            const phaseStepSvg = phaseSteps[j].getElementsByTagName('svg');
            phaseStepSvg[0].getElementsByTagName("circle")[0].style.fill = "green";
            phaseStepSvg[0].getElementsByTagName("line")[0].style.stroke = "green";
        }
    }, refreshRate);
}

update();
