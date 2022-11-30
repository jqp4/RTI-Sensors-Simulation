import os
import math
import numpy

cell = 'N36/N52E030.hgt'
# cell = 'n00e097.hgt'

fileName = f'./rawData/{cell}'

fileSize = os.path.getsize(fileName)
dim = int(math.sqrt(fileSize / 2))
print(dim)

assert dim * dim * 2 == fileSize, 'Invalid file size'

data = numpy.fromfile(fileName, numpy.dtype('>i2'),
                      dim * dim).reshape((dim, dim))


f = open("../js/mapDataSRTM.js", "w")
f.write(f"// {cell}\n")
f.write(f"// {dim} x {dim}\n\n")
f.write("mapDataSRTM = [\n")

for row in data:
    f.write("[")
    for value in row:
        f.write(f"{value},")
    f.write("],\n")

f.write("];")
f.close()
