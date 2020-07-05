// 字句解析：StateMachine：C言語

/**
 * N1256を元に字句解析を実施する。 
 * Lexical grammer
 * 	token:
 * 		keyword:
 * 			auto, break, case, ...
 * 		identifier:
 * 			[_a-zA-Z]([0-9]|[_a-zA-Z]|\u[A-F]{4,4}|\U[A-F]{8,8})+
 * 		constant:
 * 			integer-constant:
 * 				([1-9][0-9]+|0[0-7]+|0[xX][0-9a-fA-F]+)([uU][lL][lL]?|[lL][lL]?[uU])
 * 			floating-constant:
 * 				[0-9]+(\.[0-9]+)?[eE][+-]?[0-9]+[flFL]?
 * 				0x([0-9a-fA-F]+)?.([0-9a-fA-F]+)?[pP][+-]?
 * 			enumration-constant:
 * 			character-constant:
 * 		string-literal:
 * 		punctuator:
 * 	preprocessing-token:
 * 		header-name:
 * 		identifier:
 * 		pp-number:
 * 		character-constant:
 * 		string-literal:
 * 		punctuator:
 * 		each non-white-space character (cannot be one of the above):
 */

'use strict';

import { token_id } from './token_id';
import { token_err_id } from './token_err_id';
import { tokenizer, token_error_info} from './tokenizer';
//import token_error_info from './tokenizer';

/**
 * '@'から始まる状態はkeyword以外のtokenを示す
 * '@'から始まらない状態はkeyword解析途中の出現した文字までを示す
 */
type lexer_state =
	| '@init'				// 初期状態
	| '@end'				// 終了状態
	| '@identifier'			// identifier解析状態
	| '@univ_char_name'		// universal-character-name解析状態
	| '@pp-number'
	| '@NEWLINE'			// 改行
	| '@WHITESPACE'			// 空白
	| 'a'					// a
	| 'au'					// au
	| 'aut'					// aut
	| 'auto'				// auto
	| 'b'					// b
	| 'br'					// br
	| 'bre'					// bre
	| 'brea'				// brea
	| 'break'				// break
	| 'c'
	| 'ca'
	| 'cas'
	| 'case'
	| 'ch'
	| 'cha'
	| 'char'
	| 'co'
	| 'con'
	| 'cons'
	| 'const'
	| 'cont'
	| 'conti'
	| 'contin'
	| 'continu'
	| 'continue'
	| 'd'
	| 'de'
	| 'def'
	| 'defa'
	| 'defau'
	| 'defaul'
	| 'default'
	| 'do'
	| 'dou'
	| 'doub'
	| 'doubl'
	| 'double'
	| 'e'
	| 'el'
	| 'els'
	| 'else'
	| 'en'
	| 'enu'
	| 'enum'
	| 'ex'
	| 'ext'
	| 'exte'
	| 'exter'
	| 'extern'
	| 'f'
	| 'fl'
	| 'flo'
	| 'floa'
	| 'float'
	| 'fo'
	| 'for'
	| 'g'
	| 'go'
	| 'got'
	| 'goto'
	| 'i'
	| 'if'
	| 'in'
	| 'inl'
	| 'inli'
	| 'inlin'
	| 'inline'
	| 'int'
	| 'l'
	| 'lo'
	| 'lon'
	| 'long'
	| 'r'
	| 're'
	| 'reg'
	| 'regi'
	| 'regis'
	| 'regist'
	| 'registe'
	| 'register'
	| 'res'
	| 'rest'
	| 'restr'
	| 'restri'
	| 'restric'
	| 'restrict'
	| 'ret'
	| 'retu'
	| 'retur'
	| 'return'
	| 's'
	| 'sh'
	| 'sho'
	| 'shor'
	| 'short'
	| 'si'
	| 'sig'
	| 'sign'
	| 'signe'
	| 'signed'
	| 'siz'
	| 'size'
	| 'sizeo'
	| 'sizeof'
	| 'st'
	| 'sta'
	| 'stat'
	| 'stati'
	| 'static'
	| 'str'
	| 'stru'
	| 'struc'
	| 'struct'
	| 'sw'
	| 'swi'
	| 'swit'
	| 'switc'
	| 'switch'
	| 't'
	| 'ty'
	| 'typ'
	| 'type'
	| 'typed'
	| 'typede'
	| 'typedef'
	| 'u'
	| 'un'
	| 'uni'
	| 'unio'
	| 'union'
	| 'uns'
	| 'unsi'
	| 'unsig'
	| 'unsign'
	| 'unsigne'
	| 'unsigned'
	| 'v'
	| 'vo'
	| 'voi'
	| 'void'
	| 'vol'
	| 'vola'
	| 'volat'
	| 'volati'
	| 'volatil'
	| 'volatile'
	| 'w'
	| 'wh'
	| 'whi'
	| 'whil'
	| 'while'
	| '_'
	| '_B'
	| '_Bo'
	| '_Boo'
	| '_Bool'
	| '_C'
	| '_Co'
	| '_Com'
	| '_Comp'
	| '_Compl'
	| '_Comple'
	| '_Complex'
	| '_I'
	| '_Im'
	| '_Ima'
	| '_Imag'
	| '_Imagi'
	| '_Imagin'
	| '_Imagina'
	| '_Imaginar'
	| '_Imaginary'
	| '0'
	| '\\';

