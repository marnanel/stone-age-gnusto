# Gnusto tests: makefile
# Copyright (c) 2003 Thomas Thurman. Distributed under v2 of the GNU GPL.

INFORM = /usr/local/bin/inform
INFORMARGS =
MOZILLA = ~/MozillaFirebird/MozillaFirebird
MOZARGS = -P smoke
FROTZ = frotz

STDOUT = /dev/stdout
STDERR = /dev/stdout

ZORK1Z5 = ~/zork1.z5
ZORK1Z3 = ~/zork1.z3
VERSION3GAME = random.z3

TESTRIGS = ~/proj/gnusto/testrigs
BALANCES = $(TESTRIGS)/balances.z5
TRINITY = $(TESTRIGS)/trinity.z4

STANDARDGAMES = ~/proj/gnusto/bug3481
GAMESCRIPTS = gamescripts

GNUSTOARGS = nowin=1,gameoverquit=1,seed=1234,output=$(STDOUT)

test: marnrandom standards

standards: gntests strictz terpetude

# Griffith's random test should be used for testing Gnusto, but
# isn't amenable to automated testing (it does lots of direct
# screen drawing).

################################################################

# Show make how to compile all the z-code versions we know.

.SUFFIXES: .z3 .z4 .z5 .z7 .z8 .inf

.inf.z3:
	$(INFORM) -v3 $(INFORMARGS) $<
.inf.z4:
	$(INFORM) -v4 $(INFORMARGS) $<
.inf.z5:
	$(INFORM) -v5 $(INFORMARGS) $<
.inf.z7:
	$(INFORM) -v7 $(INFORMARGS) $<
.inf.z8:
	$(INFORM) -v8 $(INFORMARGS) $<

################################################################

trinityfrotz:
	$(FROTZ) $(TRINITY) < $(GAMESCRIPTS)/trinity.playback

trinitygnusto: jury-rig
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(TRINITY),input=$(GAMESCRIPTS)/trinity.playback

################################################################

marnrandom: random.z5
	python random.py

bug4284:
	python bug4284.py

# Playthrough.

balances: jury-rig
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(BALANCES),input=$(GAMESCRIPTS)/balances.playback

zork1z3:
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(ZORK1Z3),input=$(GAMESCRIPTS)/zork1.playback

zork1z5:
	$(MOZILLA) $(MOZARGS) -gnusto $(GNUSTOARGS),$(ZORK1Z5),input=$(GAMESCRIPTS)/zork1.playback

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

################################################################

jury-rig:
	cd ..;$(MAKE)

################################################################
#
# Trademarks in this document are used only for identification.
# Zork is a trademark of Activision, Inc.
#
# EOF Makefile
