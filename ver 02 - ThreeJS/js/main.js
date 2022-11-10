"use strict";

let container = document.getElementById("container");

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    400
);
// camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 1, 1000 );
camera.position.set(100, 40, 20);
var frustumSize = 1000;

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
var clock = new THREE.Clock();

var axisSize = 60;
var colors = [
    0xed6a5a, 0xf4f1bb, 0x9bc1bc, 0x5ca4a9, 0xe6ebe0, 0xf0b67f, 0xfe5f55,
    0xd6d1b1, 0xc7efcf, 0xeef5db, 0x50514f, 0xf25f5c, 0xffe066, 0x247ba0,
    0x70c1b3,
];

var jsonData = JSON.parse(data);
var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
var graph = new THREE.Object3D();
scene.add(graph);

class Field {
    constructor(width_x, width_z, height_y) {
        this.width_x = width_x;
        this.width_z = width_z;
        this.height_y = height_y;

        const c = 1.1;

        this.axisLength_x = width_x * c;
        this.axisLength_z = width_z * c;
        this.axisLength_y = height_y * c;
    }
}

class Params {
    constructor() {
        this.dl = 1; // Δl
        this.dt_ms = 50; // Δt
        this.sleepTime_ms = 50;
        this.curves = true;
        this.circles = false;
        this.lineWidth = 5;
        this.taper = "parabolic";
        this.strokes = false;
        this.sizeAttenuation = false;
        this.autoRotate = false;
        this.autoUpdate = true;
        this.update = function () {
            clearScene();
            init();
        };
    }
}

var field = new Field(80, 80, 20);
var params = new Params();
var gui = new dat.GUI();

function paramsLoad() {
    function update() {
        if (params.autoUpdate) {
            clearScene();
            init();
        }
    }

    // gui.add(params, "curves").onChange(update);
    // gui.add(params, "circles").onChange(update);
    gui.add(params, "dl", 0.5, 5).onChange(update);
    gui.add(params, "dt_ms", 20, 300).name("dt, ms").onChange(update);
    gui.add(params, "sleepTime_ms", 5, 300)
        .name("sleep time, ms")
        .onChange(update);

    gui.add(params, "lineWidth", 1, 15).onChange(update);
    // gui.add(params, "taper", ["none", "linear", "parabolic", "wavy"]).onChange(
    //     update
    // );
    // gui.add(params, "strokes").onChange(update);
    // gui.add(params, "sizeAttenuation").onChange(update);
    gui.add(params, "autoUpdate").onChange(update);
    gui.add(params, "update");
    gui.add(params, "autoRotate").onChange(function () {
        clock.getDelta();
    });

    // var loader = new THREE.TextureLoader();
    // loader.load("assets/stroke.png", function (texture) {
    //     strokeTexture = texture;
    //     init();
    // });
}