export class token_error_info_c implements token_error_info {
	pos: number;
	err_id: token_err_id;

	constructor() {
		this.pos = 0;
		this.err_id = 'null';
	}
}

export default class tokenizer_c implements tokenizer {
	// base class I/F
	text: string;
	len: number[];
	pos: number;
	pos_begin: number;
	pos_end: number;
	err_info: token_error_info[];
	// addtitional
	len_count: number;
	id: token_id;
	state : lexer_state;
	is_keyword: boolean;
	is_eof : boolean;
	regex_punctuator:RegExp;
	regex_identifier_digit_nondigit:RegExp;
	regex_white_space: RegExp;

	// Internal I/F
	private ahead_str : string;
	private ahead_len : number;

	constructor(text:string) {
		//
		this.text = text;
		this.len = new Array<number>();
		this.pos = 0;
		this.pos_begin = 0;
		this.pos_end = 0;
		this.err_info = new Array<token_error_info>();
		//
		this.len_count = 0;
		this.state = '@init';
		this.id = 'null';
		this.is_eof = false;
		this.is_keyword = false;
		this.regex_punctuator = /[\[\](){}.+\-&*~!\/%<>=^|,#\r\n\s\t]/;
		this.regex_identifier_digit_nondigit = /[0-9a-zA-Z_]/;
		this.regex_white_space = /[\s\t\v\f]/;

		// Internal I/F
		this.ahead_str = "";
		this.ahead_len = 0;
	}

	/**
	 * 字句解析開始時に初期設定を行う
	 * 字句解析状態をリセットする
	 */
	restart() {
		this.id = 'null';
		this.state = '@init';
		this.pos_begin = this.pos;
		this.len.splice(0);
		this.len_count = 0;
		this.err_info.splice(0);
		this.is_keyword = false;
	}

	exec() : boolean {
		let finish : boolean;
		let length : number;

		length = this.text.length;
		finish = false;

		this.restart();

		do {
			// 文字列長チェック
			// posが文字列長を超えていたらEOFに到達している。
			// EOF到達時の処理は各状態関数にて行う。
			if (length <= this.pos) {
				this.is_eof = true;
			}
			// 字句解析実施
			finish = this.exec_state();
		} while (!finish);

		this.pos_end = this.pos;
		this.commit_len();

		return finish;
	}

	private exec_state(): boolean {
		let result: boolean

		switch (this.state) {
			case '@init':
				result = this.execute_init();
				break;
			case '@identifier':
				result = this.execute_identifier();
				break;
			case '@univ_char_name':
				result = this.execute_univ_char_name();
				break;
			case '@NEWLINE':
				result = this.execute_newline();
				break;
			case '@WHITESPACE':
				result = this.execute_whitespace();
				break;
			case 'a':
				result = this.execute_keyword_progress([ ['u', 'au'] ]);
				break;
			case 'au':
				result = this.execute_keyword_progress([['t', 'aut']]);
				break;
			case 'aut':
				result = this.execute_keyword_progress([['o', 'auto']]);
				break;
			case 'auto':
				result = this.execute_keyword('auto');
				break;
			case 'b':
				result = this.execute_keyword_progress([['r', 'br']]);
				break;
			case 'br':
				result = this.execute_keyword_progress([['e', 'bre']]);
				break;
			case 'bre':
				result = this.execute_keyword_progress([['a', 'brea']]);
				break;
			case 'brea':
				result = this.execute_keyword_progress([['k', 'break']]);
				break;
			case 'break':
				result = this.execute_keyword('break');
				break;
			case 'c':
				result = this.execute_keyword_progress([['a', 'ca'], ['h', 'ch'], ['o', 'co']]);
				break;
			case 'ca':
				result = this.execute_keyword_progress([['s', 'cas']]);
				break;
			case 'cas':
				result = this.execute_keyword_progress([['e', 'case']]);
				break;
			case 'case':
				result = this.execute_keyword('case');
				break;
			case 'ch':
				result = this.execute_keyword_progress([['a', 'cha']]);
				break;
			case 'cha':
				result = this.execute_keyword_progress([['r', 'char']]);
				break;
			case 'char':
				result = this.execute_keyword('char');
				break;
			case 'co':
				result = this.execute_keyword_progress([['n', 'con']]);
				break;
			case 'con':
				result = this.execute_keyword_progress([['s', 'cons'], ['t', 'cont']]);
				break;
			case 'cons':
				result = this.execute_keyword_progress([['t', 'const']]);
				break;
			case 'const':
				result = this.execute_keyword('const');
				break;
			case 'cont':
				result = this.execute_keyword_progress([['i', 'conti']]);
				break;
			case 'conti':
				result = this.execute_keyword_progress([['n', 'contin']]);
				break;
			case 'contin':
				result = this.execute_keyword_progress([['u', 'continu']]);
				break;
			case 'continu':
				result = this.execute_keyword_progress([['e', 'continue']]);
				break;
			case 'continue':
				result = this.execute_keyword('continue');
				break;
			case 'd':
				result = this.execute_keyword_progress([['e', 'de'], ['o', 'do']]);
				break;
			case 'de':
				result = this.execute_keyword_progress([['f', 'def']]);
				break;
			case 'def':
				result = this.execute_keyword_progress([['a', 'defa']]);
				break;
			case 'defa':
				result = this.execute_keyword_progress([['u', 'defau']]);
				break;
			case 'defau':
				result = this.execute_keyword_progress([['l', 'defaul']]);
				break;
			case 'defaul':
				result = this.execute_keyword_progress([['t', 'default']]);
				break;
			case 'default':
				result = this.execute_keyword('default');
				break;
			case 'do':
				result = this.execute_keyword('do', [['u', 'dou']]);
				break;
			case 'dou':
				result = this.execute_keyword_progress([['b', 'doub']]);
				break;
			case 'doub':
				result = this.execute_keyword_progress([['l', 'doubl']]);
				break;
			case 'doubl':
				result = this.execute_keyword_progress([['e', 'double']]);
				break;
			case 'double':
				result = this.execute_keyword('double');
				break;
			case 'e':
				result = this.execute_keyword_progress([['l', 'el'], ['n', 'en'], ['x', 'ex']]);
				break;
			case 'el':
				result = this.execute_keyword_progress([['s', 'els']]);
				break;
			case 'els':
				result = this.execute_keyword_progress([['e', 'else']]);
				break;
			case 'else':
				result = this.execute_keyword('else');
				break;
			case 'en':
				result = this.execute_keyword_progress([['u', 'enu']]);
				break;
			case 'enu':
				result = this.execute_keyword_progress([['m', 'enum']]);
				break;
			case 'enum':
				result = this.execute_keyword('enum');
				break;
			case 'ex':
				result = this.execute_keyword_progress([['t', 'ext']]);
				break;
			case 'ext':
				result = this.execute_keyword_progress([['e', 'exte']]);
				break;
			case 'exte':
				result = this.execute_keyword_progress([['r', 'exter']]);
				break;
			case 'exter':
				result = this.execute_keyword_progress([['n', 'extern']]);
				break;
			case 'extern':
				result = this.execute_keyword('extern');
				break;
			case 'f':
				result = this.execute_keyword_progress([['l', 'fl'], ['o', 'fo']]);
				break;
			case 'fl':
				result = this.execute_keyword_progress([['o', 'flo']]);
				break;
			case 'flo':
				result = this.execute_keyword_progress([['a', 'floa']]);
				break;
			case 'floa':
				result = this.execute_keyword_progress([['t', 'float']]);
				break;
			case 'float':
				result = this.execute_keyword('float');
				break;
			case 'fo':
				result = this.execute_keyword_progress([['r', 'for']]);
				break;
			case 'for':
				result = this.execute_keyword('for');
				break;
			case 'g':
				result = this.execute_keyword_progress([['o', 'go']]);
				break;
			case 'go':
				result = this.execute_keyword_progress([['t', 'got']]);
				break;
			case 'got':
				result = this.execute_keyword_progress([['o', 'goto']]);
				break;
			case 'goto':
				result = this.execute_keyword('goto');
				break;
			case 'i':
				result = this.execute_keyword_progress([['f', 'if'], ['n', 'in']]);
				break;
			case 'if':
				result = this.execute_keyword('if');
				break;
			case 'in':
				result = this.execute_keyword_progress([['l', 'inl'], ['t', 'int']]);
				break;
			case 'inl':
				result = this.execute_keyword_progress([['i', 'inli']]);
				break;
			case 'inli':
				result = this.execute_keyword_progress([['n', 'inlin']]);
				break;
			case 'inlin':
				result = this.execute_keyword_progress([['e', 'inline']]);
				break;
			case 'inline':
				result = this.execute_keyword('inline');
				break;
			case 'int':
				result = this.execute_keyword('int');
				break;
			case 'l':
				result = this.execute_keyword_progress([['o', 'lo']]);
				break;
			case 'lo':
				result = this.execute_keyword_progress([['n', 'lon']]);
				break;
			case 'lon':
				result = this.execute_keyword_progress([['g', 'long']]);
				break;
			case 'long':
				result = this.execute_keyword('long');
				break;
			case 'r':
				result = this.execute_keyword_progress([['e', 're']]);
				break;
			case 're':
				result = this.execute_keyword_progress([['g', 'reg'], ['s', 'res'], ['t', 'ret']]);
				break;
			case 'reg':
				result = this.execute_keyword_progress([['i', 'regi']]);
				break;
			case 'regi':
				result = this.execute_keyword_progress([['s', 'regis']]);
				break;
			case 'regis':
				result = this.execute_keyword_progress([['t', 'regist']]);
				break;
			case 'regist':
				result = this.execute_keyword_progress([['e', 'registe']]);
				break;
			case 'registe':
				result = this.execute_keyword_progress([['r', 'register']]);
				break;
			case 'register':
				result = this.execute_keyword('register');
				break;
			case 'res':
				result = this.execute_keyword_progress([['t', 'rest']]);
				break;
			case 'rest':
				result = this.execute_keyword_progress([['r', 'restr']]);
				break;
			case 'restr':
				result = this.execute_keyword_progress([['i', 'restri']]);
				break;
			case 'restri':
				result = this.execute_keyword_progress([['c', 'restric']]);
				break;
			case 'restric':
				result = this.execute_keyword_progress([['t', 'restrict']]);
				break;
			case 'restrict':
				result = this.execute_keyword('restrict');
				break;
			case 'ret':
				result = this.execute_keyword_progress([['u', 'retu']]);
				break;
			case 'retu':
				result = this.execute_keyword_progress([['r', 'retur']]);
				break;
			case 'retur':
				result = this.execute_keyword_progress([['n', 'return']]);
				break;
			case 'return':
				result = this.execute_keyword('return');
				break;
			case 's':
				result = this.execute_keyword_progress([['h', 'sh'], ['i', 'si'], ['t', 'st'], ['w', 'sw']]);
				break;
			case 'sh':
				result = this.execute_keyword_progress([['o', 'sho']]);
				break;
			case 'sho':
				result = this.execute_keyword_progress([['r', 'shor']]);
				break;
			case 'shor':
				result = this.execute_keyword_progress([['t', 'short']]);
				break;
			case 'short':
				result = this.execute_keyword('short');
				break;
			case 'si':
				result = this.execute_keyword_progress([['g', 'sig'], ['z', 'siz']]);
				break;
			case 'sig':
				result = this.execute_keyword_progress([['n', 'sign']]);
				break;
			case 'sign':
				result = this.execute_keyword_progress([['e', 'signe']]);
				break;
			case 'signe':
				result = this.execute_keyword_progress([['d', 'signed']]);
				break;
			case 'signed':
				result = this.execute_keyword('signed');
				break;
			case 'siz':
				result = this.execute_keyword_progress([['e', 'size']]);
				break;
			case 'size':
				result = this.execute_keyword_progress([['o', 'sizeo']]);
				break;
			case 'sizeo':
				result = this.execute_keyword_progress([['f', 'sizeof']]);
				break;
			case 'sizeof':
				result = this.execute_keyword('sizeof');
				break;
			case 'st':
				result = this.execute_keyword_progress([['a', 'sta'], ['r', 'str']]);
				break;
			case 'sta':
				result = this.execute_keyword_progress([['t', 'stat']]);
				break;
			case 'stat':
				result = this.execute_keyword_progress([['i', 'stati']]);
				break;
			case 'stati':
				result = this.execute_keyword_progress([['c', 'static']]);
				break;
			case 'static':
				result = this.execute_keyword('static');
				break;
			case 'str':
				result = this.execute_keyword_progress([['u', 'stru']]);
				break;
			case 'stru':
				result = this.execute_keyword_progress([['c', 'struc']]);
				break;
			case 'struc':
				result = this.execute_keyword_progress([['t', 'struct']]);
				break;
			case 'struct':
				result = this.execute_keyword('struct');
				break;
			case 'sw':
				result = this.execute_keyword_progress([['i', 'swi']]);
				break;
			case 'swi':
				result = this.execute_keyword_progress([['t', 'swit']]);
				break;
			case 'swit':
				result = this.execute_keyword_progress([['c', 'switc']]);
				break;
			case 'switc':
				result = this.execute_keyword_progress([['h', 'switch']]);
				break;
			case 'switch':
				result = this.execute_keyword('switch');
				break;
			case 't':
				result = this.execute_keyword_progress([['y', 'ty']]);
				break;
			case 'ty':
				result = this.execute_keyword_progress([['p', 'typ']]);
				break;
			case 'typ':
				result = this.execute_keyword_progress([['e', 'type']]);
				break;
			case 'type':
				result = this.execute_keyword_progress([['d', 'typed']]);
				break;
			case 'typed':
				result = this.execute_keyword_progress([['e', 'typede']]);
				break;
			case 'typede':
				result = this.execute_keyword_progress([['f', 'typedef']]);
				break;
			case 'typedef':
				result = this.execute_keyword('typedef');
				break;
			case 'u':
				result = this.execute_keyword_progress([['n', 'un']]);
				break;
			case 'un':
				result = this.execute_keyword_progress([['i', 'uni'], ['s', 'uns']]);
				break;
			case 'uni':
				result = this.execute_keyword_progress([['o', 'unio']]);
				break;
			case 'unio':
				result = this.execute_keyword_progress([['n', 'union']]);
				break;
			case 'union':
				result = this.execute_keyword('union');
				break;
			case 'uns':
				result = this.execute_keyword_progress([['i', 'unsi']]);
				break;
			case 'unsi':
				result = this.execute_keyword_progress([['g', 'unsig']]);
				break;
			case 'unsig':
				result = this.execute_keyword_progress([['n', 'unsign']]);
				break;
			case 'unsign':
				result = this.execute_keyword_progress([['e', 'unsigne']]);
				break;
			case 'unsigne':
				result = this.execute_keyword_progress([['d', 'unsigned']]);
				break;
			case 'unsigned':
				result = this.execute_keyword('unsigned');
				break;
			case 'v':
				result = this.execute_keyword_progress([['o', 'vo']]);
				break;
			case 'vo':
				result = this.execute_keyword_progress([['i', 'voi'], ['l', 'vol']]);
				break;
			case 'voi':
				result = this.execute_keyword_progress([['d', 'void']]);
				break;
			case 'void':
				result = this.execute_keyword('void');
				break;
			case 'vol':
				result = this.execute_keyword_progress([['a', 'vola']]);
				break;
			case 'vola':
				result = this.execute_keyword_progress([['t', 'volat']]);
				break;
			case 'volat':
				result = this.execute_keyword_progress([['i', 'volati']]);
				break;
			case 'volati':
				result = this.execute_keyword_progress([['l', 'volatil']]);
				break;
			case 'volatil':
				result = this.execute_keyword_progress([['e', 'volatile']]);
				break;
			case 'volatile':
				result = this.execute_keyword('volatile');
				break;
			case 'w':
				result = this.execute_keyword_progress([['h', 'wh']]);
				break;
			case 'wh':
				result = this.execute_keyword_progress([['i', 'whi']]);
				break;
			case 'whi':
				result = this.execute_keyword_progress([['l', 'whil']]);
				break;
			case 'whil':
				result = this.execute_keyword_progress([['e', 'while']]);
				break;
			case 'while':
				result = this.execute_keyword('while');
				break;
			case '_':
				result = this.execute_keyword_progress([['B', '_B'], ['C', '_C'], ['I', '_I']]);
				break;
			case '_B':
				result = this.execute_keyword_progress([['o', '_Bo']]);
				break;
			case '_Bo':
				result = this.execute_keyword_progress([['o', '_Boo']]);
				break;
			case '_Boo':
				result = this.execute_keyword_progress([['l', '_Bool']]);
				break;
			case '_Bool':
				result = this.execute_keyword('_Bool');
				break;
			case '_C':
				result = this.execute_keyword_progress([['o', '_Co']]);
				break;
			case '_Co':
				result = this.execute_keyword_progress([['m', '_Com']]);
				break;
			case '_Com':
				result = this.execute_keyword_progress([['p', '_Comp']]);
				break;
			case '_Comp':
				result = this.execute_keyword_progress([['l', '_Compl']]);
				break;
			case '_Compl':
				result = this.execute_keyword_progress([['e', '_Comple']]);
				break;
			case '_Comple':
				result = this.execute_keyword_progress([['x', '_Complex']]);
				break;
			case '_Complex':
				result = this.execute_keyword('_Complex');
				break;
			case '_I':
				result = this.execute_keyword_progress([['m', '_Im']]);
				break;
			case '_Im':
				result = this.execute_keyword_progress([['a', '_Ima']]);
				break;
			case '_Ima':
				result = this.execute_keyword_progress([['g', '_Imag']]);
				break;
			case '_Imag':
				result = this.execute_keyword_progress([['i', '_Imagi']]);
				break;
			case '_Imagi':
				result = this.execute_keyword_progress([['n', '_Imagin']]);
				break;
			case '_Imagin':
				result = this.execute_keyword_progress([['a', '_Imagina']]);
				break;
			case '_Imagina':
				result = this.execute_keyword_progress([['r', '_Imaginar']]);
				break;
			case '_Imaginar':
				result = this.execute_keyword_progress([['y', '_Imaginary']]);
				break;
			case '_Imaginary':
				result = this.execute_keyword('_Imaginary');
				break;
				/*
			case '\\':
				result = this.execute_bslash();
				break;
				*/

			default:
				result = false;
				break;
		}

		return result;
	}

	private execute_init() : boolean {
		let result : boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'EOF';
			this.state = '@end';
			result = true;
		} else {
			// 1文字目
			switch (this.text[this.pos]) {
				case 'a':
					this.state = 'a';	// state trans => a
					// result = false;	// 解析継続
					break;
				case 'b':
					this.state = 'b';	// state trans => b
					// result = false;	// 解析継続
					break;
				case 'c':
					this.state = 'c';	// state trans => c
					// result = false;	// 解析継続
					break;
				case 'd':
					this.state = 'd';	// state trans => d
					// result = false;	// 解析継続
					break;
				case 'e':
					this.state = 'e';	// state trans => e
					// result = false;	// 解析継続
					break;
				case 'f':
					this.state = 'f';	// state trans => f
					// result = false;	// 解析継続
					break;
				case 'g':
					this.state = 'g';	// state trans => g
					// result = false;	// 解析継続
					break;
				case 'i':
					this.state = 'i';	// state trans => i
					// result = false;	// 解析継続
					break;
				case 'l':
					this.state = 'l';	// state trans => l
					// result = false;	// 解析継続
					break;
				case 'r':
					this.state = 'r';	// state trans => r
					// result = false;	// 解析継続
					break;
				case 's':
					this.state = 's';	// state trans => s
					// result = false;	// 解析継続
					break;
				case 't':
					this.state = 't';	// state trans => t
					// result = false;	// 解析継続
					break;
				case 'u':
					this.state = 'u';	// state trans => u
					// result = false;	// 解析継続
					break;
				case 'v':
					this.state = 'v';	// state trans => v
					// result = false;	// 解析継続
					break;
				case 'w':
					this.state = 'w';	// state trans => w
					// result = false;	// 解析継続
					break;
				case '_':
					this.state = 'w';	// state trans => _
					// result = false;	// 解析継続
					break;
				case '0':
					this.state = '0';	// state trans => 0
					// result = false;	// 解析継続
					break;
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
				case '.':
					this.state = '@pp-number';	// state trans => 0
					// result = false;	// 解析継続
					break;
				case '\\':
					this.state = '\\';	// state trans => \
					// result = false;	// 解析継続
					break;
				case '\r':
					this.state = '@NEWLINE';	// state trans => \r
					// result = false;	// 解析継続
					break;
				case '\n':
					// '\n'は改行確定
					this.id = 'NEWLINE';
					result = true;
					break;
				case ' ':
				case '\t':
				case '\v':
				case '\f':
					this.state = '@WHITESPACE';	// state trans => 空白文字
					// result = false;	// 解析継続
					break;
			}

			this.forward_pos();

		}


		return result;
	}

