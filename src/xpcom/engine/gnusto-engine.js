// gnusto-lib.js || -*- Mode: Java; tab-width: 2; -*-
// The Gnusto JavaScript Z-machine library.
// $Header: /cvs/gnusto/src/xpcom/engine/gnusto-engine.js,v 1.15 2003/09/21 01:24:59 marnanel Exp $
//
// Copyright (c) 2003 Thomas Thurman
// thomas@thurman.org.uk
// 
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have be able to view the GNU General Public License at 
// http://www.gnu.org/copyleft/gpl.html ; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

const CVS_VERSION = '$Date: 2003/09/21 01:24:59 $';
const ENGINE_COMPONENT_ID = Components.ID("{bf7a4808-211f-4c6c-827a-c0e5c51e27e1}");
const ENGINE_DESCRIPTION  = "Gnusto's interactive fiction engine";
const ENGINE_CONTRACT_ID  = "@gnusto.org/engine;1";

const PARENT_REC = 6;
const SIBLING_REC = 8;
const CHILD_REC = 10;

// FIXME: Result eaters now take TWO parameters (engine and value)
// FIXME: Some of the indep. fns should really be methods (e.g. gosub)

////////////////////////////////////////////////////////////////
//
//                        PART THE FIRST
//
//       STUFF FROM GNUSTO-LIB WHICH STILL NEEDS MERGING IN
//
////////////////////////////////////////////////////////////////

var default_unicode_translation_table = {
  155:0xe4, // a-diaeresis
  156:0xf6, // o-diaeresis
  157:0xfc, // u-diaeresis
  158:0xc4, // A-diaeresis
  159:0xd6, // O-diaeresis
  160:0xdc, // U-diaeresis
  161:0xdf, // German "sz" ligature
  162:0xbb, // right quotation marks
  163:0xab, // left quotation marks
  164:0xeb, // e-diaeresis
  165:0xef, // i-diaeresis
  166:0xff, // y-diaeresis
  167:0xcb, // E-diaeresis
  168:0xcf, // I-diaeresis
  169:0xe1, // a-acute
  170:0xe9, // e-acute
  171:0xed, // i-acute
  172:0xf3, // o-acute
  173:0xfa, // u-acute
  174:0xfd, // y-acute
  175:0xc1, // A-acute
  176:0xc9, // E-acute
  177:0xcd, // I-acute
  178:0xd3, // O-acute
  179:0xda, // U-acute
  180:0xdd, // Y-acute
  181:0xe0, // a-grave
  182:0xe8, // e-grave
  183:0xec, // i-grave
  184:0xf2, // o-grave
  185:0xf9, // u-grave
  186:0xc0, // A-grave
  187:0xc8, // E-grave
  188:0xcc, // I-grave
  189:0xd2, // O-grave
  190:0xd9, // U-grave
  191:0xe2, // a-circumflex
  192:0xea, // e-circumflex
  193:0xee, // i-circumflex
  194:0xf4, // o-circumflex
  195:0xfb, // u-circumflex
  196:0xc2, // A-circumflex
  197:0xca, // E-circumflex
  198:0xce, // I-circumflex
  199:0xd4, // O-circumflex
  200:0xdb, // U-circumflex
  201:0xe5, // a-ring
  202:0xc5, // A-ring
  203:0xf8, // o-slash
  204:0xd8, // O-slash
  205:0xe3, // a-tilde
  206:0xf1, // n-tilde
  207:0xf5, // o-tilde
  208:0xc3, // A-tilde
  209:0xd1, // N-tilde
  210:0xd5, // O-tilde
  211:0xe6, // ae-ligature
  212:0xc6, // AE-ligature
  213:0xe7, // c-cedilla
  214:0xc7, // C-cedilla
  215:0xfe, // thorn
  216:0xf0, // eth
  217:0xde, // Thorn
  218:0xd0, // Eth
  219:0xa3, // pound sterling sign
  220:0x153, // oe-ligature
  221:0x152, // OE-ligature
  222:0xa1, // inverted pling
  223:0xbf, // inverted query
};


////////////////////////////////////////////////////////////////
// Effect codes, returned from run(). See the explanation below
// for |handlers|.

// Returned when we're expecting a line of keyboard input.
//
// Answer with the string the user has entered.
var GNUSTO_EFFECT_INPUT      = '"RS"';

// Returned when we're expecting a single keypress (or mouse click).
// TODO: The lowest nibble may be 1 if the Z-machine has asked
// for timed input.
//
// Answer with the ZSCII code for the key pressed (see the Z-spec).
var GNUSTO_EFFECT_INPUT_CHAR = '"RC"';

// Returned when the Z-machine requests we save the game.
// Answer as in the Z-spec: 0 if we can't save, 1 if we can, or
// 2 if we've just restored.
var GNUSTO_EFFECT_SAVE       = '"DS"';

// Returned when the Z-machine requests we load a game.
// Answer 0 if we can't load. (If we can, we won't be around to answer.)
var GNUSTO_EFFECT_RESTORE    = '"DR"';

// Returned when the Z-machine requests we quit.
// Not to be answered, obviously.
var GNUSTO_EFFECT_QUIT       = '"QU"';

// Returned when the Z-machine requests that we restart a game.
// Assumedly, we won't be around to answer it.
var GNUSTO_EFFECT_RESTART    = '"NU"';

// Returned if we've run for more than a certain number of iterations.
// This means that the environment gets a chance to do some housekeeping
// if we're stuck deep in computation, or to break an infinite loop
// within the Z-code.
//
// Any value may be used as an answer; it will be ignored.
var GNUSTO_EFFECT_WIMP_OUT   = '"WO"';

// Returned if we hit a breakpoint.
// Any value may be used as an answer; it will be ignored.
var GNUSTO_EFFECT_BREAKPOINT = '"BP"';

// Returned if either of the two header bits which
// affect printing have changed since last time
// (or if either of them is set on first printing).
var GNUSTO_EFFECT_FLAGS_CHANGED = '"XC"'; // obsolescent

// Returned if the story wants to verify its own integrity.
// Answer 1 if its checksum matches, or 0 if it doesn't.
var GNUSTO_EFFECT_VERIFY     = '"CV"';

// Returned if the story wants to check whether it's been pirated.
// Answer 1 if it is, or 0 if it isn't.
// You probably just want to return 0.
var GNUSTO_EFFECT_PIRACY     = '"CP"';

// Returned if the story wants to set the text style.
// effect_parameters() will return a list:
//  [0] = a bitcoded text style, as in the Z-spec,
//         or -1 not to set the style.
//  [1] = the foreground colour to use, as in the Z-spec
//  [2] = the background colour to use, as in the Z-spec
// Any value may be used as an answer; it will be ignored.
var GNUSTO_EFFECT_STYLE          = '"SS"';

// Returned if the story wants to cause a sound effect.
// effect_parameters() will return a list, whose
// vales aren't fully specified at present.
// (Just go "bleep" for now.)
//
// Any value may be used as an answer; it will be ignored.
var GNUSTO_EFFECT_SOUND          = '"FX"';

var GNUSTO_EFFECT_SPLITWINDOW    = '"TW"';
var GNUSTO_EFFECT_SETWINDOW      = '"SW"';
var GNUSTO_EFFECT_ERASEWINDOW    = '"YW"';
var GNUSTO_EFFECT_ERASELINE      = '"YL"';

// Returned if the story wants to set the position of
// the cursor in the upper window. The upper window should
// be currently active.
//
// effect_parameters() will return a list:
//  [0] = the new Y coordinate
//  [1] = the new X coordinate
// Any value may be used as an answer; it will be ignored.
var GNUSTO_EFFECT_SETCURSOR      = '"SC"';

var GNUSTO_EFFECT_SETBUFFERMODE  = '"SB"';
var GNUSTO_EFFECT_SETINPUTSTREAM = '"SI"';
var GNUSTO_EFFECT_GETCURSOR =      '"GC"';

// Returned if the story wants to print a table, as with
// @print_table. (This is complicated enough to get its
// own effect code, rather than just using an internal buffer
// as most printing does.)
//
// effect_parameters() will return a list of lines to print.
//
// Any value may be used as an answer; it will be ignored.
var GNUSTO_EFFECT_PRINTTABLE     = '"PT"';

////////////////////////////////////////////////////////////////
//
// unmz5
//
// Routine to undo mz5 encoding.

function unmz5(encoded) {
  var halfsize = encoded.length/2;
  var decoded = [];

  for (var i=0; i<halfsize; i++) {
    if (encoded[halfsize+i]=='Y') {
      decoded.push(0);
    } else {
      decoded.push(encoded.charCodeAt(i));
    }
  }

  return decoded;
}

////////////////////////////////////////////////////////////////
//
//                       PART THE SECOND
//
// THE HANDLERS AND HANDLER ARRAYS
//
////////////////////////////////////////////////////////////////

// JavaScript seems to have a problem with pointers to methods.
// We solve this in a Pythonesque manner. Each instruction handler
// is a simple function which takes two parameters: 1) the engine
// asking the question (i.e. the value which would be "this" if
// the function was a method), and 2) the list of actual arguments
// given in the z-code for that function.

function handleZ_je(engine, a) { 		

    if (a.length<2) { 
      //VERBOSE burin('je','noop');
      return ''; // it's a no-op
    } else if (a.length==2) { 
      //VERBOSE burin('je',a[0] + '==' + a[1]);
      return engine._brancher(a[0]+'=='+a[1]);
    } else {
      var condition = '';
      for (var i=1; i<a.length; i++) {
	if (i!=1) condition = condition + '||';
	condition = condition + 't=='+a[i];
      }
      //VERBOSE burin('je','t=' + a[0] + ';' + condition);
      return 't='+a[0]+';'+engine._brancher(condition);
    }
  }

function handleZ_jl(engine, a) {
    //VERBOSE burin('jl',a[0] + '<' + a[1]); 
    return engine._brancher(a[0]+'<'+a[1]); }

function handleZ_jg(engine, a) { 
    //VERBOSE burin('jg',a[0] + '>'+a[1]);
    return engine._brancher(a[0]+'>'+a[1]); }

function handleZ_dec_chk(engine, a) {
    //VERBOSE burin('dec_chk',value + '-1 < ' + a[1]);
    return 't='+a[0]+';t2=_varcode_get(t)-1;_varcode_set(t2,t);'+engine._brancher('t2<'+a[1]);
  }
function handleZ_inc_chk(engine, a) {
    //VERBOSE burin('inc_chk',value + '+1 > ' + a[1]);
    return 't='+a[0]+';t2=_varcode_get(t)+1;_varcode_set(t2,t);'+engine._brancher('t2>'+a[1]);
  }

function handleZ_jin(engine, a) {
    //VERBOSE burin('jin',a[0] + ',' + a[1]);
    return engine._brancher("_obj_in("+a[0]+','+a[1]+')');
  }
function handleZ_test(engine, a) {
    //VERBOSE burin('test','t='+a[1]+';br(' + a[0] + '&t)==t)');
    return 't='+a[1]+';'+engine._brancher('('+a[0]+'&t)==t');
  }
function handleZ_or(engine, a) {
    //VERBOSE burin('or','('+a[0] + '|' + a[1]+')&0xFFFF');
    return engine._storer('('+a[0]+'|'+a[1]+')&0xffff');
  }
function handleZ_and(engine, a) {
    //VERBOSE burin('and',a[0] + '&' + a[1] + '&0xFFFF');
    return engine._storer(a[0]+'&'+a[1]+'&0xffff');
  }
function handleZ_test_attr(engine, a) {
    //VERBOSE burin('test_attr',a[0] + ',' + a[1]);
    return engine._brancher('_test_attr('+a[0]+','+a[1]+')');
  }
function handleZ_set_attr(engine, a) {
    //VERBOSE burin('set_attr',a[0] + ',' + a[1]);
    return '_set_attr('+a[0]+','+a[1]+')';
  }
function handleZ_clear_attr(engine, a) {
    //VERBOSE burin('clear_attr',a[0] + ',' + a[1]);
    return '_clear_attr('+a[0]+','+a[1]+')';
  }
function handleZ_store(engine, a) {
    //VERBOSE burin('store',a[0] + ',' + a[1]);
    return "_varcode_set("+a[1]+","+a[0]+")";
  }
function handleZ_insert_obj(engine, a) {
    //VERBOSE burin('insert_obj',a[0] + ',' + a[1]);
    return "_insert_obj("+a[0]+','+a[1]+")";
  }
function handleZ_loadw(engine, a) {
    //VERBOSE burin('loadw',"this.getWord((1*"+a[0]+"+2*"+a[1]+")&0xFFFF)");
    return engine._storer("getWord((1*"+a[0]+"+2*"+a[1]+")&0xFFFF)");
  }
