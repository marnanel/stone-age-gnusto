# Makefile - makefile for gnusto
#
# $Header: /cvs/gnusto/src/Makefile,v 1.16 2004/08/01 02:52:45 marnanel Exp $
#
# Copyright (c) 2003 Thomas Thurman
# thomas@thurman.org.uk
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of version 2 of the GNU General Public License
# as published by the Free Software Foundation.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have be able to view the GNU General Public License at 
# http://www.gnu.org/copyleft/gpl.html ; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

APPLICATION = gnusto
VERSION = 0.6.0
XPIFILE = ../downloads/${APPLICATION}-${VERSION}.xpi
PYTHON = python
MOZILLA = ~/firefox/firefox
MOZILLAARGS = -P smoke
BALANCES_GAME = ~/balances.z5

# jury-rig should be the default, please.

jury-rig: juryrig

juryrig:
	python tools/jury-rig.py

run: juryrig
	$(MOZILLA) $(MOZILLAARGS) -gnusto

balances: juryrig
	$(MOZILLA) $(MOZILLAARGS) -gnusto $(BALANCES_GAME)

xpi:
	rm -f ${XPIFILE}
	zip -9 -q ${XPIFILE} install.js `find ${APPLICATION}/|grep -v CVS`

robmiz: juryrig
	$(MOZILLA) $(MOZILLAARGS) -gnusto robmiz=tests/robmiz.robmiz
	txd /tmp/verify.z5

test: juryrig
	cd tests && $(MAKE) test

# Strictly, this is a test. Figure out where best to put tests.
playthrough: juryrig
	python tools/playthrough.py

love:
	@echo "make: hardware upgrade required"
