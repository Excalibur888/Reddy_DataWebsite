import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import CanvasJS from '@canvasjs/charts';

const rocketPicture = document.getElementById("rocket-picture");
const altitudeGraphicDiv = document.getElementById("rocket-altitude-container");
const renderDiv = document.getElementById("rocket-render");
const altitudeDiv = document.getElementById("altitude");
const accelerationDiv = document.getElementById("acceleration");
const pressureDiv = document.getElementById("pressure");
const parachuteDiv = document.getElementById("parachute-status");

const MAX_ALTITUDE = 400;
const INIT_EPOCH = Date.now();

let rocketModel;
let altitude = [];
let acceleration = [];
let pressure = [];
let parachute = false;
// 0;15;987

altitude.push({
    x: Date.now() - INIT_EPOCH,
    y: 0
});
acceleration.push({
    x: Date.now() - INIT_EPOCH,
    y: 15
});
pressure.push({
    x: Date.now() - INIT_EPOCH,
    y: 987
});

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

const light = new THREE.HemisphereLight(0xffffff, 0xff0000, 5);
scene.add(light);

/*const light = new THREE.PointLight(0xffffff, 5, 0);
light.position.set(-150, 300, 100);
light.decay = 0;
scene.add(light);*/

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 1);

container.appendChild(renderer.domElement);

const objLoader = new OBJLoader()
objLoader.load('Reddy.obj', (object) => {
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
        text: `Altitude = ${altitude[altitude.length - 1].y} m`,
        fontColor: "white",
        fontFamily: "sans-serif",
        fontWeight: "normal"
    },
    data: [{
        type: "spline",
        markerType: "none",
        dataPoints: altitude,
        color: "red"
    }],
    backgroundColor: "#000000",
    axisX:{
        labelFontColor: "white"
    },
    axisY:{
        labelFontColor: "white",
        labelMaxWidth: 20
    }
});

let accelerationChart = new CanvasJS.Chart("acceleration", {
    title: {
        text: `Acceleration = ${acceleration[acceleration.length - 1].y} m`,
        fontColor: "white",
        fontFamily: "sans-serif",
        fontWeight: "normal"
    },
    data: [{
        type: "spline",
        markerType: "none",
        dataPoints: acceleration,
        color: "yellow"
    }],
    backgroundColor: "#000000",
    axisX:{
        labelFontColor: "white"
    },
    axisY:{
        labelFontColor: "white",
        labelMaxWidth: 20
    }
});
let pressureChart = new CanvasJS.Chart("pressure", {
    title: {
        text: `Pressure = ${pressure[pressure.length - 1].y} m`,
        fontColor: "white",
        fontFamily: "sans-serif",
        fontWeight: "normal"
    },
    data: [{
        type: "spline",
        markerType: "none",
        dataPoints: pressure,
        color: "blue"
    }],
    backgroundColor: "#000000",
    axisX:{
        labelFontColor: "white"
    },
    axisY:{
        labelFontColor: "white",
        labelMaxWidth: 20
    }
});

const parachuteField = document.createElement("p");
parachuteDiv.appendChild(parachuteField);

//https://canvasjs.com/html5-javascript-dynamic-chart/


//*****************
// Loop
//*****************

function update() {
    let i = 0;
    setInterval(function () {
        parachuteField.innerHTML = '';
        parachuteField.appendChild(document.createTextNode(`Parachute status : ${parachute ? "ejected" : "standby"}`));
        parachuteDiv.style.backgroundColor = parachute ? "#407500" : "#750000";
        rocketPicture.style.bottom = `${(altitude[altitude.length - 1].y / MAX_ALTITUDE * 100)}%`;
        altitude.push({
            x: Date.now() - INIT_EPOCH,
            y: altitude[altitude.length - 1].y + 1
        });
        acceleration.push({
            x: Date.now() - INIT_EPOCH,
            y: acceleration[acceleration.length - 1].y * 1.01
        });
        pressure.push({
            x: Date.now() - INIT_EPOCH,
            y: pressure[pressure.length - 1].y - 1
        });
        if (rocketModel) rocketModel.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 1), i * Math.PI / 24);
        i++;

        altitudeChart.options.title.text = `Altitude = ${Math.round(altitude[altitude.length - 1].y)} m`;
        altitudeChart.render();
        accelerationChart.options.title.text = `Acceleration = ${Math.round(acceleration[acceleration.length - 1].y)} m/s²`;
        accelerationChart.render();
        pressureChart.options.title.text = `Pressure = ${Math.round(pressure[pressure.length - 1].y)} hPa`;
        pressureChart.render();
    }, 50);
}

update();