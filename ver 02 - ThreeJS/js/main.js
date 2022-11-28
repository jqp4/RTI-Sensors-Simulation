"use strict";

// init ThreeJS

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

var colors = [
    0xed6a5a, 0xf4f1bb, 0x9bc1bc, 0x5ca4a9, 0xe6ebe0, 0xf0b67f, 0xfe5f55,
    0xd6d1b1, 0xc7efcf, 0xeef5db, 0x50514f, 0xf25f5c, 0xffe066, 0x247ba0,
    0x70c1b3,
];

var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
var graph = new THREE.Object3D();
scene.add(graph);

class Field {
    constructor(
        width_x = params.fieldWidthX,
        width_z = params.fieldWidthZ,
        height_y = params.fieldHeight
    ) {
        this.width_x = width_x;
        this.width_z = width_z;
        this.height_y = height_y;

        const c = 1.1;

        this.axisLength_x = width_x * c;
        this.axisLength_z = width_z * c;
        this.axisLength_y = height_y * c;
    }

    loadMap(mapData) {
        // this.n = mapData.length;
        // this.m = mapData[0].length;

        this.n = this.width_x;
        this.m = this.width_z;

        this.points = [];
        this.relief = new THREE.Object3D();

        // создаем относительную карту высот
        this.relativeHeightMap = this._getRelativeHeightMap(mapData);
        console.log("Обработали значения высот до относительных");

        // преобразовываем карты высот в множество точек-векторов
        this.points = Array.from({ length: this.n }, (_, i) =>
            Array.from(
                { length: this.m },
                (_, j) => new THREE.Vector3(i, this.relativeHeightMap[i][j], j)
            )
        );

        console.log("Преобразовали значения высот в точки-вектора");

        // for (var i = 0; i < n - 1; i++) {
        //     for (var j = 0; j < m - 1; j++) {
        //         // верхний треугольник
        //         this.relief.add(
        //             this._getTriangleMesh(
        //                 this.points[i + 1][j + 1],
        //                 this.points[i + 1][j],
        //                 this.points[i][j]
        //             )
        //         );

        //         // нижний треугольник
        //         this.relief.add(
        //             this._getTriangleMesh(
        //                 this.points[i][j],
        //                 this.points[i][j + 1],
        //                 this.points[i + 1][j + 1]
        //             )
        //         );

        //         // окантовка
        //         this.relief.add(
        //             this._getCellLine(
        //                 this.points[i][j],
        //                 this.points[i + 1][j],
        //                 this.points[i + 1][j + 1],
        //                 this.points[i][j + 1]
        //             )
        //         );
        //     }
        // }

        for (const line in this._getRowLines()) {
            if (Object.hasOwnProperty.call(this._getRowLines(), line)) {
                this.relief.add(this._getRowLines()[line]);
            }
        }

        for (const line in this._getColumnLines()) {
            if (Object.hasOwnProperty.call(this._getColumnLines(), line)) {
                this.relief.add(this._getColumnLines()[line]);
            }
        }

        console.log("Создали 3D структуру ребер для отображения карты");
        graph.add(this.relief);
    }

    _getRelativeHeightMap(mapData) {
        const iShift = 0;
        const jShift = 0;
        // const k = 3; // берем каждую 3 вершину (1 из 9 в квадрате)

        // const k =
        //     Math.floor(
        //         (Math.min(mapData.length, mapData[0].length) - Math.max(iShift, jShift)) /
        //             Math.max(this.n, this.m)
        //     ) - 1;

        const cellLength = 1000;
        const len = 40041440; // средняя длина окружности земли в метрах
        const k = Math.floor((cellLength / 3) * 60 * 60 * 360 / len);

        console.log(k);
        console.log((len / 360 / 60 / 60) * 3 * k);

        const getMapElement = (i, j) => mapData[iShift + i * k][jShift + j * k];

        var minHight = getMapElement(0, 0);
        var maxHight = getMapElement(0, 0);

        for (var i = 0; i < this.n; i++) {
            for (var j = 0; j < this.m; j++) {
                const height = getMapElement(i, j);

                if (height < minHight) minHight = height;
                if (height > maxHight) maxHight = height;
            }
        }

        const alpha = (this.height_y / (maxHight - minHight)) * 0.1;

        const relativeHeightMap = Array.from({ length: this.n }, (_, i) =>
            Array.from(
                { length: this.m },
                (_, j) => (getMapElement(i, j) - minHight - 10) * alpha
                // (_, j) => getMapElement(i, j) * alpha
            )
        );

        return relativeHeightMap;
    }