window.addEventListener("load", paramsLoad);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class TrajectoryByPoints {
    /**
     * @param {THREE.Vector3[]} points точки по которым надо построить траекторию движения
     * @param {number} colorIndex номер цвета линий траектории */
    constructor(points, colorIndex = 1) {
        this.points = points;
        this.colorIndex = colorIndex;

        this.calculateSectors();
        this.drawTrajectoryLines();
        this.initializeDataForMovement();

        // this.calculateWaypoints();
        // console.log("trajectory length = %d", this.length);
        // console.log(this.waypoints);
        // this.drawWaypoints();
    }

    getСyclicIndex = (index) => index % this.points.length;

    calculateSectors() {
        this.sectors = [];
        this.sectorDirections = [];
        this.trajectoryLength = 0;

        for (let index = 0; index < this.points.length; index++) {
            const source = this.points[this.getСyclicIndex(index)];
            const target = this.points[this.getСyclicIndex(index + 1)];
            const sector = new THREE.Vector3(
                target.x - source.x,
                target.y - source.y,
                target.z - source.z
            );

            this.trajectoryLength += sector.length();
            this.sectors.push(sector);

            this.sectorDirections.push(
                new THREE.Vector3(
                    sector.x / sector.length(),
                    sector.y / sector.length(),
                    sector.z / sector.length()
                )
            );
        }
    }

    calculateWaypoints() {
        let len = 0;
        let n = 0;
        let lengthNsSectors = 0;

        this.waypoints = [this.points[0]];

        while (len + params.dl < this.trajectoryLength) {
            len += params.dl;

            while (lengthNsSectors + this.sectors[n].length() < len) {
                lengthNsSectors += this.sectors[n].length();
                n++;
            }

            const deltaLen = len - lengthNsSectors;
            const partOfThisSector = deltaLen / this.sectors[n].length();
            const sector = this.sectors[n];
            const point = this.points[n];

            // console.log(n, partOfThisSector);

            this.waypoints.push(
                new THREE.Vector3(
                    point.x + sector.x * partOfThisSector,
                    point.y + sector.y * partOfThisSector,
                    point.z + sector.z * partOfThisSector
                )
            );
        }
    }

    drawTrajectoryLines() {
        for (let index = 0; index < this.points.length; index++) {
            const point = this.points[index];
            createPointCude(point.x, point.y, point.z, this.colorIndex);
        }

        for (let index = 0; index < this.points.length; index++) {
            const source = this.points[this.getСyclicIndex(index)];
            const target = this.points[this.getСyclicIndex(index + 1)];
            var line = new THREE.Geometry();
            line.vertices.push(source);
            line.vertices.push(target);
            makeLineFromGeo(line, this.colorIndex);
        }
    }

    drawWaypoints() {
        for (let index = 0; index < this.waypoints.length; index++) {
            const waypoint = this.waypoints[index];
            createPointCude(
                waypoint.x,
                waypoint.y,
                waypoint.z,
                this.colorIndex + 1
            );
        }
    }

    initializeDataForMovement() {
        this.distanceTraveled = 0;
        this.locationSectorIndex = 0;
        this.lengthOfSectorsTraveled = 0;
        this.currentPosition = this.points[0];
        this.locationSectorLength = () =>
            this.sectors[this.locationSectorIndex].length();
    }

    /** Продвинуться по траектории определенное расстояние
     * @param {number} distance расстояние
     */
    moveAlongTrajectory(distance) {
        this.distanceTraveled += distance;

        while (
            this.lengthOfSectorsTraveled + this.locationSectorLength() <
            this.distanceTraveled
        ) {
            this.lengthOfSectorsTraveled += this.locationSectorLength();
            this.locationSectorIndex = this.getСyclicIndex(
                this.locationSectorIndex + 1
            );
        }

        const traveledDistanceOfLocationSector =
            this.distanceTraveled - this.lengthOfSectorsTraveled;
        const partOfLocationSector =
            traveledDistanceOfLocationSector / this.locationSectorLength();
        const sector = this.sectors[this.locationSectorIndex];
        const point = this.points[this.locationSectorIndex];

        this.currentPosition = new THREE.Vector3(
            point.x + sector.x * partOfLocationSector,
            point.y + sector.y * partOfLocationSector,
            point.z + sector.z * partOfLocationSector
        );
    }
}

class RectangleTrajectory extends TrajectoryByPoints {
    /**
     * @param {THREE.Vector3} cornerA первый угол прямоугольника
     * @param {THREE.Vector3} cornerB диагонально противоположенный угол прямоугольника
     * @param {number} colorIndex номер цвета линий траектории */
    constructor(cornerA, cornerB, colorIndex = 1) {
        // обмениваемся z координатами для создания недостающих 2 точек
        const cornerA1 = new THREE.Vector3(cornerA.x, cornerA.y, cornerB.z);
        const cornerB1 = new THREE.Vector3(cornerB.x, cornerB.y, cornerA.z);
        const rectanglePoints = [cornerA, cornerA1, cornerB, cornerB1];
        super(rectanglePoints, colorIndex);
    }
}

