import bafread

details = bafread.read(['genres',
                        'gamegenres',
                        'games',
                        'titles',
                        'reviews'])

game_to_title_id = {}
titles = {}
scores = {}

for game in details['games']:
    game_to_title_id[game[0]] = game[1]

for title in details['titles']:
    titles[title[1]] = title[2]

for score in details['reviews']:
    scores[score[0]] = score[3]

for detail in details['genres']:
    result = bafread.writingfile('c'+detail[0]+'.ini')
    result.write('title='+detail[2]+'\n')

    for game in details['gamegenres']:
        if game[1]==detail[0]:
            gamecode = 's'+game[0]
            if game[0] in scores and scores[game[0]]!=None:
                gamescore = scores[game[0]]
            else:
                gamescore = '?'
                
            if game[0] in game_to_title_id:
                gametitle = titles[game_to_title_id[game[0]]]
            else:
                gametitle = '?'
            
            result.write(gamecode+'='+gamescore+gametitle+'\n')