function handleZ_loadb(engine, a) {
    //VERBOSE burin('loadb',"this.getByte((1*"+a[0]+"+1*"+a[1]+")&0xFFFF)");
    return engine._storer("getByte((1*"+a[0]+"+1*"+a[1]+")&0xFFFF)");
  }
function handleZ_get_prop(engine, a) {
    //VERBOSE burin('get_prop',a[0]+','+a[1]);
    return engine._storer("_get_prop("+a[0]+','+a[1]+')');
  }
function handleZ_get_prop_addr(engine, a) {
    //VERBOSE burin('get_prop_addr',a[0]+','+a[1]);
    return engine._storer("_get_prop_addr("+a[0]+','+a[1]+')');
  }
function handleZ_get_next_prop(engine, a) {
    //VERBOSE burin('get_next_prop',a[0]+','+a[1]);
    return engine._storer("_get_next_prop("+a[0]+','+a[1]+')');
  }
function handleZ_add(engine, a) { 
    //VERBOSE burin('add',a[0]+'+'+a[1]);
    return engine._storer(a[0]+'+'+a[1]); }
function handleZ_sub(engine, a) { 
    //VERBOSE burin('sub',a[0]+'-'+a[1]);
    return engine._storer(a[0]+'-'+a[1]); }
function handleZ_mul(engine, a) { 
    //VERBOSE burin('mul',a[0]+'*'+a[1]);
    return engine._storer(a[0]+'*'+a[1]); }
function handleZ_div(engine, a) {
    //VERBOSE burin('div',a[0]+'/'+a[1]);
    return engine._storer('_trunc_divide('+a[0]+','+a[1]+')');
  }
function handleZ_mod(engine, a) { 
    //VERBOSE burin('mod',a[0]+'%'+a[1]);
    return engine._storer(a[0]+'%'+a[1]);
  }
function handleZ_call_2s(engine, a) {
    //VERBOSE burin('call2s',a[0]+'-'+a[1]);
    return engine._handler_call(a[0], a[1]);
  }
function handleZ_call_2n(engine, a) {
    //VERBOSE burin('call2n','gosub(('+a[0]+'&0xFFFF)*4),'+ a[1]+','+pc +',0');
    // can we use handler_call here, too?
    engine.m_compilation_running=0; // Got to stop after this.
    return "_func_gosub("+engine.m_pc_translate_for_routine(a[0])+",["+a[1]+"],"+engine.m_pc+",0)";
  }
function handleZ_set_colour(engine, a) {
    //VERBOSE burin('set_colour',a[0] + ',' + a[1]);
    return "m_pc="+pc+";m_effects=["+GNUSTO_EFFECT_STYLE+",-1,"+a[0]+','+a[1]+"];return 1";
  }
function handleZ_throw(engine, a) {
    //VERBOSE burin('throw','throw_stack_frame('+a[0]+');return');
    engine.m_compilation_running = 0;
    return "_throw_stack_frame("+a[0]+");return";
  }
function handleZ_jz(engine, a) {
    //VERBOSE burin('jz',a[0]+'==0');
    return engine._brancher(a[0]+'==0');
  }
function handleZ_get_sibling(engine, a) {
    //VERBOSE burin('get_sibling',"t=get_sibling("+a[0]+");");
    return "t=_get_sibling("+a[0]+");"+engine._storer("t")+";"+engine._brancher("t");
  }
function handleZ_get_child(engine, a) {
    //VERBOSE burin('get_child',"t=get_child("+a[0]+");");
    return "t=_get_child("+a[0]+");"+
      engine._storer("t")+";"+
      engine._brancher("t");
  }
function handleZ_get_parent(engine, a) {
    //VERBOSE burin('get_parent',"get_parent("+a[0]+");");
    return engine._storer("_get_parent("+a[0]+")");
  }
function handleZ_get_prop_len(engine, a) {
    //VERBOSE burin('get_prop_len',"get_prop_len("+a[0]+");");
    return engine._storer("_get_prop_len("+a[0]+')');
  }
function handleZ_inc(engine, a) {
    //VERBOSE burin('inc',c + '+1');
    return "t="+a[0]+';_varcode_set(_varcode_get(t)+1, t)';
  }
function handleZ_dec(engine, a) {
    //VERBOSE burin('dec',c + '-1');
    return "t="+a[0]+';_varcode_set(_varcode_get(t)-1, t)';
  }
function handleZ_print_addr(engine, a) {
    //VERBOSE burin('print_addr','zscii_from('+a[0]+')');
    return engine._handler_zOut('_zscii_from('+a[0]+')',0);
  }
function handleZ_call_1s(engine, a) {
    //VERBOSE burin('call_1s','handler_call('+a[0]+')');
    return engine._handler_call(a[0], '');
  }
function handleZ_remove_obj(engine, a) {
    //VERBOSE burin('remove_obj',"remove_obj("+a[0]+','+a[1]+")");
    return "_remove_obj("+a[0]+','+a[1]+")";
  }
function handleZ_print_obj(engine, a) {
    //VERBOSE burin('print_obj','name_of_object('+a[0]+',0)');
    return engine._handler_zOut("_name_of_object("+a[0]+")",0);
}
function handleZ_ret(engine, a) {
    //VERBOSE burin('ret',"_func_return("+a[0]+');return');
    engine.m_compilation_running=0;
    return "_func_return("+a[0]+');return';
  }
function handleZ_jump(engine, a) {
    engine.m_compilation_running=0;
    if (a[0] & 0x8000) {
      a[0] = (~0xFFFF) | a[0];
    }
				
    var addr=(a[0] + engine.m_pc) - 2;
    //VERBOSE burin('jump',"pc="+addr+";return");
    return "m_pc="+addr+";return";
  }
function handleZ_print_paddr(engine, a) {
    //VERBOSE burin('print_paddr',"zscii_from((("+a[0]+")&0xFFFF)*4)");
    return engine._handler_zOut("_zscii_from("+engine.m_pc_translate_for_string(a[0])+")",0);
}
function handleZ_load(engine, a) {
    //VERBOSE burin('load',"store " + c);
    return engine._storer('_varcode_get('+a[0]+')');
  }
function handleZ_call_1n(engine, a) {
    // can we use handler_call here, too?
    engine.m_compilation_running=0; // Got to stop after this.
    //VERBOSE burin('call_1n',"gosub(" + a[0] + '*4)');
    return "_func_gosub("+engine.m_pc_translate_for_routine(a[0])+",[],"+engine.m_pc+",0)"
      }
		
function handleZ_rtrue(engine, a) {
    //VERBOSE burin('rtrue',"_func_return(1);return");
    engine.m_compilation_running=0;
    return "_func_return(1);return";
  }
function handleZ_rfalse(engine, a) {
    //VERBOSE burin('rfalse',"_func_return(0);return");
    engine.m_compilation_running=0;
    return "_func_return(0);return";
}

function handleZ_print(engine, a) {
    //VERBOSE burin('printret',"see handler_print");
    return engine._handler_print('', 0);
}

function handleZ_print_ret(engine, a) {
    engine.m_compilation_running = 0;
    //VERBOSE burin('printret',"see handler_print");
    return engine._handler_print('\n', 1)+';_func_return(1);return';
}

function handleZ_nop(engine, a) {
    //VERBOSE burin('noop','');
    return "";
  }

function handleZ_restart(engine, a) {
    //VERBOSE burin('restart','');
    engine.m_compilation_running=0;
    return "m_effects=["+GNUSTO_EFFECT_RESTART+"];return 1";
  }
		
function handleZ_ret_popped(engine, a) {
    //VERBOSE burin('pop',"_func_return(gamestack.pop());return");
    engine.m_compilation_running=0;
    return "_func_return(m_gamestack.pop());return";
  }
function handleZ_catch(engine, a) {
    // The stack frame cookie is specified by Quetzal 1.3b s6.2
    // to be the number of frames on the stack.
    //VERBOSE burin('catch',"store call_stack.length");
    return engine._storer("call_stack.length");
  }
function handleZ_quit(engine, a) {
    //VERBOSE burin('quit','');
    engine.m_compilation_running=0;
    return "return "+GNUSTO_EFFECT_QUIT;
  }

function handleZ_new_line(engine, a) {
    //VERBOSE burin('newline','');
    return engine._handler_zOut("'\\n'",0);
}
		
function handleZ_show_status(engine, a){ //(illegal from V4 onward)
    //VERBOSE burin('illegalop','188');
    gnusto_error(199);
  }

function handleZ_verify(engine, a) {
    engine.m_compilation_running = 0;
    var setter = 'm_rebound=function(){'+engine._brancher('m_answers[0]')+'};';
    //VERBOSE burin('verify',"pc="+pc+";"+setter+"return GNUSTO_EFFECT_VERIFY");
    return "m_pc="+pc+";"+setter+"return "+GNUSTO_EFFECT_VERIFY;
  }
		
function handleZ_illegal_extended(engine, a) {
    // 190 can't be generated; it's the start of an extended opcode
    //VERBOSE burin('illegalop','190');
    gnusto_error(199);
  }
		
function handleZ_piracy(engine, a) {
    engine.m_compilation_running = 0;
				
    var setter = 'm_rebound=function(){'+engine._brancher('(!m_answers[0])')+'};';
    //VERBOSE burin('piracy',"pc="+pc+";"+setter+"return GNUSTO_EFFECT_PIRACY");
    return "m_pc="+pc+";"+setter+"return "+GNUSTO_EFFECT_PIRACY;
  }
		
function handleZ_call_vs(engine, a) {
    //VERBOSE burin('call_vs','see call_vn');
    return engine._storer(engine._call_vn(a, 1));
}

function handleZ_store_w(engine, a) {
    //VERBOSE burin('storew',"setWord("+a[2]+",1*"+a[0]+"+2*"+a[1]+")");
    return "setWord("+a[2]+",1*"+a[0]+"+2*"+a[1]+")";
  }

function handleZ_storeb(engine, a) {
    //VERBOSE burin('storeb',"setByte("+a[2]+",1*"+a[0]+"+1*"+a[1]+")");
    return "setByte("+a[2]+",1*"+a[0]+"+1*"+a[1]+")";
  }

function handleZ_putprop(engine, a) {
    //VERBOSE burin('putprop',"put_prop("+a[0]+','+a[1]+','+a[2]+')');
    return "_put_prop("+a[0]+','+a[1]+','+a[2]+')';
  }
function handleZ_read(engine, a) {
				
    // read, aread, sread, whatever it's called today.
    // That's something that we can't deal with within gnusto:
    // ask the environment to magic something up for us.

    if (a[3]) {
      // ...then we should do something with a[2] and a[3],
      // which are timed input parameters. For now, though,
      // we'll just ignore them.
      //VERBOSE burin('read',"should have been timed-- not yet supported");
    }

    engine.m_compilation_running = 0;
				
    var setter = "m_rebound_args[0]=a0;m_rebound_args[1]="+a[1]+";m_rebound=function(){" +
      engine._storer("_aread(m_answers[0],m_rebound_args[0],m_rebound_args[1])") +
      "};";

    //VERBOSE burin('read',"var a0=eval("+ a[0] + ");" + "pc=" + pc + ";" +

    return "var a0=eval("+ a[0] + ");" +
				"m_pc=" + engine.m_pc + ";" +
				setter +
				"m_effects=["+GNUSTO_EFFECT_INPUT+","+
				"getByte(a0+1),"+
				"getByte(a0)];return 1";
  }
function handleZ_print_char(engine, a) {
    //VERBOSE burin('print_char','zscii_char_to_ascii('+a[0]+')');
    return engine._handler_zOut('_zscii_char_to_ascii('+a[0]+')',0);
}
function handleZ_print_num(engine, a) {
    //VERBOSE burin('print_num','handler_zout('+a[0]+')');
    return engine._handler_zOut(a[0],0);
}
function handleZ_random(engine, a) {
    //VERBOSE burin('random',"random_number("+a[0]+")");
    return engine._storer("_random_number("+a[0]+")");
  }
function handleZ_push(engine, a) {
    //VERBOSE burin('push',a[0]);
    return engine._store_into('m_gamestack.pop()', a[0]);
  }
function handleZ_pull(engine, a) {
    //VERBOSE burin('pull',c +'=gamestack.pop()');
    return '_varcode_set(m_gamestack.pop(),'+a[0]+')';
  }

function handleZ_split_window(engine, a) {
    engine.m_compilation_running=0;
    //VERBOSE burin('split_window','lines=' + a[0]);
    return "m_pc="+engine.m_pc+";m_effects=["+GNUSTO_EFFECT_SPLITWINDOW+","+a[0]+"];return 1";
  }
function handleZ_set_window(engine, a) {
    engine.m_compilation_running=0;
    //VERBOSE burin('set_window','win=' + a[0]);
    return "m_pc="+engine.m_pc+";m_effects=["+GNUSTO_EFFECT_SETWINDOW+","+a[0]+"];return 1";
  }