    /**
     * получаем частоту
     * @param {number[][]} mapData
     */
    // _getK(mapData)

    /**
     *
     * @param {THREE.Vector3} v1
     * @param {THREE.Vector3} v2
     * @param {THREE.Vector3} v3
     * @returns THREE.Mesh
     */
    _getTriangleMesh(v1, v2, v3, colorIndex = 10) {
        // https://stackoverflow.com/questions/39398503/draw-a-basic-triangle-with-three-js

        var geom = new THREE.Geometry();
        const triangle = new THREE.Triangle(v1, v2, v3);
        var normal = new THREE.Triangle(0, 10, 0);
        // triangle.getNormal(normal)
        geom.vertices.push(triangle.a);
        geom.vertices.push(triangle.b);
        geom.vertices.push(triangle.c);
        geom.faces.push(
            new THREE.Face3(0, 1, 2, normal, new THREE.Color(0xffaa00))
        );

        // const material = new THREE.MeshPhongMaterial({
        //     color: colors[colorIndex],
        // });

        const material = new THREE.MeshBasicMaterial({
            color: colors[3],
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geom, material);
        return mesh;
    }

    /**
     *
     * @param {THREE.Vector3} v1
     * @param {THREE.Vector3} v2
     * @param {THREE.Vector3} v3
     *  @param {THREE.Vector3} v4
     * @returns THREE.Line
     */
    _getCellLine(v1, v2, v3, v4) {
        var geometry = new THREE.Geometry();
        geometry.vertices.push(v1);
        geometry.vertices.push(v2);
        geometry.vertices.push(v3);
        geometry.vertices.push(v4);
        geometry.vertices.push(v1);

        // игнорируем диагональ
        // geometry.vertices.push(v1);

        var line = new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ color: 0x000000 })
        );

        return line;
    }

    /**
     * Создает линии по строкам
     * @returns THREE.Line[]
     */
    _getRowLines() {
        var lines = [];
        for (var i = 0; i < this.n; i++) {
            var geometry = new THREE.Geometry();
            for (var j = 0; j < this.m; j++) {
                geometry.vertices.push(this.points[i][j]);
            }

            var line = new THREE.Line(
                geometry,
                new THREE.LineBasicMaterial({ color: 0x000000 })
            );

            lines.push(line);
        }

        return lines;
    }

    /**
     * Создает линии по столбцам
     * @returns THREE.Line[]
     */
    _getColumnLines() {
        var lines = [];
        for (var j = 0; j < this.m; j++) {
            var geometry = new THREE.Geometry();
            for (var i = 0; i < this.n; i++) {
                geometry.vertices.push(this.points[i][j]);
            }

            var line = new THREE.Line(
                geometry,
                new THREE.LineBasicMaterial({ color: 0x000000 })
            );

            lines.push(line);
        }

        return lines;
    }
}

class Params {
    constructor() {
        this.dl = 1; // Δl
        this.dt_ms = 50; // Δt
        this.sleepTime_ms = 50;

        this.fieldWidthX = 80;
        this.fieldWidthZ = 80;
        this.fieldHeight = 40;

        this.radioVisibility = 15;
        this.showAreaOfRadioVisibility = false;
        this.showTrajectoryPoints = false;
        this.showTrajectoryLines = true;

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
            main();
        };

        this.pause = false;
    }
}

var params = new Params();
var gui = new dat.GUI({ width: 450 });
var field = new Field();
field.loadMap(mapDataSRTM);

