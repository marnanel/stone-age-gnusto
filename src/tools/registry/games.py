import bafread

details = bafread.read(['reviews',
                        'persons',
                        'personnames',
                        'game_links',
                        'links'])

nameIDs = {}
names = {}

for someone in details['personnames']:
    name = someone[2]
    if ', ' in name:
        comma = name.find(', ')
        name = name[comma+2:] + ' ' + name[:comma]
    nameIDs[someone[0]] = name

for someone in details['persons']:
    names[someone[0]] = nameIDs[someone[1]]

del nameIDs

game_links = {}
links = {}

for link in details['game_links']:
    (game, linkid) = link

    if not game in game_links:
        game_links[game] = []

    game_links[game].append(linkid)

for (linkid, url, name, comment, absolute) in details['links']:
    if comment == None:
        comment = ''
    else:
        comment = "\t" + comment
        
    links[linkid] = url + ' ' + name + comment

for game in details['reviews']:

    review = ''
    rating = ''
    
    if game[4]:
        review = game[4]
    else:
        review = 'No review is available.'

    if game[2] and game[2] in names:
        review += '<p class="reviewer">Reviewed by '+names[game[2]]+'</p>'

    result = bafread.writingfile('s'+game[0]+'.ini')
    result.write('review='+review+'\n');

    if game[0] in game_links:
        for link in game_links[game[0]]:
            result.write('link='+links[link]+'\n');