function handleZ_call_vs2(engine, a) {
    //VERBOSE burin('call_vs2',"see call_vn");
    return engine._storer(engine._call_vn(a,1));
  }
function handleZ_erase_window(engine, a) {
    engine.m_compilation_running=0;
    //VERBOSE burin('erase_window','win=' + a[0]);
    return "m_pc="+engine.m_pc+";m_effects=["+GNUSTO_EFFECT_ERASEWINDOW+","+a[0]+"];return 1";
  }
function handleZ_erase_line(engine, a) {
    engine.m_compilation_running=0;
    //VERBOSE burin('erase_line',a[0]);
    return "m_pc="+engine.m_pc+";m_effects=["+GNUSTO_EFFECT_ERASELINE+","+a[0]+"];return 1";
  }
function handleZ_set_cursor(engine, a) {
    engine.m_compilation_running=0;
    //VERBOSE burin('set_cursor',' ['+a[0]+', ' + a[1] + '] ');
    return "m_pc="+engine.m_pc+";m_effects=["+GNUSTO_EFFECT_SETCURSOR+","+a[0]+","+a[1]+"];return 1";
  }
		
function handleZ_get_cursor(engine, a) {
    engine.m_compilation_running=0;
    //VERBOSE burin('get_cursor',a[0]);
    return "m_pc="+engine.m_pc+";m_effects=["+GNUSTO_EFFECT_GETCURSOR+","+a[0]+"];return 1";
  }
		
function handleZ_set_text_style(engine, a) {
    engine.m_compilation_running=0;
    //VERBOSE burin('set_text_style',a[0]);
    return "m_pc="+engine.m_pc+";m_effects=["+GNUSTO_EFFECT_STYLE+","+a[0]+",0,0];return 1";
  }
		
function handleZ_buffer_mode(engine, a) {
    engine.m_compilation_running=0;
    //VERBOSE burin('buffer_mode',a[0]);
    return "m_pc="+engine.m_pc+";m_effects=["+GNUSTO_EFFECT_SETBUFFERMODE+","+a[0]+"];return 1";
  }
		
function handleZ_output_stream(engine, a) {
    //VERBOSE burin('output_stream',a[0]+', ' + a[1]);
    return 'this._set_output_stream('+a[0]+','+a[1]+')';
  }
		
function handleZ_input_stream(engine, a) {
    engine.m_compilation_running=0;
    //VERBOSE burin('input_stream',a[0]);
    return "m_pc="+engine.m_pc+";m_effects=["+GNUSTO_EFFECT_SETINPUTSTREAM+","+a[0]+"];return 1";
  }
		
function handleZ_sound_effect(engine, a) {
    // We're rather glossing over whether and how we
    // deal with callbacks at present.
				
    engine.m_compilation_running=0;
    //VERBOSE burin('sound_effect','better logging later');
    while (a.length < 5) { a.push(0); }
    return "m_pc="+engine.m_pc+';m_effects=['+GNUSTO_EFFECT_SOUND+','+a[0]+','+a[1]+','+a[2]+','+a[3]+','+a[4]+'];return 1';
  }
		
function handleZ_read_char(engine, a) {
    // Maybe factor out "read" and this?
    //VERBOSE burin('read_char','');
    // a[0] is always 1; probably not worth checking for this
				
    if (a[3]) {
      // ...then we should do something with a[2] and a[3],
      // which are timed input parameters. For now, though,
      // we'll just ignore them.
      //VERBOSE burin('read_char','should have been timed-- not yet supported');
    }
				
    engine.m_compilation_running = 0;
				
    var setter = "m_rebound=function() { " +
      engine._storer("m_answers[0]") +
      "};";
				
    return "m_pc="+engine.m_pc+";"+setter+"m_effects=["+GNUSTO_EFFECT_INPUT_CHAR+"];return 1";
  }
		
function handleZ_scan_table(engine, a) { 
    //VERBOSE burin('scan_table',"t=scan_table("+a[0]+','+a[1]+"&0xFFFF,"+a[2]+"&0xFFFF," + a[3]+");");
    if (a.length == 4) {
      return "t=scan_table("+a[0]+','+a[1]+"&0xFFFF,"+a[2]+"&0xFFFF," + a[3]+");" +
	engine._storer("t") + ";" +  engine._brancher('t');
    } else { // must use the default for Form, 0x82
      return "t=scan_table("+a[0]+','+a[1]+"&0xFFFF,"+a[2]+"&0xFFFF," + 0x82 +");" +
	engine._storer("t") + ";" +  engine._brancher('t');
    }
  }
		
function handleZ_not(engine, a) {
		//VERBOSE burin('not','~'+a[1]+'&0xffff');
    return engine._storer('~'+a[1]+'&0xffff');
}

function handleZ_call_vn(engine, a) {
		// The engine can do this quite well for us on its own.
		return engine._call_vn(a);
}
		
function handleZ_tokenise(engine, a) {
    //VERBOSE burin('tokenise',"tokenise("+a[0]+","+a[1]+","+a[2]+","+a[3]+")");
    return "_tokenise(("+a[0]+")&0xFFFF,("+a[1]+")&0xFFFF,"+a[2]+","+a[3]+")";
  }
		
function handleZ_encode_text(engine, a) {
    //VERBOSE burin('tokenise',"encode_text("+a[0]+","+a[1]+","+a[2]+","+a[3]+")");
    return "encode_text("+a[0]+","+a[1]+","+a[2]+","+a[3]+")";
  }

function handleZ_copy_table(engine, a) {
    //VERBOSE burin('copy_table',"copy_table("+a[0]+','+a[1]+','+a[2]+")");
    return "copy_table("+a[0]+','+a[1]+','+a[2]+")";
  }
		
function handleZ_print_table(engine, a) {
				
    // Jam in defaults:
    if (a.length < 3) { a.push(1); } // default height
    if (a.length < 4) { a.push(0); } // default skip
    //VERBOSE burin('print_table',"print_table("+a[0]+','+a[1]+','+a[2]+',' + a[3]+')');
    return "m_pc="+engine.m_pc+";m_effects=_print_table("+a[0]+","+a[1]+","+a[2]+","+a[3]+");return 1";
  }
		
function handleZ_check_arg_count(engine, a) {
    //VERBOSE burin('check_arg_count',a[0]+'<=param_count()');
    return engine._brancher(a[0]+'<=_param_count()');
  }
		
function handleZ_save(engine, a) {
    //VERBOSE burin('save','');
    engine.m_compilation_running=0;
    var setter = "m_rebound=function() { " +
      engine._storer('m_answers[0]') + "};";
    return "m_pc="+engine.m_pc+";"+setter+";m_effects=["+GNUSTO_EFFECT_SAVE+"];return 1";
  }
		
function handleZ_restore(engine, a) {
    //VERBOSE burin('restore','');
    engine.m_compilation_running=0;
    var setter = "m_rebound=function(n) { " +
      engine._storer('m_answers[0]') + "};";
    return "m_pc="+engine.m_pc+";"+setter+"m_effects=["+GNUSTO_EFFECT_RESTORE+"];return 1";
  }
		
function handleZ_log_shift(engine, a) {
    //VERBOSE burin('log_shift',"log_shift("+a[0]+','+a[1]+')');
    // log_shift logarithmic-bit-shift.  Right shifts are zero-padded
    return engine._storer("_log_shift("+a[0]+','+a[1]+')');
  }

function handleZ_art_shift(engine, a) {
    //VERBOSE burin('log_shift',"art_shift("+a[0]+','+a[1]+')');
    // arithmetic-bit-shift.  Right shifts are sign-extended
    return engine._storer("_art_shift("+a[0]+','+a[1]+')');
  }

function handleZ_set_font(engine, a) {
    //VERBOSE burin('set_font','('+a[0]+'<2?1:0) <<We only provide font 1.>>');
    // We only provide font 1.
    return engine._storer('('+a[0]+'<2?1:0)');
  }

function handleZ_save_undo(engine, a) {
    //VERBOSE burin('save_undo','unsupported');
    return engine._storer('-1'); // not yet supplied
  }

function handleZ_restore_undo(engine, a) {
    //VERBOSE burin('restore_undo','unsupported');
    gnusto_error(700); // spurious restore_undo
    return engine._storer('0');
  }

function handleZ_print_unicode(engine, a) {
    //VERBOSE burin('print_unicode',"String.fromCharCode(" +a[0]+")");
    return engine._handler_zOut("String.fromCharCode(" +a[0]+")",0);
}

function handleZ_check_unicode(engine, a) {
    //VERBOSE burin('check_unicode','we always say yes');
    // We have no way of telling from JS whether we can
    // read or write a character, so let's assume we can
    // read and write all of them. We can always provide
    // methods to do so somehow (e.g. with an onscreen keyboard).
    return engine._storer('3');
}
  ////////////////////////////////////////////////////////////////
  //
  // |handlers|
  //
  // An array mapping opcodes to functions. Each function is passed
  // a series of arguments (between zero and eight, as the Z-machine
  // allows) as an array, called |a| below. It returns a string of JS,
  // called |r| in these comments, which can be evaluated to do the job of that
  // opcode. Note, again, that this is a string (not a function object).
  //
  // Extended ("EXT") opcodes are stored 1000 higher than their number.
  // For example, 1 is "je", but 1001 is "restore".
  //
  // |r|'s code may set |engine.m_compilation_running| to 0 to stop compile() from producing
  // code for any more opcodes after this one. (compile() likes to group
  // code up into blocks, where it can.)
  //
  // |r|'s code may contain a return statement for two reasons: firstly, to
  // prevent execution of any further generated code before we get to take
  // our bearings again (for example, |r| must cause a return if it knows that
  // the program counter has been modified: PC changes can't take effect until
  // the next lookup of a code block, so we need to force that to happen
  // immediately). In such cases, return zero or an undefined result. Secondly,
  // we can return a numeric value to cause an effect in the external
  // environment. See "effect codes" above for the values.
  //
  // If |r|'s code contains a return statement, it must make sure to set the PC
  // somehow, either directly or, for example, via _func_return().
  //

var handlers_v578 = {
    1: handleZ_je,
    2: handleZ_jl,
    3: handleZ_jg,
    4: handleZ_dec_chk,
    5: handleZ_inc_chk,
    6: handleZ_jin,
    7: handleZ_test,
    8: handleZ_or,
    9: handleZ_and,
    10: handleZ_test_attr,
    11: handleZ_set_attr,
    12: handleZ_clear_attr,
    13: handleZ_store,
    14: handleZ_insert_obj,
    15: handleZ_loadw,
    16: handleZ_loadb,
    17: handleZ_get_prop,
    18: handleZ_get_prop_addr,
    19: handleZ_get_next_prop,
    20: handleZ_add,
    21: handleZ_sub,
    22: handleZ_mul,
    23: handleZ_div,
    24: handleZ_mod,
    25: handleZ_call_2s,
    26: handleZ_call_2n,
    27: handleZ_set_colour,
    28: handleZ_throw,
    128: handleZ_jz,
    129: handleZ_get_sibling,
    130: handleZ_get_child,
    131: handleZ_get_parent,
    132: handleZ_get_prop_len,
    133: handleZ_inc,
    134: handleZ_dec,
    135: handleZ_print_addr,
    136: handleZ_call_1s,
    137: handleZ_remove_obj,
    138: handleZ_print_obj,
    139: handleZ_ret,
    140: handleZ_jump,
    141: handleZ_print_paddr,
    142: handleZ_load,
    143: handleZ_call_1n,
    176: handleZ_rtrue,
    177: handleZ_rfalse,
    178: handleZ_print,
    179: handleZ_print_ret,
    180: handleZ_nop,
    //181: save (illegal in V5)
    //182: restore (illegal in V5)
    183: handleZ_restart,
    184: handleZ_ret_popped,
    185: handleZ_catch,
    186: handleZ_quit,
    187: handleZ_new_line,
    188: handleZ_show_status, //(illegal from V4 onward)
    189: handleZ_verify,
    190: handleZ_illegal_extended,
    191: handleZ_piracy,
    224: handleZ_call_vs,
    225: handleZ_store_w,
    226: handleZ_storeb,
    227: handleZ_putprop,
    228: handleZ_read,
    229: handleZ_print_char,
    230: handleZ_print_num,
    231: handleZ_random,
    232: handleZ_push,
    233: handleZ_pull,
    234: handleZ_split_window,
    235: handleZ_set_window,
    236: handleZ_call_vs2,
    237: handleZ_erase_window,
    238: handleZ_erase_line,
    239: handleZ_set_cursor,
    240: handleZ_get_cursor,
    241: handleZ_set_text_style,
    242: handleZ_buffer_mode,
    243: handleZ_output_stream,
    244: handleZ_input_stream,
    245: handleZ_sound_effect,
    246: handleZ_read_char,
    247: handleZ_scan_table, 
    248: handleZ_not,
    249: handleZ_call_vn,
    250: handleZ_call_vn, // call_vn2,
    251: handleZ_tokenise,
    252: handleZ_encode_text,
    253: handleZ_copy_table,
    254: handleZ_print_table,
    255: handleZ_check_arg_count,
    1000: handleZ_save,
    1001: handleZ_restore,
    1002: handleZ_log_shift,
    1003: handleZ_art_shift,
    1004: handleZ_set_font,
    //1005: draw_picture (V6 opcode)
    //1006: picture_dat (V6 opcode)
    //1007: erase_picture (V6 opcode)
    //1008: set_margins (V6 opcode)
    1009: handleZ_save_undo,
    1010: handleZ_restore_undo,
    1011: handleZ_print_unicode,
    1012: handleZ_check_unicode,

    //1013-1015: illegal
    //1016: move_window (V6 opcode)
    //1017: window_size (V6 opcode)
    //1018: window_style (V6 opcode)
    //1019: get_wind_prop (V6 opcode)		
    //1020: scroll_window (V6 opcode)
    //1021: pop_stack (V6 opcode)
    //1022: read_mouse (V6 opcode)
    //1023: mouse_window (V6 opcode)
    //1024: push_stack (V6 opcode)
    //1025: put_wind_prop (V6 opcode)
    //1026: print_form (V6 opcode)
    //1027: make_menu (V6 opcode)
    //1028: picture_table (V6 opcode)
};

