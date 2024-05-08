import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import CanvasJS from '@canvasjs/charts';

const host = window.location.hostname;

const rocketObj = 'assets/Reddy.obj'

const rocketPicture = document.getElementById("rocket-picture");
const altitudeGraphicDiv = document.getElementById("rocket-altitude-container");
const renderDiv = document.getElementById("rocket-render");
const phaseSteps = document.getElementsByClassName("rocket-phase-step");
const parachuteDiv = document.getElementById("parachute-status");
const rawDataDiv = document.getElementById("raw-data");

const MAX_ALTITUDE = 400;
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

async function fetchData() {
    const response = await fetch("/data");
    const liveData = await response.json();
    if (!liveData) return null;
    console.log("Data retrieved");
    if (liveData.Baro) {
        data.altitude.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.Baro
        });
    }
    if (liveData.AccX) {
        data.accelerationX.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.AccX
        });
    }
    if (liveData.AccY) {
        data.accelerationY.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.AccY
        });
    }
    if (liveData.AccZ) {
        data.accelerationZ.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.AccZ
        });
    }
    if (liveData.GyroX) {
        data.angularVelocityX.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.GyroX
        });
    }
    if (liveData.GyroY) {
        data.angularVelocityY.push({
            x: Date.now() - INIT_EPOCH,
            y: liveData.GyroY
        });
    }
    if (liveData.GyroZ) {
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
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 1);

container.appendChild(renderer.domElement);

const objLoader = new OBJLoader()
objLoader.load(rocketObj, (object) => {
    rocketModel = object;
    rocketModel.rotation.x = -Math.PI / 2;
    rocketModel.traverse(function (obj) {
        if (obj instanceof THREE.Mesh) {
            obj.material.color = new THREE.Color(0xffffff);
        }
    });
    //object.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3);
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
    title: {
        text: `Altitude (m)`,
        fontColor: "white",
        fontFamily: "sans-serif",
        fontWeight: "normal"
    },
    data: [{
        type: "spline",
        markerType: "none",
        dataPoints: data.altitude,
        color: "green"
    }],
    backgroundColor: "#000000",
    axisX: {
        labelFontColor: "white"
    },
    axisY: {
        labelFontColor: "white",
        labelMaxWidth: 20
    }
});
let accelerationChart = new CanvasJS.Chart("acceleration", {
    title: {
        text: `Acceleration (m/s²)`,
        fontColor: "white",
        fontFamily: "sans-serif",
        fontWeight: "normal"
    },
    toolTip: {
        shared: true
    },
    data: [
        {
            name: "accX",
            type: "spline",
            markerType: "none",
            dataPoints: data.accelerationX,
            color: "red",
            showInLegend: true
        },
        {
            name: "accY",
            type: "spline",
            markerType: "none",
            dataPoints: data.accelerationY,
            color: "yellow",
            showInLegend: true
        },
        {
            name: "accZ",
            type: "spline",
            markerType: "none",
            dataPoints: data.accelerationZ,
            color: "blue",
            showInLegend: true
        }
    ],
    backgroundColor: "#000000",
    axisX: {
        labelFontColor: "white"
    },
    axisY: {
        labelFontColor: "white",
        labelMaxWidth: 20
    }
});
let angularVelocityChart = new CanvasJS.Chart("angularVelocity", {
    title: {
        text: `Angular Velocity (rad/s)`,
        fontColor: "white",
        fontFamily: "sans-serif",
        fontWeight: "normal"
    },
    toolTip: {
        shared: true
    },
    data: [
        {
            name: "gyroX",
            type: "spline",
            markerType: "none",
            dataPoints: data.angularVelocityX,
            color: "red",
            showInLegend: true
        },
        {
            name: "gyroY",
            type: "spline",
            markerType: "none",
            dataPoints: data.angularVelocityY,
            color: "yellow",
            showInLegend: true
        },
        {
            name: "gyroZ",
            type: "spline",
            markerType: "none",
            dataPoints: data.angularVelocityZ,
            color: "blue",
            showInLegend: true
        }
    ],
    backgroundColor: "#000000",
    axisX: {
        labelFontColor: "white"
    },
    axisY: {
        labelFontColor: "white",
        labelMaxWidth: 20
    }
});

const parachuteField = document.createElement("p");
parachuteDiv.appendChild(parachuteField);

//*****************
// Loop
//*****************

function update() {
    let i = 0;
    setInterval(function () {

        fetchData()

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

        if (rocketModel) rocketModel.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 1), i * Math.PI / 24);
        i++;

        altitudeChart.options.title.text = `Altitude (m)`;
        altitudeChart.render();
        accelerationChart.options.title.text = `Acceleration (m/s²)`;
        accelerationChart.render();
        angularVelocityChart.options.title.text = `Angular Velocity (rad/s)`;
        angularVelocityChart.render();

        for (let j = 0; j < data.phase; j++) {
            const phaseStepSvg = phaseSteps[j].getElementsByTagName('svg');
            phaseStepSvg[0].getElementsByTagName("circle")[0].style.fill = "green";
            phaseStepSvg[0].getElementsByTagName("line")[0].style.stroke = "green";
        }
    }, 250);
}

update();