	/**
	 * 'a'から始まるtokenの解析
	 * @param text 
	 * @param pos 
	 */
	private execute_a(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'identifier';
			result = true;
		} else {
			// posから3文字を取得する
			// 'uto'であれば'auto'を候補として次の解析へ
			// 'uto'でない(文字列長不足を含む)ならばidentifierとして次の解析へ
			[subst_str, subst_len] = this.get_ahead(3);

			if (subst_str == "uto") {
				this.state = 'auto';
				this.forward_pos(subst_len);
			} else {
				this.state = '@identifier';
			}
		}

		return result;
	}

	/**
	 * 'b'から始まるtokenの解析
	 * @param text 
	 * @param pos 
	 */
	private execute_b(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'identifier';
			result = true;
		} else {
			// posから4文字を取得する
			// 'reak'であれば'break'を候補として次の解析へ
			// 'reak'でない(文字列長不足を含む)ならばidentifierとして次の解析へ
			[subst_str, subst_len] = this.get_ahead(4);

			if (subst_str == "reak") {
				this.state = 'break';
				this.forward_pos(subst_len);
			} else {
				this.state = '@identifier';
			}
		}

		return result;
	}

	/**
	 * 'c'から始まるtokenの解析
	 * @param text 
	 * @param pos 
	 */
	private execute_c(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'identifier';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			switch (char) {
				case 'a':
					this.state = 'ca';
					this.forward_pos();
					break;
				case 'h':
					this.state = 'ch';
					this.forward_pos();
					break;
				case 'o':
					this.state = 'co';
					this.forward_pos();
					break;
				default:
					this.state = '@identifier';
					break;
			}
		}

		return result;
	}

	/**
	 * 'ca'から始まるtokenの解析
	 * @param text 
	 * @param pos 
	 */
	private execute_ca(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'identifier';
			result = true;
		} else {
			// posから2文字を取得する
			// 'se'であれば'case'を候補として次の解析へ
			// 'se'でない(文字列長不足を含む)ならばidentifierとして次の解析へ
			[subst_str, subst_len] = this.get_ahead(2);

			if (subst_str == "se") {
				this.state = 'case';
				this.forward_pos(subst_len);
			} else {
				this.state = '@identifier';
			}
		}

		return result;
	}

	/**
	 * 'ch'から始まるtokenの解析
	 * @param text 
	 * @param pos 
	 */
	private execute_ch(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'identifier';
			result = true;
		} else {
			// posから2文字を取得する
			// 'ar'であれば'char'を候補として次の解析へ
			// 'ar'でない(文字列長不足を含む)ならばidentifierとして次の解析へ
			[subst_str, subst_len] = this.get_ahead(2);

			if (subst_str == "ar") {
				this.state = 'char';
				this.forward_pos(subst_len);
			} else {
				this.state = '@identifier';
			}
		}

		return result;
	}

	/**
	 * 'co'から始まるtokenの解析
	 * @param text 
	 * @param pos 
	 */
	private execute_co(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'identifier';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 'n'であれば'con'を候補として次の解析へ
			// 'n'でない(文字列長不足を含む)ならばidentifierとして次の解析へ

			if (char == "n") {
				this.state = 'con';
				this.forward_pos();
			} else {
				this.state = '@identifier';
			}
		}

		return result;
	}

	/**
	 * keyword解析(1～N-1文字目まで)
	 * 次にkeywordとして期待する文字が来たらkeyword解析を継続する
	 */
	private execute_keyword_progress(exp_info: [string, lexer_state][]): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'identifier';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			// 引数で指定された期待文字かチェック
			// マッチしなかった場合はidentifierの解析へ遷移
			let exp_char: string;
			let state: lexer_state;
			let match: boolean;
			match = false;
			for ([exp_char, state] of exp_info) {
				if (char == exp_char) {
					this.state = state;
					this.forward_pos();
					match = true;
					break;
				}
			}
			// 期待文字ではなかった
			if (!match) {
				this.state = '@identifier';
			}
		}

		return result;
	}

	/**
	 * keyword解析(N文字目)
	 * 次に区切り文字が来たらkeywordが決定する。
	 * 解析済み字句が別のkeywordにつながるときはexp_infoを指定する。
	 * exp_infoが指定されたとき、keywordとして期待する文字が来たらkeyword解析を継続する。
	 * (例：入力が'do'のとき、区切り文字が来たら'do'確定、'double'と続けば別のkeywordになる)
	 * @param id 
	 * @param exp_info
	 */
	private execute_keyword(id: token_id, exp_info?: [string, lexer_state][]): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = id;
			this.is_keyword = true;
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			// 区切り文字であればtoken取得完了
			// 区切り文字でなければidentifierの解析になる
			let char: string;
			char = this.text[this.pos];
			if (this.regex_punctuator.test(char)) {
				this.id = id;
				this.is_keyword = true;
				this.state = '@end';
				result = true;
			} else {
				// exp_infoが指定されたときは次のkeyword解析へ
				// 指定されなかったときはidentifier解析へ
				if (exp_info) {
					result = this.execute_keyword_progress(exp_info);
				} else {
					this.state = '@identifier';
					this.forward_pos();
				}
			}
		}

		return result;
	}

	private execute_identifier(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'identifier';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			// identifier-digit/nondigitであれば継続
			// universal-character-nameであれば継続
			// 上記以外で解析完了
			let char: string;
			char = this.text[this.pos];

			if (this.regex_identifier_digit_nondigit.test(char)) {
				this.forward_pos();
			} else {
				if (char == '\\') {
					this.state = '@univ_char_name';
					this.forward_pos();
				} else {
					this.state = '@end';
					this.id = 'identifier';
					result = true;
				}
			}

		}

		return result;
	}

	/**
	 * identifier解析のコンテキストの中で'\'を見つけたときにこの状態に遷移する。
	 */
	private execute_univ_char_name(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			// '\'で終了時は文法エラー
			this.id = 'identifier';
			this.commit_err(this.pos - 1, 'univ_char_name');
			result = true;
		} else {
			// 次の文字を取得
			// identifier-digit/nondigitであれば継続
			// universal-character-nameであれば継続
			// 上記以外で解析完了
			let char: string;
			char = this.text[this.pos];

			if (char == 'u') {
				this.forward_pos();
				// '\u'にはhex-quad(4バイト)が続く
				[subst_str, subst_len] = this.get_ahead(4);
				if (subst_str.match(/[0-9a-fA-F]{4,4}/)) {
					this.state = '@identifier';
					this.forward_pos(subst_len);
				} else {
					// 文法エラー：'\u'にhex-quadが4つ続かない
					this.state = '@identifier';
					this.commit_err(this.pos - 2, 'univ_char_name');
				}
			} else if (char == 'U') {
				this.forward_pos();
				// '\U'にはhex-quad(4バイト)*2が続く
				[subst_str, subst_len] = this.get_ahead(8);
				if (subst_str.match(/[0-9a-fA-F]{8,8}/)) {
					this.state = '@identifier';
					this.forward_pos(subst_len);
				} else {
					// 文法エラー：'\u'にhex-quadが8つ続かない
					this.state = '@identifier';
					this.commit_err(this.pos - 2, 'univ_char_name');
				}
			} else {
				// 文法エラー：'\'にuまたはUが続かない
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'univ_char_name');
			}
		}

		return result;
	}

	private execute_newline(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			// 何もしない
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			// '\r\n'は1改行として扱う
			if (char == '\n') {
				this.forward_pos();
			}
		}

		this.id = 'NEWLINE';
		result = true;

		return result;
	}

	private execute_whitespace(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'WHITESPACE';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			// 複数の空白文字はまとめて1つとする。
			// 改行は別物として扱う。
			let char: string;
			char = this.text[this.pos];

			if (char.match( this.regex_white_space )) {
				this.forward_pos();
			} else {
				this.id = 'WHITESPACE';
				this.state = '@end';
				result = true;
			}
		}

		return result;
	}

	/*
	private execute_bslash(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			// '\'で終了時は文法エラー
			this.id = 'ERROR';
			this.state = '@end';
			result = true;
		} else {

		}

		return result;
	}
	*/

	/*
	private execute_(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			// '\'で終了時は文法エラー
			this.id = 'ERROR';
			this.state = '@end';
			result = true;
		} else {

		}

		return result;
	}
	*/

	/**
	 * 指定した文字数lenだけ先読みをする。
	 * 先読みした文字列と先読みできた文字数を返す。
	 * lenがtextの残り文字数より大きいときに残り文字数だけ読みだすことになる。
	 * @param len 
	 */
	private get_ahead(len:number) : [string, number] {
		// text文字列長を超える場合はリミットをかける
		if ((this.pos + len) > this.text.length) {
			this.ahead_len = this.text.length - this.pos;
		}
		// substringを取得
		this.ahead_str = this.text.substring(this.pos, this.pos+this.ahead_len);

		return [this.ahead_str, this.ahead_len];
	}

	/**
	 * 指定した文字数だけposを進める。
	 * @param step 
	 */
	private forward_pos(step:number = 1) {
		// text文字列長を超える場合はリミットをかける
		// 
		if ((this.pos + step) > this.text.length) {
			step = this.text.length - this.pos;
		}
		// posを前進
		this.pos += step;
		// token文字列長を更新
		this.len_count += step;
	}

	/**
	 * token文字列長を登録する。
	 * tokenの終わり、または、改行時に実行する。
	 * lenには行ごとのtoken文字列長が格納される。
	 */
	private commit_len() {
		this.len.push( this.len_count );
		this.len_count = 0;
	}

	/**
	 * 字句解析で構文エラーを検出したとき、検出した箇所を登録する。
	 * エラー発生時も可能であれば解析を継続する。
	 * @param pos_ 
	 * @param err_id_ 
	 */
	private commit_err(pos_: number, err_id_: token_err_id) {
		this.err_info.push({ pos: pos_, err_id: err_id_ });
	}
}