////////////////////////////////////////////////////////////////
//
// pc_translate_*
// 
// Each of these functions returns a string of JS code to set the PC
// to the address in |packed_target|, based on the current architecture.
//
// TODO: Would be good if we could pick up when it was a constant.

function pc_translate_v123(p) { return '(('+p+')&0xFFFF)*2'; }
function pc_translate_v45(p)  { return '(('+p+')&0xFFFF)*4'; }
function pc_translate_v67R(p) { return '(('+p+')&0xFFFF)*4+'+this.m_routine_start; }
function pc_translate_v67S(p) { return '(('+p+')&0xFFFF)*4+'+this.m_string_start; }
function pc_translate_v8(p)   { return '(('+p+')&0xFFFF)*8'; }

////////////////////////////////////////////////////////////////
//
//                       PART THE THIRD
//
// THE NEW AMAZING COMPONENT WHICH PLAYS GAMES AND WASHES DISHES
// AND LAYS THE TABLE AND WALKS THE DOG AND CLEANS THE OVEN AND...
//
////////////////////////////////////////////////////////////////

function gnusto_error(number, message) {
		// FIXME: Look into how to do this in a more standard way.
		// FIXME: Support multiple parameters!
		throw 'Error '+number+': '+message;
}

////////////////////////////////////////////////////////////////
//
// The Engine
//
// The object itself...

function GnustoEngine() { }

