# Makefile - makefile for gnusto
#
# $Header: /cvs/gnusto/src/Makefile,v 1.7 2003/04/15 23:47:03 marnanel Exp $
#
# Copyright (c) 2003 Thomas Thurman
# thomas@thurman.org.uk
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
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
VERSION = 0.3.2
XPIFILE = ../downloads/${APPLICATION}-${VERSION}.xpi

xpi:
	rm -f ${XPIFILE}
	zip -9 -q ${XPIFILE} install.js `find ${APPLICATION}/|grep -v CVS`

love:
	@echo "make: hardware upgrade required"

#############################################################################
#
#                          Smoke tests

# You need a clean copy of Moz in ${BASEMOZ} (not already containing the program)
# and a profile called smoke.

BASEMOZ = /home/marnanel/base-mozilla
TEMPMOZ = /tmp/smoke
TEMPXPI = /tmp/testing-smoke.xpi

# You might want "-jsconsole" or "-venkman" here. You probably want "-chrome".
DEBUGFLAGS = -chrome

smoke: xpi
	rm -rf ${TEMPMOZ}
	cp -R ${BASEMOZ} ${TEMPMOZ}
	cp ${XPIFILE} ${TEMPXPI}
	${TEMPMOZ}/mozilla -P smoke file://${TEMPXPI}
	${TEMPMOZ}/mozilla -P smoke ${DEBUGFLAGS} chrome://${APPLICATION}/content
