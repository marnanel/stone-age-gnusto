# Gnusto tests: verify
# Copyright (c) 2003 Thomas Thurman. Distributed under v2 of the GNU GPL.

# Where things are:
mozilla = '/home/marnanel/MozillaFirebird/MozillaFirebird'
stdout_file = '/dev/stdout'
mozilla_args = '-P smoke'
verify_program = 'verify.z5'

print '*NAME verify'

################################################################

from commands import getoutput

def invocation(extras=''):
    return getoutput(mozilla+' '+mozilla_args+
                     ' -gnusto '+
                     verify_program+
                     ',output='+stdout_file+
                     ',gameoverquit=1,'+extras).split('\n')

print invocation()
