import ConfigParser
import sys
import os.path
import re
import string

rc_file = os.path.expanduser("~/.gnusto-make.rc")
registry_section = 'registry'
baffile_option = 'baffile'
targetfiles_option = 'targetfiles'

config = ConfigParser.ConfigParser()
config.readfp(open(rc_file))

if not config.has_section(registry_section) or not config.has_option(registry_section, baffile_option) or not config.has_option(registry_section, targetfiles_option):
    print 'In order to run this program, you should create a file called '+rc_file+" containing at least the options:\n\n["+registry_section+"]\n"+baffile_option+"=<wherever the Baf's Guide file is>\n"+targetfiles_option+"=<wherever you want the target files to go>\n\nThe Guide file can be obtained from Baf's site.\n"
    sys.exit()

def read(sections):

    result = {}
    target = None

    baffile = open(config.get(registry_section, baffile_option))
    for x in baffile.xreadlines():

        if target != None:
            if x=="\\.\n":
                target = None
            else:                
                record = x[:-1].split('\t')
                
                for y in range(len(record)):
                    if record[y] == '\N':
                        record[y] = None
                        
                target.append(record)

        elif x.startswith('COPY ') and x.endswith(" FROM stdin;\n"):
            section_name = x.split('"')[1]

            if section_name in sections:
                target = result[section_name] = []
            

    return result

tag = re.compile("\<.*?\>")

def normalise(str):
    return string.join(tag.split(str)).replace('\\r\\n',' ').replace('  ',' ')

def writingfile(name):
    result = open(os.path.join(config.get(registry_section, targetfiles_option), name), 'w')
    result.write("copyright-notice=Some or all of this file is based on Baf's Guide to the IF-Archive. These parts are copyright (c) Carl Muckenhoupt. Used with permission.\n")
    return result
