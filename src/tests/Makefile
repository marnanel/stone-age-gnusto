# Gnusto tests: makefile
# Copyright (c) 2003 Thomas Thurman. Distributed under v2 of the GNU GPL.

# FIXME: This should compile "random.z5" which is needed by "random.py".

MOZILLA = ~/MozillaFirebird/MozillaFirebird
MOZARGS = -P smoke

STDOUT = /dev/stdout
STDERR = /dev/stdout

BALANCES = ~/balances.z5
ZORK1 = ~/zork1.z5
VERSION3GAME = random.z3

STANDARDGAMES = ~/proj/gnusto/bug3481
GAMESCRIPTS = gamescripts

GNUSTOARGS = nowin=1,gameoverquit=1,seed=1,output=$(STDOUT)

test: marnrandom standards

standards: gntests strictz terpetude

# Griffith's random test should be used for testing Gnusto, but
# isn't amenable to automated testing (it does lots of direct
# screen drawing).

################################################################

marnrandom:
	python random.py

balances:
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(BALANCES),input=$(GAMESCRIPTS)/balances.playback

zork1:
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(ZORK1),input=$(GAMESCRIPTS)/zork1.playback

################################################################

gntests:
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(STANDARDGAMES)/gntests.z5,input=$(GAMESCRIPTS)/gntests.playback

strictz:
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(STANDARDGAMES)/strictz.z5,input=$(GAMESCRIPTS)/strictz.playback

terpetude:
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(STANDARDGAMES)/terpetude.z5,input=$(GAMESCRIPTS)/terpetude.playback

################################################################

v3:
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(VERSION3GAME)
