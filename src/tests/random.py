# Gnusto tests: random number generation
# Copyright (c) 2003 Thomas Thurman. Distributed under v2 of the GNU GPL.

# FIXME: Need also to test whether seeding <-1000 and >-1000 are different.
# (The ZMSD suggests they should be.)

# Where things are:
mozilla = '/home/marnanel/MozillaFirebird/MozillaFirebird'
stdout_file = '/dev/stdout'
mozilla_args = '-P smoke'
random_program = 'random.z5'

# Other stuff
repeat_count = 3
expected_sequence = ': 1 2 3 4 5 6 7 8 9 1 2 3 4 5 6 1 2 3 4 5 '

print '*NAME random'

################################################################

from commands import getoutput

def invocation(extras=''):
    return getoutput(mozilla+' '+mozilla_args+
                     ' -gnusto '+
                     random_program+
                     ',output='+stdout_file+
                     ',gameoverquit=1,'+extras).split('\n')

def run_many(extras=''):

    scoreboard = { '1': {}, 'P': {}, 'S': {}, 'R': {} }

    for i in range(0, repeat_count):
        for line in invocation(extras):
            if line!='':
                if line[0] in scoreboard:
                    scoreboard[line[0]][line] = 1

                    if '0' in line:
                        print '*FAIL Zero found; all digits should be +ve'

                else:
                    print '*WARN Line begins with unexpected letter: '+line

    print 'Raw results: ',scoreboard
    return scoreboard

def print_result(message, condition):
    if condition:
        print message, '-- yes. good.'
    else:
        print '*FAIL', message, '-- no'


# First pass: no seeding. "1:" should be random.

print 'Testing with no seeding.'
counts = run_many()
print_result('Initial state is randomized', len(counts['1'])==repeat_count)
print_result('Pseudorandom state is predictable', len(counts['P'])==1)
print_result('Seeded-sequential state is predictable', len(counts['S'])==1)
if len(counts['S'])==1 and not 'S'+expected_sequence in counts['S']:
    print '*WARN: Seeded state not in accordance with ZMSD *suggested* behaviour'
print_result('Randomized state is not predictable', len(counts['R'])==repeat_count)
    
# Second pass: sequentially seeded. "1:" should be predictable.

print 'Testing with sequential seeding.'
counts = run_many('seed=15')
print_result('Initial state is predictable', len(counts['1'])==1)
if len(counts['1'])==1 and not '1'+expected_sequence in counts['1']:
    print '*WARN: Initial state not in accordance with ZMSD *suggested* behaviour'
print_result('Pseudorandom state is predictable', len(counts['P'])==1)
print_result('Seeded-sequential state is predictable', len(counts['S'])==1)
print_result('Randomized state is not predictable', len(counts['R'])==repeat_count)

# Third pass: sequentially seeded. "1:" should be always the same,
# but not predictable.

print 'Testing with pseudorandom seeding.'
counts = run_many('seed=9876')
print_result('Initial state is predictable', len(counts['1'])==1)
print_result('Pseudorandom state is predictable', len(counts['P'])==1)
print_result('Seeded-sequential state is predictable', len(counts['S'])==1)
print_result('Randomized state is not predictable', len(counts['R'])==repeat_count)
