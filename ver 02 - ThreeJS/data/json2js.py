import json


root = '/Users/gleb/Projects/AlgoView/ThreeJS/6 - Coords/'


f = open(root + 'data.json')
data = str(json.load(f)).replace("\'", "\"" )
# print(data)
f.close()


f = open(root + "js/data.js", "w")
f.write(f"data = \'{data}\'")
f.close()
