# https://habr.com/ru/company/timeweb/blog/556480/
import vpython as vp


def vp_init():
    vp.scene.title = "Modeling the motion of planets with the gravitational force"
    vp.scene.height = 600
    vp.scene.width = 800


def gravitationalForce(p1,p2):
	G = 1 #real-world value is : G = 6.67e-11
	rVector = p1.pos - p2.pos
	rMagnitude = vp.mag(rVector)
	rHat = rVector / rMagnitude
	F = - rHat * G * p1.mass * p2.mass /rMagnitude**2
	return F


def main():
    vp_init()

    planet = vp.sphere(pos=vp.vector(1,0,0), radius=0.05, color=vp.color.green,
                mass = 1, momentum=vp.vector(0,30,0), make_trail=True )

    star = vp.sphere(pos=vp.vector(0,0,0), radius=0.2, color=vp.color.yellow,
                mass = 2.0*1000, momentum=vp.vector(0,0,0), make_trail=True)

    t = 0
    dt = 0.0001 #The step size. This should be a small number

    while True:
        vp.rate(500)
        #calculte the force using gravitationalForce function
        star.force = gravitationalForce(star,planet)
        planet.force = gravitationalForce(planet,star)
        #Update momentum, position and time
        star.momentum = star.momentum + star.force*dt
        planet.momentum = planet.momentum + planet.force*dt
        star.pos = star.pos + star.momentum/star.mass*dt
        planet.pos = planet.pos + planet.momentum/planet.mass*dt
        t+= dt


main()