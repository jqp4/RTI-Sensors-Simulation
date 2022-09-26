import vpython as vp
import sympy as sy
import math
import enum
import random

# global double_pi
# double_pi = 6.283185307179586476


def vp_init():
    # vp.scene.title = "РТИ АСПД. Визуализация движения сенсоров"
    vp.scene.height = 600
    vp.scene.width = 800


class World:
    def __init__(self):
        # global grid
        self.grid = []
        self.grid_labels = []
        self.grid_frame = []

        self.font_size = 12

    def create_xy_grid(self, radius, dx):
        # xmax = extent of grid in each direction
        # dx = grid spacing
        self.clear_grid()

        # Create vertical lines.
        for x in range(-radius, radius + dx, dx):
            self.grid.append(
                vp.curve(pos=[vp.vector(x, radius, 0), vp.vector(x, -radius, 0)])
            )
            if x != -radius:
                self.grid_labels.append(
                    vp.label(
                        pos=vp.vector(x, radius, 0),
                        text=f"{radius + x} км",
                        xoffset=10,
                        yoffset=25,
                        height=self.font_size,
                        box=False,
                        font="sans",
                    )
                )

        for y in range(-radius, radius + dx, dx):
            self.grid.append(
                vp.curve(pos=[vp.vector(radius, y, 0), vp.vector(-radius, y, 0)])
            )
            if y != radius:
                self.grid_labels.append(
                    vp.label(
                        pos=vp.vector(-radius, y, 0),
                        text=f"{-radius + y} км",
                        xoffset=-25,
                        yoffset=10,
                        height=self.font_size,
                        box=False,
                        font="sans",
                    )
                )

        # Create [0 km] label
        self.grid_labels.append(
            vp.label(
                pos=vp.vector(-radius, radius, 0),
                text=f"{0} км",
                xoffset=-25,
                yoffset=25,
                height=self.font_size,
                box=False,
                font="sans",
            )
        )

        # Create grid frame
        fr = radius + 1.5
        self.grid_frame = vp.curve(
            pos=[
                vp.vector(-fr, -fr, 0),
                vp.vector(fr, -fr, 0),
                vp.vector(fr, fr, 0),
                vp.vector(-fr, fr, 0),
                vp.vector(-fr, -fr, 0),
            ],
            color=vp.color.red,
        )

    def clear_grid(self):
        self.grid = []
        self.grid_labels = []
        self.grid_frame = []

    def grid_label(self, x, y, z, value):
        return vp.label(
            pos=vp.vector(x, y, z),
            text=f"{value} км",
            xoffset=10,
            yoffset=25,
            height=12,
            box=False,
            font="sans",
        )


class Sensor_Type(enum.Enum):
    static = 0.0
    trajectory = 1.0


class Sensor:
    def __init__(
        self,
        name="Untitled sensor",
        sensor_type=Sensor_Type.static,
        pos0=vp.vector(0, 0, 0),
        trajectory=None,
        t0_degree=0.0,
        speed=0,
    ):
        self.name = name
        self.sensor_type = sensor_type

        if self.sensor_type == Sensor_Type.trajectory:
            self.size = 1.2
            self.speed = speed
            self.t_degree = t0_degree
            self.color = vp.color.green
            self.trajectory = trajectory
            self.lap_time = trajectory.curve_length / self.speed
            # self.dt_degree = self.lap_time * dt
            self.dt_degree = dt / self.lap_time * 100
            print(f"t_degree = {self.t_degree}")
            self.create_vp_object(self.get_vp_pos())
        elif self.sensor_type == Sensor_Type.static:
            self.size = 3
            self.color = vp.color.yellow
            self.create_vp_object(pos0)

        self.create_label()

    def create_vp_object(self, pos):
        self.vp_obj = vp.sphere(
            pos=pos,
            radius=self.size / 2,
            color=self.color,
            make_trail=True,
        )

    def get_vp_pos(self) -> vp.vector:
        x, y, z = self.trajectory.get_xyz(self.t_degree)
        return vp.vector(x, y, z)

    def create_label(self):
        self.vp_label = vp.label(
            pos=self.vp_obj.pos,
            text=self.name,
            font="sans",
            xoffset=20,
            yoffset=50,
            height=16,
            border=4,
            space=20,
        )

    def update_label(self):
        self.vp_label.pos = self.vp_obj.pos

    def take_step(self):
        if self.sensor_type == Sensor_Type.trajectory:
            self.t_degree += self.dt_degree
            self.vp_obj.pos = self.get_vp_pos()

    def delete(self):
        self.vp_obj.delete()
        self.label.delete()


class Circle_Trajectory:
    def __init__(self, R, x0, y0, z0):
        self.R = R
        self.x0 = x0
        self.y0 = y0
        self.z0 = z0
        self.deg_to_rad = lambda deg: deg * sy.pi / 180.0
        self.get_curve_length()
        print(f"Trajectory curve length = {self.curve_length}")

    def get_curve_length(self):
        f1 = lambda t: sy.sqrt(
            self.derivative_f_x(t) ** 2
            + self.derivative_f_y(t) ** 2
            + self.derivative_f_z(t) ** 2
        )

        t_symb = sy.Symbol("t")
        self.curve_length = sy.N(sy.integrate(f1(t_symb), (t_symb, 0, math.pi * 2)))

    def get_xyz(self, t) -> tuple:
        return (self.x0 + self.f_x(t), self.y0 + self.f_y(t), self.z0 + self.f_z(t))

    def f_x(self, t) -> float:
        return self.R * sy.cos(self.deg_to_rad(t))

    def f_y(self, t) -> float:
        return self.R * sy.sin(self.deg_to_rad(t))

    def f_z(self, t) -> float:
        return 0

    def derivative_f_x(self, t) -> float:
        return -self.R * sy.sin(self.deg_to_rad(t))

    def derivative_f_y(self, t) -> float:
        return self.R * sy.cos(self.deg_to_rad(t))

    def derivative_f_z(self, t) -> float:
        return 0


def main():
    vp_init()

    global dt
    dt = 0.005  # The step size. This should be a small number
    rate = 1000
    t = 0

    world = World()
    world.create_xy_grid(40, 10)

    bases = [
        Sensor(name=f"static sensor #{i}", pos0=pos)
        for i, pos in enumerate(
            [
                vp.vector(-20, -20, 0),
                vp.vector(-20, 20, 0),
                vp.vector(20, 20, 0),
                vp.vector(20, -20, 0),
            ]
        )
    ]

    sensors = [
        Sensor(
            name=f"p{i}",
            sensor_type=Sensor_Type.trajectory,
            trajectory=tr,
            t0_degree=random.randint(0, 359),
            speed=600,
        )
        for i, tr in enumerate(
            [
                Circle_Trajectory(10, -20, -20, 5),
                Circle_Trajectory(10, -20, 20, 5),
                Circle_Trajectory(10, 20, 20, 5),
                Circle_Trajectory(10, 20, -20, 5),
                Circle_Trajectory(10, -20, -20, 25),
                Circle_Trajectory(10, -20, 20, 25),
                Circle_Trajectory(10, 20, 20, 25),
                Circle_Trajectory(10, 20, -20, 25),
            ]
        )
    ]

    while True:
        vp.rate(rate)  # скорость показа, обратно sleep

        for base in bases:
            base.update_label()

        for sensor in sensors:
            sensor.take_step()
            sensor.update_label()

        t += dt
        # vp.scene.caption = f"t = {t / dt}"
        vp.scene.caption = f"static sensors count: {len(bases)}\ntrajectory sensors count: {len(sensors)}"


main()