class CircleTrajectory extends TrajectoryByPoints {
    /**
     * @param {THREE.Vector3} center
     * @param {number} radius
     * @param {number} colorIndex номер цвета линий траектории */
    constructor(
        center = new THREE.Vector3(0, 0, 0),
        radius = 20,
        colorIndex = 1
    ) {
        // x = r cos t ; y = r sin t ; 0 ≤ t < 2π
        const x = (t) => center.x + radius * Math.cos(t);
        const y = center.y;
        const z = (t) => center.z + radius * Math.sin(t);

        // считаем угол равнобедренного треугольника
        // alpha / 2 = sin(dl / 2 / r)
        const realAlpha = Math.sin(params.dl / 2 / radius) * 2;
        const n = Math.ceil((2 * Math.PI) / realAlpha);
        const alpha = (2 * Math.PI) / n;

        let circlePoints = [];

        for (let i = 0; i < n; i++) {
            const t = i * alpha;
            circlePoints.push(new THREE.Vector3(x(t), y, z(t)));
        }

        super(circlePoints, colorIndex);

        this.center = center;
        this.radius = radius;
    }
}

/// Шаблон летающего сенсора
class Sensor {
    constructor(trajectory, speed, colorIndex = 5) {
        this.trajectory = trajectory;
        this.speed = speed;
        this.colorIndex = colorIndex;

        this.buildSensorObject();
        this.moving();
    }

    buildSensorObject() {
        const sphereRadius = 1.5;
        const sphereWidthDivisions = 16;
        const sphereHeightDivisions = 16;
        const sphereGeo = new THREE.SphereGeometry(
            sphereRadius,
            sphereWidthDivisions,
            sphereHeightDivisions
        );

        const sphereMat = new THREE.MeshPhongMaterial({
            color: colors[this.colorIndex],
        });

        this.meshObject = new THREE.Mesh(sphereGeo, sphereMat);
        graph.add(this.meshObject);
        this.positionSensor();
    }

    positionSensor() {
        const pos = this.trajectory.currentPosition;
        this.meshObject.position.set(pos.x, pos.y, pos.z);
    }

    makeStep() {
        const dtSec = params.dt_ms / 1000;
        this.trajectory.moveAlongTrajectory(this.speed * dtSec);
        this.positionSensor();
    }

    async moving() {
        while (true) {
            this.makeStep();
            await sleep(params.sleepTime_ms);
        }
    }
}

