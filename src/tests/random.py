# Gnusto tests: random number generation
# Copyright (c) 2003 Thomas Thurman. Distributed under v2 of the GNU GPL.

# Where things are:
mozilla = '/home/marnanel/MozillaFirebird/MozillaFirebird'
stdout_file = '/dev/stdout'
mozilla_args = '-P smoke'
random_program = 'random.z5'

# Other stuff
repeat_count = 3

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

    scoreboard = { '1': {}, 'P': {}, 'R': {} }

    for i in range(0, repeat_count):
        for line in invocation(extras):
            if line!='':
                if line[0] in scoreboard:
                    scoreboard[line[0]][line] = 1
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
print_result('Seeded state is predictable', len(counts['P'])==1)
print_result('Randomized state is not predictable', len(counts['R'])==repeat_count)
    
# Second pass: seeded. "1:" should not be random.

print 'Testing with no seeding.'
counts = run_many('seed=10')
print_result('Initial state is predictable', len(counts['1'])==1)
print_result('Seeded state is predictable', len(counts['P'])==1)
print_result('Randomized state is not predictable', len(counts['R'])==repeat_count)
