import os
import sys
import glob
import ConfigParser

moz_executable = '/home/marnanel/MozillaFirebird/MozillaFirebird'
moz_args = '-P smoke'
gnusto_args = 'nowin=1,gameoverquit=1'
inifiles = '/home/marnanel/proj/mozdev/gnusto/src/tests/gamescripts/*.ini'
test_rigs = '/home/marnanel/proj/gnusto/testrigs'

temp_infilename = '/tmp/playthrough'
temp_outfilename = '/tmp/result'

def launch_moz(story_filename, seed):
    command = '%s %s -gnusto input=%s,output=%s,seed=%s,%s,%s' % (
        moz_executable,
        moz_args,
        temp_infilename,
        temp_outfilename,
        seed,
        story_filename,
        gnusto_args,
        )

    os.system(command)

for inifile in glob.glob(inifiles):
    ini = ConfigParser.ConfigParser()
    ini.read(inifile)

    sys.stdout.write('%20s - ' % (ini.get('game', 'name')))
    sys.stdout.flush()
    
    test_rig = os.path.join(test_rigs, ini.get('game','filename'))

    if os.path.exists(test_rig):
        open(temp_infilename,'w').write(ini.get('script','script')+'\r\n')

        launch_moz(test_rig, ini.get('game','seed'))

        if ini.get('success','contains') in open(temp_outfilename).read():
            print 'success'
        else:
            print 'failed'
    else:
        print 'lost (not found in test rigs)'
