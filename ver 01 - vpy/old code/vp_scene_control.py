# import vpython as vp
from vpython import *

box()
def B(b):
    print("The button said this: ", b.text)
button( bind=B, text='Click me!' )
scene.append_to_caption('-\n-\n-')

def R(r):
    print(r.checked) # alternates
radio(bind=R, text='Run') # text to right of button
scene.append_to_caption('\n\n')

def C(r):
    print(r.checked) # alternates
checkbox(bind=C, text='Run') # text to right of checkbox
scene.append_to_caption('\n\n')

def S(s):
    print(s.value)
slider( bind=S )
scene.append_to_caption('\n\n')

def M(m):
    print(m.selected, m.index)
menu( choices=['cat', 'dog', 'horse'], bind=M )
scene.append_to_caption('\n\n')

def T(s):
    print(s.text, s.number)
winput( bind=T )

s = input( 'What is your name?')