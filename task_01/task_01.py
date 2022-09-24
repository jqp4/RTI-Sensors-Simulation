import vpython as vp


def vp_init():
    vp.scene.title = "РТИ АСПД. Визуализация движения сенсоров"
    vp.scene.height = 600
    vp.scene.width = 800


def gravitationalForce(p1, p2):
    G = 1  # real-world value is : G = 6.67e-11
    rVector = p1.pos - p2.pos
    rMagnitude = vp.mag(rVector)
    rHat = rVector / rMagnitude
    F = -rHat * G * p1.mass * p2.mass / rMagnitude**2
    return F


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


class Sensor:
    # name = 'sensor'
    # pos = vp.vector(1, 0, 0),
    def __init__(self, name, pos):
        self.name = name
        self.size = 0.1

        self.create_vp_object(pos)
        self.create_label()

    def create_vp_object(self, pos):
        self.vp_obj = vp.sphere(
            pos=pos,
            radius=self.size / 2,
            color=vp.color.green,
            mass=1,
            # momentum=vp.vector(0, 30, 0),
            make_trail=True,
        )

    def create_label(self):
        self.vp_label = vp.label(
            pos=self.vp_obj.pos,
            text=self.name,
            xoffset=20,
            yoffset=50,
            space=20,
            height=16,
            border=4,
            font="sans",
        )

    def update_label(self):
        self.vp_label.pos = self.vp_obj.pos


def main():
    vp_init()

    world = World()
    world.create_xy_grid(4, 1)

    star = Sensor("Sun", vp.vector(0, 0, 0))
    star.vp_obj.mass = 1000
    star.vp_obj.radius = 0.2
    star.vp_obj.color = vp.color.yellow
    star.vp_obj.momentum = vp.vector(0, 0, 0)

    planet1 = Sensor("planet_1", vp.vector(1, 0, 0))
    planet1.vp_obj.momentum = vp.vector(0, 30, 0)

    t = 0
    dt = 0.0001  # The step size. This should be a small number

    while True:
        vp.rate(1000)  # обратно sleep

        # Calculte the force using gravitationalForce function
        star.vp_obj.force = gravitationalForce(star.vp_obj, planet1.vp_obj)
        planet1.vp_obj.force = gravitationalForce(planet1.vp_obj, star.vp_obj)

        # Update momentum, position and time
        star.vp_obj.momentum = star.vp_obj.momentum + star.vp_obj.force * dt
        planet1.vp_obj.momentum = planet1.vp_obj.momentum + planet1.vp_obj.force * dt

        star.vp_obj.pos = star.vp_obj.pos + star.vp_obj.momentum / star.vp_obj.mass * dt
        planet1.vp_obj.pos = (
            planet1.vp_obj.pos + planet1.vp_obj.momentum / planet1.vp_obj.mass * dt
        )

        star.update_label()
        planet1.update_label()

        t += dt

        # print(vp.scene.camera.pos, '    ',vp.scene.axis)


main()
