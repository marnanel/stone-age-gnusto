import bafread

details = bafread.read(['genres'])

result = bafread.writingfile('genres.ini')

names = {}
parents = {}

for detail in details['genres']:
    names[detail[0]] = bafread.normalise(detail[2])
    parents[detail[0]] = detail[1]

for detail in details['genres']:
    genre = 'c'+detail[0]

    cursor = detail[0]
    name = ''
    while cursor:
        name = names[cursor] + ' > ' + name
        cursor = parents[cursor]

    result.write(genre+'.name='+name[:-3]+'\n')
    result.write(genre+'.desc='+bafread.normalise(detail[3])+'\n')