function paramsLoad() {
    function update() {
        if (params.autoUpdate) {
            field = new Field();
            clearScene();
            main();
        }
    }

    gui.add(params, "dl", 0.5, 5).name("dl, km").onChange(update);
    gui.add(params, "dt_ms", 20, 300).name("dt, ms").onChange(update);
    gui.add(params, "sleepTime_ms", 20, 300)
        .name("sleep time, ms")
        .onChange(update);

    gui.add(params, "fieldWidthX", 10, 300)
        .name("field width X, km")
        .onChange(update);

    gui.add(params, "fieldWidthZ", 10, 300)
        .name("field width Z, km")
        .onChange(update);

    gui.add(params, "fieldHeight", 10, 100)
        .name("field height, km")
        .onChange(update);

    gui.add(params, "radioVisibility", 5, 30)
        .name("radio visibility, km")
        .onChange(update);

    gui.add(params, "showAreaOfRadioVisibility")
        .name("show area of radio visibility")
        .onChange(update);

    gui.add(params, "showTrajectoryPoints")
        .name("show trajectory points")
        .onChange(update);

    gui.add(params, "showTrajectoryLines")
        .name("show trajectory lines")
        .onChange(update);

    gui.add(params, "lineWidth", 1, 15).name("line width").onChange(update);

    gui.add(params, "autoRotate")
        .name("auto rotate")
        .onChange(function () {
            clock.getDelta();
        });

    gui.add(params, "pause").name("pause").onChange(update);

    gui.add(params, "update");

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
        if (params.showTrajectoryPoints) {
            for (let index = 0; index < this.points.length; index++) {
                const point = this.points[index];
                createPointCube(point.x, point.y, point.z, this.colorIndex);
            }
        }

        if (params.showTrajectoryLines) {
            for (let index = 0; index < this.points.length; index++) {
                const source = this.points[this.getСyclicIndex(index)];
                const target = this.points[this.getСyclicIndex(index + 1)];
                var line = new THREE.Geometry();
                line.vertices.push(source);
                line.vertices.push(target);
                makeLineFromGeo(line, this.colorIndex);
            }
        }
    }

    drawWaypoints() {
        for (let index = 0; index < this.waypoints.length; index++) {
            const waypoint = this.waypoints[index];
            createPointCube(
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
     * @param {THREE.Vector3} cornerC диагонально противоположенный угол прямоугольника
     * @param {number} colorIndex номер цвета линий траектории */
    constructor(cornerA, cornerC, colorIndex = 1) {
        // обмениваемся z координатами для создания недостающих 2 точек
        // (по часовой)
        const cornerB = new THREE.Vector3(cornerC.x, cornerC.y, cornerA.z);
        const cornerD = new THREE.Vector3(cornerA.x, cornerA.y, cornerC.z);
        const rectanglePoints = [cornerA, cornerB, cornerC, cornerD];
        super(rectanglePoints, colorIndex);
    }
}

class RoundedRectangleTrajectory extends TrajectoryByPoints {
    /**
     * @param {THREE.Vector3} cornerA первый угол прямоугольника
     * @param {THREE.Vector3} cornerC диагонально противоположенный угол прямоугольника
     * @param {number} colorIndex номер цвета линий траектории */
    constructor(cornerA, cornerC, colorIndex = 1) {
        // обмениваемся z координатами для создания недостающих 2 точек
        // (по часовой)
        const cornerB = new THREE.Vector3(cornerC.x, cornerC.y, cornerA.z);
        const cornerD = new THREE.Vector3(cornerA.x, cornerA.y, cornerC.z);

        /**
         * вектор помноженный на число
         * @param {THREE.Vector3} vector вектор
         * @param {number} alpha число */
        let partOfVector = (vector, alpha = 0.1) => {
            return new THREE.Vector3(
                vector.x * alpha,
                vector.y * alpha,
                vector.z * alpha
            );
        };

        const alpha = 0.9;

        /**
         * сдвиг от одного вектора
         * @param {THREE.Vector3} vectorA первый вектор
         * @param {THREE.Vector3} vectorB второй вектор */
        let getShift = (vectorA, vectorB) => {
            const beta = 3.2;
            return new THREE.Vector3(
                vectorA.x + beta * alpha * Math.sign(vectorB.x - vectorA.x),
                vectorA.y + beta * alpha * Math.sign(vectorB.y - vectorA.y),
                vectorA.z + beta * alpha * Math.sign(vectorB.z - vectorA.z)
            );
        };

        /**
         * сдвиг от двух векторов
         * @param {THREE.Vector3} vectorA первый вектор
         * @param {THREE.Vector3} vectorB второй вектор
         * @param {THREE.Vector3} vectorС третий вектор */
        let getDoubleShift = (vectorA, vectorB, vectorC) => {
            return new THREE.Vector3(
                vectorA.x +
                    alpha * Math.sign(vectorB.x - vectorA.x) +
                    alpha * Math.sign(vectorC.x - vectorA.x),
                vectorA.y +
                    alpha * Math.sign(vectorB.y - vectorA.y) +
                    alpha * Math.sign(vectorC.y - vectorA.y),
                vectorA.z +
                    alpha * Math.sign(vectorB.z - vectorA.z) +
                    alpha * Math.sign(vectorC.z - vectorA.z)
            );
        };

        const cornerA1 = getShift(cornerA, cornerD);
        const cornerA2 = getDoubleShift(cornerA, cornerB, cornerD);
        const cornerA3 = getShift(cornerA, cornerB);

        const cornerB1 = getShift(cornerB, cornerA);
        const cornerB2 = getDoubleShift(cornerB, cornerA, cornerC);
        const cornerB3 = getShift(cornerB, cornerC);

        const cornerC1 = getShift(cornerC, cornerB);
        const cornerC2 = getDoubleShift(cornerC, cornerB, cornerD);
        const cornerC3 = getShift(cornerC, cornerD);

        const cornerD1 = getShift(cornerD, cornerC);
        const cornerD2 = getDoubleShift(cornerD, cornerA, cornerC);
        const cornerD3 = getShift(cornerD, cornerA);

        const rectanglePoints = [
            cornerA1,
            cornerA2,
            cornerA3,

            cornerB1,
            cornerB2,
            cornerB3,

            cornerC1,
            cornerC2,
            cornerC3,

            cornerD1,
            cornerD2,
            cornerD3,
        ];
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
        this.colorIndex = colorIndex;
        this.speed = speed;
        this.id = -1;

        this.buildSensorObject();
        this.buildAreaOfRadioVisibility();
        this.updateSensorPosition();
    }

    setId(id) {
        this.id = id;
    }

    getPos() {
        return this.trajectory.currentPosition;
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

        this.sensorObject = new THREE.Mesh(sphereGeo, sphereMat);
        graph.add(this.sensorObject);
    }

    buildAreaOfRadioVisibility() {
        const sphereRadius = params.radioVisibility;
        const sphereWidthDivisions = 16;
        const sphereHeightDivisions = 16;
        const sphereGeo = new THREE.SphereGeometry(
            sphereRadius,
            sphereWidthDivisions,
            sphereHeightDivisions
        );

        const sphereMat = new THREE.MeshPhongMaterial({
            visible: params.showAreaOfRadioVisibility,
            color: colors[this.colorIndex],
            transparent: true,
            opacity: 0.2,
        });

        this.areaOfRadioVisibility = new THREE.Mesh(sphereGeo, sphereMat);
        graph.add(this.areaOfRadioVisibility);
    }

    updateSensorPosition() {
        const pos = this.getPos();
        this.sensorObject.position.set(pos.x, pos.y, pos.z);
        if (params.showAreaOfRadioVisibility) {
            this.areaOfRadioVisibility.position.set(pos.x, pos.y, pos.z);
        }
    }

    makeStep() {
        const dtSec = params.dt_ms / 1000;
        this.trajectory.moveAlongTrajectory(this.speed * dtSec);
        this.updateSensorPosition();
    }
}

/// Шаблон статичного сенсора
class StaticSensor {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.position = new THREE.Vector3(x, y, z);
        this.colorIndex = 2;
        this.id = -1;

        this.buildSensorObject();
        this.buildAreaOfRadioVisibility();
        this.updateSensorPosition();
    }

    setId(id) {
        this.id = id;
    }

    getPos() {
        return this.position;
    }

    updateSensorPosition() {
        const pos = this.getPos();
        if (params.showAreaOfRadioVisibility) {
            this.areaOfRadioVisibility.position.set(pos.x, pos.y, pos.z);
        }
    }

    buildSensorObject() {
        createCylinder(this.x, this.y, this.z, this.colorIndex);
    }

    buildAreaOfRadioVisibility() {
        const sphereRadius = params.radioVisibility;
        const sphereWidthDivisions = 16;
        const sphereHeightDivisions = 16;
        const sphereGeo = new THREE.SphereGeometry(
            sphereRadius,
            sphereWidthDivisions,
            sphereHeightDivisions
        );

        const sphereMat = new THREE.MeshPhongMaterial({
            visible: params.showAreaOfRadioVisibility,
            color: colors[this.colorIndex],
            transparent: true,
            opacity: 0.2,
        });

        this.areaOfRadioVisibility = new THREE.Mesh(sphereGeo, sphereMat);
        graph.add(this.areaOfRadioVisibility);
    }
}

class SensorsConnection {
    /// simplest
    constructor(sensor1, sensor2) {
        this.sensor1 = sensor1;
        this.sensor2 = sensor2;
        this.id1 = sensor1.id;
        this.id2 = sensor2.id;
        this.colorIndex = 0;
    }

    getDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
                Math.pow(pos1.y - pos2.y, 2) +
                Math.pow(pos1.z - pos2.z, 2)
        );
    }

    buildConnectionLine() {
        const pos1 = this.sensor1.getPos();
        const pos2 = this.sensor2.getPos();

        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(pos1);
        lineGeometry.vertices.push(pos2);

        this.g = new MeshLine();
        this.g.setGeometry(lineGeometry);

        this.mesh = new THREE.Mesh(
            this.g.geometry,
            getMeshLineMaterial(this.colorIndex)
        );

        graph.add(this.mesh);
    }

    updateConnectionLine() {
        const pos1 = this.sensor1.getPos();
        const pos2 = this.sensor2.getPos();

        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(pos1);
        lineGeometry.vertices.push(pos2);
        this.g.setGeometry(lineGeometry);

        const distance = this.getDistance(pos1, pos2);
        this.mesh.visible = distance <= params.radioVisibility * 2;
    }
}

