from perlin_noise import PerlinNoise
import vpython as vp
import sympy as sy
import math
import enum
import time
import random

# global double_pi
# double_pi = 6.283185307179586476


def vp_init():
    # vp.scene.title = "РТИ АСПД. Визуализация движения сенсоров"
    vp.scene.height = 600
    vp.scene.width = 800
    vp.scene.background = vp.color.white


class World:
    def __init__(self):
        # global grid
        self.grid = []
        self.grid_labels = []
        self.grid_frame = []
        self.topographic_map = []

        self.font_size = 12

    def get_topographic_map_values(self, size):
        noise1 = PerlinNoise(octaves=3)
        noise2 = PerlinNoise(octaves=6)
        noise3 = PerlinNoise(octaves=12)
        noise4 = PerlinNoise(octaves=24)

        gain = 10
        xpix, ypix = size, size  # x - длина по вертикали
        topographic_map_values = []
        for i in range(xpix):
            row = []
            for j in range(ypix):
                noise_val = noise1([i / xpix, j / ypix])
                noise_val += 0.5 * noise2([i / xpix, j / ypix])
                noise_val += 0.25 * noise3([i / xpix, j / ypix])
                noise_val += 0.125 * noise4([i / xpix, j / ypix])

                row.append((noise_val) * gain)
            topographic_map_values.append(row)
        return topographic_map_values

    def print_topographic_map(self):
        for row in self.topographic_map:
            for value in row:
                print(f"{value:6.3f}", end=", ")
            print()

    def create_topographic_map(self, radius):
        step = 2
        radius = int(radius)
        tmap_values = self.get_topographic_map_values(size=radius * 2)
        self.topographic_map = []

        # for x in range(-radius, radius - 1, step):
        #     for y in range(-radius, radius - 1, step):
        #         # a = vp.vertex(pos=vp.vector(x, y, tmap_values[x][y]))
        #         # b = vp.vertex(pos=vp.vector(x + 1, y, tmap_values[x + 1][y]))
        #         # c = vp.vertex(pos=vp.vector(x, y + 1, tmap_values[x][y + 1]))
        #         # d = vp.vertex(pos=vp.vector(x + 1, y + 1, tmap_values[x + 1][y + 1]))

        #         # add 2 triangles
        #         # self.topographic_map.append(vp.triangle(v0=a, v1=b, v2=c))
        #         # self.topographic_map.append(vp.triangle(v0=c, v1=b, v2=d))

        #         a = vp.vector(x, y, tmap_values[x][y])
        #         b = vp.vector(x + step, y, tmap_values[x + step][y])
        #         c = vp.vector(x, y + step, tmap_values[x][y + step])
        #         self.topographic_map.append(vp.curve(pos=[c, a, b]))

        for x in range(0, radius * 2, step):
            pos_xy = [
                vp.vector(x - radius, y - radius, tmap_values[x][y])
                for y in range(0, radius * 2, step)
            ]
            pos_yx = [
                vp.vector(y - radius, x - radius, tmap_values[y][x])
                for y in range(0, radius * 2, step)
            ]
            
            self.topographic_map.append(vp.curve(pos=pos_xy))
            self.topographic_map.append(vp.curve(pos=pos_yx))
        

        self.create_frame(radius)

    def create_frame(self, radius):
        # Create map frame
        fr = radius * 1.06
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
        self.create_frame(radius)

    def clear_grid(self):
        for obj in (
            self.grid + self.grid_labels + self.grid_frame + self.topographic_map
        ):
            obj.delete()

        self.grid = []
        self.grid_labels = []
        self.grid_frame = []
        self.topographic_map = []

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

    def __delattr__(self):
        self.clear_grid()
        super.__delattr__()


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
            # print(f"t_degree = {self.t_degree}")
            self.create_vp_object(self.get_vp_pos())
        elif self.sensor_type == Sensor_Type.static:
            self.size = 5
            self.color = vp.color.yellow
            self.create_vp_object(pos0)

        self.create_label()

    def create_vp_object(self, pos):
        if self.sensor_type == Sensor_Type.trajectory:
            self.vp_obj = vp.sphere(
                pos=pos,
                radius=self.size / 2,
                color=self.color,
                make_trail=True,
            )
        elif self.sensor_type == Sensor_Type.static:
            self.vp_obj = vp.cylinder(
                pos=pos,
                axis=vp.vector(0, 0, self.size / 2),
                radius=self.size / 2,
                color=self.color,
                # make_trail=True,
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

    def __delattr__(self):
        self.vp_obj.delete()
        self.label.delete()
        super.__delattr__()


class Trajectory:
    def __init__(self, x0=0.0, y0=0.0, z0=0.0):
        self.x0 = x0
        self.y0 = y0
        self.z0 = z0
        self.deg_to_rad = lambda deg: deg * sy.pi / 180.0
        self.curve_length = self.get_curve_length()

    def get_curve_length(self) -> float:
        f1 = lambda t: sy.sqrt(
            self.derivative_f_x(t) ** 2
            + self.derivative_f_y(t) ** 2
            + self.derivative_f_z(t) ** 2
        )

        t_symb = sy.Symbol("t")
        return sy.N(sy.integrate(f1(t_symb), (t_symb, 0, math.pi * 2)))

    def get_xyz(self, t) -> tuple:
        return (self.x0 + self.f_x(t), self.y0 + self.f_y(t), self.z0 + self.f_z(t))

    def f_x(self, t) -> float:
        return 0.0

    def f_y(self, t) -> float:
        return 0.0

    def f_z(self, t) -> float:
        return 0.0

    def derivative_f_x(self, t) -> float:
        return 0.0

    def derivative_f_y(self, t) -> float:
        return 0.0

    def derivative_f_z(self, t) -> float:
        return 0.0


class Circle_XY_Trajectory(Trajectory):
    def __init__(self, R, x0=0.0, y0=0.0, z0=0.0):
        self.R = R
        super().__init__(x0, y0, z0)
        print(f"Circle_XY_Trajectory(R={R}).curve_length = {self.curve_length}")

    def f_x(self, t) -> float:
        return self.R * sy.cos(self.deg_to_rad(t))

    def f_y(self, t) -> float:
        return self.R * sy.sin(self.deg_to_rad(t))

    def derivative_f_x(self, t) -> float:
        return -self.R * sy.sin(self.deg_to_rad(t))

    def derivative_f_y(self, t) -> float:
        return self.R * sy.cos(self.deg_to_rad(t))

    def f_z(self, t) -> float:
        return self.R * sy.sin(self.deg_to_rad(t * 5)) / 5


# криво работает
class Rectangle_XY_Trajectory(Trajectory):
    def __init__(self, P, L, x0=0.0, y0=0.0, z0=0.0):
        """* P - Длина диагонали прямоугольник;
        * L - Угол наклона диагонали к горизонтали в радианах
        * x0, y0, z0 - смещение траектории по координатной сетке"""

        self.P = P
        self.L = L
        # # itp = lambda T: int(T / P)  # int [T / P]
        # self.A1 = lambda T: int(1 / int(T / P)) * int(T / P)
        # self.A2 = lambda T: int(2 / int(T / P)) * int(int(T / P) / 2)
        # self.A3 = lambda T: int(3 / int(T / P)) * int(int(T / P) / 3)
        # self.A4 = lambda T: int(4 / int(T / P)) * int(int(T / P) / 4)
        # self.A5 = lambda T: T - P * int(T / P)
        super().__init__(x0, y0, z0)
        print(
            f"Rectangle_XY_Trajectory(P={P}, L={L}).curve_length = {self.curve_length}"
        )

    # T in [P, 5P]
    def calculate_A_values(self, t):
        """* t - degree"""
        # t degree [0, 360) -> float T in [P, 5P]
        T = (((t % 360) / 360) * 4 + 1) * self.P

        k = T / self.P
        vp.scene.caption = f"T in [P, 5P] = {k}\n"

        itp = int(T / self.P)
        self.A1 = int(1 / itp) * itp
        self.A2 = int(2 / itp) * int(itp / 2)
        self.A3 = int(3 / itp) * int(itp / 3)
        self.A4 = int(4 / itp) * int(itp / 4)
        self.A5 = T - self.P * itp

    def f_x(self, t) -> float:
        self.calculate_A_values(t)
        # return ((self.A2(t) + self.A3(t)) * self.A5(t) + self.A4(t) * self.P) * sy.cos(self.L)
        return ((self.A2 + self.A3) * self.A5 + self.A4 * self.P) * sy.cos(self.L)

    def f_y(self, t) -> float:
        self.calculate_A_values(t)
        # return ((self.A1(t) + self.A4(t)) * self.A5(t) + self.A3(t) * self.P) * sy.sin(self.L)
        return ((self.A1 + self.A4) * self.A5 + self.A3 * self.P) * sy.sin(self.L)

    def get_curve_length(self) -> float:
        return self.P * sy.N(sy.sin(self.L) * 2 + sy.cos(self.L) * 2)


class Broken_Line_Trajectory(Trajectory):
    def __init__(self, points, x0=0.0, y0=0.0, z0=0.0):
        """* points - Точки траектории вида vp.vector(x, y, z);
        * x0, y0, z0 - смещение траектории по координатной сетке"""

        self.points = points
        self.N = len(self.points)
        indices = list(range(self.N)) + [0]

        # self.segments = [
        #     [points[indices[j]], points[indices[j + 1]]]
        #     for j in range(len(indices) - 1)
        # ]

        self.segments = [
            points[indices[j + 1]] - points[indices[j]] for j in range(len(indices) - 1)
        ]

        self.vp_vector_length = lambda vec: sy.N(
            sy.sqrt(vec.x**2 + vec.y**2 + vec.z**2)
        )

        # self.segment_lengths = [
        #     self.vp_vector_length(self.segments[i][0] - self.segments[i][1])
        #     for i in range(self.N)
        # ]

        self.segment_lengths = [
            self.vp_vector_length(self.segments[i]) for i in range(self.N)
        ]

        super().__init__(x0, y0, z0)
        print(
            f"Broken_Line_Trajectory(points={points}).curve_length = {self.curve_length}"
        )

    def get_segment_by_traveled_length(self, length) -> tuple:
        index = 0
        while length > self.segment_lengths[index]:
            length -= self.segment_lengths[index]
            index += 1

        return index, length

    def get_xyz(self, t) -> tuple:
        traveled_curve_length = ((t % 360) / 360) * self.curve_length
        index, traveled_segment_length = self.get_segment_by_traveled_length(
            traveled_curve_length
        )

        p = float(traveled_segment_length / self.segment_lengths[index])
        point = self.points[index] + self.segments[index] * p
        # z_shift = math.sin(self.deg_to_rad(t * 5))
        # return (point.x, point.y, point.z + z_shift)
        return (point.x, point.y, point.z)

    def get_curve_length(self) -> float:
        return sum(self.segment_lengths)


def main():
    vp_init()
    world = World()
    # world.create_xy_grid(40, 10)
    world.create_topographic_map(40)

    global dt
    dt = 0.001  # The step size. This should be a small number

    bases = [
        Sensor(name=f"static sensor #{i}", pos0=pos)
        for i, pos in enumerate(
            [
                # vp.vector(-20, -20, 0),
                # vp.vector(-20, 20, 0),
                # vp.vector(20, 20, 0),
                # vp.vector(20, -20, 0),
                vp.vector(0, 0, 0),
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
                Circle_XY_Trajectory(10, -20, -20, 8), # первая коорд (-20) это горизонталь
                # Circle_XY_Trajectory(10, -20, 20, 5),
                # Circle_XY_Trajectory(10, 20, 20, 5),
                # Circle_XY_Trajectory(10, 20, -20, 5),
                # Circle_XY_Trajectory(10, -20, -20, 25),
                # Circle_XY_Trajectory(10, -20, 20, 25),
                # Circle_XY_Trajectory(10, 20, 20, 25),
                # Circle_XY_Trajectory(10, 20, -20, 25),
                # Rectangle_XY_Trajectory(20, 0.5)
                Broken_Line_Trajectory(
                    [
                        vp.vector(10, 10, 8),
                        vp.vector(10, 30, 8),
                        vp.vector(20, 30, 15),
                        vp.vector(30, 30, 8),
                        vp.vector(30, 10, 8),
                    ]
                ),
            ]
        )
    ]

    iteration = 0
    program_start_time = time.time()

    while True:
        cycle_start_time = time.time()

        for base in bases:
            base.update_label()

        for sensor in sensors:
            sensor.take_step()
            sensor.update_label()

        execution_time = time.time() - cycle_start_time
        sleep_time = dt - execution_time
        # print(execution_time, sleep_time)
        if sleep_time > 0:
            time.sleep(sleep_time)

        iteration += 1
        vp.scene.caption = (
            # f"iteration: {iteration}\n"
            # f"time: {time.time() - program_start_time:.3f} sec\n"
            # f"avg iteration time: {(time.time() - program_start_time)/iteration:.3f} sec\n"
            f"time: {time.time() - program_start_time:.3f} sec;   "
            f"iteration: {iteration};   \n"
            f"average iteration time: {(time.time() - program_start_time)/iteration:.6f} sec;\n"
            # f'average time of the last 50 iterations:  '
            # f"static sensors count: {len(bases)}\n"
            # f"trajectory sensors count: {len(sensors)}"
            # f"\n"
        )


main()
