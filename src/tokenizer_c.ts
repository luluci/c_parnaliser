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
 * 				(identifier)
 * 			character-constant:
 * 				L?'([^'\\\r\n]|\\['"?\\abfnrtv]|\\[0-7]{1,3}|\\x[0-9a-fA-F]+)'
 * 		string-literal:
 * 		punctuator:
 * 			[ ] ( ) { } . ->
 * 			++ -- & * + - ~ !
 * 			/ % << >> < > <= >= == != ^ | && ||
 * 			? : ; ...
 * 			= *= /= %= += -= <<= >>= &= ^= |=
 * 			, # ##
 * 			<: :> <% %> %: %:%:
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

import * as c_token_id from './token_id';
import { token_err_id } from './token_err_id';
import { tokenizer, token_error_info} from './tokenizer';

/**
 * '@'から始まる状態はkeyword以外のtokenを示す
 * '@'から始まらない状態はkeyword解析途中の出現した文字までを示す
 */
type lexer_state =
	| '@init'						// 初期状態
	| '@end'						// 終了状態
	| '@identifier'					// identifier解析状態
	| '@decimal_constant'			// decimal-constant解析状態
	| '@octal_constant'				// octal-constant解析状態
	| '@hex_constant'				// hexadecimal-constant解析状態
	| '@hex_constant_digit'			// hexadecimal-constant/hexadecimal-digit解析状態
	| '@int_suffix'					// int-suffix解析状態
	| '@unsigned_suffix'			// int-suffix/unsigned-suffix解析状態
	| '@long_suffix'				// int-suffix/long(-long)-suffix解析状態
	| '@fractional_constant'		// fractional-constant解析状態
	| '@exponent_part'				// exponent-part解析状態
	| '@exponent_part_digit'		// exponent-part/digit-sequence解析状態
	| '@hex_fractional_constant'	// hexadecimal-fractional-constant解析状態
	| '@binary_exponent_part'		// binary-exponent-part解析状態
	| '@binary_exponent_part_digit'	// binary-exponent-part/digit-sequence解析状態
	| '@float_suffix'				// floating-constant解析状態
	| '@any_fractional_constant'	// (hexadecimal-)fractional-constant解析状態
	| '@char_constant_begin'		// character-constant(1文字目)解析状態
	| '@char_constant'				// character-constant解析状態
	| '@c_char_sequence'			// c-char-sequence解析状態
	| '@string_literal'				// string-literal解析状態
	| '@NEWLINE'					// 改行
	| '@WHITESPACE'					// 空白
	| '@COMMENT_1LINE'				// コメント：1行
	| '@COMMENT_MULTILINE'			// コメント：複数行
	| 'a'							// a
	| 'au'							// au
	| 'aut'							// aut
	| 'auto'						// auto
	| 'b'							// b
	| 'br'							// br
	| 'bre'							// bre
	| 'brea'						// brea
	| 'break'						// break
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
	| 'fa'
	| 'far'
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
	| 'L'
	| 'n'
	| 'ne'
	| 'nea'
	| 'near'
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
	| '__'
	| '__f'
	| '__fa'
	| '__far'
	| '__n'
	| '__ne'
	| '__nea'
	| '__near'
	| '0'
	| '.'
	| '-'
	| '+'
	| '&'
	| '*'
	| '~'
	| '!'
	| '/'
	| '%'
	| '<'
	| '>'
	| '='
	| '^'
	| '|'
	| '?'
	| ':'
	| ';'
	| ','
	| '#'
	| '\''
	| '"'
	// PP-directive
	| 'pp_i'
	| 'pp_if'
	| 'pp_ifd'
	| 'pp_ifde'
	| 'pp_ifdef'
	| 'pp_ifn'
	| 'pp_ifnd'
	| 'pp_ifnde'
	| 'pp_ifndef'
	| 'pp_in'
	| 'pp_inc'
	| 'pp_incl'
	| 'pp_inclu'
	| 'pp_includ'
	| 'pp_include'
	| 'pp_e'
	| 'pp_el'
	| 'pp_eli'
	| 'pp_elif'
	| 'pp_els'
	| 'pp_else'
	| 'pp_en'
	| 'pp_end'
	| 'pp_endi'
	| 'pp_endif'
	| 'pp_er'
	| 'pp_err'
	| 'pp_erro'
	| 'pp_error'
	| 'pp_d'
	| 'pp_de'
	| 'pp_def'
	| 'pp_defi'
	| 'pp_defin'
	| 'pp_define'
	| 'pp_u'
	| 'pp_un'
	| 'pp_und'
	| 'pp_unde'
	| 'pp_undef'
	| 'pp_l'
	| 'pp_li'
	| 'pp_lin'
	| 'pp_line'
	| 'pp_p'
	| 'pp_pr'
	| 'pp_pra'
	| 'pp_prag'
	| 'pp_pragm'
	| 'pp_pragma'
	| '@pp_invalid_keyword'		// 未定義keyword検出
	| '@pp_token'				// pp_token
	| '\0';

export class token_error_info_c implements token_error_info {
	pos: number;
	err_id: token_err_id;

	constructor() {
		this.pos = 0;
		this.err_id = 'null';
	}
}

export type token_id = c_token_id.token_id;
export type token_sub_id = c_token_id.token_sub_id;

export class tokenizer_c implements tokenizer<token_id, token_sub_id> {
	// base class I/F
	text: string;
	len: number[];
	pos: number;
	pos_begin: number;
	pos_end: number;
	err_info: token_error_info[];
	// addtitional
	len_count: number;
	id: token_id;						// tokenの意味を示すID
	sub_id: token_sub_id;				// IDを細分化するサブID
	state : lexer_state;
	is_keyword: boolean;
	is_eof : boolean;
	// RegExp 
	regex_punctuator:RegExp;
	regex_identifier_digit_nondigit:RegExp;
	regex_white_space: RegExp;
	regex_non_digit: RegExp;
	regex_digit: RegExp;
	regex_octal_digit: RegExp;
	regex_non_octal_digit: RegExp;
	regex_hex_digit: RegExp;
	regex_int_suffix: RegExp;
	regex_float_suffix: RegExp;
	regex_simple_escape_seq: RegExp;
	regex_pp_group: RegExp;

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
		this.sub_id = 'null';
		this.is_eof = false;
		this.is_keyword = false;
		this.regex_punctuator = /[\[\](){}.+\-&*~!\/%<>=^|?:;,#\r\n\s\t]/;
		this.regex_identifier_digit_nondigit = /[0-9a-zA-Z_]/;
		this.regex_white_space = /[ \t\v\f]/;
		this.regex_non_digit = /[_a-zA-Z]/;
		this.regex_digit = /[0-9]/;
		this.regex_octal_digit = /[0-7]/;
		this.regex_non_octal_digit = /[8-9]/;
		this.regex_hex_digit = /[0-9a-fA-F]/;
		this.regex_int_suffix = /[uUlL]/;
		this.regex_float_suffix = /[flFL]/;
		this.regex_simple_escape_seq = /['"?\\abfnrtv]/;
		this.regex_pp_group = /^(if|ifdef|ifndef|elif|else|endif|include|define|undef|line|error|pragma)/;

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
		this.sub_id = 'null';
		this.pos_begin = this.pos;
		this.len.splice(0);
		this.len_count = 0;
		this.err_info.splice(0);
		this.is_keyword = false;
		// state check
		// 終端まで解析できていれば@initから再開する。
		// PPはシーケンスで解析する。
		if (this.state == '@end') {
			this.state = '@init';
		}
	}

	// 未解析,解析データなし
	is_null(): boolean {
		if (this.id == 'null') return true;
		else return false;
	}
	// 改行検出
	is_newline(): boolean {
		if (this.id == 'NEWLINE') return true;
		else return false;
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
			case '@end':
				result = true;
				break;
			case '@init':
				result = this.execute_init();
				break;
			case '@identifier':
				result = this.execute_identifier();
				break;
			case '@decimal_constant':
				result = this.execute_decimal_constant();
				break;
			case '@octal_constant':
				result = this.execute_octal_constant();
				break;
			case '@hex_constant':
				result = this.execute_hex_constant();
				break;
			case '@hex_constant_digit':
				result = this.execute_hex_constant_digit();
				break;
			case '@int_suffix':
				result = this.execute_int_suffix();
				break;
			case '@long_suffix':
				result = this.execute_long_suffix();
				break;
			case '@unsigned_suffix':
				result = this.execute_unsigned_suffix();
				break;
			case '@fractional_constant':
				result = this.execute_fractional_constant();
				break;
			case '@exponent_part':
				result = this.execute_exponent_part();
				break;
			case '@exponent_part_digit':
				result = this.execute_exponent_part_digit();
				break;
			case '@hex_fractional_constant':
				result = this.execute_hex_fractional_constant();
				break;
			case '@binary_exponent_part':
				result = this.execute_binary_exponent_part();
				break;
			case '@binary_exponent_part_digit':
				result = this.execute_binary_exponent_part_digit();
				break;
			case '@any_fractional_constant':
				result = this.execute_any_fractional_constant();
				break;
			case '@char_constant_begin':
				result = this.execute_char_constant_begin();
				break;
			case '@char_constant':
				result = this.execute_char_constant();
				break;
			/*
			case '@c_char_sequence':
				result = this.execute_c_char_sequence();
				break;
			*/
			case '@string_literal':
				result = this.execute_string_literal();
				break;
			case '@NEWLINE':
				result = this.execute_newline();
				break;
			case '@WHITESPACE':
				result = this.execute_whitespace();
				break;
			case '@COMMENT_1LINE':
				result = this.execute_comment_1line();
				break;
			case '@COMMENT_MULTILINE':
				result = this.execute_comment_multiline();
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
				result = this.execute_keyword_progress([['l', 'fl'], ['o', 'fo'], ['a', 'fa']]);
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
			case 'fa':
				result = this.execute_keyword_progress([['r', 'far']]);
				break;
			case 'far':
				result = this.execute_keyword('__far');
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
			case 'L':
				result = this.execute_L();
				break;
			case 'n':
				result = this.execute_keyword_progress([['e', 'ne']]);
				break;
			case 'ne':
				result = this.execute_keyword_progress([['a', 'nea']]);
				break;
			case 'nea':
				result = this.execute_keyword_progress([['r', 'near']]);
				break;
			case 'near':
				result = this.execute_keyword('__near');
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
				result = this.execute_keyword_progress([['B', '_B'], ['C', '_C'], ['I', '_I'], ['_', '__']]);
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
			case '__':
				result = this.execute_keyword_progress([['f', '__f'], ['n', '__n']]);
				break;
			case '__f':
				result = this.execute_keyword_progress([['a', '__fa']]);
				break;
			case '__fa':
				result = this.execute_keyword_progress([['r', '__far']]);
				break;
			case '__far':
				result = this.execute_keyword('__far');
				break;
			case '__n':
				result = this.execute_keyword_progress([['e', '__ne']]);
				break;
			case '__ne':
				result = this.execute_keyword_progress([['a', '__nea']]);
				break;
			case '__nea':
				result = this.execute_keyword_progress([['r', '__near']]);
				break;
			case '__near':
				result = this.execute_keyword('__near');
				break;
			case '0':
				result = this.execute_0();
				break;
			case '\'':
				result = this.execute_single_quote();
				break;
			case '"':
				result = this.execute_double_quote();
				break;
			case '.':
				result = this.execute_dot();
				break;
			case '-':
				result = this.execute_minus();
				break;
			case '+':
				result = this.execute_plus();
				break;
			case '&':
				result = this.execute_ampersand();
				break;
			case '*':
				result = this.execute_asterisk();
				break;
			case '!':
				result = this.execute_exclamation();
				break;
			case '/':
				result = this.execute_slash();
				break;
			case '%':
				result = this.execute_percent();
				break;
			case '<':
				result = this.execute_left_angle_bracket();
				break;
			case '>':
				result = this.execute_right_angle_bracket();
				break;
			case '=':
				result = this.execute_equal();
				break;
			case '^':
				result = this.execute_caret();
				break;
			case '|':
				result = this.execute_vertical_bar();
				break;
			case ':':
				result = this.execute_colon();
				break;

			// PP-directive
			case '#':
				result = this.execute_sharp();
				break;
			case 'pp_i':
				result = this.execute_pp_keyword_progress([['f', 'pp_if'], ['n', 'pp_in']]);
				break;
			case 'pp_if':
				result = this.execute_pp_keyword(['pp_if', '@pp_token'], [['d', 'pp_ifd'], ['n', 'pp_ifn']]);
				break;
			case 'pp_ifd':
				result = this.execute_pp_keyword_progress([['e', 'pp_ifde']]);
				break;
			case 'pp_ifde':
				result = this.execute_pp_keyword_progress([['f', 'pp_ifdef']]);
				break;
			case 'pp_ifdef':
				result = this.execute_pp_keyword(['pp_ifdef', '@pp_token']);
				break;
			case 'pp_ifn':
				result = this.execute_pp_keyword_progress([['d', 'pp_ifnd']]);
				break;
			case 'pp_ifnd':
				result = this.execute_pp_keyword_progress([['e', 'pp_ifnde']]);
				break;
			case 'pp_ifnde':
				result = this.execute_pp_keyword_progress([['f', 'pp_ifndef']]);
				break;
			case 'pp_ifndef':
				result = this.execute_pp_keyword(['pp_ifndef', '@pp_token']);
				break;
			case 'pp_in':
				result = this.execute_pp_keyword_progress([['c', 'pp_inc']]);
				break;
			case 'pp_inc':
				result = this.execute_pp_keyword_progress([['l', 'pp_incl']]);
				break;
			case 'pp_incl':
				result = this.execute_pp_keyword_progress([['u', 'pp_inclu']]);
				break;
			case 'pp_inclu':
				result = this.execute_pp_keyword_progress([['d', 'pp_includ']]);
				break;
			case 'pp_includ':
				result = this.execute_pp_keyword_progress([['e', 'pp_include']]);
				break;
			case 'pp_include':
				result = this.execute_pp_keyword(['pp_include', '@pp_token']);
				break;
			case 'pp_e':
				result = this.execute_pp_keyword_progress([['l', 'pp_el'], ['n', 'pp_en'], ['r', 'pp_er']]);
				break;
			case 'pp_el':
				result = this.execute_pp_keyword_progress([['i', 'pp_eli'], ['s', 'pp_els']]);
				break;
			case 'pp_eli':
				result = this.execute_pp_keyword_progress([['f', 'pp_elif']]);
				break;
			case 'pp_elif':
				result = this.execute_pp_keyword(['pp_elif', '@pp_token']);
				break;
			case 'pp_els':
				result = this.execute_pp_keyword_progress([['e', 'pp_else']]);
				break;
			case 'pp_else':
				result = this.execute_pp_keyword(['pp_else', '@pp_token']);
				break;
			case 'pp_en':
				result = this.execute_pp_keyword_progress([['d', 'pp_end']]);
				break;
			case 'pp_end':
				result = this.execute_pp_keyword_progress([['i', 'pp_endi']]);
				break;
			case 'pp_endi':
				result = this.execute_pp_keyword_progress([['f', 'pp_endif']]);
				break;
			case 'pp_endif':
				result = this.execute_pp_keyword(['pp_endif', '@pp_token']);
				break;
			case 'pp_er':
				result = this.execute_pp_keyword_progress([['r', 'pp_err']]);
				break;
			case 'pp_err':
				result = this.execute_pp_keyword_progress([['o', 'pp_erro']]);
				break;
			case 'pp_erro':
				result = this.execute_pp_keyword_progress([['r', 'pp_error']]);
				break;
			case 'pp_error':
				result = this.execute_pp_keyword(['pp_error', '@pp_token']);
				break;
			case 'pp_d':
				result = this.execute_pp_keyword_progress([['e', 'pp_de']]);
				break;
			case 'pp_de':
				result = this.execute_pp_keyword_progress([['f', 'pp_def']]);
				break;
			case 'pp_def':
				result = this.execute_pp_keyword_progress([['i', 'pp_defi']]);
				break;
			case 'pp_defi':
				result = this.execute_pp_keyword_progress([['n', 'pp_defin']]);
				break;
			case 'pp_defin':
				result = this.execute_pp_keyword_progress([['e', 'pp_define']]);
				break;
			case 'pp_define':
				result = this.execute_pp_keyword(['pp_define', '@pp_token']);
				break;
			case 'pp_u':
				result = this.execute_pp_keyword_progress([['n', 'pp_un']]);
				break;
			case 'pp_un':
				result = this.execute_pp_keyword_progress([['d', 'pp_und']]);
				break;
			case 'pp_und':
				result = this.execute_pp_keyword_progress([['e', 'pp_unde']]);
				break;
			case 'pp_unde':
				result = this.execute_pp_keyword_progress([['f', 'pp_undef']]);
				break;
			case 'pp_undef':
				result = this.execute_pp_keyword(['pp_undef', '@pp_token']);
				break;
			case 'pp_l':
				result = this.execute_pp_keyword_progress([['i', 'pp_li']]);
				break;
			case 'pp_li':
				result = this.execute_pp_keyword_progress([['n', 'pp_lin']]);
				break;
			case 'pp_lin':
				result = this.execute_pp_keyword_progress([['e', 'pp_line']]);
				break;
			case 'pp_line':
				result = this.execute_pp_keyword(['pp_line', '@pp_token']);
				break;
			case 'pp_p':
				result = this.execute_pp_keyword_progress([['r', 'pp_pr']]);
				break;
			case 'pp_pr':
				result = this.execute_pp_keyword_progress([['a', 'pp_pra']]);
				break;
			case 'pp_pra':
				result = this.execute_pp_keyword_progress([['g', 'pp_prag']]);
				break;
			case 'pp_prag':
				result = this.execute_pp_keyword_progress([['m', 'pp_pragm']]);
				break;
			case 'pp_pragm':
				result = this.execute_pp_keyword_progress([['a', 'pp_pragma']]);
				break;
			case 'pp_pragma':
				result = this.execute_pp_keyword(['pp_pragma', '@pp_token']);
				break;
			case '@pp_invalid_keyword':
				result = this.execute_pp_invalid_keyword('@pp_token');
				break;
			case '@pp_token':
				result = this.execute_pp_token();
				break;

			default:
				result = false;
				break;
		}

		return result;
	}

	private execute_init() : boolean {
		let char :string;
		let result : boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'EOF';
			this.state = '@end';
			result = true;
		} else {
			// 1文字目
			char = this.text[this.pos];
			switch (char) {
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
				case 'L':
					this.state = 'L';	// state trans => L
					// result = false;	// 解析継続
					break;
				case 'n':
					this.state = 'n';	// state trans => n
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
					this.state = '@decimal_constant';
					// result = false;	// 解析継続
					break;
				case '\'':
					this.state = '\'';	// state trans => '
					// result = false;	// 解析継続
					break;
				case '"':
					this.state = '"';	// state trans => "
					// result = false;	// 解析継続
					break;
				case '\r':
					this.state = '@NEWLINE';	// state trans => \r
					// result = false;	// 解析継続
					break;
				case '\n':
					// '\n'は改行確定
					this.id = 'NEWLINE';
					this.state = '@end';
					result = true;
					break;
				case ' ':
				case '\t':
				case '\v':
				case '\f':
					this.state = '@WHITESPACE';	// state trans => 空白文字
					// result = false;	// 解析継続
					break;
				case '[':
					this.id = 'left_bracket';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case ']':
					this.id = 'right_bracket';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case '(':
					this.id = 'left_paren';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case ')':
					this.id = 'right_paren';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case '{':
					this.id = 'left_brace';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case '}':
					this.id = 'right_brace';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case '.':
					this.state = '.';
					// result = false;	// 解析継続
					break;
				case '-':
					this.state = '-';
					// result = false;	// 解析継続
					break;
				case '+':
					this.state = '+';
					// result = false;	// 解析継続
					break;
				case '&':
					this.state = '&';
					// result = false;	// 解析継続
					break;
				case '*':
					this.state = '*';
					// result = false;	// 解析継続
					break;
				case '~':
					this.id = 'bitwise_complement_op';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case '!':
					this.state = '!';
					// result = false;	// 解析継続
					break;
				case '/':
					this.state = '/';
					// result = false;	// 解析継続
					break;
				case '%':
					this.state = '%';
					// result = false;	// 解析継続
					break;
				case '<':
					this.state = '<';
					// result = false;	// 解析継続
					break;
				case '>':
					this.state = '>';
					// result = false;	// 解析継続
					break;
				case '=':
					this.state = '=';
					// result = false;	// 解析継続
					break;
				case '^':
					this.state = '^';
					// result = false;	// 解析継続
					break;
				case '|':
					this.state = '|';
					// result = false;	// 解析継続
					break;
				case '?':
					this.id = 'conditional_op';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case ':':
					this.state = ':';
					// result = false;	// 解析継続
					break;
				case ';':
					this.id = 'semicolon';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case ',':
					this.id = 'comma';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case '#':
					this.state = '#';
					// result = false;	// 解析継続
					break;
				default:
					if (char.match(this.regex_non_digit)) {
						this.state = '@identifier';
						// result = false;	// 解析継続
					}
					break;
			}

			this.forward_pos();

		}

		return result;
	}

	/**
	 * 'L'から始まるtokenの解析
	 * character-sequence
	 */
	private execute_L(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'identifier';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char == "'") {
				// 'が続けばcharacter-constant解析
				this.state = '@char_constant_begin';
				this.sub_id = 'wide_char';
				this.forward_pos();
			} else if (char == '"') {
				// "が続けばstring-literal解析
				this.state = '@string_literal';
				this.sub_id = 'wide_char';
				this.forward_pos();
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'identifier';
				this.state = '@end';
				result = true;
			} else {
				// 上記以外の文字の場合、identifierに処理を任せる
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
			this.sub_id = 'keyword';
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
				this.sub_id = 'keyword';
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
					// '\'が出現したらuniversal-character-name解析開始
					// チェック関数で一気に取得する
					// 解析エラーが出てもidentifierとして解析継続
					let check : boolean;
					this.forward_pos();
					check = this.check_univ_char_name();
					if (check) {
						// エラー検出時
						// result = false;	// 解析継続
					}
				} else {
					this.id = 'identifier';
					this.state = '@end';
					result = true;
				}
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
		this.state = '@end';
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

/**
 * //から始まるコメントの解析
 */
	private execute_comment_1line(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'COMMENT';
			this.sub_id = '1line';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 改行までがコメントとなる
			switch (char) {
				case '\r':
				case '\n':
					// \r or \n が登場したら解析終了
					// 改行記号の解析は別の処理時で実施
					this.id = 'COMMENT';
					this.sub_id = '1line';
					this.state = '@end';
					result = true;
					break;
				default:
					// 改行以外はすべて受け付ける
					this.forward_pos();
					break;
			}
		}

		return result;
	}

	/**
	 * /*から始まるコメントの解析
	 */
	private execute_comment_multiline(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら終了
			this.id = 'COMMENT';
			this.sub_id = 'multiline';
			this.state = '@end';
			result = true;
			// コメントを閉じずにEOF到達はエラー
			this.commit_err(this.pos - 1, 'multi_comment');
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// */までがコメントとなる
			switch (char) {
				case '\r':
					this.forward_pos();
					// \nまではワンセットとする
					// 1文字先読み(EOFのケアとして先読み関数を使う)
					[subst_str, subst_len] = this.get_ahead(1);
					if (subst_str == "\n") {
						this.forward_pos();
					}
					// 改行を記憶する
					this.commit_len();
					break;
				case '\n':
					this.forward_pos();
					// 改行を記憶する
					this.commit_len();
					break;
				case '*':
					this.forward_pos();
					// */までワンセットで解析
					// 1文字先読み(EOFのケアとして先読み関数を使う)
					[subst_str, subst_len] = this.get_ahead(1);
					if (subst_str == "/") {
						this.forward_pos();
						// */検出で終了
						this.id = 'COMMENT';
						this.sub_id = 'multiline';
						this.state = '@end';
						result = true;
					}
					break;
				default:
					// */以外はすべて受け付ける
					this.forward_pos();
					break;
			}
		}

		return result;
	}

	/**
	 * 'から始まるtokenの解析
	 */
	private execute_single_quote(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら文法エラー
			this.id = 'char_constant';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'char_constant');
		} else {
			// そのままcharacter-constant解析へ遷移
			this.state = '@char_constant_begin';
			this.sub_id = 'char';
		}

		return result;
	}

	/**
	 * "から始まるtokenの解析
	 */
	private execute_double_quote(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら文法エラー
			this.id = 'string_literal';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'string_literal');
		} else {
			// そのままstring-literal解析へ遷移
			this.state = '@string_literal';
			this.sub_id = 'char';
		}

		return result;
	}

	/**
	 * '.'から始まるtokenの解析
	 * fractional-constant or hexadecimal-fractional-constant
	 */
	private execute_dot(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'dot';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char == ".") {
				// 2文字先読み(EOFのケアとして先読み関数を使う)
				[subst_str, subst_len] = this.get_ahead(2);
				if (subst_str == "..") {
					// "..."が出現した場合、区切り文字"..."
					this.forward_pos(2);
					this.id = 'ellipsis';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
				} else {
					// ".."が出現した場合、.単独で区切り文字だったと判断して終了。
					this.id = 'dot';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
				}
			} else if (char.match(this.regex_digit)) {
				// digitが続けばfractional-constant解析
				// 16進数floatは必ず0xから始まるので
				// .から始まる場合は必ず10進数float
				this.state = '@fractional_constant';
			} else {
				// hex-digit以外の文字が出現した場合、
				// .は区切り文字だったと判断して終了。
				this.id = 'dot';
				this.sub_id = 'punctuator';
				this.state = '@end';
				result = true;
			}
		}

		return result;
	}

	/**
	 * '0'から始まるtokenの解析
	 * octal-constant or hexadecimal-constant
	 */
	private execute_0(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'octal_constant';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_octal_digit)) {
				// octal-digitが続けばoctal-constant解析
				this.state = '@octal_constant';
				this.forward_pos();
			} else if (char == "x" || char == "X") {
				// x or X が続けばhexadecimal-constant解析
				this.state = '@hex_constant';
				this.forward_pos();
			} else if (char == ".") {
				// . が続けばfractional-constant解析
				this.state = '@fractional_constant';
				this.forward_pos();
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'octal_constant';
				this.state = '@end';
				result = true;
			} else if (char.match(this.regex_non_octal_digit)) {
				// 文法エラー：non-octal-digitが出現
				this.state = '@octal_constant';
				this.forward_pos();
				this.commit_err(this.pos - 1, 'octal_constant');
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'octal_constant');
			}
		}

		return result;
	}

	/**
	 * octal-constantの解析
	 */
	private execute_octal_constant(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'octal_constant';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_octal_digit)) {
				// octal-digitが続けばoctal-constant解析
				this.state = '@octal_constant';
				this.forward_pos();
			} else if (char == ".") {
				// . が続けばfractional-constant解析
				this.state = '@fractional_constant';
				this.forward_pos();
			} else if (char.match(this.regex_int_suffix)) {
				// int-suffixが続けばtoken区切りに到達することを確認する
				// octal検出からのsuffix解析へ遷移を判定するためにidをセットしておく
				this.id = 'octal_constant';
				this.state = '@int_suffix';
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'octal_constant';
				this.state = '@end';
				result = true;
			} else if (char.match(this.regex_non_octal_digit)) {
				// 文法エラー：non-octal-digitが出現
				this.state = '@octal_constant';
				this.forward_pos();
				this.commit_err(this.pos - 1, 'octal_constant');
			} else {
				// 文法エラー：digit,区切り文字以外が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'octal_constant');
			}
		}

		return result;
	}

	/**
	 * decimal-constantの解析
	 */
	private execute_decimal_constant(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'decimal_constant';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_digit)) {
				// digitが続けばdecimal-constant解析
				this.state = '@decimal_constant';
				this.forward_pos();
			} else if (char == ".") {
				// . が続けばfractional-constant解析へ遷移
				this.state = '@fractional_constant';
				this.forward_pos();
			} else if (char == "e" || char == "E") {
				// e or E が続けばexponent-part解析へ遷移 
				this.state = '@exponent_part';
				this.forward_pos();
			} else if (char.match(this.regex_int_suffix)) {
				// int-suffixが続けばtoken区切りに到達することを確認する
				// decimal検出からのsuffix解析へ遷移を判定するためにidをセットしておく
				this.id = 'decimal_constant';
				this.state = '@int_suffix';
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'decimal_constant';
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'decimal_constant');
			}
		}

		return result;
	}

	/**
	 * hexadecimal-constantの解析
	 * "0x"検出後の1文字目の判定を行う
	 */
	private execute_hex_constant(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら文法エラー
			this.id = 'hex_constant';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'hex_constant');
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_hex_digit)) {
				// hex-digitが続けばhexadecimal-constantのdigit部を解析
				this.state = '@hex_constant_digit';
				this.forward_pos();
			} else if (char == ".") {
				// . が続けばhexadecimal-fractional-constant解析へ遷移
				this.state = '@hex_fractional_constant';
				this.forward_pos();
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'hex_constant');
			}
		}

		return result;
	}

	/**
	 * hexadecimal-constant/hexadecimal-digitの解析
	 * hex-digitを1文字検出したら本状態へ遷移する。
	 */
	private execute_hex_constant_digit(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら終了
			this.id = 'hex_constant';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_hex_digit)) {
				// hex-digitが続けば解析継続
				//this.state = '@hex_constant_digit';
				this.forward_pos();
			} else if (char == ".") {
				// . が続けばhexadecimal-fractional-constant解析へ遷移
				this.state = '@hex_fractional_constant';
				this.forward_pos();
			} else if (char == "p" || char == "P") {
				// p or P が続けばexponent-part解析へ遷移 
				this.state = '@binary_exponent_part';
				this.forward_pos();
			} else if (char.match(this.regex_int_suffix)) {
				// int-suffixが続けばtoken区切りに到達することを確認する
				// hex検出からのsuffix解析へ遷移を判定するためにidをセットしておく
				this.id = 'hex_constant';
				this.state = '@int_suffix';
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'hex_constant';
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'hex_constant');
			}
		}

		return result;
	}

	/**
	 * integer-suffixの解析
	 * posを更新しないで遷移すること。
	 * long-long-suffix検出のために最初から解析する。
	 */
	private execute_int_suffix(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			// 前提条件からこのパスはありえない
			// idは遷移元で設定済み
			//this.id;
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char == "u" || char == "U") {
				// unsigned-suffixが出現したらlong-suffix解析へ遷移
				this.state = '@long_suffix';
				this.forward_pos();
			} else if (char == "l" || char == "L") {
				// long-suffixが出現したらlong-long-suffixをチェックする
				this.sub_id = 'long';
				this.forward_pos();
				// 1文字先読み
				[subst_str, subst_len] = this.get_ahead(1);
				if (subst_str == "l" || "L") {
					// long-long-suffixが出現したら文字を消化して次へ
					this.sub_id = 'long_long';
					this.forward_pos();
				}
				this.state = '@unsigned_suffix';
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				// idは遷移元で設定済み
				//this.id;
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'int_suffix');
			}
		}

		return result;
	}

	/**
	 * long-suffixの解析
	 * unsigned-suffixを検出した後に本状態へ遷移する
	 * unsignedの後ろのlong(-long)-suffixを検出する
	 */
	private execute_long_suffix(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			// idは遷移元で設定済み
			//this.id;
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char == "l" || char == "L") {
				// long-suffixが出現したらlong-long-suffixをチェックする
				this.sub_id = 'unsigned_long';
				this.forward_pos();
				// 1文字先読み
				[subst_str, subst_len] = this.get_ahead(1);
				if (subst_str == "l" || "L") {
					// long-long-suffixが出現したら文字を消化して次へ
					this.sub_id = 'unsigned_long_long';
					this.forward_pos();
				}
				// token終端判定
				let check :boolean;
				check = this.check_token_terminal();
				if (check) {
					// 終端に達していたら正常終了
					this.state = '@end';
					result = true;
				} else {
					// 文法エラー：規定外の文字が続いた
					this.state = '@identifier';
					this.commit_err(this.pos - 1, 'int_suffix');
				}
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				// idは遷移元で設定済み
				//this.id;
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'int_suffix');
			}
		}

		return result;
	}

	/**
	 * unsigned-suffixの解析
	 * long(-long)-suffixを検出した後に本状態へ遷移する
	 * long(-long)の後ろのunsigned-suffixを検出する
	 */
	private execute_unsigned_suffix(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			// idは遷移元で設定済み
			//this.id;
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char == "u" || char == "U") {
				// unsigned-suffixが出現したらtoken終端判定
				if (this.sub_id == 'long') {
					this.sub_id = "unsigned_long";
				} else {
					this.sub_id = 'unsigned_long_long';
				}
				this.forward_pos();
				// token終端判定
				let check: boolean;
				check = this.check_token_terminal();
				if (check) {
					// 終端に達していたら正常終了
					this.state = '@end';
					result = true;
				} else {
					// 文法エラー：規定外の文字が続いた
					this.state = '@identifier';
					this.commit_err(this.pos - 1, 'int_suffix');
				}
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				// idは遷移元で設定済み
				//this.id;
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'int_suffix');
			}
		}

		return result;
	}

	/**
	 * fractional-constantの解析
	 * "."検出後に本状態へ遷移する。
	 */
	private execute_fractional_constant(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら終了
			this.id = 'decimal_float_constant';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_digit)) {
				// digitが続けばfractional-constant解析継続
				// this.state = '@fractional_constant';
				this.forward_pos();
			} else if (char == "e" || char == "E") {
				// e or E が続けばexponent-part解析へ遷移 
				this.state = '@exponent_part';
				this.forward_pos();
			} else if (char.match(this.regex_float_suffix)) {
				// float-suffixが続けばtoken終端判定
				this.id = 'decimal_float_constant'
				this.forward_pos();
				// token終端判定
				let check: boolean;
				check = this.check_token_terminal();
				if (check) {
					// 終端に達していたら正常終了
					this.state = '@end';
					result = true;
				} else {
					// 文法エラー：規定外の文字が続いた
					this.state = '@identifier';
					this.commit_err(this.pos - 1, 'float_suffix');
				}
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'decimal_float_constant';
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'decimal_float_constant');
			}
		}

		return result;
	}

	/**
	 * exponent-partの解析
	 * e,Eが見つかったときに本状態に遷移する。
	 * digitが出現しなかった場合のエラーは本状態内で検出する。
	 */
	private execute_exponent_part(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら文法エラー
			this.id = 'decimal_float_constant';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'float_exponent');
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_digit)) {
				// digitが続けばexponent-part/digit-sequence解析
				this.state = '@exponent_part_digit';
				this.forward_pos();
			} else if (char == "+" || char == "-") {
				// + or - が続けば、この処理内でdigit判定まで実施する 
				this.forward_pos();
				// 1文字先読み(EOFのケアとして先読み関数を使う)
				[subst_str, subst_len] = this.get_ahead(1);
				if (subst_str.match(this.regex_digit)) {
					this.state = '@exponent_part_digit';
					this.forward_pos();
				} else {
					// 文法エラー：digitが出現しなかった
					this.state = '@identifier';
					this.commit_err(this.pos - 1, 'float_exponent');
				}
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'float_exponent');
			}
		}

		return result;
	}

	/**
	 * exponent-part/digit-sequenceの解析
	 * digitの1文字目まで検出してから本状態に遷移する。
	 */
	private execute_exponent_part_digit(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら終了
			this.id = 'decimal_float_constant';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_digit)) {
				// digitが続けば解析継続
				// this.state = '@exponent_part_digit';
				this.forward_pos();
			} else if (char.match(this.regex_float_suffix)) {
				// float-suffixが続けばtoken終端判定
				this.id = 'decimal_float_constant'
				this.forward_pos();
				// token終端判定
				let check: boolean;
				check = this.check_token_terminal();
				if (check) {
					// 終端に達していたら正常終了
					this.state = '@end';
					result = true;
				} else {
					// 文法エラー：規定外の文字が続いた
					this.state = '@identifier';
					this.commit_err(this.pos - 1, 'float_suffix');
				}
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'decimal_float_constant';
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'float_exponent');
			}
		}

		return result;
	}

	/**
	 * hexadecimal-fractional-constantの解析
	 * "."検出後に本状態へ遷移する。
	 */
	private execute_hex_fractional_constant(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら終了
			this.id = 'hex_float_constant';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_hex_digit)) {
				// hex-digitが続けば解析継続
				//this.state = '@hex_fractional_constant';
				this.forward_pos();
			} else if (char == "p" || char == "P") {
				// e or E が続けばbinary-exponent-part解析へ遷移 
				this.state = '@binary_exponent_part';
				this.forward_pos();
			} else if (char.match(this.regex_float_suffix)) {
				// float-suffixが続けばtoken終端判定
				this.id = 'hex_float_constant'
				this.forward_pos();
				// token終端判定
				let check: boolean;
				check = this.check_token_terminal();
				if (check) {
					// 終端に達していたら正常終了
					this.state = '@end';
					result = true;
				} else {
					// 文法エラー：規定外の文字が続いた
					this.state = '@identifier';
					this.commit_err(this.pos - 1, 'float_suffix');
				}
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'hex_float_constant';
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'hex_float_constant');
			}
		}

		return result;
	}

	/**
	 * binary-exponent-partの解析
	 * p,Pが見つかったときに本状態に遷移する。
	 * digitが出現しなかった場合のエラーは本状態内で検出する。
	 */
	private execute_binary_exponent_part(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら文法エラー
			this.id = 'hex_float_constant';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'binary_float_exponent');
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_digit)) {
				// digitが続けばbinary-exponent-part/digit-sequence解析
				this.state = '@binary_exponent_part_digit';
				this.forward_pos();
			} else if (char == "+" || char == "-") {
				// + or - が続けば、この処理内でdigit判定まで実施する 
				this.forward_pos();
				// 1文字先読み(EOFのケアとして先読み関数を使う)
				[subst_str, subst_len] = this.get_ahead(1);
				if (subst_str.match(this.regex_digit)) {
					this.state = '@binary_exponent_part_digit';
					this.forward_pos();
				} else {
					// 文法エラー：digitが出現しなかった
					this.state = '@identifier';
					this.commit_err(this.pos - 1, 'binary_float_exponent');
				}
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'binary_float_exponent');
			}
		}

		return result;
	}

	/**
	 * binary-exponent-part/digit-sequenceの解析
	 * digitの1文字目まで検出してから本状態に遷移する。
	 */
	private execute_binary_exponent_part_digit(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら終了
			this.id = 'hex_float_constant';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_digit)) {
				// digitが続けば解析継続
				// this.state = '@binary_exponent_part_digit';
				this.forward_pos();
			} else if (char.match(this.regex_float_suffix)) {
				// float-suffixが続けばtoken終端判定
				this.id = 'hex_float_constant'
				this.forward_pos();
				// token終端判定
				let check: boolean;
				check = this.check_token_terminal();
				if (check) {
					// 終端に達していたら正常終了
					this.state = '@end';
					result = true;
				} else {
					// 文法エラー：規定外の文字が続いた
					this.state = '@identifier';
					this.commit_err(this.pos - 1, 'float_suffix');
				}
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'hex_float_constant';
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'binary_float_exponent');
			}
		}

		return result;
	}

	/**
	 * (hexadecimal-)fractional-constantの解析
	 * "."から開始してhex-digitが続いた場合に本状態へ遷移する。
	 * token解析しながら10/16進数を判別する。
	 * "."に続く1文字目から解析開始する。
	 */
	private execute_any_fractional_constant(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら終了
			this.id = 'dot';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char.match(this.regex_digit)) {
				// digitが続けば解析継続
				//this.state = '@any_fractional_constant';
				this.forward_pos();
			} else if (char.match(this.regex_hex_digit)) {
				// hex-digitが続けばhexadecimal-fractional-constantが確定するので遷移
				this.state = '@hex_fractional_constant';
				this.forward_pos();
			} else if (char == "e" || char == "E") {
				// e or E が続けばbinary-exponent-part解析へ遷移 
				this.state = '@exponent_part';
				this.forward_pos();
			} else if (char == "p" || char == "P") {
				// p or P が続けばbinary-exponent-part解析へ遷移 
				this.state = '@binary_exponent_part';
				this.forward_pos();
			} else if (char.match(this.regex_float_suffix)) {
				// float-suffixが続けばtoken終端判定
				// このパスを通る時点で10/16進数の判定ができなかったということなので、
				// ここにたどり着いた時点でどちらと見ても問題なく、10進数と判断する。
				this.id = 'decimal_float_constant';
				this.forward_pos();
				// token終端判定
				let check: boolean;
				check = this.check_token_terminal();
				if (check) {
					// 終端に達していたら正常終了
					this.state = '@end';
					result = true;
				} else {
					// 文法エラー：規定外の文字が続いた
					this.state = '@identifier';
					this.commit_err(this.pos - 1, 'float_suffix');
				}
			} else if (char.match(this.regex_punctuator)) {
				// 区切り文字が続けば終了
				this.id = 'decimal_float_constant';
				this.state = '@end';
				result = true;
			} else {
				// 文法エラー：規定外の文字が続いた
				this.state = '@identifier';
				this.commit_err(this.pos - 1, 'decimal_float_constant');
			}
		}

		return result;
	}

	/**
	 * character-constantの1文字目解析
	 * 'まで出現した状態から遷移する。
	 * 'に'が続く場合は文法エラーになる。
	 */
	private execute_char_constant_begin(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら文法エラー
			this.id = 'char_constant';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'char_constant');
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char == "'") {
				// 文法エラー：''(空character-constant)
				this.id = 'char_constant';
				this.state = '@end';
				result = true;
				this.commit_err(this.pos - 1, 'char_constant');
				this.forward_pos();
			} else {
				// '以外であればchar_constantへ遷移する
				this.state = '@char_constant';
			}
		}

		return result;
	}

	/**
	 * character-constantの解析
	 * 'の後に'以外の文字が続いた状態で本状態へ遷移する。
	 */
	private execute_char_constant(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら文法エラー
			this.id = 'char_constant';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'char_constant');
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char == "'") {
				// 'が出現したら解析完了
				this.id = 'char_constant';
				this.state = '@end';
				result = true;
				this.forward_pos();
			} else if (char == "\\") {
				// '\'が出現したらescape-sequence解析開始
				// 解析エラーが出てもchar-constantとして解析継続する
				this.forward_pos();
				let err_check: boolean;
				err_check = this.check_escape_sequence();
			} else if (char == "\r" || char == "\n") {
				// 改行文字が出現したら解析打ち切り
				this.id = 'char_constant';
				this.state = '@end';
				result = true;
				this.commit_err(this.pos - 1, 'char_constant');
			} else {
				// その他の文字はすべて許容する、解析継続
				this.forward_pos();
			}
		}

		return result;
	}

	/**
	 * string-literalの解析
	 * "を検出した状態で本状態へ遷移する。
	 */
	private execute_string_literal(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// EOF到達していたら文法エラー
			this.id = 'string_literal';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'string_literal');
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			if (char == '"') {
				// "が出現したら解析完了
				this.id = 'string_literal';
				this.state = '@end';
				result = true;
				this.forward_pos();
			} else if (char == "\\") {
				// '\'が出現したらescape-sequence解析開始
				// 解析エラーが出てもchar-constantとして解析継続する
				this.forward_pos();
				let err_check: boolean;
				err_check = this.check_escape_sequence();
			} else if (char == "\r" || char == "\n") {
				// 改行文字が出現したら解析打ち切り
				this.id = 'char_constant';
				this.state = '@end';
				result = true;
				this.commit_err(this.pos - 1, 'char_constant');
			} else {
				// その他の文字はすべて許容する、解析継続
				this.forward_pos();
			}
		}

		return result;
	}

	/**
	 * '+'から始まるtokenの解析
	 */
	private execute_plus(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'plus';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '+':
					this.id = 'increment_op';
					this.forward_pos();
					break;
				case '=':
					this.id = 'add_assign_op';
					this.forward_pos();
					break;
				default:
					this.id = 'plus';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '-'から始まるtokenの解析
	 */
	private execute_minus(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'minus';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '>':
					this.id = 'arrow_op';
					this.forward_pos();
					break;
				case '-':
					this.id = 'decrement_op';
					this.forward_pos();
					break;
				case '=':
					this.id = 'sub_assign_op';
					this.forward_pos();
					break;
				default:
					this.id = 'minus';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '&'から始まるtokenの解析
	 */
	private execute_ampersand(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'ampersand';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '&':
					this.id = 'logical_AND_op';
					this.forward_pos();
					break;
				case '=':
					this.id = 'bitwise_AND_assign_op';
					this.forward_pos();
					break;
				default:
					this.id = 'ampersand';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '*'から始まるtokenの解析
	 */
	private execute_asterisk(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'asterisk';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '=':
					this.id = 'mul_assign_op';
					this.forward_pos();
					break;
				default:
					this.id = 'asterisk';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '!'から始まるtokenの解析
	 */
	private execute_exclamation(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'logical_negation_op';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '=':
					this.id = 'inequal_op';
					this.forward_pos();
					break;
				default:
					this.id = 'logical_negation_op';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '/'から始まるtokenの解析
	 */
	private execute_slash(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'div_op';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとする
			switch (char) {
				case '=':
					this.id = 'div_assign_op';
					this.forward_pos();
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				case '/':
					// 1line comment delimiter
					this.forward_pos();
					this.state = '@COMMENT_1LINE';
					break;
				case '*':
					// multiline comment delimiter
					this.forward_pos();
					this.state = '@COMMENT_MULTILINE';
					break;
				default:
					this.id = 'div_op';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
			}
		}

		return result;
	}

	/**
	 * '%'から始まるtokenの解析
	 */
	private execute_percent(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'remain_op';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '=':
					this.id = 'remain_assign_op';
					this.forward_pos();
					break;
				case '>':
					this.id = 'alt_right_brace';
					this.forward_pos();
					break;
				case ':':
					this.id = 'alt_sharp';
					this.forward_pos();
					// 2文字先読み
					// %:が続いた場合は%:%:になる
					// これらの記号はすべて区切り文字なので、
					// ほかの文字が出現したケースは次回解析でよい
					[subst_str, subst_len] = this.get_ahead(2);
					if (subst_str == "%:") {
						this.id = 'alt_sharp_sharp_op';
						this.forward_pos(subst_len);
					}
					break;
				default:
					this.id = 'remain_op';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '<'から始まるtokenの解析
	 */
	private execute_left_angle_bracket(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'lt_op';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '<':
					this.id = 'left_shift_op';
					this.forward_pos();
					// 1文字先読み
					[subst_str, subst_len] = this.get_ahead(1);
					if (subst_str == "=") {
						this.id = 'left_shift_assign_op';
						this.forward_pos();
					}
					break;
				case '=':
					this.id = 'lte_op';
					this.forward_pos();
					break;
				case ':':
					this.id = 'alt_left_bracket';
					this.forward_pos();
					break;
				case '%':
					this.id = 'alt_left_brace';
					this.forward_pos();
					break;
				default:
					this.id = 'lt_op';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '>'から始まるtokenの解析
	 */
	private execute_right_angle_bracket(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'gt_op';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '>':
					this.id = 'right_shift_op';
					this.forward_pos();
					// 1文字先読み
					[subst_str, subst_len] = this.get_ahead(1);
					if (subst_str == "=") {
						this.id = 'right_shift_assign_op';
						this.forward_pos();
					}
					break;
				case '=':
					this.id = 'gte_op';
					this.forward_pos();
					break;
				default:
					this.id = 'gt_op';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '='から始まるtokenの解析
	 */
	private execute_equal(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'simple_assign_op';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '=':
					this.id = 'equal_op';
					this.forward_pos();
					break;
				default:
					this.id = 'simple_assign_op';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '^'から始まるtokenの解析
	 */
	private execute_caret(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'bitwise_EXOR_op';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '=':
					this.id = 'bitwise_EXOR_assign_op';
					this.forward_pos();
					break;
				default:
					this.id = 'bitwise_EXOR_op';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '|'から始まるtokenの解析
	 */
	private execute_vertical_bar(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'bitwise_OR_op';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '|':
					this.id = 'logical_OR_op';
					this.forward_pos();
					break;
				case '=':
					this.id = 'bitwise_OR_assign_op';
					this.forward_pos();
					break;
				default:
					this.id = 'bitwise_OR_op';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * ':'から始まるtokenの解析
	 */
	private execute_colon(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字
			this.id = 'colon';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 区切り文字なので規定外の文字が登場しても別tokenとなる
			switch (char) {
				case '>':
					this.id = 'alt_right_bracket';
					this.forward_pos();
					break;
				default:
					this.id = 'colon';
					break;
			}
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		}

		return result;
	}

	/**
	 * '#'から始まるtokenの解析
	 * 6.10 Preprocessing directives
	 * #はPPの文脈でのみ登場するため、PPを前提に解析を行う。
	 */
	private execute_sharp(): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 1文字だけなら区切り文字とみなす
			this.id = 'sharp';
			this.sub_id = 'punctuator';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			switch (char) {
				case '#':
					// ##で区切り文字とみなす
					this.forward_pos();
					this.id = 'sharp_sharp';
					this.sub_id = 'punctuator';
					this.state = '@end';
					result = true;
					break;
				default:
					result = this.check_pp_keyword();
					break;
			}
		}

		return result;
	}

	/**
	 * Preprocessing directiveを解析する
	 * '#'が出現した状態でチェックを行う。
	 * keywordの解析を開始する。
	 */
	private check_pp_keyword(): boolean {
		let result: boolean;
		result = false;

		// 次の文字を取得
		let char: string;
		char = this.text[this.pos];
		// PP-directiveのkeywordを解析
		//	#if
		//	#ifdef
		//	#ifndef
		//	#elif
		//	#else
		//	#endif
		//	#include
		//	#define
		//	#undef
		//	#line
		//	#error
		//	#pragma
		switch (char) {
			case 'i':
				this.state = 'pp_i';
				this.forward_pos();
				break;
			case 'e':
				this.state = 'pp_e';
				this.forward_pos();
				break;
			case 'd':
				this.state = 'pp_d';
				this.forward_pos();
				break;
			case 'u':
				this.state = 'pp_u';
				this.forward_pos();
				break;
			case 'l':
				this.state = 'pp_l';
				this.forward_pos();
				break;
			case 'p':
				this.state = 'pp_p';
				this.forward_pos();
				break;
			default:
				result = true;
				break;
		}

		return result;
	}

	/**
	 * pp-keyword解析(1～N-1文字目まで)
	 * 次にkeywordとして期待する文字が来たらkeyword解析を継続する
	 */
	private execute_pp_keyword_progress(exp_info: [string, lexer_state][]): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 解析途中でEOFはエラー
			this.id = 'pp_invalid_keyword';
			this.sub_id = 'pp_keyword';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'pp_keyword');
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];

			// 引数で指定された期待文字かチェック
			// マッチしなかった場合はエラー
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
				// 未定義keywordとしてtokenの取得まで実施する
				this.state = '@pp_invalid_keyword';
				this.forward_pos();
			}
		}

		return result;
	}

	/**
	 * pp-keyword解析(N文字目)
	 * 次に区切り文字が来たらkeywordが決定する。
	 * 解析済み字句が別のkeywordにつながるときはexp_infoを指定する。
	 * exp_infoが指定されたとき、keywordとして期待する文字が来たらkeyword解析を継続する。
	 * (例：入力が'do'のとき、区切り文字が来たら'do'確定、'double'と続けば別のkeywordになる)
	 * @param id 
	 * @param exp_info
	 */
	private execute_pp_keyword(kw_info: [token_id, lexer_state], exp_info?: [string, lexer_state][]): boolean {
		let id: token_id;
		let state: lexer_state;
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 解析途中でEOFはエラー
			this.id = 'pp_invalid_keyword';
			this.sub_id = 'pp_keyword';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'pp_keyword');
		} else {
			// 次の文字を取得
			// 区切り文字であればtoken取得完了
			// 区切り文字でなければidentifierの解析になる
			let char: string;
			char = this.text[this.pos];
			if (this.regex_punctuator.test(char)) {
				[id, state] = kw_info;
				this.id = id;
				this.sub_id = 'pp_keyword';
				this.state = state;
				result = true;
			} else {
				// exp_infoが指定されたときは次のkeyword解析へ
				// 指定されなかったときは未定義keywordとしてtoken抽出
				if (exp_info) {
					result = this.execute_pp_keyword_progress(exp_info);
				} else {
					this.state = '@pp_invalid_keyword';
					this.forward_pos();
				}
			}
		}

		return result;
	}

	/**
	 * pp-keyword解析(未定義)
	 * pp-keyword解析中に未定義の文字が登場した場合、
	 * 未定義keywordとしてtokenの抽出まで実施する
	 */
	private execute_pp_invalid_keyword(state: lexer_state): boolean {
		let result: boolean;
		result = false;

		if (this.is_eof) {
			// 解析途中でEOFはエラー
			this.id = 'pp_invalid_keyword';
			this.sub_id = 'pp_keyword';
			this.state = '@end';
			result = true;
			this.commit_err(this.pos - 1, 'pp_keyword');
		} else {
			// 次の文字を取得
			// 区切り文字であればtoken取得完了
			// 区切り文字でなければ処理継続
			let char: string;
			char = this.text[this.pos];
			if (this.regex_punctuator.test(char)) {
				this.id = 'pp_invalid_keyword';
				this.sub_id = 'pp_keyword';
				this.state = state;
				result = true;
				this.commit_err(this.pos - 1, 'pp_keyword');
			} else {
				this.forward_pos();
			}
		}

		return result;
	}

	/**
	 * pp-token解析
	 * pp-keyword以後は改行までをtokenとする
	 */
	private execute_pp_token(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'pp_token';
			this.state = '@end';
			result = true;
		} else {
			// 次の文字を取得
			let char: string;
			char = this.text[this.pos];
			// 改行までがtokenとなる
			switch (char) {
				case '\\':
					// backslashが出現したら次の改行記号を無視する。
					this.forward_pos();
					// 1文字先読み(EOFのケアとして先読み関数を使う)
					let check: boolean;
					check = false;
					[subst_str, subst_len] = this.get_ahead(1);
					if (subst_str == '\r') {
						this.forward_pos();
						check = true;
					}
					[subst_str, subst_len] = this.get_ahead(1);
					if (subst_str == '\n') {
						this.forward_pos();
						check = true;
					}
					if (check) {
						// 改行を記憶する
						this.commit_len();
					}
					// 解析継続
					break;
				case '\r':
				case '\n':
					// \r or \n が登場したら解析終了
					// 改行記号の解析は別の処理時で実施
					this.id = 'pp_token';
					this.state = '@end';
					result = true;
					break;
				default:
					// 改行以外はすべて受け付ける
					this.forward_pos();
					break;
			}
		}

		return result;
	}





	/**
	 * escape-sequence解析
	 * c-char-sequenceとs-char-sequenceで共通処理のため
	 * 関数内でposを進めていく。例外的なロジックなので注意。
	 */
	private check_escape_sequence(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// 1文字先読み(EOFのケアとして先読み関数を使う)
		[subst_str, subst_len] = this.get_ahead(1);

		if (subst_str == "") {
			// '\'で終了時は文法エラー
			this.commit_err(this.pos - 1, 'escape_sequence');
			result = true;
		} else if (subst_str.match(this.regex_simple_escape_seq)) {
			// simple-escape-sequenceが登場したら正常終了
			this.forward_pos();
		} else if (subst_str.match(this.regex_octal_digit)) {
			// octal-digitが登場したら octal-escape-sequence として解析
			// octal-escape-sequenceでは1～3文字までoctal-digitが登場する
			let char_count: number;
			char_count = 0;
			do {
				char_count++;
				this.forward_pos(1);
				// 1文字先読み(EOFのケアとして先読み関数を使う)
				[subst_str, subst_len] = this.get_ahead(1);
			} while (subst_str.match(this.regex_octal_digit) && char_count < 3);
		} else if (subst_str == "x") {
			// "x"が出現したら hexadecimal-escape-sequence として解析
			// 1文字先読み(EOFのケアとして先読み関数を使う)
			this.forward_pos(1);
			[subst_str, subst_len] = this.get_ahead(1);
			if (subst_str.match(this.regex_hex_digit)) {
				// hex-digitが出現したら hexadecimal-escape-sequence を正常検出
				do {
					// 1文字先読み(EOFのケアとして先読み関数を使う)
					this.forward_pos(1);
					[subst_str, subst_len] = this.get_ahead(1);
				} while (subst_str.match(this.regex_hex_digit));
			} else {
				// 文法エラー：hex-digit以外が出現した
				result = true;
				this.commit_err(this.pos - 1, 'hex_escape_sequence');
			}
		} else if (subst_str == "u" || subst_str == "U") {
			// u or U が出現した場合、
			// universal-character-nameの判定を行う。
			// 解析エラーが出てもescape-sequenceとして解析継続
			let check : boolean;
			check = this.check_univ_char_name();
			if (check) {
				// エラー検出時
				// result = false;	// 解析継続
			}
		} else {
			// その他の文字が出現した場合は解析エラー
			result = true;
			this.commit_err(this.pos - 1, 'escape_sequence');
		}

		return result;
	}

	/**
	 * universal-character-name解析
	 * identifier/c-char-sequence/s-char-sequenceで共通処理のため
	 * 関数内でposを進めていく。例外的なロジックなので注意。
	 */
	private check_univ_char_name(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// 1文字先読み(EOFのケアとして先読み関数を使う)
		[subst_str, subst_len] = this.get_ahead(1);

		if (subst_str == 'u') {
			this.forward_pos();
			// '\u'にはhex-quad(4バイト)が続く
			[subst_str, subst_len] = this.get_ahead(4);
			if (subst_str.match(/[0-9a-fA-F]{4,4}/)) {
				this.forward_pos(subst_len);
			} else {
				// 文法エラー：'\u'にhex-quadが4つ続かない
				this.commit_err(this.pos - 2, 'univ_char_name');
				result = true;
			}
		} else if (subst_str == 'U') {
			this.forward_pos();
			// '\U'にはhex-quad(4バイト)*2が続く
			[subst_str, subst_len] = this.get_ahead(8);
			if (subst_str.match(/[0-9a-fA-F]{8,8}/)) {
				this.forward_pos(subst_len);
			} else {
				// 文法エラー：'\u'にhex-quadが8つ続かない
				this.commit_err(this.pos - 2, 'univ_char_name');
				result = true;
			}
		} else {
			// 文法エラー：'\'にuまたはUが続かない
			this.commit_err(this.pos - 1, 'univ_char_name');
			result = true;
		}

		return result;
	}

	/**
	 * token終端解析
	 * tokenが終端に達していることを判定する。
	 * 本状態へ遷移する際はIDを設定しておくこと。
	 * 
	 * @returns	true	終端に達した
	 * 			false	終端に達していない
	 */
	private check_token_terminal(): boolean {
		let subst_str: string;
		let subst_len: number;
		let result: boolean;
		result = false;

		// 1文字先読み(EOFのケアとして先読み関数を使う)
		[subst_str, subst_len] = this.get_ahead(1);

		if (subst_str == "") {
			// EOFに到達していた
			result = true;
		} else if (subst_str.match(this.regex_punctuator)) {
			// 区切り文字が続けば終了
			result = true;
		} else {
			// 文法エラー：規定外の文字が続いた
			result = false;
		}

		return result;
	}

	/**
	 * 指定した文字数lenだけ先読みをする。
	 * 先読みした文字列と先読みできた文字数を返す。
	 * lenがtextの残り文字数より大きいときに残り文字数だけ読みだすことになる。
	 * @param len 
	 */
	private get_ahead(len:number) : [string, number] {
		// text文字列長を超える場合はリミットをかける
		this.ahead_len = len;
		if ((this.pos + len) > this.text.length) {
			this.ahead_len = this.text.length - this.pos;
		}
		// substringを取得
		this.ahead_str = this.text.substring(this.pos+this.ahead_len-1, this.pos+this.ahead_len);

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