GnustoEngine.prototype = {
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PUBLIC METHODS                                           //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

  loadStory: function ge_loadStory(story) {
    dump('And in loadStory. story is ');
    dump(story);
    dump('\n');

    bis = new Components.Constructor('@mozilla.org/binaryinputstream;1',
				     'nsIBinaryInputStream');
    dump(bis);
    dump('\n');

    bis.setInputStream(story);
    dump(bis);
    dump('\n');

    rba = bis.readByteArray();
    dump(rba);
    dump('\n');

    this.m_story = story;
  },

  loadStoryMZ5: function ge_loadStory(story) {
    this.m_memory = unmz5(story);
    this._initial_setup();
  },

  loadSavedGame: function ge_loadSavedGame(savedGame) {
    throw "not implemented";
  },

  get version() {
    throw "not implemented";
  },

  get signature() {
    throw "not implemented";
  },

  get cvsVersion() {
			return CVS_VERSION.substring(7, 26);
  },

	get goldenTrail() {
			return this.m_goldenTrail;
	},

	set goldenTrail(value) {
			if (value) {
					this.m_jit = []; // Got to trash the JIT here.
					this.m_goldenTrail = 1;
			} else {
					this.m_goldenTrail = 0;
			}
	},

  effect: function ge_effect(which) {
			return this.m_effects[which];
  },

  answer: function ge_answer(which, what) {
			this.m_answers[which] = what;
  },

  // Main point of entry for gnusto. Be sure to call start_game()
  // before calling this the first time.
  //
  // This function returns an effect code when the machine pauses, stating
  // why the machine was paused. More details, and the actual values, are
  // given above.
  // 
  // |answer| is for returning answers to earlier effect codes. If you're
  // not answering an effect code, pass 0 here.
  run: function ge_run() {
   
    // burin('run', answer);
    var start_pc = 0;
    var stopping = 0;
    var turns = 0;
    var jscode;
    var turns_limit = this.m_single_step? 1: 10000;

    if (this.m_rebound) {
				this.m_rebound();
				this.m_rebound = 0;
				this.m_rebound_args = [];
		}

    while(!stopping) {

				if (turns++ >= turns_limit) {
					// Wimp out for now.
						return GNUSTO_EFFECT_WIMP_OUT;
				}

      start_pc = this.m_pc;

      if (this.m_jit[start_pc]) {
					jscode = this.m_jit[start_pc];
      } else {
					jscode=this.eval('dummy='+this._compile());

					// Store it away, if it's in static memory (there's
					// not much point caching JIT from dynamic memory!)
					if (start_pc >= this.m_stat_start) {
							this.m_jit[start_pc] = jscode;
					}
      }

      // Some useful debugging code:
      //burin('eng pc', start_pc);
      //burin('eng this.m_jit', jscode);
    
      stopping = jscode();
    }

    // so, return an effect code.
    return stopping;
  },
  
  walk: function ge_walk(answer) {
    throw "not implemented";
  },

  get architecture() {
    return 'none';
  },

  get piracy() {
    return -1;
  },

  get tandy() {
    return -1;
  },

  get status() {
    return 'this is the status, hurrah!';
  },

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PRIVATE METHODS                                          //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////
  // _initial_setup
  //
  // Initialises global variables.
  _initial_setup: function ge_initial_setup() {

			this.m_jit = [];
			this.m_compilation_running = 0;
			this.m_gamestack = [];

			this.m_call_stack = [];
			this.m_locals = [];
			this.m_locals_stack = [];
			this.m_param_counts = [];
			this.m_result_eaters = [];

			this.m_goldenTrail = 0;

			this.m_version     = this.getByte(0);

			this.m_himem       = this.getUnsignedWord(0x4);
			this.m_pc          = this.getUnsignedWord(0x6);
			this.m_dict_start  = this.getUnsignedWord(0x8);
			this.m_objs_start  = this.getUnsignedWord(0xA);
			this.m_vars_start  = this.getUnsignedWord(0xC);
			this.m_stat_start  = this.getUnsignedWord(0xE);
			this.m_abbr_start  = this.getUnsignedWord(0x18);
			this.m_alpha_start = this.getUnsignedWord(0x34);
			this.m_hext_start  = this.getUnsignedWord(0x36);		
	
			// Use the correct addressing mode for this Z-machine version...

			if (this.m_version<=3) {
					// Versions 1 and 2 (prehistoric)
					this.m_pc_translate_for_routine = pc_translate_v123;
					this.m_pc_translate_for_string = pc_translate_v123;
			} else if (this.m_version<=5) {
					// Versions 3 ("Standard"), 4 ("Plus") and 5 ("Advanced")
					this.m_pc_translate_for_routine = pc_translate_v45;
					this.m_pc_translate_for_string = pc_translate_v45;
			} else if (this.m_version<=7) {
					// Versions 6 (the graphical one) and 7 (rare postInfocom extension)
					this.m_routine_start  = this.getUnsignedWord(0x28)*8;
					this.m_string_start   = this.getUnsignedWord(0x2a)*8;
					this.m_pc_translate_for_routine = pc_translate_v67R;
					this.m_pc_translate_for_string = pc_translate_v67S;
			} else if (this.m_version==8) {
					// Version 8 (normal postInfocom extension)
					this.m_pc_translate_for_routine = pc_translate_v8;
					this.m_pc_translate_for_string = pc_translate_v8;
			} else {
					gnusto_error(170, 'impossible: unknown z-version got this far');
			}

		// And pick up the relevant instruction set.

    if (this.m_version==5) {
				this.m_handlers = handlers_v578;
    } else if (this.m_version<9) {
				gnusto_error(101, 'version not implemented');
    } else {
				gnusto_error(170, 'impossible: unknown z-version got this far');
    }

    this.m_separator_count = this.getByte(this.m_dict_start);
    for (var i=0; i<this.m_separator_count; i++) {		  
      this.m_separators[i]=this._zscii_char_to_ascii(this.getByte(this.m_dict_start + i+1));
    }	
	
    // If there is a header extension...
    if (this.m_hext_start > 0) {
      // get start of custom unicode table, if any
      this.m_unicode_start = this.getUnsignedWord(this.m_hext_start+6);
      if (this.m_unicode_start > 0) { // if there is one, get the char count-- characters beyond that point are undefined.
					this.m_custom_unicode_charcount = this.getByte(this.m_unicode_start);
					this.m_unicode_start += 1;
      }
    }		
    
    this.m_rebound = 0;
    this.m_rebound_args = [];
    
    this.m_output_to_console = 1;
    this.m_streamthrees = [];
    this.m_output_to_script = 0;
    
    this.m_console_buffer = '';
    this.m_transcript_buffer = '';
    
    // Reset the default alphabet on reload.  Yes these are already defined in tossio,
    // but that's because it might use them before they get defined here.
    this.m_zalphabet[0] = 'abcdefghijklmnopqrstuvwxyz';
    this.m_zalphabet[1] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.m_zalphabet[2] = 'T\n0123456789.,!?_#\'"/\\-:()'; // T = magic ten bit flag		
    
    var newchar;
    var newcharcode;		
    if (this.m_alpha_start > 0) { // If there's a custom alphabet...
      for (var alpharow=0; alpharow<3; alpharow++){
					var alphaholder = '';
					for (var alphacol=0; alphacol<26; alphacol++) {	
							newcharcode = this.getByte(this.m_alpha_start + (alpharow*26) + alphacol);
							if ((newcharcode >=155) && (newcharcode <=251)) {		     
									// Yes, custom alphabets can refer to custom unicode tables.  Whee...
									if (unicode_start == 0) {
											alphaholder += String.fromCharCode(default_unicode_translation_table[newcharcode]);
									} else {
											if ((newcharcode-154)<= custom_unicode_charcount)
													alphaholder += String.fromCharCode(this.getUnsignedWord(unicode_start + ((newcharcode-155)*2)));					
											else
													alphaholder += ' ';
									}
							} else {
									newchar = String.fromCharCode(newcharcode);
									if (newchar == '^') newchar = '\n';  // This is hackish, but I don't know a better way.
									alphaholder += newchar;
							}
					}		    
					this.m_zalphabet[alpharow]= alphaholder;  // Replace the current row with the newly constructed one.
      }
    }
		

    // We don't also reset the debugging variables, because
    // they need to persist across re-creations of this object.
		// FIXME: Is this still true?

    // Clear the Z-engine's local variables.
    for (var i=0; i<16; i++) this.m_locals[i]=0;

    this.m_printing_header_bits = 0;

    this.m_leftovers = '';
  },

  getByte: function ge_getByte(address) {
    if (address<0) { address &= 0xFFFF; }
    return this.m_memory[address];
  },

  setByte: function ge_setByte(value, address) {
    if (address<0) { address &= 0xFFFF; }
    this.m_memory[address] = value;
  },

  getWord: function ge_getWord(address) {
    if (address<0) { address &= 0xFFFF; }
    return this._unsigned2signed((this.m_memory[address]<<8)|
																 this.m_memory[address+1]);
  },

  _unsigned2signed: function ge_unsigned2signed(value) {
    return ((value & 0x8000)?~0xFFFF:0)|value;
  },

  _signed2unsigned: function ge_signed2unsigned(value) {
    return value & 0xFFFF;
  },

  getUnsignedWord: function ge_getUnsignedWord(address) {
    if (address<0) { address &= 0xFFFF; }
    return (this.m_memory[address]<<8)|this.m_memory[address+1];
  },

  setWord: function ge_setWord(value, address) {
			if (address<0) { address &= 0xFFFF; }
			this.setByte((value>>8) & 0xFF, address);
			this.setByte((value) & 0xFF, address+1);
  },

	// Inelegant function to load parameters according to a VAR byte (or word).
	_handle_variable_parameters: function ge_handle_var_parameters(args, types, bytecount) {
			var argcursor = 0;

			if (bytecount==1) {
					types = (types<<8) | 0xFF;
			}

			while (1) {
					var current = types & 0xC000;
					if (current==0xC000) {
							return;
					} else if (current==0x0000) {
							args[argcursor++] = this.getWord(this.m_pc);
							this.m_pc+=2;
					} else if (current==0x4000) {
							args[argcursor++] = this.getByte(this.m_pc++);
					} else if (current==0x8000) {
							args[argcursor++] = this._code_for_varcode(this.getByte(this.m_pc++));
					} else {
							gnusto_error(171); // impossible
					}
						
					types = (types << 2) | 0x3;
			}
	},

	// _compile() returns a string of JavaScript code representing the
	// instruction at the program counter (and possibly the next few
	// instructions, too). It will change the PC to point to the end of the
	// code it's compiled.
	_compile: function ge_compile() {

			this.m_compilation_running = 1;
			code = '';
			var starting_pc = this.m_pc;

			do {

					// List of arguments to the opcode.
					var args = [];

					this_instr_pc = this.m_pc;

			
					// Check for a breakpoint.
					if (this.m_pc in this.m_breakpoints) {
							code = code + 'if(_is_valid_breakpoint('+this.m_pc+'))return 0x510;';
							//VERBOSE burin(code,'');
					}

					if (this.m_goldenTrail) {
							// for now.
							// (Can we merge this with the breakpoint check?)
							code = code + 'dump("pc : '+this.m_pc.toString(16)+'\\n");';
					}
				
					// So here we go...
					// what's the opcode?
					var instr = this.getByte(this.m_pc++);
			
					if (instr==0) {
							// If we just get a zero, we've probably
							// been directed off into deep space somewhere.
					
							gnusto_error(201); // lost in space
					
					} else if (instr==190) { // Extended opcode.
							
							instr = 1000+this.getByte(this.m_pc++);
							this._handle_variable_parameters(args,
																							 this.getByte(this.m_pc++),
																							 1);
					
					} else if (instr & 0x80) {
							if (instr & 0x40) { // Variable params
									
									if (!(instr & 0x20))
											// This is a 2-op, despite having
											// variable parameters; reassign it.
											instr &= 0x1F;
								
									if (instr==250 || instr==236) {
											// We get more of them!
											var types = this.getUnsignedWord(this.m_pc);
											this.m_pc += 2;
											this._handle_variable_parameters(args, types, 2);
									} else
											this._handle_variable_parameters(args,
																											 this.getByte(this.m_pc++), 1);
							
							} else { // Short. All 1-OPs except for one 0-OP.
									
									switch(instr & 0x30) {
									case 0x00:
											args[0] = this.getWord(this.m_pc);
											this.m_pc+=2;
											instr = (instr & 0x0F) | 0x80;
											break;
											
									case 0x10:
											args[0] = this.getByte(this.m_pc++);
											instr = (instr & 0x0F) | 0x80;
											break;
									
									case 0x20:
											args[0] =
													this._code_for_varcode(this.getByte(this.m_pc++));
											instr = (instr & 0x0F) | 0x80;
											break;
									
									case 0x30:
											// 0-OP. We don't need to get parameters, but we
											// *do* need to translate the opcode.
											instr = (instr & 0x0F) | 0xB0;
											break;
									}
							}
					} else { // Long
					
							if (instr & 0x40)
									args[0] =
											this._code_for_varcode(this.getByte(this.m_pc++));
							else
									args[0] = this.getByte(this.m_pc++);
							
							if (instr & 0x20)
									args[1] =
											this._code_for_varcode(this.getByte(this.m_pc++));
							else
									args[1] = this.getByte(this.m_pc++);
					
							instr &= 0x1F;
					}
			
					if (this.m_handlers[instr]) {
							code = code + this.m_handlers[instr](this, args)+';';
							//VERBOSE burin(code,'');
					} else if (instr>=1128 && instr<=1255 &&
										 "special_instruction_EXT"+(instr-1000) in this) {
					
							// ZMSD 14.2: We provide a hook for plug-in instructions.
							// FIXME: This will no longer work in a component.
							// Can we do anything else instead?
							
							code = code +
									this["special_instruction_EXT"+(instr-1000)](args)+
									';';
							//VERBOSE burin(code,'');

					} else {
							gnusto_error(200, instr, this.m_pc.toString(16)); // no handler
					}

			} while(this.m_compilation_running);

			// When we're not in debug mode, dissembly only stops at places where
			// the THIS.M_PC must be reset; but in debug mode it's perfectly possible
			// to have |code| not read or write to the PC at all. So we need to
			// set it automatically at the end of each fragment.
			
			if (this.m_single_step||this.m_debug_mode) {
					code = code + 'm_pc='+this.m_pc; 
					//VERBOSE burin(code,'');
			}

			// Name the function after the starting position, to make life
			// easier for Venkman.
			return 'function J'+starting_pc.toString(16)+'(){'+code+'}';
	},

	_param_count: function ge_param_count() {
			return this.m_param_counts[0];
	},

	_set_output_stream: function ge_set_output_stream(target, address) {
			if (target==0) {
					// then it's a no-op.
			} else if (target==1) {
					this.m_output_to_console = 1;
			} else if (target==2) {
					this.setByte(this.getByte(0x11) | 0x1);
			} else if (target==3) {
					
					if (this.m_streamthrees.length>15) {
							gnusto_error(202); // too many nested stream-3s
					}

					this.m_streamthrees.unshift([address, address+2]);

			} else if (target==4) {
					this.m_output_to_script = 1;
			} else if (target==-1) {
					this.m_output_to_console = 0;
			} else if (target==-2) {
					this.setByte(this.getByte(0x11) & ~0x1);
			} else if (target==-3) {
					
					if (this.m_streamthrees.length<1) {
							gnusto_error(203); // not enough nested stream-3s
					}

					var latest = this.m_streamthrees.shift();
					this.setWord((latest[1]-latest[0])-2, latest[0]);
					
			} else if (target==-4) {
					this.m_output_to_script = 0;
			} else {
					gnusto_error(204, target); // weird output stream number
			}
	},

	// Called when we reach a possible breakpoint. |addr| is the opcode
	// address. If we should break, sets |pc| to |addr| and returns true;
	// else returns false.
	_is_valid_breakpoint: function ge_is_valid_breakpoint(addr) {
			if (addr in this.m_breakpoints) {
					if (this.m_breakpoints[addr]==2) {
							// A breakpoint we've just reurned from.
							this.m_breakpoints[addr]=1; // set it ready for next time
							return 0; // it doesn't trigger again this time.
					} else if (this.m_breakpoints[addr]==1) {
							// a genuine breakpoint!
							this.m_pc = addr;
							return 1;
					}

					gnusto_error(170); // not really impossible, though
					return 0;
			} else
			// not listed in the breakpoints table
			return 0; // Well, duh.
	},

	_trunc_divide: function ge_trunc_divide(over, under) {
	
			var result;

			if (under==0) {
					gnusto_error(701); // division by zero
					return 0;
			}

			result = over / under;

			if (result > 0) {
					return Math.floor(result);
			} else {
					return Math.ceil(result);
			}			
		  
	},

	_zscii_char_to_ascii: function ge_zscii_char_to_ascii(zscii_code) {
			if (zscii_code<0 || zscii_code>1023) {
					gnusto_error(702, zscii_code); // illegal zscii code
			}

			var result;

			if (zscii_code==13 || zscii_code==10) {
					result = 10;
			} else if ((zscii_code>=32 && zscii_code<=126) || zscii_code==0) {
					result = zscii_code;
			} else if (zscii_code>=155 && zscii_code<=251) {
					// Extra characters.

					if (unicode_start == 0) 
							return String.fromCharCode(default_unicode_translation_table[zscii_code]);
					else { // if we're using a custom unicode translation table...
							if ((zscii_code-154)<= custom_unicode_charcount) 
									return String.fromCharCode(this.getUnsignedWord(unicode_start + ((zscii_code-155)*2)));					
							else 
									gnusto_error(703, zscii_code); // unknown zscii code
                                  
					}


					// FIXME: It's not clear what to do if they request a character
					// that's off the end of the table.
			}	else {
					//let's do nothing for the release-- we'll check the spec afterwards.
					// FIXME: what release was that, and what are we doing now?
					// Is there anything in Bugzilla to track this?
					return "*";//gnusto_error(703, zscii_code); // unknown zscii code
			}

			return String.fromCharCode(result);
	},

	_random_number: function ge_random_number(arg) {
		if (arg==0) {
				// zero returns to true random mode-- seed from system clock
				this.m_use_seed = 0;
				return 0;
		} else {
				if (arg>0) {
						// return a random number between 1 and arg.
						if (this.m_use_seed == 0) {
								return 1 + Math.round((arg -1) * Math.random());
						} else {
								this.random_seed--;
								return Math.round(Math.abs(Math.tan(this.m_random_seed))*8.71*arg)%arg;
						}
				} else {
						// Else we should reseed the RNG and return 0.
						this.m_random_seed = arg;
						this.m_use_seed = 1;
						return 0;
				}
		}
	},

	_func_prologue: function ge_func_prologue(actuals) {
			var count = this.getByte(this.m_pc++);
			for (var i=count; i>=0; i--) {
					if (i<actuals.length) {
							this.m_locals.unshift(actuals[i]);
					} else {
							this.m_locals.unshift(0); // except in v.3, but hey
					}
			}
			this.m_locals_stack.unshift(count+1);
	},

	_func_gosub: function ge_gosub(to_address, actuals, ret_address, result_eater) {
			this.m_call_stack.push(ret_address);
			this.m_pc = to_address;
			// FIXME: func_prologue only called here. Refactor.
			this._func_prologue(actuals);
			this.m_param_counts.unshift(actuals.length);
			this.m_result_eaters.push(result_eater);

			if (to_address==0) {
					// Rare special case.
					this._func_return(0);
			}
	},

	////////////////////////////////////////////////////////////////
	// Tokenises a string.
	//
	// See aread() for caveats.
	// Maybe we should allow aread() to pass in the correct value stored
	// in text_buffer, since it knows it already. It means we don't have
	// to figure it out ourselves.
	//
	_tokenise: function ge_tokenise(text_buffer, parse_buffer, dictionary, overwrite) {

			var cursor = parse_buffer + 2;                	
			if (isNaN(dictionary)) dictionary = 0;
			if (isNaN(overwrite)) overwrite = 0;

			// burin('tokenise', text_buffer+' '+parse_buffer+' '+dictionary+' '+overwrite);

			function look_up(engine, word, dict_addr) {

					var entry_length = engine.getByte(dict_addr+engine.m_separator_count+1);
					var entries_count = engine.getWord(dict_addr+engine.m_separator_count+2);
					var entries_start = engine.m_dict_start+engine.m_separator_count+4;

					// Whether the dictionary is sorted.
					// We don't use this at present (it would be a
					// useful optimisation, though).
					var is_sorted = 1;

					if (entries_count < 0) {
					
							// This should actually only happen on user dictionaries,
							// but the distinction isn't a useful one, and so we don't
							// bother to check.

							is_sorted = 0;
							entries_count = -entries_count;
					}

					var oldword = word;				
					word = engine._into_zscii(word);
			
					for (var i=0; i<entries_count; i++) {
							//really ugly kludge until into_zscii is fixed properly
							// FIXME: Is it?
							var address = entries_start+i*entry_length;
							if (engine._zscii_from(address)==oldword) {
									return address;
							}
							
							var j=0;
							while (j<word.length &&		
										 engine.getByte(address+j)==word.charCodeAt(j))
									j++;

							if (j==word.length)return address;
					}
				
					return 0;
			}

			function add_to_parse_table(engine, dictionary, curword, words_count, wordpos) {
                       
					var lexical = look_up(engine, curword, dictionary);

					if (!(overwrite && lexical==0)) {

							engine.setWord(lexical, cursor);
							cursor+=2;

							engine.setByte(curword.length, cursor++);
							engine.setByte(wordpos+2, cursor++);
	
					} else {

							// In overwrite mode, if we don't know a word, we skip
							// the corresponding record.

							cursor +=4;

					}
		
					engine.setByte(engine.getByte(words_count)+1, words_count);		
			
					return 1;
			}

			if (dictionary==0) {
					// Use the standard game dictionary.
					dictionary = this.m_dict_start;
			}

			var max_chars = this.getByte(text_buffer);

			var result = '';

			for (var i=0;i<this.getByte(text_buffer + 1);i++) {
					result += String.fromCharCode(this.getByte(text_buffer + 2 + i));
			}

			var words_count = parse_buffer + 1;
			this.setByte(0, words_count);
		
			var words = [];
			var curword = '';
			var wordindex = 0;

			for (var cpos=0; cpos < result.length; cpos++) {
					if (result[cpos]  == ' ') {
							if (curword != '') {
									words[wordindex] = curword;
									add_to_parse_table(this, dictionary, words[wordindex], words_count,
																		 cpos - words[wordindex].length);
									wordindex++;
									curword = '';
							}
					} else {
							if (this._is_separator(result[cpos])) {
									if (curword != '') {
											words[wordindex] = curword;
											add_to_parse_table(this, dictionary, words[wordindex], words_count,
																				 cpos - words[wordindex].length);
											wordindex++;
									}
									words[wordindex] = result[cpos];
									add_to_parse_table(this, dictionary, words[wordindex], words_count, cpos);
									wordindex++;
									curword = '';		
							} else {
									curword += result[cpos];	
							}
					}
			}
		
			if (curword != '') {			
					words[wordindex] = curword;
					add_to_parse_table(this, dictionary, words[wordindex], words_count,
														 cpos - words[wordindex].length);
			}
		
			//display the broken-up text for visual validation 
			//for (var i=0; i < words.length; i++){
			//		alert(i + ': ' + words[i] + ' ' + words[i].length);
			//}

	},

	// Very very very limited implementation:
	//  * Doesn't properly handle terminating characters (always returns 10).
	//  * Doesn't handle word separators.
	_aread: function ge_aread(source, text_buffer, parse_buffer) {

			text_buffer &= 0xFFFF;
			parse_buffer &= 0xFFFF;

			var max_chars = this.getByte(text_buffer);
			var result = source.substring(0,max_chars);

			this.setByte(result.length, text_buffer + 1);
			
			for (var i=0;i<result.length;i++) {
					this.setByte(result.charCodeAt(i), text_buffer + 2 + i);
			}

			if (parse_buffer!=0) {
					this._tokenise(text_buffer, parse_buffer, 0, 0);
			}

			// Return the ASCII value for the Enter key. aread() is supposed
			// to return the value of the key which terminated the string, but
			// (FIXME:) at present we only support termination using Enter.
			return 10;
	},

	// Returns from a z-machine routine.
	// |value| is the numeric result of the routine.
	// It can also be null, in which case the remaining results of
	// the current opcode won't be executed (it won't run the "result eater").
	_func_return: function ge_func_return(value) {
			for (var i=this.m_locals_stack.shift(); i>0; i--) {
					this.m_locals.shift();
			}
			this.m_param_counts.shift();
			this.m_pc = this.m_call_stack.pop();

			var eater = this.m_result_eaters.pop();
			if (eater && (value!=null)) {
					eater(value);
			}
	},

	_throw_stack_frame: function throw_stack_frame(cookie) {
			// The cookie is the value of call_stack.length when @catch was
			// called. It cannot be less than 1 or greater than the current
			// value of call_stack.length.

			if (cookie>this.m_call_stack.length || cookie<1) {
					gnusto_error(207, cookie);
			}

			while (this.m_call_stack.length > cookie-1) {
					this._func_return(null);
			}
	},

	_get_prop_addr: function ge_get_prop_addr(object, property) {
			var result = this._property_search(object, property, -1);
			if (result[2]) {
					return result[0];
			} else {
					return 0;
			}
	},

	_get_prop_len: function ge_get_prop_len(address) {
			// The last byte before the data is either the size byte of a 2-byte
			// field, or the only byte of a 1-byte field. We can tell the
			// difference using the top bit.

			var value = this.getByte(address-1);

			if (value & 0x80) {
					// A two-byte field, so we take the bottom five bits.
					value = value & 0x1F;

					if (value==0)
							return 64;
					else
							return value;
			} else {
					// A one-byte field. Our choice rests on a single bit.
					if (value & 0x40)
					return 2;
					else
					return 1;
			}

			gnusto_error(172); // impossible
	},

	_get_next_prop: function ge_get_next_prop(object, property) {

			if (object==0) return 0; // Kill that V0EFH before it starts.

			var result = this.property_search(object, -1, property);

			if (result[2]) {
					// There's a real property number in there;
					// return it.
					return result[3];
			} else {
					// There wasn't a valid property following the one
					// we wanted. Why not?

					if (result[4]) {
							// Because the one we wanted was the last one.
							// Tell them to go back to square one.
							return 0;
					} else {
							// Because the one we wanted didn't exist.
							// They shouldn't have asked for it: barf.
							gnusto_error(205, property);
					}
			}

			gnusto_error(173); // impossible
	},

	_get_prop: function ge_get_prop(object, property) {
			
			if (object==0) return 0; // Kill that V0EFH before it starts.

			var temp = this._property_search(object, property, -1);

			if (temp[1]==2) {
					return this.getWord(temp[0]);
			} else if (temp[1]==1) {
					return this.getByte(temp[0]); // should this be treated as signed?
			} else {
					// get_prop used on a property of the wrong length
					gnusto_error(706, object, property);
					return this.getWord(temp[0]);
			}

			gnusto_error(174); // impossible
	},

	// This is the function which does all searching of property lists.
	// It takes three parameters:
	//    |object| -- the number of the object you're interested in
	//
	// The next parameters allow us to specify the property in two ways.
	// If you use both, it will "or" them together.
	//    |property| -- the number of the property you're interested in,
	//                     or -1 if you don't mind.
	//    |previous_property| -- the number of the property BEFORE the one
	//                     you're interested in, or 0 if you want the first one,
	//                     or -1 if you don't mind.
	//
	// If you specify a valid property, and the property doesn't exist, this
	// function will return the default value instead (and tell you it's done so).
	//
	// The function returns an array with these elements:
	//    [0] = the property address.
	//    [1] = the property length.
	//    [2] = 1 if this property really belongs to the object, or
	//	    0 if it doesn't (and if it doesn't, and you've specified
	//          a valid |property|, then [0] and [1] will be properly
	//          set to defaults.)
	//    [3] = the number of the property.
	//          Equal to |property| if you specified it.
	//          May be -1, if |property| is -1 and [2]==0.
	//    [4] = a piece of state only useful to get_next_prop():
	//          if the object does not contain the property (i.e. if [2]==0)
	//          then this will be 1 if the final property was equal to
	//          |previous_property|, and 0 otherwise. At all other times it will
	//          be 0.
	_property_search: function ge_property_search(object, property, previous_property) {
			var props_address = this.getUnsignedWord(this.m_objs_start + 124 + object*14);

			props_address = props_address + this.getByte(props_address)*2 + 1;
			
			var previous_prop = 0;

			while(1) {
					var len = 1;

					var prop = this.getByte(props_address++);

					if (prop & 0x80) {
							// Long format.
							len = this.getByte(props_address++) & 0x3F;
							if (len==0) len = 64;
					} else {
							// Short format.
							if (prop & 0x40) len = 2;
					}
					prop = prop & 0x3F;

					if (prop==property || previous_prop==previous_property) {
							return [props_address, len, 1, prop, 0];
					} else if (prop < property) {

							// So it's not there. Can we get it from the defaults?

							if (property>0)
									// Yes, because it's a real property.
									return [this.m_objs_start + (property-1)*2,
													2, 0, property, 0];
							else
									// No: they didn't specify a particular
									// property.
									return [-1, -1, 0, property,
													previous_prop==property];
					}

					props_address += len;
					previous_prop = prop;
			}
			gnusto_error(175); // impossible
	},

	////////////////////////////////////////////////////////////////
	// Functions that modify the object tree

	_set_attr: function ge_set_attr(object, bit) {
			if (object==0) return; // Kill that V0EFH before it starts.
			
			var address = this.m_objs_start + 112 + object*14 + (bit>>3);
			var value = this.getByte(address);
			this.setByte(value | (128>>(bit%8)), address);
	},

	_clear_attr: function ge_clear_attr(object, bit) {
			if (object==0) return; // Kill that V0EFH before it starts.

			var address = this.m_objs_start + 112 + object*14 + (bit>>3);
			var value = this.getByte(address);
			this.setByte(value & ~(128>>(bit%8)), address);
	},

	_test_attr: function ge_test_attr(object, bit) {
			if (object==0) return 0; // Kill that V0EFH before it starts.

			if ((this.getByte(this.m_objs_start + 112 + object*14 +(bit>>3)) &
					 (128>>(bit%8)))) {
					return 1;
			} else {
					return 0;
			}
	},

	_put_prop: function put_prop(object, property, value) {

			var address = this._property_search(object, property, -1);

			if (!address[2]) {
					gnusto_error(704); // undefined property
			}

			if (address[1]==1) {
					this.setByte(value & 0xff, address[0]);
			} else if (address[1]==2) {
					this.setWord(value&0xffff, address[0]);
			} else {
					gnusto_error(705); // weird length
			}
	},


	_get_older_sibling: function ge_get_older_sibling(object) {
			// Start at the eldest child.
			var candidate = this._get_child(this._get_parent(object));

			if (object==candidate) {
					// evidently nothing doing there.
					return 0;
			}

			while (candidate) {
					next_along = this._get_sibling(candidate);
					if (next_along==object) {
							return candidate; // Yay! Got it!
					}
					candidate = next_along;
			}

			// We ran out, so the answer's 0.
			return 0;
	},

	_insert_obj: function ge_insert_obj(mover, new_parent) {

			// First, remove mover from wherever it is in the tree now.

			var old_parent = this._get_parent(mover);
			var older_sibling = this._get_older_sibling(mover);
			var younger_sibling = this._get_sibling(mover);

			if (old_parent && this._get_child(old_parent)==mover) {
					this._set_child(old_parent, younger_sibling);
			}

			if (older_sibling) {
					this._set_sibling(older_sibling, younger_sibling);
			}

			// Now, slip it into the new place.
			
			this._set_parent(mover, new_parent);

			if (new_parent) {
					this._set_sibling(mover, this._get_child(new_parent));
					this._set_child(new_parent, mover);
			}
	},

	// FIXME: Why the new_parent?!
	_remove_obj: function ge_remove_obj(mover, new_parent) {
			this._insert_obj(mover, 0);
	},

	_get_family: function ge_get_family(from, relationship) {
			return this.getUnsignedWord(this.m_objs_start + 112 +
																	relationship + from*14);
	},

	_get_parent:  function ge_get_parent(from)
	{ return this._get_family(from, PARENT_REC); },

	_get_child:   function ge_get_child(from)
  { return this._get_family(from, CHILD_REC); },

  _get_sibling: function ge_get_sibling(from)
	{ return this._get_family(from, SIBLING_REC); },

	_set_family: function ge_set_family(from, to, relationship)
	{ this.setWord(to, this.m_objs_start + 112 + relationship + from*14); },

	_set_parent: function ge_set_parent(from, to)
	{ return this._set_family(from, to, PARENT_REC); },

	_set_child: function ge_set_child(from, to)
	{ return this._set_family(from, to, CHILD_REC); },

	_set_sibling: function ge_set_sibling(from, to)
	{ return this._set_family(from, to, SIBLING_REC); },

	_obj_in: function ge_obj_in(child, parent)
	{ return this._get_parent(child) == parent; },

	////////////////////////////////////////////////////////////////

	// Implements @copy_table, as in the Z-spec.
	_copy_table: function ge_copy_table(first, second, size) {
			if (second==0) {

					// Zero out the first |size| bytes of |first|.

					for (var i=0; i<size; i++) {
							this.setByte(0, i+first);
					}
			} else {

					// Copy |size| bytes of |first| into |second|.

					var copy_forwards = 0;

					if (size<0) {
							size = -size;
							copy_forwards = 1;
					} else {
							if (first > second) {
									copy_forwards = 1;
							} else {
									copy_forwards = 0;
							}
					}

					if (copy_forwards) {
							for (var i=0; i<size; i++) {
									this.setByte(this.getByte(first+i), second+i);
							}
					} else {
							for (var i=size-1; i>=0; i--) {
									this.setByte(this.getByte(first+i), second+i);
							}
					}
			}
	},


	////////////////////////////////////////////////////////////////
	// Implements @scan_table, as in the Z-spec.
	_scan_table: function ge_scan_table(target_word, target_table,
																			table_length, table_form)
	{
			// TODO: Optimise this some.
	                         
			var jumpby = table_form & 0x7F;
			var usewords = ((table_form & 0x80) == 0x80);
			var lastlocation = target_table + (table_length*jumpby);

			if (usewords) {
					//if the table is in the form of word values
					while (target_table < lastlocation) {
							if (((this.getByte(target_table)&0xFF) == ((target_word>>8)&0xFF)) &&
									((this.getByte(target_table+1)&0xFF) == (target_word&0xFF))) {

									return target_table;
							}
							target_table += jumpby;
					}
			} else {
					//if the table is in the form of byte values
					while (target_table < lastlocation) {
							if ((this.getByte(target_table)&0xFF) == (target_word&0xFFFF)) {
									return target_table;
							}
							target_table += jumpby;
					}
			}
			return 0;	
	},

	////////////////////////////////////////////////////////////////
	// Returns the lines that @print_table should draw, as in
	// the Z-spec.
	//
	// It's rather poorly defined there:
	//   * How is the text in memory encoded?
	//       [Straight ZSCII, not five-bit encoded.]
	//   * What happens to the cursor? Moved?
	//       [We're guessing not.]
	//   * Is the "table" a table in the Z-machine sense, or just
	//     a contiguous block of memory?
	//       [Just a contiguous block.]
	//   * What if the width takes us off the edge of the screen?
	//   * What if the height causes a [MORE] event?
	//
	// It also goes largely un-noted that this is the only possible
	// way to draw on the lower window away from the current
	// cursor position. (If we take the view that v5 windows are
	// roughly the same thing as v6 windows, though, windows don't
	// "own" any part of the screen, so there's no such thing as
	// drawing on the lower window per se.)
	//
	// FIXME: Add note that we now start with G_E_PRINTTABLE

	_print_table: function ge_print_table(address, width, height, skip) {

			var lines = [GNUSTO_EFFECT_PRINTTABLE];

			for (var y=0; y<height; y++) {

					var s='';

					for (var x=0; x<width; x++) {
							s=s+this._zscii_char_to_ascii(this.getByte(address++));
					}

					lines.push(s);

					address += skip;
			}

			return lines;
	},

	_zscii_from: function ge_zscii_from(address, max_length, tell_length) {

			if (address in this.m_jit) {
					//VERBOSE burin('zscii_from ' + address,'already in THIS.M_JIT');

					// Already seen this one.
					
					if (tell_length)
					return this.m_jit[address];
					else
					return this.m_jit[address][0];
			}

			var temp = '';
			var alph = 0;
			var running = 1;
			var start_address = address;

			// Should be:
			//   -2 if we're not expecting a ten-bit character
			//   -1 if we are, but we haven't seen any of it
			//   n  if we've seen half of one, where n is what we've seen
			var tenbit = -2;

			// Should be:
			//    0 if we're not expecting an abbreviation
			//    z if we are, where z is the prefix
			var abbreviation = 0;

			if (!max_length) max_length = 65535;
			var stopping_place = address + max_length;

			while (running) {
					var word = this.getUnsignedWord(address);
					address += 2;

					running = ((word & 0x8000)==0) && address<stopping_place;

					for (var j=2; j>=0; j--) {
							var code = ((word>>(j*5))&0x1f);

							if (abbreviation) {
									temp = temp + this.zscii_from(this.getUnsignedWord((32*(abbreviation-1)+code)*2+abbr_start)*2);
									abbreviation = 0;
							} else if (tenbit==-2) {

									if (code>5) {
											if (alph==2 && code==6)
													tenbit = -1;
											else
													temp = temp + this.m_zalphabet[alph][code-6];
											
											alph = 0;
									} else {
											if (code==0) { temp = temp + ' '; alph=0; }
											else if (code<4) { abbreviation = code; }
											else { alph = code-3; }
									}

							} else if (tenbit==-1) {
									tenbit = code;
							} else {
									temp = temp + this._zscii_char_to_ascii((tenbit<<5) + code);
									tenbit = -2;
							}
					}
			}

			if (start_address >= this.m_stat_start) {
					this.m_jit[start_address] = [temp, address];
			}

			//VERBOSE burin('zscii_from ' + address,temp);
			if (tell_length) {
					return [temp, address];
			} else {
					return temp;
			}
	},

	////////////////////////////////////////////////////////////////
	//
	// encode_text
	//
	// Implements the @encode_text opcode.
	//   |zscii_text|+|from| is the address of the unencoded text.
	//   |length|            is its length.
	//                         (It may also be terminated by a zero byte.)
	//   |coded_text|        is where to put the six bytes of encoded text.
	_encode_text: function ge_encode_text(zscii_text, length, from, coded_text) {

			zscii_text += from;
			var source = '';

			while (length>0) {
					var b = this.getByte(zscii_text);
		
					if (b==0) break;

					source = source + this._zscii_char_to_ascii(b);
					zscii_text++;
					length--;
			}

			var result = this.into_zscii(source);

			for (var i=0; i<result.length; i++) {
					var c = result[i].charCodeAt(0);
					this.setByte(c, coded_text++);
			}
	},

	////////////////////////////////////////////////////////////////
	//
	// Encodes the ZSCII string |str| to its compressed form,
	// and returns it.
	// 
	_into_zscii: function ge_into_zscii(str) {
			var result = '';
			var buffer = [];
			var set_stop_bit = 0;
			
			function emit(value) {

					buffer.push(value);

					if (buffer.length==3) {
							var temp = (buffer[0]<<10 | buffer[1]<<5 | buffer[2]);

							// Weird, but it seems to be the rule:
							if (result.length==4) temp += 0x8000;

							result = result +
									String.fromCharCode(temp >> 8) +
									String.fromCharCode(temp &  0xFF);
							buffer = [];
					}
			}

			// Need to handle other alphabets. At present we only
			// handle alphabetic characters (A0).
			// Also need to handle ten-bit characters.
			// FIXME: Are the above still true?
		
			var cursor = 0;

			while (cursor<str.length && result.length<6) {
					var ch = str.charCodeAt(cursor++);

					if (ch>=65 && ch<=90) { // A to Z
							// These are NOT mapped to A1. ZSD3.7
							// explicitly forbids use of upper case
							// during encoding.
							emit(ch-59);
					} else if (ch>=97 && ch<=122) { // a to z
							emit(ch-91);
					} else {
							var z2 = this.m_zalphabet[2].indexOf(ch);
							
							if (z2!=-1) {
									emit(5); // shift to weird stuff

									// XXX FIXME. This ought logically to be z2+6
									// (and Frotz also uses 6 here.) For some reason,
									// it seems not to work unless it's z2+9.
									// Find out what's up.
									emit(z2+6);
							} else {
									emit(5);
									emit(6);
									emit(ch >> 5);
									emit(ch &  0x1F);
							}
					}
			}

			cursor = 0;

			while (result.length<6) emit(5);

			return result.substring(0,6);
	},

	_name_of_object: function ge_name_of_object(object) {

			if (object==0)
			return "<void>";
			else {
					var aa = this.m_objs_start + 124 + object*14;
					return this._zscii_from(this.getUnsignedWord(aa)+1);
			}
	},

	////////////////////////////////////////////////////////////////
	//
	// Function to print the contents of leftovers.

	_print_leftovers: function ge_print_leftovers() {

			this._zOut(leftovers);

			// May as well clear it out and save memory,
			// although we won't be called again until it's
			// set otherwise.
			this.leftovers = '';
	},

	////////////////////////////////////////////////////////////////
	//
	// Prints the text |text| on whatever input streams are
	// currently enabled.
	//
	// If this returns false, the text has been printed.
	// If it returns true, the text hasn't been printed, but
	// you must return the GNUSTO_EFFECT_FLAGS_CHANGED effect
	// to your caller. (There's a function handler_zOut()
	// which does all this for you.)

	_zOut: function ge_zOut(text) {

			if (this.m_streamthrees.length) {

					// Stream threes disable any other stream while they're on.
					// (And they can't cause flag changes, I suppose.)

					var current = this.m_streamthrees[0];
					var address = this.m_streamthrees[0][1];

					for (var i=0; i<text.length; i++) {
							this.setByte(text.charCodeAt(i), address++);
					}

					this.m_streamthrees[0][1] = address;
			} else {

					var bits = this.getByte(0x11) & 0x03;
					var changed = bits != this.m_printing_header_bits;
					effect_parameters = this.m_printing_header_bits; 
					this.m_printing_header_bits = bits;

					// OK, so should we bail?

					if (changed) {
							
							m_leftovers = text;
							m_rebound = print_leftovers;

							return 1;

					} else {

							if (this.m_output_to_console) {
									this.m_console_buffer = this.m_console_buffer + text;
							}

							if (bits & 1) {
									this.m_transcript_buffer = this.m_transcript_buffer + text;
							}
					}
			}

			return 0;
	},

	////////////////////////////////////////////////////////////////

	consoleText: function ge_console_text() {
			var temp = this.m_console_buffer;
			this.m_console_buffer = '';
			return temp;
	},

	_transcript_text: function ge_transcript_text() {
			var temp = this.m_transcript_buffer;
			this.m_transcript_buffer = '';
			return temp;
	},

	////////////////////////////////////////////////////////////////

	_is_separator: function ge_IsSeparator(value) {
			for (var sepindex=0; sepindex < this.m_separator_count; sepindex++) {
					if (value == this.m_separators[sepindex]) return 1;	
			}
			return 0;	
	},

	////////////////////////////////////////////////////////////////
	//
	// code_for_varcode
	//
	// should one day be replaced by varcode_[sg]et, probably.
	//
	_code_for_varcode: function ge_code_for_varcode(varcode) {
			if (varcode==0) {
					return 'm_gamestack.pop()';
			} else if (varcode < 0x10) {
					return 'm_locals['+(varcode-1)+']';
			} else {
					return 'getWord('+(this.m_vars_start+(varcode-16)*2)+')';
			}

			gnusto_error(170); // impossible
	},

	////////////////////////////////////////////////////////////////
	//
	// varcode_get
	//
	// Retrieves the value specified by |varcode|, and returns it.
	// |varcode| is interpreted as in ZSD 4.2.2:
	//    0     = pop from game stack
	//    1-15  = local variables
	//    16 up = global variables
	//
	// TODO: We need a varcode_getcode() which returns a JS string
	// which will perform the same job as this function, to save us
	// the extra call we use when encoding "varcode_get(constant)".
	_varcode_get: function ge_varcode_get(varcode) {
			if (varcode==0) {
					return this.m_gamestack.pop();
			} else if (varcode < 0x10) {
					return this.m_locals[(varcode-1)];
			} else {
					return this.getWord(this.m_vars_start+(varcode-16)*2);
			}

			gnusto_error(170); // impossible
	},

	////////////////////////////////////////////////////////////////
	//
	// varcode_set
	//
	// Stores the value |value| in the place specified by |varcode|.
	// |varcode| is interpreted as in ZSD 4.2.2.
	//    0     = push to game stack
	//    1-15  = local variables
	//    16 up = global variables
	//
	// TODO: We need a varcode_setcode() which returns a JS string
	// which will perform the same job as this function, to save us
	// the extra call we use when encoding "varcode_set(n, constant)".
	_varcode_set: function ge_varcode_set(value, varcode) {
			if (varcode==0) {
					this.m_gamestack.push(value);
			} else if (varcode < 0x10) {
					this.m_locals[varcode-1] = value;
			} else {
					this.setWord(value, this.m_vars_start+(varcode-16)*2);
			}
	},

	_brancher: function ge_brancher(condition) {

			var inverted = 1;
			var temp = this.getByte(this.m_pc++);
			var target_address = temp & 0x3F;

			if (temp & 0x80) {
					inverted = 0;
			}

			if (!(temp & 0x40)) {
					target_address = (target_address << 8) | this.getByte(this.m_pc++);
					// and it's signed...

					if (target_address & 0x2000) {
							// sign bit's set; propagate it
							target_address = (~0x1FFF) | (target_address & 0x1FFF);
					}
			}

			var if_statement = condition;

			if (inverted) {
					if_statement = 'if(!('+if_statement+'))';
			} else {
					if_statement = 'if('+if_statement+')';
			}

			// Branches to the addresses 0 and 1 are actually returns with
			// those values.

			if (target_address == 0) {
					return if_statement + '{_func_return(0);return;}';
			}

			if (target_address == 1) {
					return if_statement + '{_func_return(1);return;}';
			}

			target_address = (this.m_pc + target_address) - 2;

			// This is an optimisation that's currently unimplemented:
			// if there's no code there, we should mark that we want it later.
			//  [ if (!this.m_jit[target_address]) this.m_jit[target_address]=0; ]

			return if_statement + '{m_pc='+(target_address)+';return;}';
	},

	_storer: function ge_storer(rvalue) {
			return this._store_into(this._code_for_varcode(this.getByte(this.m_pc++)),
															rvalue);
	},

	_store_into: function ge_store_into(lvalue, rvalue) {
			if (rvalue.substring && rvalue.substring(0,11)=='_func_gosub') {
					// Special case: the results of gosubs can't
					// be stored synchronously.

					this.m_compilation_running = 0; // just to be sure we stop here.

					if (rvalue.substring(rvalue.length-3)!=',0)') {
							// You really shouldn't pass us gosubs with
							// the result function filled in.
							gnusto_error(100, rvalue); // can't modify gosub
					}

					// Twist the lvalue into a function definition.

					return rvalue.substring(0,rvalue.length-2) +
							'function(r){'+
							this._store_into(lvalue, 'r')+
							'})';
			}

			if (lvalue=='m_gamestack.pop()') {
					return 'm_gamestack.push('+rvalue+')';
			} else if (lvalue.substring(0,8)=='getWord(') {
					return 'setWord('+rvalue+','+lvalue.substring(8);
			} else if (lvalue.substring(0,8)=='getByte(') {
					return 'setByte('+rvalue+','+lvalue.substring(8);
			} else {
					return lvalue + '=' + rvalue;
			}
	},

	_call_vn: function call_vn(args, offset) {
			//VERBOSE burin('call_vn','gosub(' + args[0] + '*4, args)');
			this.m_compilation_running = 0;
			var address = this.m_pc;

			if (offset) {
					address += offset;
			}

			return '_func_gosub('+
			this.m_pc_translate_for_routine(args[0])+','+
			'['+args.slice(1)+'],'+
			(address) + ',0)';
	},

	_handler_call: function ge_handler_call(target, arguments) {
			this.m_compilation_running=0; // Got to stop after this.
			var functino = "function(r){"+this._storer("r")+";});";
			// (get it calculated so's the pc will be right)

			return "_func_gosub("+
			this.m_pc_translate_for_routine(target)+
			",["+arguments+"],"+this.m_pc+","+functino;
	},

	////////////////////////////////////////////////////////////////
	// Returns a JS string that calls zOut() correctly to print
	// the line of text in |text|. (See zOut() for details of
	// what constitutes "correctly".)
	//
	// If |is_return| is set, the result will cause a Z-machine
	// return with a result of 1 (the same result as @rtrue).
	// If it's clear, the result will set the PC to the
	// address immediately after the current instruction.
	//
	// (will possibly soon be redundant)
	_handler_zOut: function ge_handler_zOut(text, is_return) {

			var setter;

			if (is_return) {
					setter = '_func_return(1)';
			} else {
					setter = 'm_pc=0x'+this.m_pc.toString(16);
			}

			return 'if(_zOut('+text+')){' + setter +
			';return '+ GNUSTO_EFFECT_FLAGS_CHANGED +	'}';
	},

	////////////////////////////////////////////////////////////////
	// Returns a JS string which will print the text encoded
	// immediately after the current instruction.
	//
	// |suffix| is a string to add to the encoded string. It may
	// be null, in which case no string will be added.
	//
	// |is_return| is passed through unchanged to handler_zOut()
	// (this function is written in terms of that function).
	// See the comments for that function for details.
	_handler_print: function ge_handler_print(suffix, is_return) {
		
			var zf = this._zscii_from(this.m_pc,65535,1);
			var message = zf[0];

			if (suffix) message = message + suffix;

			message=message.
			replace('\\','\\\\','g').
			replace('"','\\"','g').
			replace('\n','\\n','g'); // not elegant

			this.m_pc=zf[1];

			//VERBOSE burin('print',message);
			return this._handler_zOut('"'+message+'"', is_return);
	},

	_log_shift: function ge_log_shift(value, shiftbits) {
			// log_shift logarithmic-bit-shift.  Right shifts are zero-padded
			if (shiftbits < 0) {		
					return (value >>> (-1* shiftbits)) & 0x7FFF;
			} else {
					return (value << shiftbits) & 0x7FFF;
			}
	},

	_art_shift: function ge_art_shift(value, shiftbits) {
			// arithmetic-bit-shift.  Right shifts are sign-extended
			if (shiftbits < 0) {		
					return (value >> (-1* shiftbits)) & 0x7FFF;
			} else {
					return (value << shiftbits) &0x7FFF;
			}	
	},

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PRIVATE VARIABLES                                        //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

  // This will hold the filename of the current game file (so we can
  // reset the memory from it as needed.
  // XXXFIXME: this implies things about where we get game data!
  m_local_game_file: 0,

  // These are all initialised in the function start_game().

  // The actual memory of the Z-machine, one byte per element.
  m_memory: [],

	// Hash mapping Z-code instructions to functions which return a
	// JavaScript string to handle them.
	m_handlers: 0,
  
  // |this.m_jit| is a cache for the results of compile(): it maps
  // memory locations to JS function objects. Theoretically,
  // executing the function associated with a given address is
  // equivalent to executing the z-code at that address.
  //
  // Note: the results of dissembly in dynamic memory should never
  // be put into this array, since the code can change.
  //
  // Planned features:
  //    1) compile() should know about this array, and should stop
  //       dissembly if its program counter reaches any key in it.
  //    2) putting a flag value (probably zero) into this array will
  //       have the effect of 1), but won't stop us replacing it with
  //       real code later.
  m_jit: [],
  
	// If this is nonzero, the engine will report as it passes each instruction.
	m_goldenTrail: 0,
	
  // In ordinary use, compile() attempts to make the functions
  // it creates as long as possible. Sometimes, though, we have to
  // stop dissembling (for example, when we reach a RETURN) or it
  // will seem a good idea (say, when we meet an unconditional jump).
  // In such cases, a subroutine anywhere along the line may set
  // |m_compilation_running| to 0, and compile() will stop after the current
  // iteration.
  m_compilation_running: 0,
  
  // |gamestack| is the Z-machine's stack.
  m_gamestack: 0,
  
  // |himem| is the high memory mark. This is rarely used in practice;
  // we might stop noting it.
  m_himem: 0,
  
  // |pc| is the Z-machine's program counter.
  m_pc: 0,
  
  // |this_instr_pc| is the address of the current instruction.
  m_this_instr_pc: 0,
  
  // |dict_start| is the address of the dictionary in the Z-machine's memory.
  m_dict_start: 0,
  
  // |objs_start| is the address of the object table in the Z-machine's memory.
  m_objs_start: 0,
  
  // |vars_start| is the address of the global variables in the Z-machine's
  // memory.
  m_vars_start: 0,
  
  // |stat_start| is the address of the bottom of static memory.
  // Anything below this can change during the games. Anything
  // above this does not change like the shifting shadows.
  m_stat_start: 0,
  
  // Address of the start of the abbreviations table in memory. (Can this
  // be changed? If not, we could decode them all first.)
  m_abbr_start: 0,
  
  // Address of the start of the header extension table in memory.
  m_hext_start: 0,
  
  // Address of custom alphabet table (if any).
  m_alpha_start: 0,

  m_zalphabet: [],
  
  // Address of start of strings.
  // Only used in versions 6 and 7; otherwise undefined.
  m_string_start: 0,
  
  // Address of start of routines.
  // Only used in versions 6 and 7; otherwise undefined.
  m_routine_start: 0,
  
  // Address of Unicode Translation Table (if any).
  m_unicode_start: 0,
  m_custom_unicode_charcount: 0,
  
  // Information about the defined list of word separators
  m_separator_count: 0,
  m_separators: [],
  
  // |version| is the current Z-machine version.
  m_version: 0,

  // |call_stack| stores all the return addresses for all the functions
  // which are currently executing.
  m_call_stack: 0,
  
  // |locals| is an array of the Z-machine's local variables.
  m_locals: [],
  
  // |locals_stack| is a stack of the values of |locals| for functions
  // further down the call stack than the current function.
  m_locals_stack: 0,
  
  // |param_counts| is an array which stores the number of parameters for
  // each of the variables on |call_stack|, and the current function (so
  // that the number of parameters to the current function is in
  // param_counts[0]). (Hmm, that's a bit inconsistent. We should change it.)
  m_param_counts: 0,
  
  // |result_eaters| is a stack whose use parallels |call_stack|. Instead of
  // storing return addresses, though, |result_eaters| stores function objects.
  // Each of these gets executed as the function returns. For example, if a
  // function contains:
  //
  //    b000: locals[7] = foo(locals[1])
  //    b005: something else
  //
  // and we're just now returning from the call to foo() in b000, the only
  // legitimate value we can set the PC to is b005 (b000 would cause an
  // infinite loop, after all), but we can't go on to b005 because we haven't
  // finished executing b000 yet. So on the top of |result_eaters| there'll be
  // a function object which stores values in locals[7].
  //
  // |result_eaters| may contain zeroes as well as function objects. These are
  // treated as no-ops.
  //
  // It might seem sensible to do without |call_stack| altogether, since an entry
  // in |result_eaters| may set the PC. However, having a list of return
  // addresses enables us to print a call stack.
  m_result_eaters: {},
  
  // The function object to run first next time run() gets called,
  // before any other execution gets under way. Its argument will be the
  // |answer| formal parameter of run(). It can also be 0, which
  // is a no-op. run() will clear it to 0 after running it, whatever
  // happens.
  m_rebound: 0,
  
	// Any extra arguments for m_rebound.
  m_rebound_args: [],

  // Whether we're writing output to the ordinary screen (stream 1).
  m_output_to_console: 0,
  
  // Stream 2 is whether we're writing output to a game transcript,
  // but the state for that is stored in a bit in "Flags 2" in the header.
  
  // A list of streams writing out to main memory (collectively, stream 3).
  // The stream at the start of the list is the current one.
  // Each stream is represented as a list with two elements: [|start|, |end|].
  // |start| is the address at the start of the memory block where the length
  // of the block will be stored after the stream is closed. |end| is the
  // current end of the block.
  m_streamthrees: [],
  
  // Whether we're writing copies of input to a script file (stream 4).
  // fixme: This is really something we need to tell the environment about,
  // since we can't deal with it ourselves.
  m_output_to_script: 0,
  
  // FIXME: Clarify the distinction here
  // If this is 1, run() will "wimp out" after every opcode.
  m_single_step: 0,
  m_debug_mode: 0,
  m_parser_debugging: 0,
  
  // Hash of breakpoints. If compile() reaches one of these, it will stop
  // before executing that instruction with GNUSTO_EFFECT_BREAKPOINT, and the
  // PC set to the address of that instruction.
  //
  // The keys of the hash are opcode numbers. The values are not yet stably
  // defined; at present, all values should be 1, except that if a breakpoint's
  // value is 2, it won't trigger, but it will be reset to 1.
  m_breakpoints: {},
  
  // Buffer of text written to console.
  m_console_buffer: '',
  
  // Buffer of text written to transcript.
  m_transcript_buffer: '',

  // |effects| holds the current effect in its zeroth element, and any
	// parameters needed in the following elements.
  m_effects: [],

	// |answers| is a list of answers to an effect, given by the environment.
  m_answers: [],

  m_random_seed: 0,
  m_use_seed: 0,
  
  // Values of the bottom two bits in Flags 2 (address 0x11),
  // used by the zOut function.
  // See <http://mozdev.org/bugs/show_bug.cgi?id=3344>.
  m_printing_header_bits: 0,
  
  // Leftover text which should be printed next run(), since
  // we couldn't print it this time because the flags had
  // changed.
  m_leftovers: '',

  // These pointers point at the currently-selected functions:
  m_pc_translate_for_routine: pc_translate_v45,
  m_pc_translate_for_string: pc_translate_v45,

};