class SensorsConnectionTrue {
    constructor(id1, id2) {
        this.id1 = id1;
        this.id2 = id2;
    }

    getDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
                Math.pow(pos1.y - pos2.y, 2) +
                Math.pow(pos1.z - pos2.z, 2)
        );
    }

    buildConnectionLine(pos1, pos2) {
        // this.line = createLine(pos1, pos2, this.colorIndex);

        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(pos1);
        lineGeometry.vertices.push(pos2);

        this.g = new MeshLine();
        this.g.setGeometry(lineGeometry);

        this.mesh = new THREE.Mesh(
            this.g.geometry,
            getMeshLineMaterial(this.colorIndex)
        );

        graph.add(this.mesh);
    }

    updateConnectionLine_old(pos1, pos2) {
        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(pos1);
        lineGeometry.vertices.push(pos2);
        this.g.setGeometry(lineGeometry);

        const distance = this.getDistance(pos1, pos2);
        this.mesh.visible = distance <= params.radioVisibility * 2;
    }
}

class SensorSimulation {
    constructor() {
        this.nextId = 0;
        this.sensors = new Map();
        this.staticSensorIds = [];
        this.flyingSensorIds = [];
        this.connections = [];

        this.createStaticSensors();
        this.createFlyingSensors();
        this.createConnectionsBetweenSensors();
    }

