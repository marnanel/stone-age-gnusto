# Makefile - makefile for archangel
#
# $Header: /cvs/gnusto/src/Makefile,v 1.1 2003/02/04 02:43:10 marnanel Exp $
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

APPLICATION = archangel
VERSION = 0.2.0
XPIFILE = ../downloads/${APPLICATION}-${VERSION}.xpi

xpi:
	rm -f ${XPIFILE}
	zip -9 -q ${XPIFILE} install.js `find ${APPLICATION}/|grep -v CVS`

# This is for testing before releases. It's rather dependent on my setup (but
# if it works for you, good). You need a clean copy of Moz in ${BASEMOZ}
# (not already containing Archangel) and a profile called aatest.

BASEMOZ = /home/marnanel/base-mozilla
TEMPMOZ = /tmp/aatest
TEMPXPI = /tmp/testing-aa.xpi

# You might want "-jsconsole" or "-venkman" here. You probably want "-chrome".
DEBUGFLAGS = -chrome

aatest: xpi
	rm -rf ${TEMPMOZ}
	cp -R ${BASEMOZ} ${TEMPMOZ}
	cp ${XPIFILE} ${TEMPXPI}
	${TEMPMOZ}/mozilla -P aatest file://${TEMPXPI}
	${TEMPMOZ}/mozilla -P aatest ${DEBUGFLAGS} chrome://archangel/content
