# Gnusto tests: funky characters in dictionary words
# Copyright (c) 2003 Thomas Thurman. Distributed under v2 of the GNU GPL.

# Where things are:
mozilla = '/home/marnanel/MozillaFirebird/MozillaFirebird'
stdout_file = '/dev/stdout'
playback_file = 'gamescripts/bug4284.playback'
mozilla_args = '-P smoke'
bug4284_program = 'bug4284.z5'

print '*NAME bug4284'

################################################################

from commands import getoutput

def invocation():
    return getoutput(mozilla+' '+mozilla_args+
                     ' -gnusto '+
                     bug4284_program+
                     ',output='+stdout_file+
                     ',input='+playback_file+
                     ',gameoverquit=1').split('\n')

# In the output there must be four lines of the form
#   "Value given is X."
# each of which should contain a decimal number which should increase by |increment|.
# Note that |increment| differs depending on whether this is z3, and potentially
# other things. But it will always be the same for any one binary, and should always
# be the same for binaries for the same compiler for the same z-version.

prefix = 'Value given is '
increment = 9

latest = None
count = 0
problem = 0

for line in invocation():
    if line.startswith(prefix):
        value = int(line[len(prefix):-1])
        if latest!=None and latest+increment!=value:
            print '*FAIL Weird increment: '+`(value-latest)`
            problem = 1

        latest = value
        count = count + 1

if count!=4:
    print '*FAIL Wrong number of values: '+`count`
    problem = 1

if not problem:
    print '*PASS'
    