/// Шаблон статичного сенсора
class StaticSensor {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

init();
render();

function clearScene() {
    scene.remove(graph);
    graph = new THREE.Object3D();
    scene.add(graph);
}

function init() {
    // console.log(jsonData);

    createAxis();
    createAxisText();
    creatrLight();
    createStaticSensors();
    createFlyingSensors();
}

function createStaticSensors() {
    var staticSensors = [];
    staticSensors.push(new StaticSensor(30, 0, 30));
    staticSensors.push(new StaticSensor(60, 0, 30));

    for (var index = 0; index < staticSensors.length; index++) {
        var s = staticSensors[index];
        createCylinder(s.x, s.y, s.z, 2);
    }
}

function createFlyingSensors() {
    var points = [
        new THREE.Vector3(10, 10, 10),
        new THREE.Vector3(40, 10, 10),
        new THREE.Vector3(40, 10, 40),
    ];

    // var trajectory = new TrajectoryByPoints(points);
    // var trajectory = new RectangleTrajectory(points[0], points[2]);
    var trajectory = new CircleTrajectory();

    var flyingSensors = [];
    flyingSensors.push(new Sensor(trajectory, 10));

    for (var index = 0; index < flyingSensors.length; index++) {
        var s = flyingSensors[index];
        // createCylinder(s.x, s.y, s.z, 2);
    }
}

function createPointCude(x, y, z, colorIndex) {
    const size = 0.5;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshPhongMaterial({
        color: colors[colorIndex],
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    graph.add(cube);
}

function createCylinder(x, y, z, colorIndex) {
    const geometry = new THREE.CylinderGeometry(3, 4, 2.5, 16);
    const material = new THREE.MeshPhongMaterial({
        color: colors[colorIndex],
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(x, y, z);
    graph.add(cylinder);
}

function makeLineFromGeo(geo, c) {
    var g = new MeshLine();
    g.setGeometry(geo);

    var material = new MeshLineMaterial({
        useMap: false,
        color: new THREE.Color(colors[c]),
        opacity: 1,
        resolution: resolution,
        sizeAttenuation: false,
        lineWidth: params.lineWidth,
    });
    var mesh = new THREE.Mesh(g.geometry, material);
    graph.add(mesh);
}

function createSphere(x, y, z, colorIndex) {
    const sphereRadius = 3;
    const sphereWidthDivisions = 16;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(
        sphereRadius,
        sphereWidthDivisions,
        sphereHeightDivisions
    );

    const sphereMat = new THREE.MeshPhongMaterial({
        color: colors[colorIndex],
    });
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.set(x, y, z);
    graph.add(mesh);
}

function createOctahedron(x, y, z, colorIndex) {
    // https://threejs.org/docs/#api/en/geometries/OctahedronGeometry

    const octahedronRadius = 3;
    const octahedronGeo = new THREE.OctahedronGeometry(octahedronRadius);
    const octahedronMat = new THREE.MeshPhongMaterial({
        color: colors[colorIndex],
    });
    const mesh = new THREE.Mesh(octahedronGeo, octahedronMat);
    mesh.position.set(x, y, z);
    graph.add(mesh);
}

function createVertices() {
    for (let i = 0; i < jsonData.vertices.length; i++) {
        const element = jsonData.vertices[i];
        // console.log(element);
        const coords = element.coords;
        const type = Number(element.type);
        if (type == 1) {
            createSphere(coords[0], coords[1], coords[2], type);
        } else if (type == 2) {
            createOctahedron(coords[0], coords[1], coords[2], type);
        }
    }
}

function createEdges() {
    for (let i = 0; i < jsonData.edges.length; i++) {
        const element = jsonData.edges[i];
        const coordsSourse = element.coordsSourse;
        const coordsTarget = element.coordsTarget;
        const type = Number(element.type);
        // console.log(element);

        // createSphere(coords[0], coords[1], coords[2], type);

        var line = new THREE.Geometry();
        line.vertices.push(
            new THREE.Vector3(coordsSourse[0], coordsSourse[1], coordsSourse[2])
        );

        line.vertices.push(
            new THREE.Vector3(coordsTarget[0], coordsTarget[1], coordsTarget[2])
        );

        makeLineFromGeo(line, type);
    }
}

function createLine(sourceVector3, targetVector3) {
    var line = new THREE.Geometry();
    line.vertices.push(sourceVector3);
    line.vertices.push(targetVector3);
    makeLineFromGeo(line, 3);
}

function createArrow(sourceVector3, targetVector3) {
    var line = new THREE.Geometry();
    line.vertices.push(sourceVector3);
    line.vertices.push(targetVector3);
    makeLineFromGeo(line, 3);

    var x = targetVector3.x - sourceVector3.x;
    var y = targetVector3.y - sourceVector3.y;
    var z = targetVector3.z - sourceVector3.z;

    var alpha = y == 0 ? (Math.sign(z) * Math.PI) / 2 : Math.atan(z / y); // поворот вокруг оси OX
    var beta = z == 0 ? (Math.sign(x) * Math.PI) / 2 : Math.atan(x / z); //  поворот вокруг оси OY
    var gamma = x == 0 ? (Math.sign(y) * Math.PI) / 2 : Math.atan(y / x); // поворот вокруг оси OZ

    // console.log(x, y, z);
    // console.log(alpha, beta, gamma);

    // var len = Math.sqrt(Math.pow(x), Math.pow(y), Math.pow(z));
    // x = x / len;
    // y = y / len;
    // z = z / len;

    // var coneSourceVector3 = new THREE.Vector3(
    //     targetVector3.x - x,
    //     targetVector3.y - y,
    //     targetVector3.z - z
    // );

    // конус

    // https://customizer.github.io/three.js-doc.ru/geometries/coneBufferGeometry.htm
    // https://threejs.org/docs/#api/en/geometries/ConeGeometry

    const coneRadius = 1.5;
    const coneHeight = 4;
    const coneRadiusSegments = 16;

    var coneGeo = new THREE.ConeGeometry(
        coneRadius,
        coneHeight,
        coneRadiusSegments
    );

    const coneMat = new THREE.MeshPhongMaterial({
        // flatShading: true,
        // color: "#CA8",
        color: colors[3],
    });
    const mesh = new THREE.Mesh(coneGeo, coneMat);
    mesh.position.set(targetVector3.x, targetVector3.y, targetVector3.z);
    // mesh.position.set(0, coneHeight/2, 0);

    mesh.rotation.x = alpha;
    mesh.rotation.z = -beta;
    mesh.rotation.y = gamma;

    graph.add(mesh);
}

function createAxis() {
    createArrow(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(field.axisLength_x, 0, 0)
    );
    createArrow(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, field.axisLength_y, 0)
    );
    createArrow(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, field.axisLength_z)
    );

    // куб 0 0 0
    // {
    //     const cubeSize = 0.2;
    //     const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    //     const cubeMat = new THREE.MeshPhongMaterial({ color: colors[3] });
    //     const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    //     graph.add(mesh);
    // }

    createLine(
        new THREE.Vector3(field.width_x, 0, 0),
        new THREE.Vector3(field.width_x, 0, field.width_z)
    );

    createLine(
        new THREE.Vector3(0, 0, field.width_z),
        new THREE.Vector3(field.width_x, 0, field.width_z)
    );
}

function textParameters(text, fontSize) {
    return {
        alignment: "center",
        backgroundColor: "rgba(0,0,0,0)",
        color: "#000000",
        fontFamily: "sans-serif",
        fontSize: fontSize,
        fontStyle: "normal",
        fontVariant: "normal",
        fontWeight: "normal",
        lineGap: 0.25,
        padding: 0.5,
        strokeColor: "#fff",
        strokeWidth: 0,
        text: text,
    };
}

function createAxisText() {
    const fontSize = 5;

    var parameters_x = textParameters("x", fontSize);
    var parameters_y = textParameters("y", fontSize);
    var parameters_z = textParameters("z", fontSize);

    var label_x = new THREE.TextSprite(parameters_x);
    var label_y = new THREE.TextSprite(parameters_y);
    var label_z = new THREE.TextSprite(parameters_z);

    label_x.position.set(field.axisLength_x + fontSize, 0, 0);
    label_y.position.set(0, field.axisLength_y + fontSize, 0);
    label_z.position.set(0, 0, field.axisLength_z + fontSize);

    graph.add(label_x);
    graph.add(label_y);
    graph.add(label_z);
}

function creatrLight() {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 2);
    light.target.position.set(-5, 0, 0);
    graph.add(light);
    graph.add(light.target);

    // https://www.youtube.com/watch?v=T6PhV4Hz0u4
    const ambientIntensity = 0.2;
    const ambientlight = new THREE.AmbientLight(color, ambientIntensity);
    graph.add(ambientlight);
}

onWindowResize();

function onWindowResize() {
    var w = container.clientWidth;
    var h = container.clientHeight;

    var aspect = w / h;

    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;

    camera.updateProjectionMatrix();

    renderer.setSize(w, h);

    resolution.set(w, h);
}

window.addEventListener("resize", onWindowResize);

function render() {
    requestAnimationFrame(render);
    controls.update();

    if (params.autoRotate) {
        graph.rotation.y += 0.25 * clock.getDelta();
    }

    renderer.render(scene, camera);
}
