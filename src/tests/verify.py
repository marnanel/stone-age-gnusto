# Gnusto tests: verify
# Copyright (c) 2003 Thomas Thurman. Distributed under v2 of the GNU GPL.

# Where things are:
mozilla = '/home/marnanel/MozillaFirebird/MozillaFirebird'
stdout_file = '/dev/stdout'
mozilla_args = '-P smoke'
verify_program = 'verify.z5'

temp = 'verify.not.z5'

print '*NAME verify'

################################################################

from commands import getoutput
import os

failed = 0

def invocation(program):
    return getoutput(mozilla+' '+mozilla_args+
                     ' -gnusto '+
                     program+
                     ',output='+stdout_file+
                     ',gameoverquit=1').split('\n')

if invocation('verify.z5')[0]!='YES':
    failed = 1
    print "*FAIL Plain copy didn't verify"

# Create a new copy of the code, with the checksum horked
code = open(verify_program,'rb').read()
code = code[:0x1c]+ 'No' + code[0x1e:]
open(temp,'wb').write(code)
del code # release the memory

if invocation('verify.not.z5')[0]!='NO':
    failed = 1
    print "*FAIL Corrupted copy verified"

os.remove(temp)

if not failed:
    print "*PASS Everything's good"
