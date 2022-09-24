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

    star    = vp.sphere(pos=vp.vector(0, 0, 0), radius=0.2, color=vp.color.yellow,
                        mass = 1000, momentum=vp.vector(0, 0, 0), make_trail=True)

    planet1 = vp.sphere(pos=vp.vector(1, 0, 0), radius=0.05, color=vp.color.green,
                        mass = 1, momentum=vp.vector(0, 30, 0), make_trail=True)

    planet2 = vp.sphere(pos=vp.vector(0, 3, 1), radius=0.075, color=vp.vector(1, 0, 0),#RGB color
                        mass = 2, momentum=vp.vector(-35, 0, 0), make_trail=True)
                    
    planet3 = vp.sphere(pos=vp.vector(0, -3.5, 2), radius=0.1, color=vp.vector(1, 0, 1),
                        mass = 10, momentum=vp.vector(160, 0, 0), make_trail=True)

    t = 0
    dt = 0.0001 #The step size. This should be a small number

    while (True):
        vp.rate(30000) # обратно sleep
        
        # Calculte the force using gravitationalForce function
        star.force = gravitationalForce(star,planet1)+gravitationalForce(star,planet2)+gravitationalForce(star,planet3)
        planet1.force = gravitationalForce(planet1,star)+gravitationalForce(planet1,planet2)+gravitationalForce(planet1,planet3)
        planet2.force = gravitationalForce(planet2,star)+gravitationalForce(planet2,planet1)+gravitationalForce(planet2,planet3)
        planet3.force = gravitationalForce(planet3,star)+gravitationalForce(planet3,planet1)+gravitationalForce(planet3,planet2)

        # Update momentum, position and time
        star.momentum = star.momentum + star.force*dt
        planet1.momentum = planet1.momentum + planet1.force*dt
        planet2.momentum = planet2.momentum + planet2.force*dt
        planet3.momentum = planet3.momentum + planet3.force*dt

        star.pos = star.pos + star.momentum/star.mass*dt
        planet1.pos = planet1.pos + planet1.momentum/planet1.mass*dt
        planet2.pos = planet2.pos + planet2.momentum/planet2.mass*dt
        planet3.pos = planet3.pos + planet3.momentum/planet3.mass*dt
        
        t += dt


main()