# maker.py $Id: jury-rig.py,v 1.1 2003/10/14 02:13:07 marnanel Exp $
# Program to update all Gnusto components.
# Licensed under the same terms as Gnusto itself.
# Copyright (c) 2003, Thomas Thurman

import os.path
import ConfigParser
import sys

verbose = 1

def output(text):
    if verbose:
        sys.stdout.write(text)

def input(prompt):
    sys.stdout.write(prompt)
    return sys.stdin.readline().strip()

def user_says_yes_to(prompt):
    while 1:
        answer = input(prompt+' (y/n) ').lower()

        if answer!='' and answer[0] in ['y','o','j', 's', 't']:
            return 1
        elif answer!='' and answer[0] in ['n', 'f']:
            return 0
        else:
            print 'Please respond with Y for yes or N for no.'

def is_good_base_directory(dir):
    components = os.path.join(dir, 'components')
    chrome = os.path.join(dir, 'chrome')
    return os.path.isdir(components) and os.path.isdir(chrome)

def is_good_cvs_root(dir):
    src = os.path.join(dir, 'src')
    gnusto = os.path.join(src, 'gnusto')
    content = os.path.join(gnusto, 'content')
    cvs = os.path.join(dir, 'CVS')
    return os.path.isdir(content) and os.path.isdir(cvs)

def is_good_idl_includes(dir):
    supports = os.path.join(dir, 'nsISupports.idl')
    return os.path.exists(supports)

def is_good_xpidl_compiler(filename):
    return os.path.exists(filename) and os.popen3(filename)[2].read().find('nsIThing')!=-1

def configuration():
    filename = os.path.expanduser('~/.gnusto-make.rc')

    output('Loading results from '+filename+'... ')

    conf = ConfigParser.ConfigParser()

    if os.path.exists(filename):
        output('ok\n')

        conf.read(filename)
    else:
        output("not found.\nOK, we'll create one.\n\n")

        conf.add_section('make')
        conf.set('make', 'makeversion', 1)

        print
        print '    //   ) )        Welcome to Gnusto!'    
        print '   //          __               ___    __  ___  ___'
        print '  //  ____  //   ) ) //   / / ((   ) )  / /   //   ) ) '
        print ' //    / / //   / / //   / /   \ \     / /   //   / /'
        print '((____/ / //   / / ((___( ( //   ) )  / /   ((___/ /'
        
        print
        print "It looks like you haven't compiled Gnusto before, so before"
        print "we get started I'd like to know a few details of your system."
        print "These will get saved in a file called "+filename+"."
        print "Use ctrl-C if you need to break out at any point."
        print

        print "Firstly, I need to know the base directory of the Mozilla"
        print "installation you'll be using to run Gnusto. This will contain"
        print 'subdirectories called "chrome" and "components".'
        print

        def ask(try_dirs, # list of dirs to try first
                shown_name, # name of what we're looking for
                checker_fn, # function to say whether the answer's OK
                ):

            possibles = []
            for dir in try_dirs:
                dir = os.path.expanduser(dir)
                if checker_fn(dir) and not dir in possibles:
                    possibles.append(dir)

            for dir in possibles:
                print ' *', dir, 'is one possibility.'

            print

            for dir in possibles:
                print shown_name+' might be '+dir+'.'
                if user_says_yes_to('Is that correct? '):
                    return dir

            print
            if possibles==[]:
                print "I can't find it anywhere."
            else:
                print "OK, then you'll have to tell me where it is."

            while 1:
                answer = os.path.expanduser(input(shown_name+': where is it? '))

                if checker_fn(answer):
                    return answer
                else:
                    print "No, that doesn't look right to me."
                    print

        answer = ask([os.getcwd(),
                      '/usr/lib/mozilla',
                      '~/mozilla',
                      '~/firebird',
                      '~/MozillaFirebird',
                      ],
                     "Mozilla's base directory",
                     is_good_base_directory)

        conf.set('make', 'mozbase', answer)
        conf.set('make', 'components', os.path.join(answer, 'components'))
        conf.set('make', 'chrome', os.path.join(answer, 'chrome'))

        print "Great, that's lovely."
        print

        print "Next I need to know Gnusto's CVS root. This will contain"
        print 'subdirectories called "src/gnusto/content" and, of course, "CVS".'
        print

        conf.set('make',
                 'cvsroot',
                 ask([os.getcwd(),
                      '~/gnusto',
                      '~/proj/gnusto',
                      '~/proj/mozdev/gnusto',
                      ],
                     "Gnusto's CVS root",
                     is_good_cvs_root))
        
        print "OK, got it."
        print

        print "The next thing I need to know is where to find Mozilla's XPIDL"
        print 'library. This needs to contain files such as nsISupports.idl.'

        conf.set('make',
                 'idlinclude',
                 ask(['/usr/share/idl/mozilla',
                      '/usr/local/share/idl/mozilla',
                      '/usr/src/mozilla/dist/idl',
                      '~/mozilla/dist/idl',
                      ],
                     "The XPIDL library",
                     is_good_idl_includes))
        print "Wonderful. Nearly there."
        print

        print "Lastly, I need to know where to find Mozilla's XPIDL compiler."
        print "If you don't have this, you can download it along with Mozilla"
        print "itself."

        path = os.environ['PATH'].replace(';',':').split(':')
        xpidls = []
        
        for dir in path:
            xpidls.append(os.path.join(dir, 'xpidl'))

        conf.set('make',
                 'xpidlcompiler',
                 ask(xpidls,
                     "The xpidl compiler",
                     is_good_xpidl_compiler))

        conf.write(open(filename, 'w'))

    return conf

def walker(arg, dirname, filenames):

    if dirname.endswith('CVS'):
        # Ignore CVS data
        return
    
    for name in filenames:
        if name.endswith('.js'):
            output('Copying JS: '+name+'\n')
        elif name.endswith('.idl'):
            output('Compiling IDL: '+name+'\n')

try:
    settings = configuration()

    xpcom = settings.get('make', 'cvsroot')
    xpcom = os.path.join(xpcom, 'src')
    xpcom = os.path.join(xpcom, 'xpcom')

    os.path.walk(xpcom, walker, None)
    
except KeyboardInterrupt:
    print
    print 'Ctrl-C pressed. Goodbye.'
except:
    print
    print '\aSomething went wrong. Probably our fault, not yours.'
    print "It'd be helpful if you emailed info@gnusto.org with this information:"

    exception = sys.exc_info()
    sys.excepthook(exception[0], exception[1], exception[2])