    getNewId() {
        const newId = this.nextId;
        this.nextId++;
        return newId;
    }

    addStaticSensor(staticSensor) {
        const id = this.getNewId();
        this.sensors.set(id, staticSensor);
        this.staticSensorIds.push(id);
    }

    addFlyingSensor(flyingSensor) {
        const id = this.getNewId();
        this.sensors.set(id, flyingSensor);
        this.flyingSensorIds.push(id);
    }

    createStaticSensors() {
        this.addStaticSensor(new StaticSensor(30, 0, 30));
        this.addStaticSensor(new StaticSensor(60, 0, 60));
    }

    createFlyingSensors() {
        var points = [
            new THREE.Vector3(10, 10, 10),
            new THREE.Vector3(40, 10, 10),
            new THREE.Vector3(40, 10, 40),
        ];

        var trajectory1 = new RoundedRectangleTrajectory(points[0], points[2]);
        var trajectory2 = new CircleTrajectory(
            new THREE.Vector3(30, 30, 30),
            15
        );

        this.addFlyingSensor(new Sensor(trajectory1, 10, 6));
        this.addFlyingSensor(new Sensor(trajectory2, 10, 5));
    }

    createConnectionsBetweenSensors() {
        for (let i = 0; i < this.flyingSensorIds.length; i++) {
            const id1 = this.flyingSensorIds[i];
            for (let j = i; j < this.flyingSensorIds.length; j++) {
                const id2 = this.flyingSensorIds[j];
                var connection = new SensorsConnection(
                    this.sensors.get(id1),
                    this.sensors.get(id2)
                );

                connection.buildConnectionLine();
                this.connections.push(connection);
            }
        }

        for (let i = 0; i < this.flyingSensorIds.length; i++) {
            const id1 = this.flyingSensorIds[i];
            for (let j = i; j < this.staticSensorIds.length; j++) {
                const id2 = this.staticSensorIds[j];
                var connection = new SensorsConnection(
                    this.sensors.get(id1),
                    this.sensors.get(id2)
                );

                connection.buildConnectionLine();
                this.connections.push(connection);
            }
        }
    }

