# Gnusto tests: makefile
# Copyright (c) 2003 Thomas Thurman. Distributed under v2 of the GNU GPL.

INFORM = /usr/local/bin/inform
INFORMARGS =
MOZILLA = ~/MozillaFirebird/MozillaFirebird
MOZARGS = -P smoke
FROTZ = /usr/games/frotz
GLULXE = /usr/local/bin/glulxe
GLULXEARGS =

STDOUT = /dev/stdout
STDERR = /dev/stdout

ZORK1Z5 = ~/zork1.z5
ZORK1Z3 = ~/zork1.z3

TESTRIGS = ~/proj/gnusto/testrigs
BALANCES = $(TESTRIGS)/balances.z5
TRINITY = $(TESTRIGS)/trinity.z4
GLULXDEMO = $(TESTRIGS)/hello-world.ulx

STANDARDGAMES = ~/proj/gnusto/bug3481
GAMESCRIPTS = gamescripts

# was: GNUSTOARGS = nowin=1,gameoverquit=1,seed=1234,output=$(STDOUT)
# but setting args this way is deprecated
GNUSTO = $(MOZILLA) $(MOZARGS) -gnusto

test: marnrandom standards

standards: gntests strictz terpetude

# Griffith's random test should be used for testing Gnusto, but
# isn't amenable to automated testing (it does lots of direct
# screen drawing).

################################################################

# Show make how to compile all the z-code versions we know.

.SUFFIXES: .z3 .z4 .z5 .z7 .z8 .ulx .inf

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
.inf.ulx:
	$(INFORM) -G -t $(INFORMARGS) $<

################################################################

# Some simple tests for things we're still working on:

# z4 support...

trinityfrotz:
	$(FROTZ) $(TRINITY) < $(GAMESCRIPTS)/trinity.playback

trinitygnusto: jury-rig
	$(GNUSTO) $(GAMESCRIPTS)/trinity.grimoire

# Glulx support...

glglulxe:
	$(GLULXE) $(GLULXEARGS) $(GLULXDEMO)

glgnusto:
	$(GNUSTO),$(GLULXDEMO)

################################################################

marnrandom: random.z5
	python random.py

bug4284:
	python bug4284.py

# Playthrough.

balances: jury-rig
	$(GNUSTO) $(GAMESCRIPTS)/balances.grimoire

zork1z3:
	$(GNUSTO),$(ZORK1Z3),input=$(GAMESCRIPTS)/zork1.playback

zork1z5:
	$(GNUSTO),$(ZORK1Z5),input=$(GAMESCRIPTS)/zork1.playback

################################################################

gntests:
	$(GNUSTO),$(STANDARDGAMES)/gntests.z5,input=$(GAMESCRIPTS)/gntests.playback

strictz:
	$(GNUSTO),$(STANDARDGAMES)/strictz.z5,input=$(GAMESCRIPTS)/strictz.playback

terpetude:
	$(GNUSTO),$(STANDARDGAMES)/terpetude.z5,input=$(GAMESCRIPTS)/terpetude.playback

################################################################

grimoire: jury-rig
	$(GNUSTO),$(GAMESCRIPTS)/balances.grimoire

preferences: jury-rig
	$(MOZILLA) $(MOZARGS) -gnusto alpha=omicron,beta=psi

################################################################

# simplerestore

simplerestore: simplerestorez5 simplerestorez4 simplerestorez3

simplerestorez3: jury-rig simplerestore.z3
	$(GNUSTO) simplerestore.z3,gamescripts/simplerestore.grimoire
simplerestorez4: jury-rig simplerestore.z4
	$(GNUSTO) simplerestore.z4,gamescripts/simplerestore.grimoire
simplerestorez5: jury-rig simplerestore.z5
	$(GNUSTO) simplerestore.z5,gamescripts/simplerestore.grimoire

################################################################

jury-rig:
	cd ..;$(MAKE)

################################################################
#
# Trademarks in this document are used only for identification.
# Zork is a trademark of Activision, Inc.
#
# EOF Makefile
