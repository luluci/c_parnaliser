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
	| 'a'		// a状態
	| 'au'
	| 'aut'
	| 'auto'
	| 'b'
	| 'br'
	| 'bre'
	| 'brea'
	| 'break'
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
	| 'con'
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
	is_eof : boolean;
	regex_punctuator:RegExp;
	regex_identifier_digit_nondigit:RegExp;

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
		this.regex_punctuator = /[\[\](){}.+\-&*~!\/%<>=^|,#\r\n\s\t]/;
		this.regex_identifier_digit_nondigit = /[0-9a-zA-Z_]/;

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
			case 'a':
				result = this.execute_a();
				break;
			case 'auto':
				result = this.execute_auto();
				break;

			/*
			case 'b':
				result = this.execute_b(char);
				break;
			case 'br':
				result = this.execute_br(char);
				break;
			case 'bre':
				result = this.execute_bre(char);
				break;
			case 'brea':
				result = this.execute_brea(char);
				break;
			case 'break':
				result = this.execute_break(char);
				break;
			case 'c':
				result = this.execute_c(char);
				break;
			case 'ca':
				result = this.execute_ca(char);
				break;
			case 'cas':
				result = this.execute_cas(char);
				break;
			case 'case':
				result = this.execute_case(char);
				break;
			case 'ch':
				result = this.execute_ch(char);
				break;
			case 'cha':
				result = this.execute_cha(char);
				break;
			case 'char':
				result = this.execute_char(char);
				break;
			case 'co':
				result = this.execute_co(char);
				break;
			case 'con':
				result = this.execute_con(char);
				break;
			case 'cons':
				result = this.execute_cons(char);
				break;
			case 'const':
				result = this.execute_const(char);
				break;
			case 'cont':
				result = this.execute_cont(char);
				break;
			case 'conti':
				result = this.execute_conti(char);
				break;
			case 'contin':
				result = this.execute_contin(char);
				break;
			case 'continu':
				result = this.execute_continu(char);
				break;
			case 'continue':
				result = this.execute_continue(char);
				break;
			case 'd':
				result = this.execute_d(char);
				break;
			case 'de':
				result = this.execute_de(char);
				break;
			case 'def':
				result = this.execute_def(char);
				break;
			case 'defa':
				result = this.execute_defa(char);
				break;
			case 'defau':
				result = this.execute_defau(char);
				break;
			case 'defaul':
				result = this.execute_defaul(char);
				break;
			case 'default':
				result = this.execute_default(char);
				break;
			case 'do':
				result = this.execute_do(char);
				break;
			case 'dou':
				result = this.execute_dou(char);
				break;
			case 'doub':
				result = this.execute_doub(char);
				break;
			case 'doubl':
				result = this.execute_doubl(char);
				break;
			case 'double':
				result = this.execute_double(char);
				break;
			case 'e':
				result = this.execute_e(char);
				break;
			case 'el':
				result = this.execute_el(char);
				break;
			case 'els':
				result = this.execute_els(char);
				break;
			case 'else':
				result = this.execute_else(char);
				break;
			case 'en':
				result = this.execute_en(char);
				break;
			case 'enu':
				result = this.execute_enu(char);
				break;
			case 'enum':
				result = this.execute_enum(char);
				break;
			case 'ex':
				result = this.execute_ex(char);
				break;
			case 'ext':
				result = this.execute_ext(char);
				break;
			case 'exte':
				result = this.execute_exte(char);
				break;
			case 'exter':
				result = this.execute_exter(char);
				break;
			case 'extern':
				result = this.execute_extern(char);
				break;
			case 'f':
				result = this.execute_f(char);
				break;
			case 'fl':
				result = this.execute_fl(char);
				break;
			case 'flo':
				result = this.execute_flo(char);
				break;
			case 'floa':
				result = this.execute_floa(char);
				break;
			case 'float':
				result = this.execute_float(char);
				break;
			case 'fo':
				result = this.execute_fo(char);
				break;
			case 'for':
				result = this.execute_for(char);
				break;
			case 'g':
				result = this.execute_g(char);
				break;
			case 'go':
				result = this.execute_go(char);
				break;
			case 'got':
				result = this.execute_got(char);
				break;
			case 'goto':
				result = this.execute_goto(char);
				break;
			case 'i':
				result = this.execute_i(char);
				break;
			case 'if':
				result = this.execute_if(char);
				break;
			case 'in':
				result = this.execute_in(char);
				break;
			case 'inl':
				result = this.execute_inl(char);
				break;
			case 'inli':
				result = this.execute_inli(char);
				break;
			case 'inlin':
				result = this.execute_inlin(char);
				break;
			case 'inline':
				result = this.execute_inline(char);
				break;
			case 'int':
				result = this.execute_int(char);
				break;
			case 'l':
				result = this.execute_l(char);
				break;
			case 'lo':
				result = this.execute_lo(char);
				break;
			case 'lon':
				result = this.execute_lon(char);
				break;
			case 'long':
				result = this.execute_long(char);
				break;
			case 'r':
				result = this.execute_r(char);
				break;
			case 're':
				result = this.execute_re(char);
				break;
			case 'reg':
				result = this.execute_reg(char);
				break;
			case 'regi':
				result = this.execute_regi(char);
				break;
			case 'regis':
				result = this.execute_regis(char);
				break;
			case 'regist':
				result = this.execute_regist(char);
				break;
			case 'registe':
				result = this.execute_registe(char);
				break;
			case 'register':
				result = this.execute_register(char);
				break;
			case 'res':
				result = this.execute_res(char);
				break;
			case 'rest':
				result = this.execute_rest(char);
				break;
			case 'restr':
				result = this.execute_restr(char);
				break;
			case 'restri':
				result = this.execute_restri(char);
				break;
			case 'restric':
				result = this.execute_restric(char);
				break;
			case 'restrict':
				result = this.execute_restrict(char);
				break;
			case 'ret':
				result = this.execute_ret(char);
				break;
			case 'retu':
				result = this.execute_retu(char);
				break;
			case 'retur':
				result = this.execute_retur(char);
				break;
			case 'return':
				result = this.execute_return(char);
				break;
			case 's':
				result = this.execute_s(char);
				break;
			case 'sh':
				result = this.execute_sh(char);
				break;
			case 'sho':
				result = this.execute_sho(char);
				break;
			case 'shor':
				result = this.execute_shor(char);
				break;
			case 'short':
				result = this.execute_short(char);
				break;
			case 'si':
				result = this.execute_si(char);
				break;
			case 'sig':
				result = this.execute_sig(char);
				break;
			case 'sign':
				result = this.execute_sign(char);
				break;
			case 'signe':
				result = this.execute_signe(char);
				break;
			case 'signed':
				result = this.execute_signed(char);
				break;
			case 'siz':
				result = this.execute_siz(char);
				break;
			case 'size':
				result = this.execute_size(char);
				break;
			case 'sizeo':
				result = this.execute_sizeo(char);
				break;
			case 'sizeof':
				result = this.execute_sizeof(char);
				break;
			case 'st':
				result = this.execute_st(char);
				break;
			case 'sta':
				result = this.execute_sta(char);
				break;
			case 'stat':
				result = this.execute_stat(char);
				break;
			case 'stati':
				result = this.execute_stati(char);
				break;
			case 'static':
				result = this.execute_static(char);
				break;
			case 'str':
				result = this.execute_str(char);
				break;
			case 'stru':
				result = this.execute_stru(char);
				break;
			case 'struc':
				result = this.execute_struc(char);
				break;
			case 'struct':
				result = this.execute_struct(char);
				break;
			case 'sw':
				result = this.execute_sw(char);
				break;
			case 'swi':
				result = this.execute_swi(char);
				break;
			case 'swit':
				result = this.execute_swit(char);
				break;
			case 'switc':
				result = this.execute_switc(char);
				break;
			case 'switch':
				result = this.execute_switch(char);
				break;
			case 't':
				result = this.execute_t(char);
				break;
			case 'ty':
				result = this.execute_ty(char);
				break;
			case 'typ':
				result = this.execute_typ(char);
				break;
			case 'type':
				result = this.execute_type(char);
				break;
			case 'typed':
				result = this.execute_typed(char);
				break;
			case 'typede':
				result = this.execute_typede(char);
				break;
			case 'typedef':
				result = this.execute_typedef(char);
				break;
			case 'u':
				result = this.execute_u(char);
				break;
			case 'un':
				result = this.execute_un(char);
				break;
			case 'uni':
				result = this.execute_uni(char);
				break;
			case 'unio':
				result = this.execute_unio(char);
				break;
			case 'union':
				result = this.execute_union(char);
				break;
			case 'uns':
				result = this.execute_uns(char);
				break;
			case 'unsi':
				result = this.execute_unsi(char);
				break;
			case 'unsig':
				result = this.execute_unsig(char);
				break;
			case 'unsign':
				result = this.execute_unsign(char);
				break;
			case 'unsigne':
				result = this.execute_unsigne(char);
				break;
			case 'unsigned':
				result = this.execute_unsigned(char);
				break;
			case 'v':
				result = this.execute_v(char);
				break;
			case 'vo':
				result = this.execute_vo(char);
				break;
			case 'voi':
				result = this.execute_voi(char);
				break;
			case 'void':
				result = this.execute_void(char);
				break;
			case 'vol':
				result = this.execute_vol(char);
				break;
			case 'vola':
				result = this.execute_vola(char);
				break;
			case 'volat':
				result = this.execute_volat(char);
				break;
			case 'volati':
				result = this.execute_volati(char);
				break;
			case 'volatil':
				result = this.execute_volatil(char);
				break;
			case 'volatile':
				result = this.execute_volatile(char);
				break;
			case 'w':
				result = this.execute_w(char);
				break;
			case 'wh':
				result = this.execute_wh(char);
				break;
			case 'whi':
				result = this.execute_whi(char);
				break;
			case 'whil':
				result = this.execute_whil(char);
				break;
			case 'while':
				result = this.execute_while(char);
				break;
			case '_':
				result = this.execute_ul(char);
				break;
			case '_Bool':
				result = this.execute_ul_Bool(char);
				break;
			case '_Complex':
				result = this.execute_ul_Complex(char);
				break;
			case '_Imaginary':
				result = this.execute_ul_Imaginary(char);
				break;
			case '\\':
				result = this.execute_bslash(char);
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
			} else {
				this.state = '@identifier';
			}

			this.forward_pos(subst_len);
		}

		return result;
	}

	private execute_auto(): boolean {
		let result: boolean;
		result = false;

		// EOF到達していたら終了
		if (this.is_eof) {
			this.id = 'auto';
			this.state = '@end';
			result = true;
		} else {

			// 次の文字を取得
			// 区切り文字であればtoken取得完了
			// 区切り文字でなければidentifierの解析になる
			let char : string;
			char = this.text[this.pos];

			if (this.regex_punctuator.test(char)) {
				this.id = 'auto';
				this.state = '@end';
				result = true;
			} else {
				this.state = '@identifier';
				this.forward_pos();
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

	private commit_err(pos_: number, err_id_: token_err_id) {
		this.err_info.push({ pos: pos_, err_id: err_id_ });
	}
}