    async start() {
        while (true) {
            for (let i = 0; i < this.flyingSensorIds.length; i++) {
                const sensorId = this.flyingSensorIds[i];
                this.sensors.get(sensorId).makeStep();
            }

            this.connections.forEach((connection) => {
                connection.updateConnectionLine();
            });

            await sleep(params.sleepTime_ms);
        }
    }
}

main();
render();

function clearScene() {
    scene.remove(graph);
    graph = new THREE.Object3D();
    scene.add(graph);
}

function main() {
    createAxis();
    // createChessBoardField();
    createAxisText();
    createLight();

    var simulation = new SensorSimulation();

    if (!params.pause) {
        simulation.start();
    }
}

function createPointCube(x, y, z, colorIndex) {
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
    const height = 2.5;
    const geometry = new THREE.CylinderGeometry(3, 4, height, 16);
    const material = new THREE.MeshPhongMaterial({
        color: colors[colorIndex],
    });

    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(x, y + height / 2, z);
    graph.add(cylinder);
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

function getMeshLineMaterial(colorIndex) {
    return new MeshLineMaterial({
        useMap: false,
        color: new THREE.Color(colors[colorIndex]),
        opacity: 1,
        resolution: resolution,
        sizeAttenuation: false,
        lineWidth: params.lineWidth,
    });
}

function makeLineFromGeo(geo, c) {
    var g = new MeshLine();
    g.setGeometry(geo);

    // var material = new MeshLineMaterial({
    //     useMap: false,
    //     color: new THREE.Color(colors[c]),
    //     opacity: 1,
    //     resolution: resolution,
    //     sizeAttenuation: false,
    //     lineWidth: params.lineWidth,
    // });

    var mesh = new THREE.Mesh(g.geometry, getMeshLineMaterial(c));
    graph.add(mesh);
    return mesh;
}

function createLine(sourceVector3, targetVector3, colorIndex = 3) {
    var line = new THREE.Geometry();
    line.vertices.push(sourceVector3);
    line.vertices.push(targetVector3);
    return makeLineFromGeo(line, colorIndex);
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
    {
        const cubeSize = 0.2;
        const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMat = new THREE.MeshPhongMaterial({ color: colors[3] });
        const mesh = new THREE.Mesh(cubeGeo, cubeMat);
        // graph.add(mesh);
    }
}

function createChessBoardField() {
    const step = 10;
    const fontSize = 2.5;
    const myString = "abcdefghijklmnopqrstuvwxyz";
    const splits = myString.split("");

    for (let width_x = step; width_x < field.width_x; width_x += step) {
        for (let width_z = step; width_z < field.width_z; width_z += step) {
            // параллельно оси OZ
            createLine(
                new THREE.Vector3(width_x, 0, 0),
                new THREE.Vector3(width_x, 0, width_z)
            );

            // параллельно оси OX
            createLine(
                new THREE.Vector3(0, 0, width_z),
                new THREE.Vector3(width_x, 0, width_z)
            );
        }
    }

    for (let i = 1; i < field.width_x / step; i++) {
        for (let j = 1; j < field.width_z / step; j++) {
            const x = (i - 0.5) * step;
            const z = (j - 0.5) * step;

            const text = splits[i] + j;
            const tpa = textParameters(text, fontSize);
            const label = new THREE.TextSprite(tpa);

            label.position.set(x, 0, z);
            graph.add(label);
        }
    }
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

function createLight() {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 2);
    light.target.position.set(-5, 0, 0);
    graph.add(light);
    graph.add(light.target);

    // https://www.youtube.com/watch?v=T6PhV4Hz0u4
    const ambientIntensity = 0.2;
    const ambientLight = new THREE.AmbientLight(color, ambientIntensity);
    graph.add(ambientLight);
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