////////////////////////////////////////////////////////////////
//
// The Factory
//
// A simple class to make Gnusto engines
//

GnustoEngineFactory = new Object();

GnustoEngineFactory.createInstance =
function gef_createinstance(outer, interface_id)
{
  if (outer != null) {
    dump("Don't squish us!\n");
    throw Components.results.NS_ERROR_NO_AGGREGATION;
  }

  if (interface_id.equals(Components.interfaces.gnustoIEngine)) {
    return new GnustoEngine();
  }

  // Otherwise...
  dump("Ugh, weird interface.\n");
  throw Components.results.NS_ERROR_INVALID_ARG;
}


////////////////////////////////////////////////////////////////
//
// The Module
//
// This is the object we pass out to the environment when we get registered.

var Module = new Object();

// Tells the environment where to find our factory.
Module.registerSelf =
function mod_regself(compMgr, fileSpec, location, type) {
  reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
  reg.registerFactoryLocation(ENGINE_COMPONENT_ID,
			      ENGINE_DESCRIPTION,
			      ENGINE_CONTRACT_ID,
			      fileSpec,
			      location,
			      type);
}

// Returns the factory for the given component and interface IDs.
Module.getClassObject =
function mod_getclassobj(compMgr, component_id, interface_id) {

  if (component_id.equals(ENGINE_COMPONENT_ID)) {
    return GnustoEngineFactory;
  }
  
  // okay, so something's weird. give up.
  
  // FIXME: why these errors in particular?
  if (interface_id.equals(Components.interfaces.nsIFactory)) {
    throw Components.results.NS_ERROR_NO_INTERFACE;
  } else {
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
  }
  
}

// Tells us we're being unloaded. (That's always OK with us.)
Module.canUnload =
function mod_canunload(compMgr) {
  return true;
}


////////////////////////////////////////////////////////////////
//
// NSGetModule
//
// It all starts here!

function NSGetModule(compMgr, fileSpec) {
		return Module;
}

// EOF gnusto-engine.js //