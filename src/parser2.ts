'use strict';

// implement:
//   Annex A
//   A.2 Phrase structure grammar

//import rfdc from 'rfdc';
import lexer from '../src/lexer';
import { tokenizer_c, token_id, token_sub_id } from '../src/tokenizer_c';
import { ParseNode, ParseNodeGenerator } from './lib/parse_node';

type cb_type = (id: token_id, row: number, col: number, token: string) => void;

type parse_state =
	| 'root'							// 解析root状態:translation-unit
	| '@undecided'						// 解析途中で出現したgrammarが未確定
	| '@WHITESPACE'

	| 'pp-directive'
	| 'translation-unit'
	| 'semicolon'
	| 'declaration-specifiers'

	// A.1 Lexical grammar
	// A.1.2 Keywords
	| 'auto'
	| 'break'
	| 'case'
	| 'char'
	| 'const'
	| 'continue'
	| 'default'
	| 'do'
	| 'double'
	| 'else'
	| 'enum'
	| 'extern'
	| 'float'
	| 'for'
	| 'goto'
	| 'if'
	| 'inline'
	| 'int'
	| 'long'
	| 'register'
	| 'restrict'
	| 'return'
	| 'short'
	| 'signed'
	| 'sizeof'
	| 'static'
	| 'struct'
	| 'switch'
	| 'typedef'
	| 'union'
	| 'unsigned'
	| 'void'
	| 'volatile'
	| 'while'
	| '_Bool'
	| '_Complex'
	| '_Imaginary'
	// A.1.3 Identifiers
	| 'identifier'
	// A.1.5 Constants
	| 'constant'
	// A.1.6 String literals
	| 'string-literal'
	// A.1.7 Punctuators
	| 'left-bracket'
	| 'right-bracket'
	| 'left-paren'
	| 'right-paren'
	| 'left-brace'
	| 'right-brace'
	| 'dot'
	| 'arrow-operator'
	| 'increment-operator'
	| 'decrement-operator'
	| 'ampersand'					// &	address_operator | bitwise_AND_operator
	| 'asterisk'					// *	asterisk_punctuator | indirection_operator | multimlication_operator
	| 'plus'						// +
	| 'minus'						// -
	| 'bitwise_complement_op'		// ~
	| 'logical_negation_op'			// !
	| 'div_op'						// /
	| 'remain_op'					// %
	| 'left_shift_op'				// <<
	| 'right_shift_op'				// >>
	| 'lt_op'						// <
	| 'gt_op'						// >
	| 'lte_op'						// <=
	| 'gte_op'						// >=
	| 'equal_op'					// ==
	| 'inequal_op'					// !=
	| 'bitwise_EXOR_op'				// ^
	| 'bitwise_OR_op'				// |
	| 'logical_AND_op'				// &&
	| 'logical_OR_op'				// ||
	| 'conditional_op'				// ?
	| 'colon'						// :
	| 'semicolon'					// ;
	| 'ellipsis'					// ...
	| 'simple_assign_op'			// =
	| 'mul_assign_op'				// *=
	| 'div_assign_op'				// /=
	| 'remain_assign_op'			// %=
	| 'add_assign_op'				// +=
	| 'sub_assign_op'				// -=
	| 'left_shift_assign_op'		// <<=
	| 'right_shift_assign_op'		// >>=
	| 'bitwise_AND_assign_op'		// &=
	| 'bitwise_EXOR_assign_op'		// ^=
	| 'bitwise_OR_assign_op'		// |=
	| 'comma'						// ,
	| 'sharp'						// #
	| 'sharp_sharp'					// ##
	| 'alt_left_bracket'			// <:	== [
	| 'alt_right_bracket'			// :>	== ]
	| 'alt_left_brace'				// <%	== {
	| 'alt_right_brace'				// %>	== }
	| 'alt_sharp'					// %:	== #
	| 'alt_sharp_sharp_op'			// %:%:	== ##
	// A.2 Phrase structure grammar
	// A.2.1 Expressions
	// (6.5.1) primary-expression:
	| 'primary-expression'
	| 'primary-expression_error'
	// (6.5.2) postfix-expression:
	| 'postfix-expression'
	| 'postfix-expression_1'
	| 'postfix-expression_2'
	| 'postfix-expression_1_error'
	// (6.5.2) argument-expression-list:
	| 'argument-expression-list'
	// (6.5.3) unary-expression:
	| 'unary-expression'					// unary-expression
	// (6.5.3) unary-operator: one of
	| 'unary-operator'						// unary-operator
	// (6.5.16) assignment-expression:
	| 'assignment-expression'				// assignment-expression
	// (*) expression utility
	| 'typename_in_expr'					// expression内に出現する "( type-name )" を判定する
	// A.2.2 Declarations
	// (6.7.2) type-specifier:
	| 'type-specifier'
	| 'type-specifier_prim'					// 組み込み型
	// (6.7.2.1) struct-or-union-specifier:
	// (6.7.2.1) struct-or-union:
	// (6.7.2.1) struct-declaration-list:
	// (6.7.2.1) struct-declaration:
	// (6.7.2.1) specifier-qualifier-list:
	| 'specifier-qualifier-list'
	// (6.7.2.2) enum-specifier:
	// (6.7.2.2) enumerator-list:
	// (6.7.2.2) enumerator:
	// (6.7.3) type-qualifier:
	| 'type-qualifier'
	// (6.7.6) type-name:
	| 'type-name'
	// (6.7.8) initializer-list:
	| 'initializer-list'

	| 'root_decl-spec'					//	-> declaration-specifiers
	| 'root_decl-spec_declarator'		//		-> declarator
	| 'root_end'						// translation-unitの解析終了
	| 'EOF'



	// Expressions
	| 'cast-expression'
	| 'conditional-expression'			// conditional-expression
	| 'expression'						// expression
	| 'constant-expression'				// constant-expression
	// Declarations
	| 'declaration'
	| 'declaration_dont_declare'
	| 'declaration-specifier'
	| 'init-declarator'					// init-declarator
	| 'struct-or-union-specifier'		// 
	| 'struct-or-union'					// 
	| 'struct-declaration-list'			// 
	| 'struct-declarator'				//
	| 'enum-specifier'					//
	| 'declarator'						// declarator: variable or functin decl
	| 'declarator_var'					// variable declarator
	| 'declarator_func'					// function declarator
	| 'direct-declarator'				// direct-declarator
	| 'pointer'							// pointer
	| 'parameter-type-list'				// parameter-type-list
	| 'parameter-declaration'			// parameter-declaration
	| 'identifier-list'					// identifier-list
	| 'abstract-declarator'
	| 'typedef-name'					// typedefで定義されたユーザ定義型
	| 'initializer'						// initializer
	| 'initializer-list'				// initializer-list
	| 'designation'						// designation
	| 'designator'						// designator
	// Statements
	| 'statement'						// statement
	| 'labeled-statement'
	| 'expression-statement'
	| 'compound-statement'				// compound-statement
	| 'selection-statement'
	| 'iteration-statement'
	| 'jump-statement'
	// External definitions
	| 'function-definition'				// function-definition
	// Preprocessor directives
	| 'pp-directive'





	// Expressions
	// 単独で出現するgrammarとしては下記3つのみ
	//	expression : expr全般、,により複数出現可
	//	assignment-expression : expr全般、単独のみ
	//	constant-expression : 定数、assignだけないexpr

	| 'prim-expr'								// primary-expression
	| 'arg-expr-list'							// argument-expression-list
	| 'unary-expr'								// unary-expression
	| 'cast-expr'								// cast-expression
	| 'mul-expr'								// multiplicative-expression
	| 'add-expr'								// additive-expression
	| 'shift-expr'								// shift-expression
	| 'rel-expr'								// relational-expression
	| 'equ-expr'								// equality-expression
	| 'AND-expr'								// AND-expression
	| 'excl-OR-expr'							// exclusive-OR-expression
	| 'incl-OR-expr'							// inclusive-OR-expression
	| 'logi-AND-expr'							// logical-AND-expression
	| 'logi-OR-expr'							// logical-OR-expression
	| 'cond-expr'								// conditional-expression

	| 'unary-expr'								// unary-expression
	| 'assign-expr'								// assignment-expression
	| 'expr'									// expression
	| 'expr_re'									// expression
	| 'const-expr'								// constant-expression
	| 'expr_impl'								// expression
	| 'expr_impl_re'							// expression
	| 'expr_impl_re_cond'						//	-> ? expr :
	| 'expr_impl_lp'							// 	-> (
	| 'expr_impl_lp_expr'						// 		-> term
	| 'expr_impl_term'							// cast-expressionまでの単項を解析
	| 'expr_impl_term_prim'						//	-> primary-expression
	| 'expr_impl_term_prim_lb_expr'				//		-> [ expr
	| 'expr_impl_term_prim_lp_arg_expr_list'	//		-> ( arg-expr-list
//	| 'expr_impl_term_unexpr'					//	-> unary-expression
	| 'expr_impl_term_lp'						//	-> (
	| 'expr_impl_term_lp_expr'					//		-> expression
	| 'expr_impl_term_lp_typename'				//		-> typename
	| 'expr_impl_term_lp_rp_lb_inilist'			//			-> { initializer-list
	| 'expr_impl_term_sizeof_lp'				//	-> sizeof (
	| 'expr_impl_term_sizeof_lp_typename'		//		-> typename
	| 'expr_impl_term_sizeof_lp_typename_rp_lb_inilist'	//			-> ) { initializer-list
	| 'expr_impl_term_sizeof_lp_rp'				//		-> *
	| 'arg_expr_list'							// argument-expression-list
	| 'arg_expr_list_re'							// argument-expression-list
	// Declarations
	| 'declaration'								// declaration
	| 'declaration_decl-spec'					//	-> declaration-specifiers
	| 'declaration_decl-spec_decl'				//		-> declarator
	| 'declaration_decl-spec_decl_init'			//			-> = initializer
	| 'decl-specifiers'							// declaration-specifiers(初回)
	| 'decl-specifiers_re'						// declaration-specifiers(2回目以降)
	| 'sq-list'									// specifier-qualifier-list(初回)
	| 'sq-list_re'								// specifier-qualifier-list(2回目以降)
	| 'struct-or-union-spec'					// struct-or-union-specifier
	| 'struct-declaration-list'					// struct-declaration-list
	| 'struct-declarator-list'					// struct-declarator-list(初回)
	| 'struct-declarator-list_re'				// struct-declarator-list(2回目以降)
	| 'enum-spec'								// enum-specifier
	| 'enum-spec_lb'							//	-> { enum-list
	| 'enum-list'								// enumerator-list
	| 'enum-list_re'							// enumerator-list(2回目以降)
	| 'declarator'								// declarator
	| 'declarator_lp_decl'						// 	-> ( declarator
	| 'declarator@err'							// declarator@err
	| 'direct-declarator'						// direct-declarator
	| 'direct-declarator_lb'					//	-> [
	| 'direct-declarator_lb_assign_expr'		//		-> assginment-expression
	| 'direct-declarator_lp'					//	-> (
	| 'direct-declarator_lp_list_rp'			//		-> ?-list )
	| 'pointer'									// pointer
	| 'parameter-type-list'						// parameter-type-list
	| 'parameter-type-list_type'				//	-> declaration-specifiers
	| 'parameter-type-list_type_decl'			//		-> (abstract-)declarator
	| 'parameter-declaration'					// parameter-declaration
	| 'identifier-list'							// identifier-list
	| 'identifier-list_re'						// identifier-list
	| 'type-name'								// type-name
	| 'type-name_sq-list_abst-decl'				// type-name/specifier-qualifier-list -> abstract-declarator
	| 'type-name_end'							// type-name 解析完了
	| 'abstract-declarator'						// abstract-declarator
	| 'abstract-declarator_lp_abst'				// abstract-declarator ( abstract-declarator 
	| 'abstract-declarator_lp_param'			// abstract-declarator ( parameter-type-list
	| 'abstract-declarator_lb'					// abstract-declarator [
	| 'abstract-declarator_lb_type'				// abstract-declarator [ type-qualifier or static or assignment-expression
	| 'abstract-declarator_rb'					// abstract-declarator [ type-qualifier or static or assignment-expression ]
	| 'initializer'								// initializer
	| 'initializer_lb_list'						//	-> { initializer-list
	| 'initializer_end'							//	-> { initializer-list } or assign-expr
	| 'initializer-list'						// initializer-list
	| 'initializer-list_design'					// 	-> designator
	| 'initializer-list_design_lb_const-expr'	// 		-> [ constant-expression
	| 'initializer-list_init'					//	-> designator(opt) initializer
	// Statements
	| 'statement'										// statement
	| 'statement_case'									//	-> case
	| 'statement_compound'								// compound-statement
	| 'statement_compound_lb'							//	-> {
	| 'statement_expr'									// expression
	| 'statement_if'									//	-> if ( expr )
	| 'statement_if_state'								//		-> statement
	| 'statement_switch'								//	-> switch ( expr )
	| 'statement_switch_state'							//		-> statement
	| 'statement_while'									//	-> while ( expr )
	| 'statement_while_state'							//		-> statement
	| 'statement_do'									//	-> do statement
	| 'statement_do_state'								//		-> while ( expr
	| 'statement_for_lp'								//	-> for (
	| 'statement_for_lp_id'								//		-> identifier
	| 'statement_for_lp_t'								//		-> any token
	| 'statement_for_lp_t_s_expr'						//			-> ; expr
	| 'statement_for_lp_t_s_expr_s_expr'				//				-> ; expr
	| 'statement_for_lp_t_s_expr_s_expr_rp_state'		//					-> ) state
	| 'statement_return'								//	-> return
	| 'statement_end'									// statement
	// External definitions
	| 'func-def'								// function-definition
	| 'func-def_decl'							//	-> declaration-specifier
	| 'func-def_decl-spec_decl'					// 		-> declarator
	| 'func-def_decl-spec_decl@err'				// 		-> declarator(err)
	| 'func-def_end'							// function-definition解析完了
	// Preprocessing directives
	| 'pp_group_part'							//
	//
	| 'null';				// 初期状態

/*
type parse_context =
	| 'translation-unit'
	| '@undecided'		// 解析途中で出現したgrammarが未確定
	| '@WHITESPACE'
	// Expressions
	| 'primary-expression'
	| 'postfix-expression'
	| 'argument-expression-list'
	| 'cast-expression'
	| 'unary-expression'				// unary-expression
	| 'sizeof'
	| 'conditional-expression'			// conditional-expression
	| 'expression'						// expression
	| 'constant-expression'				// constant-expression
	| 'assignment-expression'			// assignment-expression
	// Declarations
	| 'declaration'
	| 'declaration_dont_declare'
	| 'declaration-specifier'
	| 'init-declarator'					// init-declarator
	| 'type-specifier'					// 
	| 'type-qualifier'					//
	| 'struct-or-union-specifier'		// 
	| 'struct-or-union'					// 
	| 'struct-declaration-list'			// 
	| 'struct-declarator'				//
	| 'enum-specifier'					//
	| 'declarator'						// declarator: variable or functin decl
	| 'declarator_var'					// variable declarator
	| 'declarator_func'					// function declarator
	| 'direct-declarator'				// direct-declarator
	| 'pointer'							// pointer
	| 'parameter-type-list'				// parameter-type-list
	| 'parameter-declaration'			// parameter-declaration
	| 'identifier-list'					// identifier-list
	| 'type-name'
	| 'abstract-declarator'
	| 'typedef-name'					// typedefで定義されたユーザ定義型
	| 'initializer'						// initializer
	| 'initializer-list'				// initializer-list
	| 'designation'						// designation
	| 'designator'						// designator
	// Statements
	| 'statement'						// statement
	| 'labeled-statement'
	| 'expression-statement'
	| 'compound-statement'				// compound-statement
	| 'selection-statement'
	| 'iteration-statement'
	| 'jump-statement'
	// External definitions
	| 'function-definition'				// function-definition
	// Preprocessor directives
	| 'pp-directive'
	| 'null';
*/
type parse_error_info =
	| 'unknown_type'							// 未知の型が出現した
	| 'duplicate_type_specify'					// 2重に型指定された
	| 'unexpected-token'						// 規定のtokenが出現しなかった
	| 'not_found_any_token'						// 何かしらのtokenが必要な個所で出現しなかった
	| 'not_found_declarator'					// declaratorが出現しなかった
	| 'not_found_left_paren'					// ( が出現すべきコンテキストで出現しなかった
	| 'not_found_right_paren'					// ) が出現すべきコンテキストで出現しなかった
	| 'not_found_right_bracket'					// ] が出現すべきコンテキストで出現しなかった
	| 'not_found_left_brace'					// { が出現すべきコンテキストで出現しなかった
	| 'not_found_right_brace'					// } が出現すべきコンテキストで出現しなかった
	| 'not_found_colon'							// conditional-expressionで:が出現しなかった
	| 'not_found_semicolon'						// ; が出現すべきコンテキストで出現しなかった
	| 'not_found_while'							// while が出現すべきコンテキストで出現しなかった
	| 'EOF_in_parse'							// 解析途中でEOF出現
	| '@logic_error'							// ロジック上ありえないtokenが出現した
	| 'null';

/** [parse_tree] 構成図
 * 	+[root]
 * 	`+<child>
 *   `+[expression]
 *    `+<child>
 *     `+[]
 *      +[]
 */
export type parse_tree_node = {
	state: parse_state;
	child: parse_tree_node[];
	parent: parse_tree_node | null;
	lex: lex_info | null;
	err_info: parse_error_info;
	is_typedef: boolean;
}
export type lex_info = {
	id: token_id;
	sub_id: token_sub_id;
	token: string;
	row: number;
	col: number;
	len: number;
	pos: number;
}
// identifier: 変数名, 関数名, typedef の情報
export type ident_type_info = 'null' | 'void' | 'char' | 'short' | 'int' | 'long' | 'long long' | 'float' | 'double' | '_Bool' | '_Complex';
export type ident_info = {
	token: string;
	// type attr(specifier, qualifier)
	type: ident_type_info;
	is_signed: boolean;		// true:signed, false:unsigned
	is_static: boolean;
	is_const: boolean;
	is_inline: boolean;
	// info属性
	is_ident_var: boolean;
	is_ident_func: boolean;
	is_typedef: boolean;
}
// expression解析フラグ
type expr_info = {
	expr_enable_assign: boolean;		// assignment-operator の受付可否
	expr_enable_binary: boolean;		// binary-operator の受付可否
	expr_enable_cast: boolean;			// cast-expresion の受付可否
}
// type-specifier解析情報
type type_specifier_info = {
	sign_def?: token_id;
	spec_def?: token_id;
	struct_def?: boolean;
	union_def?: boolean;
	enum_def?: boolean;
	id_def?: string;
}

/**
 * token管理キュー
 * リングバッファ実装
 */
class token_queue {
	// object
	private _lexer: lexer<tokenizer_c, token_id, token_sub_id>;
	private _queue: Array<lex_info | null>;
	static readonly QUEUE_SIZE: number = 1000;
	// queue管理情報
	private _count: number;		// 保持token数
	private _head: number;		// 先頭idx
	private _tail: number;		// 末尾idx
	private _curr: number;		// lookAhead現在idx

	constructor(text: string) {
		// object
		this._lexer = new lexer<tokenizer_c, token_id, token_sub_id>(tokenizer_c, text);
		this._queue = new Array<lex_info|null>(token_queue.QUEUE_SIZE);
		// queue管理情報
		this._count = 0;
		this._head = 0;
		this._tail = 0;
		this._curr = 0;
	}

	/**
	 * token queue からidx番目のtoken(FirstInを0とする)を返す。
	 * 操作が無ければLastInを返す。
	 * queueに存在する以上のidxが指定されたらlexerからtokenを取得してqueueに追加する。
	 */
	public get(idx?: number): lex_info {
		// idxを指定していたら参照箇所更新
		if (idx != null) this._curr = this._incr(this._head, idx);
		// curr と head の差分から必要な要素数を算出
		let require_size = this._diff(this._curr, this._head);
		// 指定された数だけtokenをスタック
		if (this._count <= require_size) this._enqueue(require_size - this._count + 1);
		// 指定されたtokenを返す
		let token: lex_info = this._queue[this._curr]!;
		return token;
	}
	public get_next(idx: number = 1): lex_info {
		this._curr = this._incr(this._curr, idx);
		return this.get();
	}
	public get_if(pred: (token: lex_info) => boolean, idx?: number): lex_info {
		if ( pred( this.get(idx) ) ) {
			// predがtrueになるまでtoken取得
			while ( pred( this.get_next() ) );
		}
		// 結果を返す
		return this._queue[this._curr]!;
	}

	/**
	 * queueにtokenを追加する
	 */
	public enq(idx: number = 1): void {
		this._enqueue(idx);
	}

	/**
	 * queueの先頭からtokenを取り出す
	 */
	public deq(): lex_info {
		return this._dequeue();
	}

	public curr(): lex_info | null {
		return this._queue[this._curr];
	}

	public count(): number {
		return this._count;
	}

	public pos(idx?: number): number {
		if (idx != null) this._curr = this._incr(this._head, idx);
		return this._curr;
	}

	/**
	 * (キュー上の先頭idx - キュー上の末尾idx) を算出する。
	 * ロジック上、top_idx > btm_idx である前提の計算になる。
	 * @param lhs 
	 * @param rhs 
	 */
	private _diff(top_idx:number, btm_idx:number): number {
		let result: number;
		if (top_idx >= btm_idx) {
			// そのまま計算
			result = top_idx - btm_idx;
		} else {
			// 大小関係が逆の場合は、queueを一周しているとみなす
			result = token_queue.QUEUE_SIZE + top_idx - btm_idx;
		}
		return result;
	}
	private _incr(idx: number, diff: number = 1): number {
		if (idx + diff >= token_queue.QUEUE_SIZE) {
			idx = idx + diff - token_queue.QUEUE_SIZE;
		} else {
			idx += diff;
		}
		return idx;
	}
	private _decr(idx: number, diff: number = 1): number {
		if (idx < diff) {
			idx = token_queue.QUEUE_SIZE - diff + idx;
		} else {
			idx -= diff;
		}
		return idx;
	}

	private _dequeue(): lex_info {
		let token: lex_info | null;
		token = this._queue[this._head];
		this._queue[this._head] = null;
		this._count = this._decr(this._count);
		this._head = this._incr(this._head);
		return token!;
	}
	/**
	 * Lexerからtokenを取得する。
	 */
	private _enqueue(num: number) {
		for (let i = 0; i < num; i++) {
			// Lexer解析実施
			this._lexer.exec();
			// token取得
			let token: lex_info = {
				id: this._lexer.id,
				sub_id: this._lexer.sub_id,
				token: this._lexer.token,
				row: this._lexer.row,
				col: this._lexer.col,
				len: this._lexer.len,
				pos: this._lexer.pos,
			};
			// 取得したtokenをスタックする
			this._queue[this._tail] = token;
			this._tail = this._incr(this._tail);
			this._count = this._incr(this._count);
		}
	}
}

export class parser {

	private lexer: lexer<tokenizer_c, token_id, token_sub_id>;
	private parse_cb?: cb_type;
	private state: parse_state;

	private pn_root: ParseNode<parse_state>;
	private _in_lookAhead: boolean;

	// parser解析ツリーもどき
	private tree: parse_tree_node;					// 解析ツリーもどきroot
	private token_stack: lex_info[];				// LookAheda用のLexerTokenスタック
	private _token_queue: token_queue;
	private tgt_node: parse_tree_node;				// 現コンテキストの解析ツリーもどきへの参照
	private ident_var_tbl: ident_info[];			// 変数名テーブル:declaratorにより宣言される
	private ident_func_tbl: ident_info[];			// 関数名テーブル:declaratorにより宣言される
	private typedef_tbl: ident_info[];				// ユーザ定義型(typedef)テーブル, struct/unionはtypedefしなければidentifier単独で出現しないため、ここには登録しない
	private enum_tbl: string[];						// enum定義テーブル
	private state_stack_tbl: parse_state[];		// parser解析状態スタック：再帰処理をしないための遷移先管理テーブル
	private type_spec_info: type_specifier_info;	// declaration-specifiersの解析内でtype-specifierとして出現した情報の管理
	private expr_info: expr_info;					//
	private expr_info_temp: expr_info;				//
	private expr_info_stack: expr_info[];			// 

	// parse2からの定義
	//private parse_tree!: parse_node;

	constructor(text:string) {
		this.lexer = new lexer<tokenizer_c, token_id, token_sub_id>(tokenizer_c, text);
		this.state = 'null';
		this.tree = this.get_empty_node('translation-unit');
		this.token_stack = [];
		this._token_queue = new token_queue(text);
		this.tgt_node = this.tree;
		this.ident_var_tbl = [];
		this.ident_func_tbl = [];
		this.typedef_tbl = [];
		this.enum_tbl = [];
		this.state_stack_tbl = [];
		this.type_spec_info = {};
		this.expr_info = { expr_enable_assign: true, expr_enable_binary: true, expr_enable_cast: true };
		this.expr_info_temp = { expr_enable_assign: true, expr_enable_binary: true, expr_enable_cast: true };
		this.expr_info_stack = [];
		this.pn_root = new ParseNode<parse_state>('null');
		this.make_parse_tree();
		this._in_lookAhead = false;
	}

	private make_parse_tree() {
		let pn = new ParseNodeGenerator<parse_state>();
		type parse_node = ParseNode<parse_state>;

		// node定義
		let pn_eof = pn.eop('EOF', this.ev_eof, this.at_eof);
		// A.1 Lexical grammar
		// A.1.2 Keywords
		let pn_sizeof = pn.node('sizeof', this.ev_sizeof, this.at_sizeof);
		// A.1.3 Identifiers
		let pn_id = pn.node('identifier', this.ev_identifier, this.at_identifier);
		// A.1.5 Constants
		let pn_const = pn.node('constant', this.ev_constant, this.at_constant);
		// A.1.6 String literals
		let pn_str_lit = pn.node('string-literal', this.ev_str_lit, this.at_str_lit);
		// A.1.7 Punctuators
		let pn_lbracket = pn.node('left-bracket', this.ev_lbracket, this.at_lbracket);
		let pn_rbracket = pn.node('right-bracket', this.ev_rbracket, this.at_rbracket);
		let pn_lparen = pn.node('left-paren', this.ev_lparen, this.at_lparen);
		let pn_rparen = pn.node('right-paren', this.ev_rparen, this.at_rparen);
		let pn_lbrace = pn.node('left-brace', this.ev_lbrace, this.at_lbrace);
		let pn_rbrace = pn.node('right-brace', this.ev_rbrace, this.at_rbrace);
		let pn_dot = pn.node('dot', this.ev_dot, this.at_dot);
		let pn_arrow = pn.node('arrow-operator', this.ev_arrow_op, this.at_arrow_op);
		let pn_incr = pn.node('increment-operator', this.ev_incr_op, this.at_incr_op);
		let pn_decl = pn.node('decrement-operator', this.ev_decl_op, this.at_decl_op);
		let pn_amp = pn.node('ampersand', this.ev_amp, this.at_amp);
		let pn_aster = pn.node('asterisk', this.ev_aster, this.at_aster);
		let pn_plus = pn.node('plus', this.ev_plus, this.at_plus);
		let pn_minus = pn.node('minus', this.ev_minus, this.at_minus);
		let pn_bitw_cmpl_op = pn.node('bitwise_complement_op', this.ev_bitw_cmpl_op, this.at_bitw_cmpl_op);
		let pn_logic_nega_op = pn.node('logical_negation_op', this.ev_logic_nega_op, this.at_logic_nega_op);
		let pn_semicolon = pn.node('semicolon', this.ev_semicolon, this.at_semicolon);
		let pn_comma = pn.node('comma', this.ev_comma, this.at_comma);
		// A.2.1 Expressions
		// (6.5.1) primary-expression:
		let pn_primary_expr: parse_node;
		let pn_primary_expr_else: parse_node;
		// (6.5.2) postfix-expression:
		let pn_postfix_expr_1: parse_node;
		let pn_postfix_expr_1_else: parse_node;
		let pn_postfix_expr_2: parse_node;
		let pn_postfix_expr: parse_node;
		// (6.5.2) argument-expression-list:
		let pn_arg_expr_list = pn.node('argument-expression-list');
		// (6.5.3) unary-expression:
		let pn_unary_expr = pn.node('unary-expression');
		// (6.5.3) unary-operator: one of
		let pn_unary_ope = pn.node('unary-operator');
		// (6.5.4) cast-expression:
		let pn_cast_expr = pn.node('cast-expression');
		// (6.5.16) assignment-expression:
		let pn_assign_expr = pn.node('assignment-expression');
		// (6.5.17) expression:
		let pn_expr: parse_node;
		// (*) expression utility
		let pn_typename_in_expr: parse_node;
		// A.2.2 Declarations
		// (6.7.2) type-specifier:
		let pn_type_spec = pn.node('type-specifier');
		let pn_type_spec_prim = pn.node('type-specifier_prim', this.ev_type_spec_prim, this.at_type_spec_prim);
		// (6.7.2.1) specifier-qualifier-list:
		let pn_spec_qual_list = pn.node('specifier-qualifier-list');
		// (6.7.3) type-qualifier:
		let pn_type_qual = pn.node('type-qualifier', this.ev_type_qual, this.at_type_qual);
		// (6.7.6) type-name:
		let pn_typename = pn.node('type-name');
		// (6.7.8) initializer-list:
		let pn_init_list = pn.node('initializer-list');
	
		let pn_root = pn.node('root', this.ev_null, this.at_null);
		let pn_prepro = pn.node('pp-directive', this.ev_pp, this.at_null);				// preprocessing-directive
		let pn_extern_decl = pn.node('statement', this.ev_null, this.at_null);			// external-declaration
		let pn_decl_spec = pn.node('declaration-specifiers', this.ev_decl_spec, this.at_null);		// declaration-specifiers
		let pn_init_decl_list = pn.node('statement', this.ev_null, this.at_null);		// init-declarator-list
		let pn_declarator = pn.node('statement', this.ev_null, this.at_null);			// declarator
		let pn_decl_list = pn.node('statement', this.ev_null, this.at_null);				// declaration-list
		let pn_compound_state = pn.node('statement', this.ev_null, this.at_null);		// compound-statement

		// 解析ツリー作成
		// A.2.1 Expressions
		pn_expr = pn.root('expression');
		// (*) expression utility
		pn_typename_in_expr = pn.node('typename_in_expr', this.ev_null, this.at_null);
		// (6.5.1) primary-expression:
		pn_primary_expr_else = pn.else('primary-expression_error', this.at_com_err_not_stop);
		pn_primary_expr = pn.node('primary-expression')
			.or([
				pn_id,
				pn_const,
				pn_str_lit,
				// ( expr ) はcast-exprと競合があるため注意
				pn.seq([pn_lparen, pn_expr, pn_rparen]).else(pn_primary_expr_else),
			]);
		// (6.5.2) postfix-expression:
		pn_postfix_expr_1_else = pn.else('postfix-expression_1_error', this.at_com_err_not_stop);
		pn_postfix_expr_1 = pn.node('postfix-expression_1')
			.or([
				pn.seq([pn_lbracket, pn_expr, pn_rbracket]).else(pn_postfix_expr_1_else),
				pn_lparen.opt(pn_arg_expr_list).seq([pn_rbracket]).else(pn_postfix_expr_1_else),
				pn_dot.seq([pn_id]).else(pn_postfix_expr_1_else),
				pn_arrow.seq([pn_id]).else(pn_postfix_expr_1_else),
				pn_incr,
				pn_decl,
			]);
		pn_postfix_expr_2 = pn.node('postfix-expression_2')
			.or([
				pn.seq([pn_lparen, pn_typename, pn_rparen, pn_lbrace, pn_init_list]).opt(pn_comma).seq([pn_rbrace]),
			]);
		pn_postfix_expr = pn.node('postfix-expression')
			.or([
				pn.seq([pn_primary_expr]).many(pn_postfix_expr_1),
//				pn.seq([pn_primary_expr, pn.many(pn_postfix_expr_1)]),	// ↑どっちでも同じ
//				pn_postfix_expr_2	// cast-exprと構文の競合があるので、cast-expr内で処理する。
			]);
		// (6.5.2) argument-expression-list:
		pn_arg_expr_list.seq([
			pn_assign_expr, pn.many(pn.seq([pn_comma, pn_assign_expr]))
		]);
		// (6.5.3) unary-expression:
		pn_unary_expr.or([
			pn_postfix_expr,
			pn.seq([pn_incr, pn_unary_expr]),
			pn.seq([pn_decl, pn_unary_expr]),
			pn.seq([pn_unary_ope, pn_cast_expr]),
			pn.seq([pn_sizeof]),
		]);
		// (6.5.3) unary-operator: one of
		pn_unary_ope.or([
			pn_amp,
			pn_aster,
			pn_plus,
			pn_minus,
			pn_bitw_cmpl_op,
			pn_logic_nega_op,
		]);
		// (6.5.4) cast-expression:
		// 先頭のleft paren, left paren + type-name がgrammar上競合する。
		// lookAheadで判定を先に実行する。
		//     (1) cast-expression:    ( type-name ) cast-expression
		//     (2) postfix-expression: ( type-name ) { initializer-list }
		//     (3) primary-expression: ( expression )
		// 「( type-name )」の後には、cast-expr か postfix-exprのinit-list が出現する可能性がある。
		// grammarの節を越えて競合がある点に注意。
		pn_cast_expr.or([
			// postfix-expression: init-list はここで判定する
			pn.lookAhead( pn.seq([pn_lparen, pn_typename, pn_rparen]), this.at_la_before, this.at_la_after)
				.or([
					pn.seq([pn_lbrace, pn_init_list]).opt(pn_comma).seq([pn_rbrace]),
					pn_cast_expr,
				]),
			pn_unary_expr,
		])
		// (6.5.17) expression:
		pn_expr.many(pn_postfix_expr);
		// A.2.2 Declarations
		// (6.7.2) type-specifier:
		pn_type_spec.or([
			pn_type_spec_prim,

		]);
		// (6.7.2.1) specifier-qualifier-list:
		pn_spec_qual_list.many1(
			pn.or([
				pn_type_spec,
				pn_type_qual,
			])
		);
		// (6.7.6) type-name:
		pn_typename.seq([pn_spec_qual_list, ]);
		// external-declaration
		// function-definition / declaration は declaration-specifier まで共通
		/*
		pn_extern_decl.seq(pn_decl_spec).or([
			pn_declarator.seq(pn.opt(pn_decl_list)).seq(pn_compound_state),								// function-definition
			pn_init_decl_list.seq(pn.new('semicolon', this.ev_null, this.en_null))							// declaration
		])
		*/
		// translation-unit
		// external-declaration の繰り返し
		let pn_trans_unit: parse_node = pn.node('translation-unit').many(pn_extern_decl);
		// ルート要素定義
		// prepro-directive or translation-unit の解析を実施
		/*
		pn_root.action_post(this.at_post)
			.or([
				pn_prepro,
				pn_trans_unit
			]);
		*/
		pn_root
			.many(
				pn.or([
					pn.seq([pn_cast_expr, pn_semicolon]),
					pn_eof,
				])
			);

		this.pn_root = pn_root;
		this.pn_root.action_post(this.at_post);
	}


	public exec(): boolean {
		// 空白をスキップ
		this.skip_whitespace();
		// 状態遷移チェック
		let result = this.pn_root.parse();

		return result;
	}
	public get parse_tree(): parse_tree_node {
		return this.tree;
	}


	// state trans event check
	// 状態遷移チェック
	// root node用：遷移条件なし
	private ev_null(): boolean {
		// 条件なし
		return true;
	}
	private at_post = (): void => {
		// 空白を事前にスキップ
		this.skip_whitespace();
	}

	/**
	 * action:
	 * lookAhead before process
	 */
	private at_la_before = (): void => {
		this._in_lookAhead = true;
		this._token_queue.pos(0);
	}
	/**
	 * action:
	 * lookAhead after process
	 */
	private at_la_after = (): void => {
		this._in_lookAhead = false;
	}

	/**
	 * EOF
	 */
	private ev_eof = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'EOF':
				check_result = true;
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	private at_eof = (): void => {
		this.push_parse_node('EOF');
	}

	///////////////////////////////////////
	// A.1 Lexical grammar
	///////////////////////////////////////
	/**
	 * event:
	 * sizeof 状態遷移判定
	 */
	private ev_sizeof = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'sizeof':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * sizeof 状態処理
	 */
	private at_sizeof = (): void => {
		this.push_parse_node('sizeof');
	}

	/**
	 * event:
	 * identifier 状態遷移判定
	 */
	private ev_identifier = ():boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'identifier':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * identifier 状態処理
	 */
	private at_identifier = (): void => {
		this.push_parse_node('identifier');
	}

	/**
	 * event:
	 * constant 状態遷移判定
	 */
	private ev_constant = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'char_constant':
			case 'decimal_constant':
			case 'decimal_float_constant':
			case 'hex_constant':
			case 'hex_float_constant':
			case 'octal_constant':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * constant 状態処理
	 */
	private at_constant = (): void => {
		this.push_parse_node('constant');
	}

	/**
	 * event:
	 * string-literal 状態遷移判定
	 */
	private ev_str_lit = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'string_literal':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * string-literal 状態処理
	 */
	private at_str_lit = (): void => {
		this.push_parse_node('string-literal');
	}

	/**
	 * event:
	 * left-bracket 状態遷移判定
	 */
	private ev_lbracket = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'left_bracket':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * left-bracket 状態処理
	 */
	private at_lbracket = (): void => {
		this.push_parse_node('left-bracket');
	}

	/**
	 * event:
	 * right-bracket 状態遷移判定
	 */
	private ev_rbracket = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'right_bracket':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * right-bracket 状態処理
	 */
	private at_rbracket = (): void => {
		this.push_parse_node('right-bracket');
	}

	/**
	 * event:
	 * left-brace 状態遷移判定
	 */
	private ev_lbrace = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'left_brace':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * left-brace 状態処理
	 */
	private at_lbrace = (): void => {
		this.push_parse_node('left-brace');
	}

	/**
	 * event:
	 * right-brace 状態遷移判定
	 */
	private ev_rbrace = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'right_brace':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * right-brace 状態処理
	 */
	private at_rbrace = (): void => {
		this.push_parse_node('right-brace');
	}

	/**
	 * event:
	 * left-paren 状態遷移判定
	 */
	private ev_lparen = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'left_paren':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * left-paren 状態処理
	 */
	private at_lparen = (): void => {
		this.push_parse_node('left-paren');
	}

	/**
	 * event:
	 * right-paren 状態遷移判定
	 */
	private ev_rparen = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'right_paren':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * right-paren 状態処理
	 */
	private at_rparen = (): void => {
		this.push_parse_node('right-paren');
	}

	/**
	 * event:
	 * dot 状態遷移判定
	 */
	private ev_dot = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'dot':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * dot 状態処理
	 */
	private at_dot = (): void => {
		this.push_parse_node('dot');
	}

	/**
	 * event:
	 * arrow-operator 状態遷移判定
	 */
	private ev_arrow_op = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'arrow_op':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * arrow-operator 状態処理
	 */
	private at_arrow_op = (): void => {
		this.push_parse_node('arrow-operator');
	}

	/**
	 * event:
	 * increment-operator 状態遷移判定
	 */
	private ev_incr_op = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'increment_op':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * increment-operator 状態処理
	 */
	private at_incr_op = (): void => {
		this.push_parse_node('increment-operator');
	}

	/**
	 * event:
	 * decrement-operator 状態遷移判定
	 */
	private ev_decl_op = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'decrement_op':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * decrement-operator 状態処理
	 */
	private at_decl_op = (): void => {
		this.push_parse_node('decrement-operator');
	}

	/**
	 * event:
	 * ampersand 状態遷移判定
	 */
	private ev_amp = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'ampersand':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * ampersand 状態処理
	 */
	private at_amp = (): void => {
		this.push_parse_node('ampersand');
	}

	/**
	 * event:
	 * asterisk 状態遷移判定
	 */
	private ev_aster = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'asterisk':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * asterisk 状態処理
	 */
	private at_aster = (): void => {
		this.push_parse_node('asterisk');
	}

	/**
	 * event:
	 * plus 状態遷移判定
	 */
	private ev_plus = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'plus':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * plus 状態処理
	 */
	private at_plus = (): void => {
		this.push_parse_node('plus');
	}

	/**
	 * event:
	 * minus 状態遷移判定
	 */
	private ev_minus = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'minus':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * minus 状態処理
	 */
	private at_minus = (): void => {
		this.push_parse_node('minus');
	}

	/**
	 * event:
	 * bitwise_complement_op 状態遷移判定
	 */
	private ev_bitw_cmpl_op = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'bitwise_complement_op':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * bitwise_complement_op 状態処理
	 */
	private at_bitw_cmpl_op = (): void => {
		this.push_parse_node('bitwise_complement_op');
	}

	/**
	 * event:
	 * logical_negation_op 状態遷移判定
	 */
	private ev_logic_nega_op = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'logical_negation_op':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * logical_negation_op 状態処理
	 */
	private at_logic_nega_op = (): void => {
		this.push_parse_node('logical_negation_op');
	}

	/**
	 * event:
	 * semicolon 状態遷移判定
	 */
	private ev_semicolon = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'semicolon':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * semicolon 状態処理
	 */
	private at_semicolon = (): void => {
		this.push_parse_node('semicolon');
	}

	/**
	 * event:
	 * comma 状態遷移判定
	 */
	private ev_comma = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'comma':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * comma 状態処理
	 */
	private at_comma = (): void => {
		this.push_parse_node('comma');
	}

	/**
	 * event:
	 * type-specifier_組み込み型 状態遷移判定
	 */
	private ev_type_spec_prim = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'void':
			case 'char':
			case 'short':
			case 'int':
			case 'long':
			case 'float':
			case 'double':
			case 'signed':
			case 'unsigned':
			case '_Bool':
			case '_Complex':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * type-specifier_組み込み型 状態処理
	 */
	private at_type_spec_prim = (): void => {
		this.push_parse_node('type-specifier');
	}

	/**
	 * event:
	 * type-qualifier 状態遷移判定
	 */
	private ev_type_qual = (): boolean => {
		let check_result: boolean = false;
		switch (this.get_token_id()) {
			case 'const':
			case 'restrict':
			case 'volatile':
				check_result = true;
				this.get_token_next();
				break;
			default:
				check_result = false;
				break;
		}
		return check_result;
	}
	/**
	 * action:
	 * type-qualifier 状態処理
	 */
	private at_type_qual = (): void => {
		this.push_parse_node('type-qualifier');
	}

	/**
	 * action:
	 * common error, not stop
	 */
	private at_com_err_not_stop = (states: parse_state[]): void => {
		this.push_error_node(states[0], 'unexpected-token');
	}


	// preprocessing-directive
	private ev_pp(): boolean {
		// 必ずdeclaration-specifiersから始まる。
		// ただし、pp-directivesの処理をしていないのでここで登場する。
		switch (this.get_token_id()) {
			// Preprocessor directive
			case 'pp_define':
			case 'pp_elif':
			case 'pp_else':
			case 'pp_endif':
			case 'pp_error':
			case 'pp_if':
			case 'pp_ifdef':
			case 'pp_ifndef':
			case 'pp_include':
			case 'pp_invalid_keyword':
			case 'pp_line':
			case 'pp_pragma':
			case 'pp_token':
			case 'pp_undef':
				this.get_token_next();
				return true;
				break;
		}

		return false;
	}
	// declaration-specifiers
	private ev_decl_spec(): boolean {
		if (this.is_declaration_token()) {
			// declaration(-specifier)開始tokenであればroot treeを作成して解析開始
			this.switch_new_context('@undecided', 'root_decl-spec', 'root_end');
			// function-definition / declaration は declaration-specifier まで共通
			// declaration-specifierの解析開始
			this.switch_new_context('declaration-specifier', 'decl-specifiers', 'root_decl-spec');
			return true;
		}

		return false;
	}

	// state entry action
	private at_null(): void {
		// 処理なし
	}
	private en_pp(): void {
		// 1文で終了
		// 詳細解析はLexer側が未対応
		// 新規解析ツリーを作成
		this.switch_new_context('pp-directive', 'pp_group_part', 'root_end');
		// 解析ツリーに出現トークンを登録
		this.push_parse_node('pp-directive');
	}







	/**
	 * function-definition or declaration を判定する
	 * declaration-specifier declarator まで検出した状態から解析する
	 * 	-> [declaration]			init-declarator-list or ; につながる
	 * 	-> [function-definition]	declaration-list or { につながる
	 */
	private lookahead_jdg_func_decl(pos: number = 0): [parse_state, number] {
		let la_fin: boolean = false;
		let id: token_id;
		let id_stack: token_id[] = [];
		let is_declarator: boolean;
		let is_declaration: boolean;

		let result: parse_state = '@undecided';

		// 空白を事前にスキップ
		this.skip_whitespace();

		// 先読み判定を実施
		// 判定：1st token
		// 空白文字以外のtokenを取得
		[id, pos] = this.get_token_id_if_not_whitespace(pos);
		switch (id) {
			case 'semicolon':
			case 'simple_assign_op':
				return ['declaration', pos];
				break;
			case 'left_brace':
				return ['function-definition', pos];
				break;
			default:
				// その他は解析継続
				break;
		}
		//開始token判定
		is_declarator = this.is_declarator_token(id);
		is_declaration = this.is_declaration_token(id);
		if (is_declarator && is_declaration) {
			// 重複は解析継続
		} else if (is_declarator) {
			return ['declaration', pos];
		} else if (is_declaration) {
			return ['function-definition', pos];
		} else {
			// その他は構文エラー
			return ['@undecided', pos];
		}

		// 未確定であれば検出済みcontextから判定
		// このcontextでは直前にdeclaratorが出現している前提
		// declaratorが変数宣言だったか関数宣言だったか判定する
		let prev_ctx: parse_state;
		prev_ctx = 'null';
		let { valid, node } = this.get_prev_node_if_not_whitespace();
		//念のため正常に取得できたかチェック
		if (valid) {
			// 直前のtoken/contextによりcontextが確定する
			switch (node!.state) {
				case 'declarator_var':
					prev_ctx = 'declarator_var';
					break;
				case 'declarator_func':
					prev_ctx = 'declarator_func';
					for (let child of node!.child) {
						if (child.lex && child.lex.id == 'asterisk') prev_ctx = 'declarator_var';
					}
					break;
				case 'declarator':
					// ( が出現した場合スタックしていくのでツリーをたどる
					let id_node: parse_tree_node | null;
					id_node = this.get_node_declarator_id(node!);
					if (id_node) {
						switch (id_node!.state) {
							case 'declarator_var':
								prev_ctx = 'declarator_var';
								break;
							case 'declarator_func':
								prev_ctx = 'declarator_func';
								break;
						}
					}
					break;

				default:
					// その他tokenはありえない
					break;
			}
		}
		switch (prev_ctx) {
			case 'declarator_var':
				return ['declaration', pos];
				break;
			case 'declarator_func':
				return ['function-definition', pos];
				break;
			default:
				// その他のcontextはありえない
				return ['@undecided', pos];
				break;
		}
	}
	/**
	 * context解析
	 * statement か declaration(=declaration-specifiers) が出現するcontextにおいて、
	 * どちらが出現したかをtoken先読みで判定する。
	 */
	private lookahead_jdg_state_decl(pos: number = 0): [parse_state, number] {
		let la_fin: boolean = false;
		let id: token_id;
		let id_stack: token_id[] = [];
		let is_decl: boolean;
		let is_state: boolean;

		let result: parse_state = '@undecided';

		// 空白をスキップ
		this.skip_whitespace();

		// 判定：1st token
		// 空白文字以外のtokenを取得
		[id, pos] = this.get_token_id_if_not_whitespace(pos);
		// 先頭token判定
		is_decl = this.is_declaration_token(id);
		is_state = this.is_statement(id);
		if (is_decl && is_state) {
			// token重複
			// identifierのみ重複のはず
			if (this.is_typedef_token()) {
				// typedef-nameであればdeclarationで確定
				return ['declaration', pos];
			} else if (this.is_ident_var_token()) {
				// 変数名であればstatementで確定
				return ['statement', pos];
			} else if (this.is_ident_func_token()) {
				// 関数名であればstatementで確定
				return ['statement', pos];
			} else {
				// 該当なしであれば、tokenを先読みして判定する
			}
		} else if (is_decl) {
			// declarationで確定
			return ['declaration', pos];
		} else if (is_state) {
			// expressionで確定
			return ['statement', pos];
		} else {
			// 規定外のtoken出現
			return ['@undecided', pos];
		}

		// identifier が expression or declarator か判定を実施
		// typedefの解析をしっかり行えば不要な判定なので
		// 強引に先読みして判定を実施する。

		// 判定：2nd token
		// 空白文字以外のtokenを取得
		[id, pos] = this.get_token_id_if_not_whitespace(pos + 1);
		switch (id) {
			// expression context
			// idに続くtoken
			case 'dot':
			case 'arrow_op':
			case 'increment_op':
			case 'decrement_op':
				return ['statement', pos];
				break;

			// declaration context
			// idに続くtoken
			case 'typedef':
			case 'extern':
			case 'static':
			case 'auto':
			case 'register':
			case 'void':
			case 'char':
			case 'short':
			case 'int':
			case 'long':
			case 'int':
			case 'long':
			case 'float':
			case 'double':
			case 'signed':
			case 'unsigned':
			case '_Bool':
			case '_Complex':
			case 'struct':
			case 'union':
			case 'enum':
			case 'identifier':
			// expressionのcontextではidentifierは2回登場しない
			case 'const':
			case 'restrict':
			case 'volatile':
			case 'inline':
				return ['declaration', pos];
				break;

			// 重複
			case 'semicolon':
				// id ; でcontext終了
				// 型省略とみなす。
				// 型省略の宣言と判定：(int) id ;
				return ['declaration', pos];
				break;
			case 'left_bracket':
			case 'left_paren':
			case 'comma':
			case 'asterisk':
				// これらの後にはどちらも出現しうる
				// 次の解析へ
				id_stack.push(id);
				break;

			default:
				// 規定外のtoken出現
				return ['@undecided', pos];
				break;
		}

		// 判定：3rd token
		// 空白文字以外のtokenを取得
		[id, pos] = this.get_token_id_if_not_whitespace(pos + 1);
		switch (id_stack[0]) {
			case 'left_bracket':
				// 中身が空のカッコはdeclarator
				if (id == 'right_bracket') {
					return ['declaration', pos];
				}
				break;
			case 'left_paren':
				// 中身が空のカッコはdeclarator
				if (id == 'right_paren') {
					return ['declaration', pos];
				}
				break;
			case 'comma':
			case 'asterisk':
				break;
		}
		// 再帰的に判定実施
		[result, pos] = this.lookahead_jdg_state_decl(pos);
		// 判定完了していたら終了
		if (result != '@undecided') {
			return [result, pos];
		}

		// ここまででダメならひとまずdeclarationとみなす
		return ['declaration', pos];
	}

	/**
	 * context解析
	 * parameter-type-list か identifier-list が出現するcontextにおいて、
	 * どちらが出現したかをtoken先読みで判定する。
	 */
	private lookahead_jdg_list_param_id(pos: number = 0): [parse_state, number] {
		let la_fin: boolean = false;
		let id: token_id;
		let id_stack: token_id[] = [];
		let is_decl: boolean;

		let result: parse_state = '@undecided';

		// identifierが出現したときに判定するためにコールする前提
		// 空白をスキップ
		// this.skip_whitespace();

		// 判定：1st token
		// 空白文字以外のtokenを取得
		[id, pos] = this.get_token_id_if_not_whitespace(pos);
		// 先頭token判定
		is_decl = this.is_declaration_token(id);
		if (id == 'identifier') {
			// identifierのみ重複、個別に判定
			if (this.is_typedef_token()) {
				// typedef-nameであればdeclarationで確定
				return ['parameter-type-list', pos];
			} else if (this.is_ident_var_token()) {
				// 変数名であればidentifier-listで確定
				return ['identifier-list', pos];
			} else if (this.is_ident_func_token()) {
				// 関数名であればidentifier-listで確定
				return ['identifier-list', pos];
			} else {
				// 該当なしであれば、tokenを先読みして判定する
			}
		} else {
			// identifierが前提なのでこちらのパスにはこない
			this.push_error_node("parameter-type-list", '@logic_error');
			if (is_decl) {
				// declarationで確定
				return ['parameter-type-list', pos];
			} else {
				// 規定外のtoken出現
				return ['@undecided', pos];
			}
		}

		// 判定：2nd token
		// 空白文字以外のtokenを取得
		[id, pos] = this.get_token_id_if_not_whitespace(pos + 1);
		if (this.is_declaration_token(id)) {
			// declarationで確定
			return ['parameter-type-list', pos];
		} else if (this.is_declarator_token(id)) {
			// declarationで確定
			return ['parameter-type-list', pos];
		} else {
			// declaration,declarator以外であればidentifier-listとみなす
			return ['identifier-list', pos];
		}
	}

	/**
	 * declarator か abstract-declarator かを判定する
	 * @param pos 
	 */
	private lookahead_jdg_decl_abst(pos: number = 0): [parse_state, number] {
		let la_fin: boolean = false;
		let id: token_id;
		let id_stack: token_id[] = [];
		let is_decl: boolean;

		let result: parse_state = '@undecided';

		// 判定：1st token
		// 空白文字以外のtokenを取得
		[id, pos] = this.get_token_id_if_not_whitespace(pos);
		// ( は読み飛ばす
		while (id == 'left_paren' || id == 'asterisk') {
			[id, pos] = this.get_token_id_if_not_whitespace(pos + 1);
		}
		switch (id) {
			case 'identifier':
				// identiriferが出現したらdeclarator
				return ['declarator', pos];
			default:
				// その他tokenならabstract-declarator
				return ['abstract-declarator', pos];
		}
	}

	/**
	 * expression or type-name を判定する
	 */
	private lookahead_jdg_expr_typename(pos: number = 0): [parse_state, number] {
		let la_fin: boolean = false;
		let id: token_id;
		let id_stack: token_id[] = [];
		let is_decl: boolean;

		let result: parse_state = '@undecided';

		// 空白を事前にスキップ
		this.skip_whitespace();

		// 判定：1st token
		// 空白文字以外のtokenを取得
		[id, pos] = this.get_token_id_if_not_whitespace(pos);
		//出現しているtokenをチェック
		let is_typename = this.is_typename_token(id);
		let is_expression = this.is_expression_token(id);
		if (is_typename && is_expression) {
			// 両方成立しているとき
			// 重複はidentifierのみ
			if (this.is_typedef_token()) {
				return ['type-name', pos];
			} else if (this.is_ident_var_token()) {
				return ['expression', pos];
			} else if (this.is_ident_func_token()) {
				return ['expression', pos];
			} else {
				// 次の解析
			}
		} else if (is_typename) {
			// typename tokenが出現
			return ['type-name', pos];
		} else if (is_expression) {
			// expression tokenが出現
			return ['expression', pos];
		} else {
			// 両方不成立
			return ['@undecided', pos];
		}

		// 判定：2nd token
		// 空白文字以外のtokenを取得
		[id, pos] = this.get_token_id_if_not_whitespace(pos + 1);
		switch (id) {
			case 'identifier':
				// expressionではidentifierは2度出現しない
				// typename tokenとみなす
				return ['type-name', pos];
				break;

			case 'right_paren':
				// ) が出現したらcontextが終了
				// type-nameとみなす
				// 3rd tokenが { ならtype-name確定だが、
				// いずれにせよtype-nameになるので先読み確認は省略
				return ['type-name', pos];
				break;

			// expression
			case 'dot':
			case 'arrow_op':
			case 'increment_op':
			case 'decrement_op':
			case 'div_op':
			case 'remain_op':
			case 'plus':
			case 'minus':
			case 'left_shift_op':
			case 'right_shift_op':
			case 'lt_op':
			case 'gt_op':
			case 'lte_op':
			case 'gte_op':
			case 'equal_op':
			case 'inequal_op':
			case 'ampersand':
			case 'bitwise_EXOR_op':
			case 'bitwise_OR_op':
			case 'logical_AND_op':
			case 'logical_OR_op':
			case 'conditional_op':
			case 'simple_assign_op':
			case 'mul_assign_op':
			case 'div_assign_op':
			case 'remain_assign_op':
			case 'add_assign_op':
			case 'sub_assign_op':
			case 'left_shift_assign_op':
			case 'right_shift_assign_op':
			case 'bitwise_AND_assign_op':
			case 'bitwise_EXOR_assign_op':
			case 'bitwise_OR_assign_op':
			case 'comma':
				return ['expression', pos];
				break;

			// 重複
			case 'left_bracket':
			case 'left_paren':
				// 判定：3rd token
				// 空白文字以外のtokenを取得
				[id, pos] = this.get_token_id_if_not_whitespace(pos + 1);
				//出現しているtokenをチェック
				let is_decl = this.is_declaration_token(id);
				is_expression = this.is_expression_token(id);
				if (is_decl && is_expression) {
					//T.B.D.
				} else if (is_decl) {
					// typename tokenとみなす
					return ['type-name', pos];
				} else if (is_expression) {
					// expression tokenが出現
					return ['expression', pos];
				} else {
					//T.B.D.
				}
				// typename tokenとみなす
				return ['type-name', pos];
				break;
			case 'asterisk':
				// 判定：3rd token
				// 空白文字以外のtokenを取得
				[id, pos] = this.get_token_id_if_not_whitespace(pos + 1);
				//出現しているtokenをチェック
				is_expression = this.is_expression_token(id);
				if (is_expression) {
					// expression tokenが出現
					return ['expression', pos];
				} else {
					// typename tokenとみなす
					return ['type-name', pos];
				}
				break;

			default:
				return ['@undecided', pos];
				break;
		}
	}


	/**
	 * 次に出現しているtokenが空白以外になるようにする
	 */
	private skip_whitespace() {
		if (this._token_queue.count() == 0) {
			while (this.is_whitespace()) {
				this.push_parse_node('@WHITESPACE');
			}
		}
	}
	private is_whitespace(id?: token_id): boolean {
		let result: boolean;
		result = false;

		if (!id) id = this._token_queue.get(0).id;

		switch (id) {
			case 'WHITESPACE':
			case 'NEWLINE':
			case 'COMMENT':
			case '__far':		// とりあえず無視する
			case '__near':		// とりあえず無視する
				result = true;
				break;
		}

		return result;
	}
	/*
	private skip_whitespace() {
		while (this.is_whitespace()) {
			this.push_parse_node('@WHITESPACE');
		}
	}
	private is_whitespace(id?: token_id): boolean {
		let result: boolean;
		result = false;

		if (!id) id = this.get_token_id();

		switch (id) {
			case 'WHITESPACE':
			case 'NEWLINE':
			case 'COMMENT':
			case '__far':		// とりあえず無視する
			case '__near':		// とりあえず無視する
				result = true;
				break;
		}

		return result;
	}
	*/

	/**
	 * 出現しているtokenがdeclarationの開始tokenか判定する
	 */
	private is_declaration_token(id?: token_id): boolean {
		let result: boolean;
		result = false;

		if (!id) id = this.get_token_id();

		switch (id) {
			// storage-class-specifier
			case 'typedef':
			case 'extern':
			case 'static':
			case 'auto':
			case 'register':
			// type-qualifier
			case 'const':
			case 'restrict':
			case 'volatile':
			// function specifier
			case 'inline':
			// type-specifier
			case 'void':
			case 'char':
			case 'short':
			case 'int':
			case 'long':
			case 'float':
			case 'double':
			case 'signed':
			case 'unsigned':
			case '_Bool':
			case '_Complex':
			case 'struct':
			case 'union':
			case 'enum':
			case 'identifier':
				result = true;
				break;
		}

		return result;
	}

	/**
	 * 出現しているtokenがdeclaratorの開始tokenか判定する
	 */
	private is_declarator_token(id?: token_id): boolean {
		let result: boolean;
		result = false;

		if (!id) id = this.get_token_id();

		switch (id) {
			case 'asterisk':
			case 'left_paren':
			case 'identifier':
				result = true;
				break;
		}

		return result;
	}

	/**
	 * 現在出現しているtokenがexpressionの開始tokenかどうか判定する
	 */
	private is_expression_token(id?: token_id): boolean {
		let result: boolean;
		result = false;

		if (!id) id = this.get_token_id();

		switch (id) {
			// primary-expression
			//	identifier
			//	constant
			//	string-literal
			//	( expression )
			// postfix-expression
			// unary-expression
			//	++
			//	--
			//	unary-operator
			//		&
			//		*
			//		+
			//		-
			//		~
			//		!
			//	sizeof
			// cast-expression
			//	( type-name )
			case 'identifier':
			case 'char_constant':
			case 'decimal_constant':
			case 'decimal_float_constant':
			case 'hex_constant':
			case 'hex_float_constant':
			case 'octal_constant':
			case 'string_literal':
			case 'left_paren':
			case 'increment_op':
			case 'decrement_op':
			case 'ampersand':
			case 'asterisk':
			case 'plus':
			case 'minus':
			case 'bitwise_complement_op':
			case 'logical_negation_op':
			case 'sizeof':
				result = true;
				break;
		}

		return result;
	}

	/**
	 * tokenがstatement開始tokenか判定する
	 * @param id 
	 */
	private is_statement(id?: token_id): boolean {
		let result: boolean;
		result = false;

		if (!id) id = this.get_token_id();

		switch (id) {
			case 'case':
			case 'default':
			case 'left_brace':
			case 'semicolon':
			case 'if':
			case 'switch':
			case 'while':
			case 'do':
			case 'for':
			case 'goto':
			case 'continue':
			case 'break':
			case 'return':
				result = true;
				break;
			case 'identifier':
				result = true;
				break;
			default:
				if (this.is_expression_token(id)) result = true;
				break;
		}

		return result;
	}

	/**
	 * 現在出現しているtokenが変数名かどうか判定する
	 */
	private is_ident_var_token(token?: string): boolean {
		if (!token) token = this.get_token_str();
		for (let info of this.ident_var_tbl) {
			if (info.token == token) return true;
		}
		return false;
	}
	/**
	 * 現在出現しているtokenが関数名かどうか判定する
	 */
	private is_ident_func_token(token?: string): boolean {
		if (!token) token = this.get_token_str();
		for (let info of this.ident_func_tbl) {
			if (info.token == token) return true;
		}
		return false;
	}
	/**
	 * 現在出現しているtokenがtypedef-nameかどうか判定する
	 */
	private is_typedef_token(token?: string): boolean {
		if (!token) token = this.get_token_str();
		for (let info of this.typedef_tbl) {
			if (info.token == token) return true;
		}
		return false;
	}

	/**
	 * 現在出現しているtokenがtype-nameかどうか判定する
	 */
	private is_typename_token(token?: string): boolean {
		let result: boolean;
		result = false;

		if (!token) token = this.get_token_str();
		if (this.is_type_specifier_token(token) || this.is_type_qualifier_token(token)) {
			result = true;
		}

		return result;
	}

	/**
	 * 現在出現しているtokenがtype-specifierかどうか判定する
	 */
	private is_type_specifier_token(token?: string): boolean {
		let result: boolean;
		result = false;

		if (!token) token = this.get_token_str();
		switch (token) {
			case 'void':
			case 'char':
			case 'short':
			case 'int':
			case 'long':
			case 'float':
			case 'double':
			case 'signed':
			case 'unsigned':
			case '_Bool':
			case '_Complex':
			case 'struct':
			case 'union':
			case 'enum':
			case 'identifier':
				result = true;
				break;
		}

		return result;
	}

	/**
	 * 現在出現しているtokenがtype-qualifierかどうか判定する
	 */
	private is_type_qualifier_token(token?: string): boolean {
		let result: boolean;
		result = false;

		if (!token) token = this.get_token_str();
		switch (token) {
			case 'const':
			case 'restrict':
			case 'volatile':
				result = true;
				break;
		}

		return result;
	}

	/**
	 * 出現しているtokenがabstract-declaratorの開始tokenかどうか判定する。
	 */
	private is_abst_decl_begin_token(): boolean {
		let result: boolean;
		result = false;

		switch (this.get_token_id()) {
			case 'asterisk':
			case 'left_paren':
			case 'left_bracket':
				result = true;
				break;
		}

		return result;
	}

	/**
	 * 出現しているtokenがdesignatorの開始tokenかどうか判定する。
	 */
	private is_designator_token(): boolean {
		let result: boolean;
		result = false;

		switch (this.get_token_id()) {
			case 'dot':
			case 'left_bracket':
				result = true;
				break;
		}

		return result;
	}


	/**
	 * type_spec_infoを初期化
	 */
	private init_type_spec_info() {
		this.type_spec_info = {};
	}
	/**
	 * type-specifierにおいて
	 */
	private is_type_spec_duplicated(id: token_id): boolean {
		let result: boolean;

		// false/duplicateなし で初期化
		result = false;

		switch (id) {
			case 'signed':
			case 'unsigned':
				// signed/unsignedが出現済みだとNG
				if (this.type_spec_info.sign_def != null) {
					result = true;
				}
				// enum/struct/union/typedef-nameには共起しない
				if (
					(this.type_spec_info.enum_def != null)
					|| (this.type_spec_info.id_def != null)
					|| (this.type_spec_info.struct_def != null)
					|| (this.type_spec_info.union_def != null)
				) {
					result = true;
				}
				// primitive-typeの修飾はOK
				if (this.type_spec_info.spec_def != null) {
					result = false;
				}
				break;

			case 'void':
			case 'char':
			case 'short':
			case 'int':
			case 'long':
			case 'float':
			case 'double':
			case '_Bool':
			case '_Complex':
			case '__far':
			case '__near':
				// signed/unsignedの修飾はOK
				if (this.type_spec_info.sign_def != null) {
					result = false;
				}
				// enum/struct/union/typedef-nameには共起しない
				if (
					(this.type_spec_info.enum_def != null)
					|| (this.type_spec_info.id_def != null)
					|| (this.type_spec_info.struct_def != null)
					|| (this.type_spec_info.union_def != null)
				) {
					result = true;
				}
				// primitive-typeが出現済みだとNG
				if (this.type_spec_info.spec_def != null) {
					result = true;
				}
				break;

			case 'struct':
			case 'union':
			case 'enum':
			case 'identifier':
				// signed/unsignedが出現済みだとNG
				if (this.type_spec_info.sign_def != null) {
					result = true;
				}
				// enum/struct/union/typedef-nameには共起しない
				if (
					(this.type_spec_info.enum_def != null)
					|| (this.type_spec_info.id_def != null)
					|| (this.type_spec_info.struct_def != null)
					|| (this.type_spec_info.union_def != null)
				) {
					result = true;
				}
				// primitive-typeが出現済みだとNG
				if (this.type_spec_info.spec_def != null) {
					result = true;
				}
				break;

			default:
				// その他tokenはありえない
				break;
		}

		return result;
	}

	/**
	 * declarationの評価を実施
	 */
	private eval_declaration(tgt_node?: parse_tree_node): boolean {
		let result: boolean;
		result = true;

		// 引数未指定であれば現在contextを対象とする
		if (tgt_node == undefined) {
			tgt_node = this.get_curr_node();
		}

		// declaration評価
		let decl_spec_node: parse_tree_node | null = null;
		let decl_node: parse_tree_node | null = null;
		let has_decl_spec: boolean = false;
		let has_decl: boolean = false;
		let has_decl_var: boolean = false;
		let has_decl_func: boolean = false;
		let has_err: boolean = false;
		tgt_node.child.forEach(node => {
			if (node.err_info != 'null') has_err = true;
			if (node.state == 'declaration-specifier') {
				decl_spec_node = node;
				has_decl_spec = true;
			}
			if (node.state == 'declarator') {
				decl_node = node;
				has_decl = true;
			}
			if (node.state == 'declarator_var') {
				decl_node = node;
				has_decl_var = true;
			}
			if (node.state == 'declarator_func') {
				decl_node = node;
				has_decl_func = true;
			}
		});

		if (!has_err) {
			if (has_decl_spec) {
				if (decl_spec_node!.is_typedef) {
					// typedefのcontextであればtypedef解析
					// このときは変数宣言にはならない
					if (has_decl || has_decl_var || has_decl_func) {
						this.eval_typedef(decl_spec_node!, decl_node!);
					}
				} else {
					// 変数宣言であれば処理実施
					if (has_decl_var) {
						this.eval_ident_var(decl_spec_node!, decl_node!);
					}
					// 変数宣言であれば処理実施
					if (has_decl_func) {
						this.eval_ident_func(decl_spec_node!, decl_node!);
					}
				}
			}
		}

		return result;
	}
	/**
	 * declaration-specifierがtypedefのcontextであったとき、
	 * 型情報の登録を行う
	 */
	private eval_typedef(decl_spec_node: parse_tree_node, decl_node: parse_tree_node) {
		let id_info: ident_info;
		id_info = this.get_empty_ident_info();
		id_info.is_typedef = true;
		// 変数情報を取得
		this.eval_typedef_search_spec(id_info, decl_spec_node);
		// 変数宣言は複数存在するので後に実施、見つけたものは順次登録
		this.eval_typedef_search_name(id_info, decl_node);
	}
	private eval_typedef_search_spec(id_info: ident_info, decl_spec_node: parse_tree_node) {
		// declaration-specifiers から型情報を探す
		// T.B.D.
	}
	private eval_typedef_search_name(id_info: ident_info, decl_node: parse_tree_node): boolean {
		// 登録するidentifierを見つけたかどうか
		// 主に再帰的解析で使用する
		let find_id: boolean;
		find_id = false;

		// declaratorにはidentifierは複数出現する。
		// それらは別々の変数宣言となる。
		// identifierを検出したら名前を登録
		if (decl_node.lex && decl_node.lex.id == 'identifier') {
			let new_id: ident_info;
			new_id = this.get_clone_ident_info(id_info);
			new_id.token = decl_node.lex.token;
			// 変数名を登録
			this.push_typedef(new_id);
			find_id = true;
		}
		// childが存在するなら再帰的にチェック
		// 名前となるidentifierは,で区切られて出現する
		let push_ok: boolean = true;
		let result: boolean;
		for (let node of decl_node.child) {
			if (push_ok) {
				result = this.eval_typedef_search_name(id_info, node);
				if (result) push_ok = false;
			} else {
				if (node.lex && node.lex.id == 'comma') push_ok = true;
			}
		}

		return find_id;
	}
	/**
	 * declarationが変数宣言のcontextであったとき、
	 * 変数名情報の登録を行う
	 */
	private eval_ident_var(decl_spec_node: parse_tree_node, decl_node: parse_tree_node) {
		let id_info: ident_info;
		id_info = this.get_empty_ident_info();
		id_info.is_ident_var = true;
		// 変数情報を取得
		this.eval_ident_var_search_spec(id_info, decl_spec_node);
		// 変数宣言は複数存在するので後に実施、見つけたものは順次登録
		this.eval_ident_var_search_name(id_info, decl_node);
	}
	private eval_ident_var_search_spec(id_info: ident_info, decl_spec_node: parse_tree_node) {
		// declaration-specifiers から型情報を探す
		// T.B.D.
	}
	private eval_ident_var_search_name(id_info: ident_info, decl_node: parse_tree_node): boolean {
		// 登録するidentifierを見つけたかどうか
		// 主に再帰的解析で使用する
		let find_id: boolean;
		find_id = false;

		// declaratorにはidentifierは複数出現する。
		// それらは別々の変数宣言となる。
		// identifierを検出したら名前を登録
		if (decl_node.lex && decl_node.lex.id == 'identifier') {
			let new_id: ident_info;
			new_id = this.get_clone_ident_info(id_info);
			new_id.token = decl_node.lex.token;
			// 変数名を登録
			this.push_ident_var(new_id);
			find_id = true;
		}
		// childが存在するなら再帰的にチェック
		// 名前となるidentifierは,で区切られて出現する
		let push_ok: boolean = true;
		let result: boolean;
		for (let node of decl_node.child) {
			if (push_ok) {
				result = this.eval_ident_var_search_name(id_info, node);
				if (result) push_ok = false;
			} else {
				if (node.lex && node.lex.id == 'comma') push_ok = true;
			}
		}

		return find_id;
	}
	/**
	 * declarationが関数宣言のcontextであったとき、
	 * 変数名情報の登録を行う
	 */
	private eval_ident_func(decl_spec_node: parse_tree_node, decl_node: parse_tree_node) {
		let id_info: ident_info;
		id_info = this.get_empty_ident_info();
		id_info.is_ident_func = true;
		// 変数情報を取得
		this.eval_ident_func_search_spec(id_info, decl_spec_node);
		// 変数宣言は複数存在するので後に実施、見つけたものは順次登録
		this.eval_ident_func_search_name(id_info, decl_node);
	}
	private eval_ident_func_search_spec(id_info: ident_info, decl_spec_node: parse_tree_node) {
		// declaration-specifiers から型情報を探す
		// T.B.D.
	}
	private eval_ident_func_search_name(id_info: ident_info, decl_node: parse_tree_node): boolean {
		// 登録するidentifierを見つけたかどうか
		// 主に再帰的解析で使用する
		let find_id: boolean;
		find_id = false;

		// declaratorにはidentifierは複数出現する。
		// それらは別々の変数宣言となる。
		// identifierを検出したら名前を登録
		if (decl_node.lex && decl_node.lex.id == 'identifier') {
			let new_id: ident_info;
			new_id = this.get_clone_ident_info(id_info);
			new_id.token = decl_node.lex.token;
			// 変数名を登録
			this.push_ident_func(new_id);
			find_id = true;
		}
		// childが存在するなら再帰的にチェック
		// 名前となるidentifierは,で区切られて出現する
		let push_ok: boolean = true;
		let result: boolean;
		for (let node of decl_node.child) {
			if (push_ok) {
				result = this.eval_ident_func_search_name(id_info, node);
				if (result) push_ok = false;
			} else {
				if (node.lex && node.lex.id == 'comma') push_ok = true;
			}
		}

		return find_id;
	}

	/**
	 * typedefとして登録
	 */
	private push_typedef(id: ident_info) {
		this.typedef_tbl.push(id);
	}
	private push_ident_var(id: ident_info) {
		this.ident_var_tbl.push(id);
	}
	private push_ident_func(id: ident_info) {
		this.ident_func_tbl.push(id);
	}
	private get_empty_ident_info(): ident_info {
		return {
			token: "",
			type: 'null',
			is_signed: false,
			is_static: false,
			is_const: false,
			is_inline: false,
			is_ident_var: false,
			is_ident_func: false,
			is_typedef: false,
		};
	}
	private get_clone_ident_info(id: ident_info): ident_info {
		return {
			token: id.token,
			type: id.type,
			is_signed: id.is_signed,
			is_static: id.is_static,
			is_const: id.is_const,
			is_inline: id.is_inline,
			is_ident_var: id.is_ident_var,
			is_ident_func: id.is_ident_func,
			is_typedef: id.is_typedef,
		};
	}

	/**
	 * 現在出現しているtokenをenumeration-constantとして登録
	 */
	private push_enum_const() {
		let token: string = this.get_token_str();
		this.enum_tbl.push(token);
	}

	/**
	 * 新規解析ツリーを作成し、解析状態を新規grammarにスイッチする。
	 * 同時に解析完了したときに復帰先の状態を記憶しておく。
	 * @param ctx 
	 * @param next_state
	 * @param return_state
	 */
	private switch_new_context(ctx: parse_state, next_state: parse_state, return_state: parse_state, err_info_: parse_error_info = 'null') {
		// 新規解析ツリーを作成
		this.push_parse_tree(ctx, err_info_);
		// 復帰先状態を登録
		this.state_stack_tbl.push(return_state);
		// 次の解析状態へ遷移
		this.state = next_state;

		// 
		this.expr_info_stack.push({
			expr_enable_assign: this.expr_info.expr_enable_assign,
			expr_enable_binary: this.expr_info.expr_enable_binary,
			expr_enable_cast: this.expr_info.expr_enable_cast
		});
	}
	/**
	 * コンテキストスイッチ前の状態に復帰する。
	 * 復帰先の状態が無ければ何もしない。
	 */
	private switch_old_context(): boolean {
		let sw_exe: boolean = false;
		let next_state: parse_state | undefined;
		next_state = this.state_stack_tbl.pop();

		if (next_state) {
			// 状態遷移設定
			this.state = next_state;
			// 解析ツリー復帰
			this.pop_parse_tree();

			this.expr_info = this.expr_info_stack.pop()!;

			sw_exe = true;
		}

		return sw_exe;
	}

	/**
	 * 現在解析中のコンテキストが確定したときにコールする。
	 * 対象解析ツリーのコンテキストを設定する。
	 * @param ctx 
	 */
	private set_current_context(ctx: parse_state) {
		this.tgt_node.state = ctx;
	}
	private set_current_context_error(err: parse_error_info) {
		this.tgt_node.err_info = err;
	}
	private set_current_context_is_typedef(flag: boolean = true) {
		this.tgt_node.is_typedef = flag;
	}
	/**
	 * 構文未確定で解析を進め、構文が確定したタイミングで、過去tokenに対してctx(,error)を設定する。
	 * 現在tokenはまだpushしていない状況で使用する。
	 * （使用状況イメージ：　this.tgt_node.child==以前までのtoken, this.token_stack==現在以降のtoken）
	 * @param rel_idx 	セット対象tokenが何個前か指定する。(1:1個前, 2:2個前, ...)
	 * @param ctx 		設定context
	 * @param err_info 	設定error_info
	 */
	private set_prev_node_context(rel_idx: number, ctx: parse_state, err_info: parse_error_info = 'null') {
		// 1以上、配列要素数未満のとき有効
		if (rel_idx > 0 && rel_idx < this.tgt_node.child.length) {
			// this.tgt_node.child[]にアクセスするインデックスに変換
			rel_idx = this.tgt_node.child.length - rel_idx;
			// データ更新
			this.tgt_node.child[rel_idx].state = ctx;
			if (err_info != 'null') {
				this.tgt_node.child[rel_idx].err_info = err_info;
			}
		}
	}
	/**
	 * tgt_nodeに新規解析treeを追加する。
	 * 追加したtreeが新しいtgt_nodeとなる。
	 * @param ctx 解析コンテキスト
	 */
	private push_parse_tree(ctx: parse_state, err_info_: parse_error_info = 'null') {
		let new_len: number;
		new_len = this.tgt_node.child.push(this.get_new_tree(ctx, err_info_));
		this.tgt_node.child[new_len - 1].parent = this.tgt_node;
		this.tgt_node = this.tgt_node.child[new_len - 1];
	}
	private pop_parse_tree(): parse_tree_node | null {
		let curr_node: parse_tree_node | null;

		// 復帰先チェック
		if (this.tgt_node.parent) {
			curr_node = this.tgt_node;
			this.tgt_node = this.tgt_node.parent;
			//ここでpopするかどうかでバッファに残すかどうかが変わる
			//curr_node = this.tgt_node.child.pop()!;
		} else {
			curr_node = null;
		}

		return curr_node;
	}
	/**
	 * tgt_nodeに字句nodeを追加する。
	 * nodeを追加したらlexerは次tokenを取得する
	 */
	private push_parse_node(ctx: parse_state, err_info: parse_error_info = 'null') {
		this.tgt_node.child.push(this.get_new_node(ctx, err_info));
	}
	/**
	 * tgt_nodeにエラーnodeを追加する。
	 * 既定のtokenが出現しなかった場合はエラー情報だけの空nodeを追加する。
	 */
	private push_error_node(ctx: parse_state, err_info: parse_error_info) {
		this.tgt_node.child.push(this.get_empty_node(ctx, err_info));
	}



	/**
	 * Lexerからtokenを取得する。
	 * 取得したtokenはスタックしておく。
	 * 解析時は[0]が現在解析中のtoken、[1]以降がLookAheadで取得したtokenとする。
	 * tokenはnodeを追加するたびにFIFOで取り出してnodeと紐づける
	 */
	private get_new_token(num: number = 1) {
		for (let i = 0; i < num; i++) {
			// Lexer解析実施
			this.lexer.exec();
			// 取得したtokenをスタックする
			this.token_stack.push({
				id: this.lexer.id,
				sub_id: this.lexer.sub_id,
				token: this.lexer.token,
				row: this.lexer.row,
				col: this.lexer.col,
				len: this.lexer.len,
				pos: this.lexer.pos,
			});
		}
	}
	/**
	 * token stack からidxで指定したtokenを返す。
	 * LookAhead対応。idxが1以上であればtokenを取得して先読みをする。
	 */
	private get_token(idx: number = 0): lex_info {
		// 指定された数だけtokenがスタックされているかチェック
		if (this.token_stack.length <= idx) {
			// 不足分を取得：先読み
			this.get_new_token(idx - this.token_stack.length + 1);
		}
		// 指定されたtokenを返す
		return this.token_stack[idx];
	}
	private get_token_if(pred: (token: lex_info) => boolean, pos: number = 0): [lex_info, number] {
		let token_: lex_info;
		do {
			token_ = this.get_token(pos);
			pos++;
		} while (!pred(token_));
		return [token_, pos - 1];
	}

	private get_token_next(idx?: number): lex_info {
		return this._token_queue.get_next(idx);
	}
	/**
	 * token stack からidxで指定したtokenのidを返す
	 */
	private get_token_id(idx?: number): token_id {
		let result: token_id;
		//
		if (this._in_lookAhead) {
			result = this._token_queue.get_if( this._pred_token_is_whitespace, idx ).id;
		} else {
			if (idx == null) idx = 0;
			result = this._token_queue.get(idx).id;
		}
		return result;
	}
	private _pred_token_is_whitespace = (token: lex_info): boolean => {
		return this.is_whitespace(token.id);
	}

	private get_token_id_if(pred: (token: lex_info) => boolean, pos: number = 0): [token_id, number] {
		let token: lex_info;
		let new_pos: number;
		[token, new_pos] = this.get_token_if(pred, pos);
		return [token.id, new_pos];
	}
	private get_token_id_if_not_whitespace(pos: number = 0): [token_id, number] {
		let token: lex_info;
		let new_pos: number;
		[token, new_pos] = this.get_token_if((token: lex_info) => !this.is_whitespace(token.id), pos);
		return [token.id, new_pos];
	}
	/*
	private get_token_id(idx: number = 0): token_id {
		return this.get_token(idx).id;
	}
	private get_token_id_if(pred: (token: lex_info) => boolean, pos: number = 0): [token_id, number] {
		let token: lex_info;
		let new_pos: number;
		[token, new_pos] = this.get_token_if(pred, pos);
		return [token.id, new_pos];
	}
	private get_token_id_if_not_whitespace(pos: number = 0): [token_id, number] {
		let token: lex_info;
		let new_pos: number;
		[token, new_pos] = this.get_token_if((token: lex_info) => !this.is_whitespace(token.id), pos);
		return [token.id, new_pos];
	}
	*/
	/**
	 * token stack からidxで指定したtokenのidを返す
	 */
	private get_token_str(idx: number = 0): string {
		return this.get_token(idx).token;
	}

	/**
	 * 現在解析中contextのnodeを返す
	 */
	private get_curr_node(): parse_tree_node {
		return this.tgt_node;
	}
	/**
	 * 現在出現しているtoken idを返す
	 */
	private get_curr_ctx_is_typedef(): boolean {
		return this.tgt_node.is_typedef;
	}
	/**
	 * declaratorは()の入れ子により階層が深くなっている可能性がある。
	 * declaratorが宣言している名前を示すidentifierを検索して返す
	 */
	private get_node_declarator_id(node: parse_tree_node): parse_tree_node | null {
		// 先頭から探索して最初に出現するidentifierを取得する
		let idx: number = 0;
		let fin: boolean = false;
		let tgt: parse_tree_node | null;
		tgt = node;

		while (!fin) {
			if (tgt!.child[idx].lex) {
				switch (tgt!.child[idx].lex!.id) {
					case 'identifier':
						// identifierを検出したら終了
						tgt = tgt!.child[idx];
						fin = true;
						break;
					case 'left_paren':
						// ( を検出したら階層を下る
						if (tgt!.child.length > idx + 1) {
							tgt = tgt!.child[idx + 1];
							idx = 0;
						}
						break;
					default:
						// その他tokenは無視
						break;
				}
			}

			idx++;
			if (tgt!.child.length <= idx) {
				fin = true;
				tgt = null;
			}
		}
		return tgt;
	}
	/**
	 * 現在解析中のgrammarの中で前回までに出現したtokenを取得する
	 * @param prev_count 何個前のcontextを取得するか。1=1個前
	 */
	private get_prev_node(prev_count: number = 1): { valid: boolean, node?: parse_tree_node } {
		let result_valid: boolean;
		let result_node: parse_tree_node;
		let idx: number;

		// 指定されたインデックスがこれまでに出現したnode数以上であれば処理実施
		if (this.tgt_node.child.length > prev_count) {
			// 前回コンテキスト参照インデックスを作成
			idx = this.tgt_node.child.length - prev_count;
			return { valid: true, node: this.tgt_node.child[idx] };
		}
		else {
			return { valid: false };
		}
	}
	private get_prev_node_if(pred: (node: parse_tree_node) => boolean, prev_count: number = 1): { valid: boolean, node?: parse_tree_node } {
		let result_valid: boolean;
		let result_node: parse_tree_node;
		let idx: number;

		// 指定されたインデックスがこれまでに出現したnode数以上であれば処理実施
		if (prev_count > 0 && this.tgt_node.child.length > prev_count) {
			// 前回コンテキスト参照インデックスを作成
			idx = this.tgt_node.child.length - prev_count;
			// nodeを検索
			while (idx > -1 && prev_count > 0) {
				if (pred(this.tgt_node.child[idx])) {
					result_node = this.tgt_node.child[idx];
					prev_count--;
				}
				idx--;
			}
		}
		// nodeが見つかっていれば正常値を返す
		if (prev_count == 0) {
			return { valid: true, node: result_node! };
		} else {
			return { valid: false };
		}
	}
	private get_prev_node_if_not_whitespace(prev_count: number = 1): { valid: boolean, node?: parse_tree_node } {
		let { valid, node } = this.get_prev_node_if((node: parse_tree_node) => (node.lex == null || !this.is_whitespace(node.lex!.id)), prev_count);
		if (valid) {
			return { valid: true, node: node! }
		}
		else {
			return { valid: false };
		}
	}
	/**
	 * 現在解析中のgrammarの中で前回までに出現したtokenのcontextを取得する
	 * @param prev_count 何個前のcontextを取得するか。1=1個前
	 */
	private get_prev_ctx(prev_count: number = 1): { valid: boolean, ctx?: parse_state } {
		let { valid, node } = this.get_prev_node(prev_count);

		if (valid) {
			return { valid: true, ctx: node!.state }
		}
		else {
			return { valid: false };
		}
	}
	/**
	 * 現在解析中のgrammarの中で前回までに出現したtokenのis_typedefを取得する
	 * @param prev_count 何個前のcontextを取得するか。1=1個前
	 */
	private get_prev_ctx_is_typedef(prev_count: number = 1): boolean {
		let { valid, node } = this.get_prev_node(prev_count);

		if (valid) {
			return node!.is_typedef;
		}
		else {
			return false;
		}
	}

	private get_new_tree(ctx: parse_state, err_info_: parse_error_info = 'null'): parse_tree_node {
		let node: parse_tree_node;
		node = {
			state: ctx,
			child: [],
			parent: null,
			lex: null,
			err_info: err_info_,
			is_typedef: false,
		};
		return node;
	}
	private get_new_node(ctx: parse_state, err_info_: parse_error_info = 'null'): parse_tree_node {
		let node: parse_tree_node;
		node = {
			state: ctx,
			child: [],
			parent: null,
			//lex: this.token_stack.shift()!,
			lex: null,
			err_info: err_info_,
			is_typedef: false,
		};
//		node.lex = this.token_stack.shift()!;
		node.lex = this._token_queue.deq();
		return node;
	}
	private get_empty_node(state: parse_state, err_info_: parse_error_info = 'null'): parse_tree_node {
		let node: parse_tree_node;
		node = {
			state: state,
			child: [],
			parent: null,
			lex: null,
			err_info: err_info_,
			is_typedef: false,
		};
		return node;
	}

}






















// export class parser {

// 	constructor(text: string, cb?: cb_type) {
// 	}

// 	/**
// 	 * parse実行
// 	 * external-declarationを1回の解析単位とする
// 	 * EOFに達したらfalseを返す
// 	 */
// 	public exec(): boolean {
// 		this.parse();
// 		return (this.state != 'EOF');
// 	}
// 	public get parse_tree(): parse_tree_node {
// 		return this.tree;
// 	}

// 	/**
// 	 * parserを初期化
// 	 */
// 	private parser_init() {
// 		// 
// 		// 初期状態ではtokenを取得する
// 		// 以降は解析内でtokenを解析ツリーに登録するたびに毎回次へ進める
// 		this.get_new_token();
// 		this.state = 'root';
// 	}

// 	private parse() {
// 		let finish: boolean;

// 		do {
// 			switch (this.state) {
// 				case 'null':
// 					this.parser_init();
// 					finish = false;
// 					break;

// 				// translation-unit
// 				case 'root':
// 					finish = this.parse_root();
// 					break;
// 				case 'root_decl-spec':
// 					finish = this.parse_root_decl_spec();
// 					break;
// 				case 'root_decl-spec_declarator':
// 					finish = this.parse_root_decl_spec_declarator();
// 					break;
// 				case 'root_end':
// 					finish = this.parse_root_end();
// 					break;

// 				// Expressions
// 				case 'expr':
// 					finish = this.parse_expr();
// 					break;
// 				case 'expr_re':
// 					finish = this.parse_expr_re();
// 					break;
// 				case 'unary-expr':
// 					finish = this.parse_unary_expr();
// 					break;
// 				case 'assign-expr':
// 					finish = this.parse_assign_expr();
// 					break;
// 				case 'const-expr':
// 					finish = this.parse_const_expr();
// 					break;
// 				case 'expr_impl':
// 					finish = this.parse_expr_impl();
// 					break;
// 				case 'expr_impl_re':
// 					finish = this.parse_expr_impl_re();
// 					break;
// 				case 'expr_impl_re_cond':
// 					finish = this.parse_expr_impl_re_cond();
// 					break;
// 				case 'expr_impl_lp':
// 					finish = this.parse_expr_impl_lp();
// 					break;
// 				case 'expr_impl_lp_expr':
// 					finish = this.parse_expr_impl_lp_expr();
// 					break;
// 				case 'expr_impl_term':
// 					finish = this.parse_expr_impl_term();
// 					break;
// 				case 'expr_impl_term_prim':
// 					finish = this.parse_expr_impl_term_prim();
// 					break;
// 				case 'expr_impl_term_prim_lb_expr':
// 					finish = this.parse_expr_impl_term_prim_lb_expr();
// 					break;
// 				case 'expr_impl_term_prim_lp_arg_expr_list':
// 					finish = this.parse_expr_impl_term_prim_lp_arg_expr_list();
// 					break;
// 				case 'expr_impl_term_lp':
// 					finish = this.parse_expr_impl_term_lp();
// 					break;
// 				case 'expr_impl_term_lp_expr':
// 					finish = this.parse_expr_impl_term_lp_expr();
// 					break;
// 				case 'expr_impl_term_lp_typename':
// 					finish = this.parse_expr_impl_term_lp_typename();
// 					break;
// 				case 'expr_impl_term_lp_rp_lb_inilist':
// 					finish = this.parse_expr_impl_term_lp_rp_lb_inilist();
// 					break;
// 				case 'expr_impl_term_sizeof_lp':
// 					finish = this.parse_expr_impl_term_sizeof_lp();
// 					break;
// 				case 'expr_impl_term_sizeof_lp_typename':
// 					finish = this.parse_expr_impl_term_sizeof_lp_typename();
// 					break;
// 				case 'expr_impl_term_sizeof_lp_typename_rp_lb_inilist':
// 					finish = this.parse_expr_impl_term_sizeof_lp_typename_rp_lb_inilist();
// 					break;
// 				case 'expr_impl_term_sizeof_lp_rp':
// 					finish = this.parse_expr_impl_term_sizeof_lp_rp();
// 					break;
// 				case 'arg_expr_list':
// 					finish = this.parse_arg_expr_list();
// 					break;
// 				case 'arg_expr_list_re':
// 					finish = this.parse_arg_expr_list_re();
// 					break;

// 				// Declarations
// 				case 'declaration':
// 					finish = this.parse_declaration();
// 					break;
// 				case 'declaration_decl-spec':
// 					finish = this.parse_declaration_decl_spec();
// 					break;
// 				case 'declaration_decl-spec_decl':
// 					// declarationの解析からのフロー以外に、
// 					// translation-unit解析の中でdeclarationと確定したら直接遷移してくる
// 					// 確定するのはここまでtokenが出現した後になる
// 					finish = this.parse_declaration_decl_spec_decl()
// 					break;
// 				case 'declaration_decl-spec_decl_init':
// 					finish = this.parse_declaration_decl_spec_decl_init();
// 					break;
// 				case 'decl-specifiers':
// 					finish = this.parse_decl_specifiers();
// 					break;
// 				case 'decl-specifiers_re':
// 					finish = this.parse_decl_specifiers_re();
// 					break;
// 				case 'sq-list':
// 					finish = this.parse_sqlist();
// 					break;
// 				case 'sq-list_re':
// 					finish = this.parse_sqlist_re();
// 					break;
// 				case 'struct-or-union-spec':
// 					finish = this.parse_struct_union_s();
// 					break;
// 				case 'struct-declaration-list':
// 					finish = this.parse_struct_declaration_list();
// 					break;
// 				case 'struct-declarator-list':
// 					finish = this.parse_struct_declarator_list();
// 					break;
// 				case 'struct-declarator-list_re':
// 					finish = this.parse_struct_declarator_list_re();
// 					break;
// 				case 'enum-spec':
// 					finish = this.parse_enum_spec();
// 					break;
// 				case 'enum-spec_lb':
// 					finish = this.parse_enum_spec_lb();
// 					break;
// 				case 'enum-list':
// 					finish = this.parse_enum_list();
// 					break;
// 				case 'enum-list_re':
// 					finish = this.parse_enum_list_re();
// 					break;
// 				case 'declarator':
// 					finish = this.parse_declarator();
// 					break;
// 				case 'declarator_lp_decl':
// 					finish = this.parse_declarator_lp_decl();
// 					break;
// 				case 'declarator@err':
// 					finish = this.parse_declarator_err();
// 					break;
// 				case 'direct-declarator':
// 					finish = this.parse_direct_declarator();
// 					break;
// 				case 'direct-declarator_lb':
// 					finish = this.parse_direct_declarator_lb();
// 					break;
// 				case 'direct-declarator_lb_assign_expr':
// 					finish = this.parse_direct_declarator_lb_assign_expr();
// 					break;
// 				case 'direct-declarator_lp':
// 					finish = this.parse_direct_declarator_lp();
// 					break;
// 				case 'direct-declarator_lp_list_rp':
// 					finish = this.parse_direct_declarator_lp_list_rp();
// 					break;
// 				case 'pointer':
// 					finish = this.parse_pointer();
// 					break;
// 				case 'parameter-type-list':
// 					finish = this.parse_param_type_list();
// 					break;
// 				case 'parameter-type-list_type':
// 					finish = this.parse_param_type_list_type();
// 					break;
// 				case 'parameter-type-list_type_decl':
// 					finish = this.parse_param_type_list_type_decl();
// 					break;
// 				case 'identifier-list':
// 					finish = this.parse_identifier_list();
// 					break;
// 				case 'identifier-list_re':
// 					finish = this.parse_identifier_list_re();
// 					break;
// 				case 'type-name':
// 					finish = this.parse_typename();
// 					break;
// 				case 'type-name_sq-list_abst-decl':
// 					finish = this.parse_typename_abst_decl();
// 					break;
// 				case 'type-name_end':
// 					finish = this.parse_typename_end();
// 					break;
// 				case 'abstract-declarator':
// 					finish = this.parse_abst_decl();
// 					break;
// 				case 'abstract-declarator_lp_abst':
// 					finish = this.parse_abst_decl_lp_abst();
// 					break;
// 				case 'abstract-declarator_lp_param':
// 					finish = this.parse_abst_decl_lp_param();
// 					break;
// 				case 'abstract-declarator_lb':
// 					finish = this.parse_abst_decl_lb();
// 					break;
// 				case 'abstract-declarator_lb_type':
// 					finish = this.parse_abst_decl_lb_type();
// 					break;
// 				case 'abstract-declarator_rb':
// 					finish = this.parse_abst_decl_rb();
// 					break;
// 				case 'initializer':
// 					finish = this.parse_initializer();
// 					break;
// 				case 'initializer_lb_list':
// 					finish = this.parse_initializer_lb_list();
// 					break;
// 				case 'initializer_end':
// 					finish = this.parse_initializer_end();
// 					break;
// 				case 'initializer-list':
// 					finish = this.parse_initializer_list();
// 					break;
// 				case 'initializer-list_design':
// 					finish = this.parse_initializer_list_design();
// 					break;
// 				case 'initializer-list_design_lb_const-expr':
// 					finish = this.parse_initializer_list_design_lb_constexpr();
// 					break;
// 				case 'initializer-list_init':
// 					finish = this.parse_initializer_list_init();
// 					break;

// 				// Statements
// 				case 'statement':
// 					finish = this.parse_statement();
// 					break;
// 				case 'statement_case':
// 					finish = this.parse_statement_case();
// 					break;
// 				case 'statement_compound':
// 					finish = this.parse_statement_compound();
// 					break;
// 				case 'statement_compound_lb':
// 					finish = this.parse_statement_compound_lb();
// 					break;
// 				case 'statement_expr':
// 					finish = this.parse_statement_expr();
// 					break;
// 				case 'statement_if':
// 					finish = this.parse_statement_if();
// 					break;
// 				case 'statement_if_state':
// 					finish = this.parse_statement_if_state();
// 					break;
// 				case 'statement_switch':
// 					finish = this.parse_statement_switch();
// 					break;
// 				case 'statement_switch_state':
// 					finish = this.parse_statement_switch_state();
// 					break;
// 				case 'statement_while':
// 					finish = this.parse_statement_while();
// 					break;
// 				case 'statement_while_state':
// 					finish = this.parse_statement_while_state();
// 					break;
// 				case 'statement_do':
// 					finish = this.parse_statement_do();
// 					break;
// 				case 'statement_do_state':
// 					finish = this.parse_statement_do_state();
// 					break;
// 				case 'statement_for_lp':
// 					finish = this.parse_statement_for_lp();
// 					break;
// 				case 'statement_for_lp_id':
// 					finish = this.parse_statement_for_lp_id();
// 					break;
// 				case 'statement_for_lp_t':
// 					finish = this.parse_statement_for_lp_t();
// 					break;
// 				case 'statement_for_lp_t_s_expr':
// 					finish = this.parse_statement_for_lp_t_s_expr();
// 					break;
// 				case 'statement_for_lp_t_s_expr_s_expr':
// 					finish = this.parse_statement_for_lp_t_s_expr_s_expr();
// 					break;
// 				case 'statement_for_lp_t_s_expr_s_expr_rp_state':
// 					finish = this.parse_statement_for_lp_t_s_expr_s_expr_rp_state();
// 					break;
// 				case 'statement_return':
// 					finish = this.parse_statement_return();
// 					break;
// 				case 'statement_end':
// 					finish = this.parse_statement_end();
// 					break;

// 				// External definitions
// 				case 'func-def':
// 				case 'func-def_decl':
// 					// 直接この解析にくることはない
// 					finish = true;
// 					break;
// 				case 'func-def_decl-spec_decl':
// 					// translation-unit解析の中でfunction-definitionと確定したら遷移する
// 					// 確定するのはここまでtokenが出現した後になる
// 					finish = this.parse_func_def_decl_spec_decl();
// 					break;
// 				case 'func-def_decl-spec_decl@err':
// 					finish = this.parse_func_def_decl_spec_decl_err();
// 					break;
// 				case 'func-def_end':
// 					finish = this.parse_func_def_end();
// 					break;

// 				// Preprocessing directives
// 				case 'pp_group_part':
// 					finish = this.parse_pp_group_part();
// 					break;

// 				case 'EOF':
// 				default:
// 					// 解析終了
// 					finish = true;
// 					break;
// 			}

// 			// 一連のgrammarが解析終了したらfinish==trueとなる
// 			// 状態遷移の復帰先がスタックされていたらそちらへ復帰して解析継続
// 			if (finish) {
// 				if (this.switch_old_context()) {
// 					finish = false;
// 				}
// 			}
// 		} while (!finish);

// 	}

// 	/**
// 	 * translation-unit 解析
// 	 * function-definition or declaration の繰り返しになる
// 	 * 1parse あたり 1translation-unit の解析とする
// 	 */
// 	private parse_root(): boolean {
// 	}
// 	/**
// 	 * translation-unit 解析
// 	 * declaration-specifier まで検出した状態から解析開始
// 	 */
// 	private parse_root_decl_spec(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'semicolon':
// 				// ; が出現したらdeclarationとして解析完了
// 				this.set_current_context('declaration');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現
// 				if (this.is_declarator_token()) {
// 					// declarator開始tokenであれば解析開始
// 					this.switch_new_context('declarator', 'declarator', 'root_decl-spec_declarator');
// 				} else {
// 					// その他は構文エラーで終了
// 					this.set_current_context_error('unexpected-token');
// 					finish = true;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * translation-unit 解析
// 	 * declaration-specifier declarator まで検出した状態から解析開始
// 	 * declaratorの内容により、declarationとfunction-definitionの判定が可能
// 	 */
// 	private parse_root_decl_spec_declarator(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		let ctx: parse_context;
// 		let pos: number;
// 		[ctx, pos] = this.lookahead_jdg_func_decl();
// 		switch (ctx) {
// 			case 'declaration':
// 				// 変数宣言であればdeclarationのcontextになる
// 				this.set_current_context('declaration');
// 				// declaration解析状態へ合流
// 				this.state = 'declaration_decl-spec_decl';
// 				break;
// 			case 'function-definition':
// 				// 変数宣言であればfunction-definitionのcontextになる
// 				this.set_current_context('function-definition');
// 				// function-definition解析状態へ合流
// 				this.state = 'func-def_decl-spec_decl';
// 				break;
// 			default:
// 				// その他のcontextはありえない。
// 				// エラーとしてdeclarationの次から解析継続
// 				this.push_error_node('declaration', 'not_found_declarator');
// 				// contextにエラーを設定
// 				this.set_current_context_error('not_found_declarator');
// 				this.state = 'root_decl-spec';
// 				break;
// 		}

// 		return finish
// 	}
// 	/**
// 	 * translation-unit 解析完了
// 	 * declaration or function-definition の解析完了で遷移する
// 	 * translation-unitの解析を閉じる
// 	 */
// 	private parse_root_end(): boolean {
// 		let finish: boolean;
// 		finish = true;
// 		this.state = 'root';
// 		return finish;
// 	}

// 	/**
// 	 * experssion解析全体イメージ
// 	 * [ctx_sw]+
// 	 *         +-(expr)----[ctx_sw]+---------------------...
// 	 *         +-(assign-expr)-+   +
// 	 *         +-(const-expr)---`+-+-(expr_impl)-[ctx_sw]+---------------------
// 	 *                                                   +-(expr_impl)
// 	 * 
// 	 * 
// 	 * expression: 複数のassignment-expressionからの構成になりうるため、
// 	 *             expression 1つごとに[ctx_sw]する。
// 	 */
// 	/**
// 	 * expression解析
// 	 * 演算子の優先順位等は考慮せず、grammarとしてexpressionを構成するtokenを取得する
// 	 * 
// 	 */
// 	private parse_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// expression解析を開始
// 		this.expr_info.expr_enable_assign = true;
// 		this.expr_info.expr_enable_binary = true;
// 		this.switch_new_context('expression', 'expr_impl', 'expr_re');

// 		return finish;
// 	}
// 	/**
// 	 * expression解析(2回目)
// 	 * 
// 	 */
// 	private parse_expr_re(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'comma':
// 				// , が出現したら
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('expression');
// 				// expression解析を開始
// 				this.expr_info.expr_enable_assign = true;
// 				this.expr_info.expr_enable_binary = true;
// 				this.switch_new_context('expression', 'expr_impl', 'expr_re');
// 				break;

// 			case 'EOF':
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは解析終了
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * assignment-expression解析
// 	 * 演算子の優先順位等は考慮せず、grammarとしてexpressionを構成するtokenを取得する
// 	 * expressionとの差異は1回だけで終了する点
// 	 */
// 	private parse_assign_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// expression解析を開始
// 		this.expr_info.expr_enable_assign = true;
// 		this.expr_info.expr_enable_binary = true;
// 		// expression解析(実装)へ遷移
// 		this.state = 'expr_impl';

// 		return finish;
// 	}
// 	/**
// 	 * constant-expression解析
// 	 * 演算子の優先順位等は考慮せず、grammarとしてexpressionを構成するtokenを取得する
// 	 * assignment-expressionとの差異はassignに関する演算子は不可である点
// 	 */
// 	private parse_const_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// expression解析を開始
// 		this.expr_info.expr_enable_assign = false;
// 		this.expr_info.expr_enable_binary = true;
// 		// expression解析(実装)へ遷移
// 		this.state = 'expr_impl';

// 		return finish;
// 	}
// 	/**
// 	 * unary-expression解析
// 	 * binary-operatorは受け付けず、単項のみ出現
// 	 */
// 	private parse_unary_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// expression解析を開始
// 		this.expr_info.expr_enable_assign = true;
// 		this.expr_info.expr_enable_binary = true;
// 		this.expr_info.expr_enable_cast = true;
// 		// expression解析(実装)へ遷移
// 		this.state = 'expr_impl_term';

// 		return finish;
// 	}
// 	/**
// 	 * expression解析(実装)
// 	 * 演算子の優先順位等は考慮せず、grammarとしてexpressionを構成するtokenを取得する
// 	 * expression全体でカッコ()の対応をとる必要がある
// 	 */
// 	private parse_expr_impl(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			// primary-expression
// 			case 'identifier':
// 			// このcontextで出現するidentifierは変数名
// 			case 'octal_constant':
// 			case 'hex_constant':
// 			case 'decimal_constant':
// 			case 'decimal_float_constant':
// 			case 'hex_float_constant':
// 			case 'char_constant':
// 			case 'string_literal':
// 				// expression解析を開始
// 				this.switch_new_context('expression', 'expr_impl_term', 'expr_impl_re');
// 				break;

// 			// primary-expression
// 			// postfix-expression
// 			// cast-expression
// 			case 'left_paren':
// 				// expression と type-name を判別しないといけないので別処理へ遷移
// 				this.state = 'expr_impl_lp';
// 				break;

// 			// unary-expression
// 			case 'increment_op':			// ++
// 			case 'decrement_op':			// --
// 				// expression解析を開始
// 				this.switch_new_context('expression', 'expr_impl_term', 'expr_impl_re');
// 				break;
// 			case 'ampersand':				// &
// 			case 'asterisk':				// *
// 			case 'plus':					// +
// 			case 'minus':					// -
// 			case 'bitwise_complement_op':	// ~
// 			case 'logical_negation_op':		// !
// 				// expression解析を開始
// 				this.switch_new_context('expression', 'expr_impl_term', 'expr_impl_re');
// 				break;
// 			case 'sizeof':
// 				// expression解析を開始
// 				this.switch_new_context('expression', 'expr_impl_term', 'expr_impl_re');
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('unexpected-token');
// 				this.push_error_node('expression', 'unexpected-token');
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析(2回目)
// 	 * 
// 	 */
// 	private parse_expr_impl_re(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			// multiplicative
// 			case 'asterisk':
// 			case 'div_op':
// 			case 'remain_op':
// 			// additive
// 			case 'plus':
// 			case 'minus':
// 			// shift
// 			case 'left_shift_op':
// 			case 'right_shift_op':
// 			// relational
// 			case 'lt_op':
// 			case 'gt_op':
// 			case 'lte_op':
// 			case 'gte_op':
// 			// equality
// 			case 'equal_op':
// 			case 'inequal_op':
// 			// AND
// 			case 'ampersand':
// 			// exclusive-OR
// 			case 'bitwise_EXOR_op':
// 			// inclusive-OR
// 			case 'bitwise_OR_op':
// 			// logical-AND
// 			case 'logical_AND_op':
// 			// logical-OR
// 			case 'logical_OR_op':
// 				// binary-operator
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('expression');
// 				// expression解析を開始
// 				this.state = 'expr_impl';
// 				break;
// 			// conditional
// 			case 'conditional_op':
// 				// conditional-expression
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('expression');
// 				// expression解析を開始
// 				this.switch_new_context('expression', 'expr', 'expr_impl_re_cond');
// 				break;
// 			// assignment
// 			case 'simple_assign_op':
// 			case 'mul_assign_op':
// 			case 'div_assign_op':
// 			case 'remain_assign_op':
// 			case 'add_assign_op':
// 			case 'sub_assign_op':
// 			case 'left_shift_assign_op':
// 			case 'right_shift_assign_op':
// 			case 'bitwise_AND_assign_op':
// 			case 'bitwise_EXOR_assign_op':
// 			case 'bitwise_OR_assign_op':
// 				if (this.expr_info.expr_enable_assign) {
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('expression');
// 					// expression解析を開始
// 					this.state = 'expr_impl';
// 				} else {
// 					finish = true;
// 				}
// 				break;

// 			case 'EOF':
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは解析終了
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析(2回目)
// 	 * conditional
// 	 */
// 	private parse_expr_impl_re_cond(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			// conditional
// 			case 'colon':
// 				// conditional-expression
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('expression');
// 				// expression解析を開始
// 				this.switch_new_context('expression', 'expr_impl', 'expr_impl_re');
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('conditional-expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_colon');
// 				this.push_error_node('conditional-expression', 'not_found_colon');
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * ( まで検出した後から解析実施
// 	 * expression or type-name につながる
// 	 */
// 	private parse_expr_impl_lp(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// 空白文字以外のtokenを先読み
// 		let id: token_id;
// 		let pos: number;
// 		let ctx: parse_context;
// 		[id, pos] = this.get_token_id_if_not_whitespace(1);
// 		//出現しているtokenをチェック
// 		switch (id) {
// 			case 'right_paren':
// 				// ) が出現したらカッコ内が空だったら構文エラーで解析終了
// 				this.set_current_context_error('not_found_any_token');
// 				this.push_parse_node('expression', 'not_found_any_token');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// 1つ先のtokenから次のcontextを解析
// 				[ctx, pos] = this.lookahead_jdg_expr_typename(pos);
// 				switch (ctx) {
// 					case 'type-name':
// 						// type-nameであればカッコ含めて1つのtermとなる
// 						this.switch_new_context('expression', 'expr_impl_term', 'expr_impl_re');
// 						break;
// 					case 'expression':
// 						// expressionであればカッコの中身をexpressionとして解析する。
// 						// その後、( epxr ) がprimary-exprであり、expr 解析後はterm_primの解析に移る。
// 						// term_primまで解析が終わったら本contextのexpr_impl解析に戻る。
// 						// expression解析を開始
// 						this.switch_new_context('expression', 'expr_impl_term', 'expr_impl_re');
// 						this.switch_new_context('expression', 'expr_impl_term_prim', 'expr_impl_term_prim');
// 						// ( を解析ツリーに登録
// 						this.push_parse_node('expression');
// 						// expression解析を開始
// 						this.switch_new_context('expression', 'expr', 'expr_impl_lp_expr');
// 						break;
// 					default:
// 						// その他tokenは構文エラー
// 						this.set_current_context_error('unexpected-token');
// 						this.push_error_node('expression', 'unexpected-token');
// 						finish = true;
// 						break;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * ( expression まで検出した後から解析実施
// 	 * ) を閉じるための処置が必要
// 	 */
// 	private parse_expr_impl_lp_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// ) が出現したら現在contextの解析終了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('expression');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_right_paren');
// 				this.push_error_node('expression', 'not_found_right_paren');
// 				//finish = true;
// 				// 解析継続
// 				this.state = 'expr_impl_re';
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * 項を1つ取得する
// 	 */
// 	private parse_expr_impl_term(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			// primary-expression
// 			case 'identifier':
// 			// このcontextで出現するidentifierは変数名
// 			case 'octal_constant':
// 			case 'hex_constant':
// 			case 'decimal_constant':
// 			case 'decimal_float_constant':
// 			case 'hex_float_constant':
// 			case 'char_constant':
// 			case 'string_literal':
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('primary-expression');
// 				// 解析継続
// 				this.state = 'expr_impl_term_prim';
// 				break;

// 			// primary-expression
// 			// postfix-expression
// 			// cast-expression
// 			case 'left_paren':
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('expression');
// 				// expression と type-name を判別しないといけないので別処理へ遷移
// 				this.state = 'expr_impl_term_lp';
// 				break;

// 			// unary-expression
// 			case 'increment_op':			// ++
// 			case 'decrement_op':			// --
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('unary-expression');
// 				// 解析継続
// 				//this.state = 'expr_impl_term_unexpr';
// 				this.expr_info.expr_enable_cast = false;
// 				break;
// 			case 'ampersand':				// &
// 			case 'asterisk':				// *
// 			case 'plus':					// +
// 			case 'minus':					// -
// 			case 'bitwise_complement_op':	// ~
// 			case 'logical_negation_op':		// !
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('unary-expression');
// 				// 解析継続
// 				// this.state
// 				break;
// 			case 'sizeof':
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('expression');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'left_paren') {
// 					// ( が出現したら expression or type-name
// 					// expression と type-name を判別しないといけないので別処理へ遷移
// 					this.state = 'expr_impl_term_sizeof_lp';
// 				} else {
// 					// ( が出現しなければ解析継続
// 					//this.state = 'expr_impl_term_unexpr';
// 					this.expr_info.expr_enable_cast = false;
// 				}
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('unexpected-token');
// 				this.push_error_node('expression', 'unexpected-token');
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * primary-expression まで検出済み
// 	 * primary-expressionは1度のみ
// 	 * postfix-expressionの解析となる
// 	 */
// 	private parse_expr_impl_term_prim(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {

// 			// postfix-expression
// 			case 'left_bracket':			// [
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('postfix-expression');
// 				this.switch_new_context('expression', 'expr', 'expr_impl_term_prim_lb_expr');
// 				break;
// 			case 'left_paren':
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('postfix-expression');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() != 'right_paren') {
// 					// ) 以外が出現したら argument-expression-list 解析実施
// 					this.switch_new_context('unary-expression', 'arg_expr_list', 'expr_impl_term_prim_lp_arg_expr_list');
// 				} else {
// 					// ) が出現したら本contextは終了、そのまま解析継続
// 					this.push_parse_node('postfix-expression');
// 				}
// 				break;
// 			case 'dot':
// 			case 'arrow_op':
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('postfix-expression');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'identifier') {
// 					// identifierが出現したら解析継続
// 					this.push_parse_node('postfix-expression');
// 				} else {
// 					// その他tokenは構文エラー
// 					this.set_current_context_error('unexpected-token');
// 					this.push_error_node('postfix-expression', 'unexpected-token');
// 					finish = true;
// 				}
// 				break;
// 			case 'increment_op':			// ++
// 			case 'decrement_op':			// --
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('unary-expression');
// 				// 解析継続
// 				//this.state;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			// primary-expression は1度のみ
// 			case 'identifier':
// 			case 'octal_constant':
// 			case 'hex_constant':
// 			case 'decimal_constant':
// 			case 'decimal_float_constant':
// 			case 'hex_float_constant':
// 			case 'char_constant':
// 			case 'string_literal':
// 			// unary-operator は先頭のみ
// 			case 'ampersand':				// &
// 			case 'asterisk':				// *
// 			case 'plus':					// +
// 			case 'minus':					// -
// 			case 'bitwise_complement_op':	// ~
// 			case 'logical_negation_op':		// !
// 			case 'sizeof':
// 			default:
// 				// その他tokenが出現で解析終了
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * primary-expression [ expression まで検出済み
// 	 */
// 	private parse_expr_impl_term_prim_lb_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_bracket':			// ]
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('postfix-expression');
// 				// 解析継続
// 				this.state = 'expr_impl_term_prim';
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('postfix-expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_right_bracket');
// 				this.push_error_node('postfix-expression', 'not_found_right_bracket');
// 				// 解析継続
// 				this.state = 'expr_impl_term_prim';
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * primary-expression ( argument-expression-list まで検出済み
// 	 */
// 	private parse_expr_impl_term_prim_lp_arg_expr_list(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_paren':			// )
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('postfix-expression');
// 				// 解析継続
// 				this.state = 'expr_impl_term_prim';
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('postfix-expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_right_paren');
// 				this.push_error_node('postfix-expression', 'not_found_right_paren');
// 				// 解析継続
// 				this.state = 'expr_impl_term_prim';
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * ( まで検出した後から解析実施
// 	 * expression or type-name につながる
// 	 */
// 	private parse_expr_impl_term_lp(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		//出現しているtokenをチェック
// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// ) が出現したらカッコ内が空だったら構文エラーで解析終了
// 				this.set_current_context_error('not_found_any_token');
// 				this.push_parse_node('expression', 'not_found_any_token');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				let ctx: parse_context;
// 				let pos: number;
// 				[ctx, pos] = this.lookahead_jdg_expr_typename();
// 				switch (ctx) {
// 					case 'type-name':
// 						// 解析開始
// 						this.switch_new_context('type-name', 'type-name', 'expr_impl_term_lp_typename');
// 						break;
// 					case 'expression':
// 						// 解析開始
// 						this.switch_new_context('expression', 'expr', 'expr_impl_term_lp_expr');
// 						break;
// 					default:
// 						// その他tokenは構文エラー
// 						this.set_current_context_error('unexpected-token');
// 						this.push_error_node('expression', 'unexpected-token');
// 						finish = true;
// 						break;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * ( expression まで検出した後から解析実施
// 	 */
// 	private parse_expr_impl_term_lp_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		//出現しているtokenをチェック
// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// ) を登録
// 				this.push_parse_node('expression');
// 				// 解析継続
// 				this.state = 'expr_impl_term_prim';
// 				break;
// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_right_paren');
// 				this.push_error_node('expression', 'not_found_right_paren');
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * ( type-name まで検出した後から解析実施
// 	 */
// 	private parse_expr_impl_term_lp_typename(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		//出現しているtokenをチェック
// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// ) を登録
// 				this.push_parse_node('expression');
// 				break;
// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_right_paren');
// 				this.push_error_node('expression', 'not_found_right_paren');
// 				break;
// 		}

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'left_brace':
// 				// { が出現したら postfix-expression のcontextだった
// 				// { を登録
// 				this.push_parse_node('expression');
// 				// initializer-list 解析へ
// 				this.switch_new_context('initializer-list', 'initializer-list', 'expr_impl_term_lp_rp_lb_inilist');
// 				break;
// 			default:
// 				// cast-expressionが有効であれば遷移可能
// 				// 無効であれば構文エラー
// 				if (this.expr_info.expr_enable_cast) {
// 					// その他tokenはcast-expressionだったとみなす
// 					// 次の解析へ遷移
// 					this.state = 'expr_impl_term';
// 				} else {
// 					// その他tokenは構文エラー
// 					this.set_current_context_error('not_found_left_brace');
// 					this.push_error_node('expression', 'not_found_left_brace');
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * ( expression ) { initializer-list まで検出済み
// 	 */
// 	private parse_expr_impl_term_lp_rp_lb_inilist(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_brace':			// }
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('postfix-expression');
// 				// 解析終了
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('postfix-expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_right_brace');
// 				this.push_error_node('postfix-expression', 'not_found_right_brace');
// 				// 解析終了
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * sizeof ( まで検出した後から解析実施
// 	 * expression or type-name につながる
// 	 */
// 	private parse_expr_impl_term_sizeof_lp(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		//出現しているtokenをチェック
// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// ) が出現したらカッコ内が空だったら構文エラーで解析終了
// 				this.set_current_context_error('not_found_any_token');
// 				// ( を登録
// 				this.push_parse_node('unary-expression');
// 				// ) を登録
// 				this.push_parse_node('unary-expression', 'not_found_any_token');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('unary-expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				let ctx: parse_context;
// 				let pos: number;
// 				[ctx, pos] = this.lookahead_jdg_expr_typename(1);
// 				switch (ctx) {
// 					case 'type-name':
// 						// ( を登録
// 						this.push_parse_node('unary-expression');
// 						// 解析開始
// 						this.switch_new_context('type-name', 'type-name', 'expr_impl_term_sizeof_lp_typename');
// 						break;
// 					case 'expression':
// 						// 解析開始
// 						this.switch_new_context('unary-expression', 'unary-expr', 'expr_impl_term_sizeof_lp_rp');
// 						break;
// 					default:
// 						// その他tokenは構文エラー
// 						this.set_current_context_error('unexpected-token');
// 						this.push_error_node('unary-expression', 'unexpected-token');
// 						finish = true;
// 						break;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * sizeof ( typename まで検出した後から解析実施
// 	 */
// 	private parse_expr_impl_term_sizeof_lp_typename(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		//出現しているtokenをチェック
// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// ) を登録
// 				this.push_parse_node('unary-expression');
// 				break;
// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_right_paren');
// 				this.push_error_node('unary-expression', 'not_found_right_paren');
// 				break;
// 		}

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// 次のtokenをチェック
// 		switch (this.get_token_id()) {
// 			case 'left_brace':
// 				// { であれば initializer-listが続く
// 				// { を登録
// 				this.push_parse_node('unary-expression');
// 				// initializer-list 解析へ
// 				this.switch_new_context('initializer-list', 'initializer-list', 'expr_impl_term_sizeof_lp_typename_rp_lb_inilist');
// 				break;
// 			default:
// 				// その他tokenは解析終了
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * sizeof ( typename ) { initializer-list まで検出済み
// 	 */
// 	private parse_expr_impl_term_sizeof_lp_typename_rp_lb_inilist(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_brace':			// }
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('unary-expression');
// 				// 解析終了
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('unary-expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_right_brace');
// 				this.push_error_node('unary-expression', 'not_found_right_brace');
// 				// 解析終了
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * expression解析
// 	 * sizeof ( * ) まで検出した後から解析実施
// 	 */
// 	private parse_expr_impl_term_sizeof_lp_rp(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		//出現しているtokenをチェック
// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// ) を登録
// 				this.push_parse_node('expression');
// 				break;
// 			default:
// 				// その他tokenは構文エラー
// 				this.set_current_context_error('not_found_right_paren');
// 				this.push_error_node('expression', 'not_found_right_paren');
// 				break;
// 		}

// 		finish = true;
// 		return finish;
// 	}
// 	/**
// 	 * argument-expression-list解析
// 	 */
// 	private parse_arg_expr_list(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		if (this.is_expression_token()) {
// 			// expression開始tokenが出現していたら
// 			// assignment-expression解析開始
// 			this.switch_new_context('assignment-expression', 'assign-expr', 'arg_expr_list_re');
// 		} else {
// 			if (this.get_token_id() == 'EOF') {
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('postfix-expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 			} else {
// 				// その他tokenが出現したら構文エラー、解析終了とする
// 				this.set_current_context_error('unexpected-token');
// 				finish = true;
// 			}
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * argument-expression-list解析
// 	 */
// 	private parse_arg_expr_list_re(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'comma':
// 				// , が出現したら解析継続
// 				this.push_parse_node('argument-expression-list');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.is_expression_token()) {
// 					// expression開始tokenが出現していたら
// 					// assignment-expression解析開始
// 					this.switch_new_context('assignment-expression', 'assign-expr', 'arg_expr_list_re');
// 				} else {
// 					if (this.get_token_id() == 'EOF') {
// 						// EOF が出現したら構文エラーで終了
// 						this.set_current_context_error('EOF_in_parse');
// 						this.push_error_node('postfix-expression', 'EOF_in_parse');
// 						this.state = 'EOF';
// 						finish = true;
// 					} else {
// 						// その他tokenが出現したら構文エラー、解析終了とする
// 						this.set_current_context_error('unexpected-token');
// 						finish = true;
// 					}
// 				}
// 				break;

// 			default:
// 				// その他tokenが出現したら解析終了とする
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * declaration解析
// 	 * declaration-specifiers init-declarator-list(opt) ;
// 	 */
// 	private parse_declaration(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// type-specifierの出現有無を初期化
// 		this.init_type_spec_info();

// 		switch (this.get_token_id()) {
// 			case 'EOF':
// 				// EOFは意味がないが一応正常終了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('declaration-specifier');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				if (this.is_declaration_token()) {
// 					// declaration-specifierの解析開始
// 					this.switch_new_context('declaration-specifier', 'decl-specifiers', 'declaration_decl-spec');
// 				} else {
// 					// その他tokenは構文エラー
// 					// declarationが出現するcontextで呼ばれるのでこのパスはありえない
// 					// 無限ループしないためにtokenを消費して解析終了
// 					// 解析ツリーに出現tokenを登録
// 					this.push_parse_node('declaration-specifier', 'unexpected-token');
// 					// contextにエラーを設定
// 					this.set_current_context_error('unexpected-token');
// 					// 解析終了
// 					finish = true;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * declaration解析
// 	 * declaration-specifiers まで検出した後から解析実施
// 	 */
// 	private parse_declaration_decl_spec(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'semicolon':
// 				// ;によりdeclarationのcontext、declarationの終了となる
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('declaration');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('declaration', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現
// 				if (this.is_declarator_token()) {
// 					// declarator開始tokenであれば解析開始
// 					this.switch_new_context('declarator', 'declarator', 'declaration_decl-spec_decl');
// 				} else {
// 					// その他は構文エラーで終了
// 					// declaratorが出現しなかったものとして解析継続
// 					this.push_error_node('declarator', 'not_found_declarator');
// 					// contextにエラーを設定
// 					this.set_current_context_error('not_found_declarator');
// 					finish = true;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * declaration解析
// 	 * declaratorまで取得した後、init-declarator-list(opt)の解析を実施
// 	 */
// 	private parse_declaration_decl_spec_decl(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'simple_assign_op':
// 				// = が出現したら初期化を実施
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('init-declarator');
// 				// initializerの解析を実施
// 				this.switch_new_context('initializer', 'initializer', 'declaration_decl-spec_decl_init');
// 				break;
// 			case 'comma':
// 				// , が出現したら次のdeclaratorを解析
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('init-declarator');
// 				if (this.is_declarator_token()) {
// 					// declaratorの解析を実施
// 					this.switch_new_context('declarator', 'declarator', 'declaration_decl-spec_decl');
// 				} else {
// 					// その他tokenは構文エラー
// 					this.push_error_node('declarator', 'unexpected-token');
// 					// contextにエラーを設定
// 					this.set_current_context_error('unexpected-token');
// 				}
// 				break;
// 			case 'semicolon':
// 				// ; が出現したらdeclarator解析完了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('declaration');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('declarator', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				// declaratorが出現しなかったものとして解析継続
// 				this.push_error_node('declarator', 'unexpected-token');
// 				// contextにエラーを設定
// 				this.set_current_context_error('unexpected-token');
// 				break;
// 		}

// 		// 解析完了であれば取得したgrammarを評価
// 		if (finish) {
// 			// typedef
// 			this.eval_declaration(this.get_curr_node());
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * declaration解析
// 	 * declarator initilaizer まで検出した状態から解析
// 	 */
// 	private parse_declaration_decl_spec_decl_init(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'comma':
// 				// , が出現したら次のdeclaratorを解析
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('init-declarator');
// 				if (this.is_declarator_token()) {
// 					// declaratorの解析を実施
// 					this.switch_new_context('declarator', 'declarator', 'declaration_decl-spec_decl');
// 				} else {
// 					// その他tokenは構文エラー
// 					this.push_error_node('declarator', 'unexpected-token');
// 					// contextにエラーを設定
// 					this.set_current_context_error('unexpected-token');
// 				}
// 				break;
// 			case 'semicolon':
// 				// ; が出現したらdeclarator解析完了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('declaration');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('declarator', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				// declaratorが出現しなかったものとして解析継続
// 				this.push_error_node('declarator', 'unexpected-token');
// 				// contextにエラーを設定
// 				this.set_current_context_error('unexpected-token');
// 				finish = true;
// 				break;
// 		}

// 		// 解析完了であれば取得したgrammarを評価
// 		let node: parse_tree_node;
// 		node = this.get_curr_node();
// 		if (finish && node.err_info == 'null') {
// 			this.eval_declaration(node);
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * declaration-specifiers解析
// 	 *	storage-class-specifier, type-specifier, type-qualifier, function-specifier
// 	 */
// 	private parse_decl_specifiers(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// type-specifierの出現有無を初期化
// 		this.init_type_spec_info();

// 		switch (this.get_token_id()) {
// 			// storage-class-specifier
// 			case 'typedef':
// 				// typedef context であることを記憶
// 				this.set_current_context_is_typedef();
// 			case 'extern':
// 			case 'static':
// 			case 'auto':
// 			case 'register':
// 			// type-qualifier
// 			case 'const':
// 			case 'restrict':
// 			case 'volatile':
// 			// function specifier
// 			case 'inline':
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('declaration-specifier');
// 				// 次状態へ遷移
// 				this.state = 'decl-specifiers_re';
// 				break;

// 			// type-specifier
// 			case 'signed':
// 			case 'unsigned':
// 				// type-specifier-infoを更新
// 				this.type_spec_info.sign_def = this.get_token_id();
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('declaration-specifier');
// 				// 次状態へ遷移
// 				this.state = 'decl-specifiers_re';
// 				break;
// 			case 'void':
// 			case 'char':
// 			case 'short':
// 			case 'int':
// 			case 'long':
// 			case 'float':
// 			case 'double':
// 			case '_Bool':
// 			case '_Complex':
// 				// type-specifier-infoを更新
// 				this.type_spec_info.spec_def = this.get_token_id();
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('declaration-specifier');
// 				// 次状態へ遷移
// 				this.state = 'decl-specifiers_re';
// 				break;
// 			case 'struct':
// 				// type-specifier-infoを更新
// 				this.type_spec_info.struct_def = true;
// 				// struct or union であれば、struct-or-union-specifierの解析開始
// 				this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'decl-specifiers_re');
// 				break;
// 			case 'union':
// 				// type-specifier-infoを更新
// 				this.type_spec_info.union_def = true;
// 				// struct or union であれば、struct-or-union-specifierの解析開始
// 				this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'decl-specifiers_re');
// 				break;
// 			case 'enum':
// 				// type-specifier-infoを更新
// 				this.type_spec_info.enum_def = true;
// 				// enumであれば、enum-specifierの解析開始
// 				this.switch_new_context('enum-specifier', 'enum-spec', 'decl-specifiers_re');
// 				break;

// 			case 'identifier':
// 				// typedefとして定義された型か判定
// 				if (this.is_typedef_token()) {
// 					// 定義済みであればエラーなし
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('declaration-specifier');
// 				} else {
// 					// 未定義でも型とみなして解析継続
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('declaration-specifier', 'unknown_type');
// 				}
// 				// type-specifier-infoを更新
// 				this.type_spec_info.id_def = this.get_token_str();
// 				// 次状態へ遷移
// 				this.state = 'decl-specifiers_re';
// 				break;

// 			case 'semicolon':
// 				// ;によりdeclarationのcontext終了となる
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('declaration-specifier');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('declaration-specifier', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				// declaration出現のcontextであることを前提に遷移するので、
// 				// 何かしらの期待するtokenだったとみなして解析継続
// 				this.push_error_node('declaration-specifier', 'unexpected-token');
// 				// contextにエラーを設定
// 				this.set_current_context_error('unexpected-token');
// 				// 次状態へ遷移
// 				this.state = 'decl-specifiers_re';
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * declaration-specifiers解析(2回目)
// 	 *	storage-class-specifier, type-specifier, type-qualifier, function-specifier
// 	 */
// 	private parse_decl_specifiers_re(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			// storage-class-specifier
// 			case 'typedef':
// 				// typedef context であることを記憶
// 				this.set_current_context_is_typedef();
// 			case 'extern':
// 			case 'static':
// 			case 'auto':
// 			case 'register':
// 			// 先頭以外で出現するのはNGか？
// 			// type-qualifier
// 			case 'const':
// 			case 'restrict':
// 			case 'volatile':
// 			// function specifier
// 			case 'inline':
// 				// declaration-specifiers であればそのまま解析継続
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('declaration-specifier');
// 				break;

// 			// type-specifier
// 			case 'signed':
// 			case 'unsigned':
// 				// declaration-specifiers の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('declaration-specifier', 'duplicate_type_specify');
// 				} else {
// 					// 未出現であれば問題なし
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('declaration-specifier');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.sign_def = this.get_token_id();
// 				}
// 				break;
// 			case 'void':
// 			case 'char':
// 			case 'short':
// 			case 'int':
// 			case 'long':
// 			case 'float':
// 			case 'double':
// 			case '_Bool':
// 			case '_Complex':
// 			case '__far':
// 			case '__near':
// 				// declaration-specifiers の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('declaration-specifier', 'duplicate_type_specify');
// 				} else {
// 					// 未出現であれば問題なし
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('declaration-specifier');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.spec_def = this.get_token_id();
// 				}
// 				break;
// 			case 'struct':
// 				// declaration-specifiers の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'decl-specifiers_re', 'duplicate_type_specify');
// 				} else {
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'decl-specifiers_re');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.struct_def = true;
// 				}
// 				break;
// 			case 'union':
// 				// declaration-specifiers の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'decl-specifiers_re', 'duplicate_type_specify');
// 				} else {
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'decl-specifiers_re');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.union_def = true;
// 				}
// 				break;
// 			case 'enum':
// 				// declaration-specifiers の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// struct or union であれば、enum-specifierの解析開始
// 					this.switch_new_context('enum-specifier', 'enum-spec', 'decl-specifiers_re', 'duplicate_type_specify');
// 				} else {
// 					// struct or union であれば、enum-specifierの解析開始
// 					this.switch_new_context('enum-specifier', 'enum-spec', 'decl-specifiers_re');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.enum_def = true;
// 				}
// 				break;

// 			case 'identifier':
// 				// typedefとして定義された型か判定
// 				if (this.is_typedef_token()) {
// 					// declaration-specifiers の一連の解析内で型が出現済みか判定
// 					if (this.is_type_spec_duplicated(this.get_token_id())) {
// 						// 型定義済み かつ 型出現済みであれば、2回以上出現したので構文エラー
// 						// 解析ツリーに出現トークンを登録
// 						this.push_parse_node('declaration-specifier', 'duplicate_type_specify');
// 					} else {
// 						// 型定義済み かつ 未出現であれば問題なし
// 						// 解析ツリーに出現トークンを登録
// 						this.push_parse_node('declaration-specifier');
// 						// type-specifier-infoを更新
// 						this.type_spec_info.id_def = this.get_token_str();
// 					}
// 				} else {
// 					// declaration-specifiers の一連の解析内で型が出現済みか判定
// 					if (this.is_type_spec_duplicated(this.get_token_id())) {
// 						// 型未定義 かつ 型出現済みであれば、declaratorとみなして解析終了
// 						finish = true;
// 					} else {
// 						// 型未定義 かつ 未出現であれば型とみなして解析継続
// 						this.push_parse_node('declaration-specifier', 'unknown_type');
// 						// type-specifier-infoを更新
// 						this.type_spec_info.id_def = this.get_token_str();
// 					}
// 				}
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは解析終了
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}

// 	private parse_struct_union_s(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// struct/unionを検出した状態でここに遷移するため、
// 		// 最初にstruct/unionを登録する。
// 		this.push_parse_node('struct-or-union');

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// check: identifier
// 		if (this.get_token_id() == 'identifier') {
// 			// identifierであればtoken受理
// 			this.push_parse_node('struct-or-union');
// 		}

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// check: {
// 		if (this.get_token_id() == 'left_brace') {
// 			// struct-declaration-list 解析開始
// 			this.push_parse_node('struct-or-union');
// 			this.state = 'struct-declaration-list';
// 		} else {
// 			// { が出現しなければここで解析終了
// 			finish = true;
// 		}

// 		return finish;
// 	}
// 	private parse_struct_declaration_list(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// } が登場するまで繰り返す
// 		switch (this.get_token_id()) {
// 			// } によりstruct/union定義終了
// 			case 'right_brace':
// 				this.push_parse_node('struct-or-union');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('struct-or-union', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			// } 以外が出現したら specifier-qualifier-list とみなす
// 			default:
// 				// specifier-qualifier-list解析を開始
// 				// 解析終了したら struct-declarator-list の解析へ遷移
// 				this.switch_new_context('struct-declaration-list', 'sq-list', 'struct-declarator-list');
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * struct-declarator-list を解析する。
// 	 */
// 	private parse_struct_declarator_list(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'colon':
// 				// : が出現したら constant-expression が続く
// 				this.push_parse_node('struct-declarator');
// 				// constant-expression解析を開始
// 				// 解析終了したらstruct-declarator-list(2回目以降)の解析へ遷移
// 				this.switch_new_context('constant-expression', 'const-expr', 'struct-declarator-list_re');
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('struct-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現したら declarator 解析を実施
// 				// 解析終了したらstruct-declarator-list(2回目以降)の解析へ遷移
// 				this.switch_new_context('declarator', 'declarator', 'struct-declarator-list_re');
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * struct-declarator-list(2回目以降) を解析する。
// 	 */
// 	private parse_struct_declarator_list_re(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'colon':
// 				// : が出現したら constant-expression が続く
// 				this.push_parse_node('struct-declarator');
// 				// constant-expression解析を開始
// 				// 解析終了したらstruct-declarator-list(2回目以降)の解析へ遷移
// 				this.switch_new_context('constant-expression', 'const-expr', 'struct-declarator-list_re');
// 				break;

// 			case 'comma':
// 				// comma が出現したら struct-declaration-list の解析に戻る
// 				this.push_parse_node('struct-declarator');
// 				this.state = 'struct-declaration-list';
// 				break;

// 			case 'semicolon':
// 				// semicolon が出現したら struct-declaration の解析が終了。
// 				// struct-declaration-list の解析に戻る
// 				this.push_parse_node('struct-declarator');
// 				this.state = 'struct-declaration-list';
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('struct-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現したら構文エラー
// 				// struct-declaration-list の解析に戻る
// 				this.push_error_node('struct-declarator', 'unexpected-token');
// 				this.state = 'struct-declaration-list';
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * enum-specifier解析
// 	 * enumを検出したら遷移する
// 	 */
// 	private parse_enum_spec(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// enum 出現を前提にtoken登録
// 		this.push_parse_node('enum-specifier');

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// identifierチェック
// 		if (this.get_token_id() == 'identifier') {
// 			this.push_parse_node('enum-specifier');
// 		}

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// { チェック
// 		if (this.get_token_id() == 'left_brace') {
// 			// { が出現していたらenumerator-listの解析を実施
// 			this.push_parse_node('enum-specifier');
// 			this.switch_new_context('enum-specifier', 'enum-list', 'enum-spec_lb');
// 		} else {
// 			// 出現しなかったら解析終了
// 			finish = true;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * enum-specifier解析
// 	 * enumerator-listの解析が終了したら遷移する
// 	 * } をチェックする
// 	 */
// 	private parse_enum_spec_lb(): boolean {
// 		let finish: boolean;
// 		finish = true;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// { チェック
// 		if (this.get_token_id() == 'right_brace') {
// 			// } が出現していたらenumerator-specifierの解析終了
// 			this.push_parse_node('enum-specifier');
// 		} else {
// 			// 出現しなかったら構文エラー
// 			this.push_parse_node('enum-specifier', 'not_found_right_brace');
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * enumerator-list解析
// 	 * enum {} の中身を解析
// 	 */
// 	private parse_enum_list(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// identifierチェック
// 		if (this.get_token_id() == 'identifier') {
// 			// enum定義登録
// 			this.push_enum_const();
// 			// token登録
// 			this.push_parse_node('enum-specifier');
// 		}

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// = チェック
// 		if (this.get_token_id() == 'simple_assign_op') {
// 			// = が出現していたらconstant-expression取得
// 			this.push_parse_node('enum-specifier');
// 			// constant-expression解析を開始
// 			// 解析終了したらenumerator-list(2回目以降)の解析へ遷移
// 			this.switch_new_context('constant-expression', 'const-expr', 'enum-list_re');
// 		} else {
// 			// = が出現していなければenumeratorの解析終了
// 			// enumerator-listの2回目以降(,以降)の解析へ遷移
// 			this.state = 'enum-list_re';
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * enumerator-list(2回目以降)解析
// 	 * enum {} の中身を解析
// 	 */
// 	private parse_enum_list_re(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// ,チェック
// 		if (this.get_token_id() == 'comma') {
// 			// token登録
// 			this.push_parse_node('enum-specifier');
// 			// 空白をスキップ
// 			this.skip_whitespace();
// 			// } が続く可能性があるのでチェック
// 			if (this.get_token_id() == 'right_brace') {
// 				// } が出現したら解析終了
// 				finish = true;
// 			} else {
// 				// enumeratorを再度解析
// 				this.state = 'enum-list';
// 			}
// 		} else {
// 			// , が出現しなければenumerator-list解析終了
// 			finish = true;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * declarator解析
// 	 * 
// 	 */
// 	private parse_declarator(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'asterisk':
// 				// * が出現したらpointer解析
// 				this.switch_new_context('pointer', 'pointer', 'declarator');
// 				break;

// 			case 'left_paren':
// 				// ( が出現したらdeclaratorを入れ子で解析
// 				// token登録
// 				this.push_parse_node('declarator');
// 				this.switch_new_context('declarator', 'declarator', 'declarator_lp_decl');
// 				break;

// 			case 'identifier':
// 				// token登録
// 				this.push_parse_node('declarator');
// 				// direct-declarator部の解析へ遷移
// 				this.state = 'direct-declarator';
// 				break;

// 			case 'EOF':
// 				// EOF出現、構文エラーで終了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現したら
// 				this.state = 'declarator@err';
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * declarator解析
// 	 * ( declarator まで検出した状態から解析
// 	 */
// 	private parse_declarator_lp_decl(): boolean {
// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ) をチェック
// 		if (this.get_token_id() == 'right_paren') {
// 			// token登録
// 			this.push_parse_node('declarator');
// 		} else {
// 			this.push_error_node('declarator', 'not_found_right_paren');
// 		}

// 		// direct-declarator部の解析へ遷移
// 		this.state = 'direct-declarator';

// 		return false;
// 	}
// 	/**
// 	 * declarator解析
// 	 * 構文エラー検出時のエラー処理を実施
// 	 */
// 	private parse_declarator_err(): boolean {
// 		let finish: boolean;
// 		finish = true;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// エラー情報を登録して解析終了
// 		this.push_error_node('declarator', "unexpected-token");

// 		return finish;
// 	}
// 	/**
// 	 * direct-declarator解析
// 	 * 
// 	 */
// 	private parse_direct_declarator(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'left_bracket':
// 				// [ が出現したら変数宣言と確定
// 				this.set_current_context('declarator_var');
// 				// token登録
// 				this.push_parse_node('direct-declarator');
// 				// []内の解析状態へ遷移
// 				this.state = 'direct-declarator_lb';
// 				break;

// 			case 'left_paren':
// 				// ( が出現したら関数宣言と確定
// 				this.set_current_context('declarator_func');
// 				// token登録
// 				this.push_parse_node('direct-declarator');
// 				// ()内の解析状態へ遷移
// 				this.state = 'direct-declarator_lp';
// 				break;

// 			case 'EOF':
// 				// EOFで解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// identifierだけで終了したら変数宣言と確定
// 				this.set_current_context('declarator_var');
// 				// その他tokenが出現したらdeclarator解析完了とする
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * direct-declarator解析
// 	 * direct-declarator [ まで検出した後から解析開始
// 	 */
// 	private parse_direct_declarator_lb(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_bracket':
// 				// ] が出現したら解析完了とする
// 				this.push_parse_node('direct-declarator');
// 				finish = true;
// 				break;

// 			case 'static':
// 				// static が出現したら解析継続
// 				// token登録
// 				this.push_parse_node('direct-declarator');
// 				break;

// 			case 'asterisk':
// 				// * が出現した
// 				// token登録
// 				this.push_parse_node('direct-declarator');
// 				// 空白を事前にスキップ
// 				this.skip_whitespace();
// 				// 次は必ず ] が出現する
// 				if (this.get_token_id() == 'right_bracket') {
// 					// ] が出現したら解析完了とする
// 					this.push_parse_node('direct-declarator');
// 				} else {
// 					// ] 以外が出現したら構文エラーで終了
// 					this.set_current_context_error('not_found_right_bracket');
// 					this.push_error_node('direct-declarator', 'not_found_right_bracket');
// 				}
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF出現、構文エラーで終了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('direct-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				if (this.is_type_qualifier_token()) {
// 					// type-qualifier開始tokenが出現していたら解析継続
// 					// token登録
// 					this.push_parse_node('direct-declarator');
// 				} else if (this.is_expression_token()) {
// 					// expression開始tokenが出現していたら
// 					// assignment-expression解析開始
// 					this.switch_new_context('assignment-expression', 'assign-expr', 'direct-declarator_lb_assign_expr');
// 				} else {
// 					// その他tokenが出現したら構文エラー、解析終了とする
// 					this.set_current_context_error('not_found_right_bracket');
// 					finish = true;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * direct-declarator解析
// 	 * direct-declarator [ assignment-expression まで検出した後から解析開始
// 	 */
// 	private parse_direct_declarator_lb_assign_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_bracket':
// 				// ] が出現したら解析完了とする
// 				this.push_parse_node('direct-declarator');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF出現、構文エラーで終了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('direct-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現したら構文エラー、解析終了とする
// 				this.set_current_context_error('not_found_right_bracket');
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * direct-declarator解析
// 	 * direct-declarator ( まで検出した後から解析開始
// 	 */
// 	private parse_direct_declarator_lp(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// ) が出現したら解析完了とする
// 				this.push_parse_node('direct-declarator');
// 				finish = true;
// 				break;

// 			case 'identifier':
// 				// parameter-type-list か identifier-list かを判定
// 				let ctx: parse_context;
// 				let pos: number;
// 				[ctx, pos] = this.lookahead_jdg_list_param_id();
// 				switch (ctx) {
// 					case 'parameter-type-list':
// 						// parameter-type-list解析開始
// 						this.switch_new_context('parameter-type-list', 'parameter-type-list', 'direct-declarator_lp_list_rp');
// 						break;
// 					case 'identifier-list':
// 						// identifier-list解析開始
// 						this.switch_new_context('identifier-list', 'identifier-list', 'direct-declarator_lp_list_rp');
// 						break;
// 					default:
// 						// こちらのパスはありえない
// 						this.push_error_node('declarator', '@logic_error');
// 						finish = true;
// 						break;
// 				}
// 				break;

// 			case 'EOF':
// 				// EOF出現、構文エラーで終了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('direct-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				if (this.is_declaration_token()) {
// 					// declaration開始token(declaration-specifiers token)が出現したら
// 					// parameter-type-list解析開始
// 					this.switch_new_context('parameter-type-list', 'parameter-type-list', 'direct-declarator_lp_list_rp');
// 				} else {
// 					// その他tokenが出現したら構文エラー、解析終了とする
// 					this.set_current_context_error('not_found_right_paren');
// 					finish = true;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * direct-declarator解析
// 	 * direct-declarator ( list まで検出した後から解析開始
// 	 */
// 	private parse_direct_declarator_lp_list_rp(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// ) を登録して解析完了とする
// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// ) が出現したら解析完了とする
// 				this.push_parse_node('direct-declarator');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF出現、構文エラーで終了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('direct-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現したら構文エラー、解析終了とする
// 				this.set_current_context_error('not_found_right_paren');
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * parameter-type-list 解析
// 	 * 
// 	 */
// 	private parse_param_type_list(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		if (this.is_declaration_token()) {
// 			// declaration開始token(=declaration-sepcifiers)なら
// 			// parameter-declaration 解析
// 			this.switch_new_context('parameter-type-list', 'decl-specifiers', 'parameter-type-list_type');
// 		} else {
// 			// その他tokenは解析終了
// 			finish = true;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * parameter-type-list 解析
// 	 * declaration-specifiers の解析完了後に本状態へ遷移する。
// 	 * 型名の後の変数名が該当。
// 	 */
// 	private parse_param_type_list_type(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'comma':
// 				// , が出現したら次のparameter-list解析
// 				this.push_parse_node('parameter-type-list');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				// ... が続いたら可変長引数、ここでparameter-type-list終了
// 				if (this.get_token_id() == 'ellipsis') {
// 					this.push_parse_node('parameter-type-list');
// 					finish = true;
// 				} else {
// 					if (this.is_declaration_token()) {
// 						// declaration開始token(=declaration-sepcifiers)なら
// 						// parameter-declaration 解析
// 						this.switch_new_context('parameter-type-list', 'decl-specifiers', 'parameter-type-list_type');
// 					} else {
// 						this.push_error_node('parameter-type-list', 'unexpected-token');
// 					}
// 				}
// 				break;

// 			case 'EOF':
// 				// EOF出現、構文エラーで終了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('parameter-type-list', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				if (this.is_declarator_token()) {
// 					let ctx: parse_context;
// 					let pos: number;
// 					[ctx, pos] = this.lookahead_jdg_decl_abst();
// 					switch (ctx) {
// 						case 'declarator':
// 							this.switch_new_context('parameter-type-list', 'declarator', 'parameter-type-list_type');
// 							break;
// 						case 'abstract-declarator':
// 							this.switch_new_context('parameter-type-list', 'abstract-declarator', 'parameter-type-list_type');
// 							break;
// 						default:
// 							// このケースはありえない
// 							this.push_error_node('parameter-type-list', '@logic_error');
// 							break;
// 					}
// 				} else {
// 					// その他tokenが出現したら解析終了とする
// 					finish = true;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * parameter-type-list 解析
// 	 * declaration-specifiers (abstract-)declarator まで検出した状態から解析
// 	 */
// 	private parse_param_type_list_type_decl(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'comma':
// 				// , が出現したら次のparameter-list解析
// 				this.push_parse_node('parameter-type-list');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				// ... が続いたら可変長引数、ここでparameter-type-list終了
// 				if (this.get_token_id() == 'ellipsis') {
// 					this.push_parse_node('parameter-type-list');
// 					finish = true;
// 				} else {
// 					if (this.is_declaration_token()) {
// 						// declaration開始token(=declaration-sepcifiers)なら
// 						// parameter-declaration 解析
// 						this.switch_new_context('parameter-type-list', 'decl-specifiers', 'parameter-type-list_type');
// 					} else {
// 						this.push_error_node('parameter-type-list', 'unexpected-token');
// 					}
// 				}
// 				break;

// 			case 'EOF':
// 				// EOF出現、構文エラーで終了
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('parameter-type-list', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現したら解析終了とする
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}


// 	/**
// 	 * identifier-list 解析
// 	 * 
// 	 */
// 	private parse_identifier_list(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'identifier':
// 				// token登録
// 				this.push_parse_node('identifier-list');
// 				this.state = 'identifier-list_re';
// 				break;

// 			default:
// 				// identifier以外が出現したら終了とする
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * identifier-list 解析(2回目以降)
// 	 * 
// 	 */
// 	private parse_identifier_list_re(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'comma':
// 				// , が出現したら次は必ずidentifier
// 				// token登録
// 				this.push_parse_node('identifier-list');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'identifier') {
// 					// identifierが出現したら解析継続
// 					// token登録
// 					this.push_parse_node('identifier-list');
// 				} else {
// 					// , にidentifier以外が続いたら構文エラー
// 					this.push_error_node('identifier-list', 'unexpected-token');
// 					finish = true;
// 				}
// 				break;

// 			default:
// 				// identifier以外が出現したら終了とする
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}


// 	/**
// 	 * type-nameが登場するコンテキストでコールする。
// 	 * type-name = specifier-quailifier-list abstract-declarator(opt)
// 	 * のspecifier-quailifier-listを取得する処理を実施。
// 	 * parseエラーがあればエラーtokenをセットして終了。
// 	 */
// 	private parse_typename(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// 必ず specifier-qualifier-listから開始する。
// 		// specifier-qualifier-list解析を開始
// 		this.switch_new_context('type-name', 'sq-list', 'type-name_sq-list_abst-decl');

// 		return finish;
// 	}
// 	/**
// 	 * specifier-qualifier-list 解析後に遷移する。
// 	 * type-name解析のコンテキストで出現するabstract-declaratorを解析する
// 	 */
// 	private parse_typename_abst_decl(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// abstract-declarator は opt なので出現するかチェックする。
// 		// abstract-declarator は parameter-declaration と type-name のコンテキストで出現する。
// 		// parameter-declaration と type-name の後には ) が必ず続くので判別可能
// 		if (this.is_abst_decl_begin_token()) {
// 			// abstract-declarator解析を開始
// 			this.switch_new_context('abstract-declarator', 'abstract-declarator', 'type-name_end');
// 		} else {
// 			// abstract-declarator が出現しなければ解析終了
// 			this.state = 'type-name_end';
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * type-name 解析完了時に遷移する。
// 	 * type-name の解析完了を通知する。
// 	 */
// 	private parse_typename_end(): boolean {
// 		let finish: boolean;
// 		finish = true;
// 		return finish;
// 	}

// 	/**
// 	 * specifier-quailifier-list 解析
// 	 * parseエラーがあればエラーtokenをセットして終了。
// 	 */
// 	private parse_sqlist(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// type-specifierの出現有無を初期化
// 		this.init_type_spec_info();

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			// type-qualifier
// 			case 'const':
// 			case 'restrict':
// 			case 'volatile':
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('type-qualifier');
// 				this.state = 'sq-list_re';
// 				break;

// 			// type-specifier
// 			case 'signed':
// 			case 'unsigned':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('type-specifier', 'duplicate_type_specify');
// 				} else {
// 					// 未出現であれば問題なし
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('type-specifier');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.sign_def = this.get_token_id();
// 				}
// 				this.state = 'sq-list_re';
// 				break;
// 			case 'void':
// 			case 'char':
// 			case 'short':
// 			case 'int':
// 			case 'long':
// 			case 'float':
// 			case 'double':
// 			case '_Bool':
// 			case '_Complex':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('type-specifier', 'duplicate_type_specify');
// 				} else {
// 					// 未出現であれば問題なし
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('type-specifier');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.spec_def = this.get_token_id();
// 				}
// 				this.state = 'sq-list_re';
// 				break;

// 			// type-specifier/struct or union
// 			case 'struct':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'sq-list_re', 'duplicate_type_specify');
// 				} else {
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'sq-list_re');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.struct_def = true;
// 				}
// 				break;
// 			case 'union':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'sq-list_re', 'duplicate_type_specify');
// 				} else {
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'sq-list_re');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.union_def = true;
// 				}
// 				break;

// 			// type-specifier/enum
// 			case 'enum':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// struct or union であれば、enum-specifierの解析開始
// 					this.switch_new_context('enum-specifier', 'enum-spec', 'sq-list_re', 'duplicate_type_specify');
// 				} else {
// 					// struct or union であれば、enum-specifierの解析開始
// 					this.switch_new_context('enum-specifier', 'enum-spec', 'sq-list_re');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.enum_def = true;
// 				}
// 				break;

// 			// type-specifier/typedef
// 			case 'identifier':
// 				// typedefとして定義された型か判定
// 				if (this.is_typedef_token()) {
// 					// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 					if (this.is_type_spec_duplicated(this.get_token_id())) {
// 						// 型定義済み かつ 型出現済みであれば、2回以上出現したので構文エラー
// 						// 解析ツリーに出現トークンを登録
// 						this.push_parse_node('type-specifier', 'duplicate_type_specify');
// 					} else {
// 						// 型定義済み かつ 未出現であれば問題なし
// 						// 解析ツリーに出現トークンを登録
// 						this.push_parse_node('type-specifier');
// 						// type-specifier-infoを更新
// 						this.type_spec_info.id_def = this.get_token_str();
// 					}
// 				} else {
// 					// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 					if (this.is_type_spec_duplicated(this.get_token_id())) {
// 						// 型未定義 かつ 型出現済みであれば、declaratorとみなして解析終了
// 						finish = true;
// 					} else {
// 						// 型未定義 かつ 未出現であれば型とみなして解析継続
// 						this.push_parse_node('type-specifier', 'unknown_type');
// 						// type-specifier-infoを更新
// 						this.type_spec_info.id_def = this.get_token_str();
// 					}
// 				}
// 				this.state = 'sq-list_re';
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('type-qualifier', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			// 上記で定義したtokenが出現している間はspecifier-quailifier-listとみなす。
// 			// 上記以外のtokenが出現したら解析終了
// 			default:
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * specifier-quailifier-list 解析
// 	 * parseエラーがあればエラーtokenをセットして終了。
// 	 */
// 	private parse_sqlist_re(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			// type-qualifier
// 			case 'const':
// 			case 'restrict':
// 			case 'volatile':
// 				// 解析ツリーに出現トークンを登録
// 				this.push_parse_node('type-qualifier');
// 				break;

// 			// type-specifier
// 			case 'signed':
// 			case 'unsigned':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('type-specifier', 'duplicate_type_specify');
// 				} else {
// 					// 未出現であれば問題なし
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('type-specifier');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.sign_def = this.get_token_id();
// 				}
// 				this.state = 'sq-list_re';
// 				break;
// 			case 'void':
// 			case 'char':
// 			case 'short':
// 			case 'int':
// 			case 'long':
// 			case 'float':
// 			case 'double':
// 			case '_Bool':
// 			case '_Complex':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('type-specifier', 'duplicate_type_specify');
// 				} else {
// 					// 未出現であれば問題なし
// 					// 解析ツリーに出現トークンを登録
// 					this.push_parse_node('type-specifier');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.spec_def = this.get_token_id();
// 				}
// 				this.state = 'sq-list_re';
// 				break;

// 			// type-specifier/struct or union
// 			case 'struct':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'sq-list_re', 'duplicate_type_specify');
// 				} else {
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'sq-list_re');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.struct_def = true;
// 				}
// 				break;
// 			case 'union':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// 型出現済みであれば、2回以上出現したので構文エラー
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'sq-list_re', 'duplicate_type_specify');
// 				} else {
// 					// struct or union であれば、struct-or-union-specifierの解析開始
// 					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'sq-list_re');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.union_def = true;
// 				}
// 				break;

// 			// type-specifier/enum
// 			case 'enum':
// 				// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 				if (this.is_type_spec_duplicated(this.get_token_id())) {
// 					// struct or union であれば、enum-specifierの解析開始
// 					this.switch_new_context('enum-specifier', 'enum-spec', 'sq-list_re', 'duplicate_type_specify');
// 				} else {
// 					// struct or union であれば、enum-specifierの解析開始
// 					this.switch_new_context('enum-specifier', 'enum-spec', 'sq-list_re');
// 					// type-specifier-infoを更新
// 					this.type_spec_info.enum_def = true;
// 				}
// 				break;

// 			// type-specifier/typedef
// 			case 'identifier':
// 				// typedefとして定義された型か判定
// 				if (this.is_typedef_token()) {
// 					// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 					if (this.is_type_spec_duplicated(this.get_token_id())) {
// 						// 型定義済み かつ 型出現済みであれば、2回以上出現したので構文エラー
// 						// 解析ツリーに出現トークンを登録
// 						this.push_parse_node('type-specifier', 'duplicate_type_specify');
// 					} else {
// 						// 型定義済み かつ 未出現であれば問題なし
// 						// 解析ツリーに出現トークンを登録
// 						this.push_parse_node('type-specifier');
// 						// type-specifier-infoを更新
// 						this.type_spec_info.id_def = this.get_token_str();
// 					}
// 				} else {
// 					// specifier-quailifier-list の一連の解析内で型が出現済みか判定
// 					if (this.is_type_spec_duplicated(this.get_token_id())) {
// 						// 型未定義 かつ 型出現済みであれば、declaratorとみなして解析終了
// 						finish = true;
// 					} else {
// 						// 型未定義 かつ 未出現であれば型とみなして解析継続
// 						this.push_parse_node('type-specifier', 'unknown_type');
// 						// type-specifier-infoを更新
// 						this.type_spec_info.id_def = this.get_token_str();
// 					}
// 				}
// 				this.state = 'sq-list_re';
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('type-qualifier', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			// 上記で定義したtokenが出現している間はspecifier-quailifier-listとみなす。
// 			// 上記以外のtokenが出現したら解析終了
// 			default:
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * abstract-declarator解析
// 	 */
// 	private parse_abst_decl(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'asterisk':
// 				// pointer 解析を開始
// 				this.switch_new_context('abstract-declarator', 'pointer', 'abstract-declarator');
// 				break;

// 			case 'left_paren':
// 				this.push_parse_node('abstract-declarator');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				// ( が出現したら abstract-declarator か parameter-type-list が開始する。
// 				// 次に出現する文字は競合しないため、この時点で判定できる。
// 				if (this.is_abst_decl_begin_token()) {
// 					// abstract-declarator を入れ子で解析開始
// 					this.switch_new_context('abstract-declarator', 'abstract-declarator', 'abstract-declarator_lp_abst');
// 				} else {
// 					// parameter-type-list を解析開始
// 					this.switch_new_context('parameter-type-list', 'parameter-type-list', 'abstract-declarator_lp_param');
// 				}
// 				break;

// 			case 'left_bracket':
// 				// [ の中の解析へ遷移
// 				this.push_parse_node('abstract-declarator');
// 				this.state = 'abstract-declarator_lb';
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('abstract-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現したら解析終了
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * ( abstractor-declarator まで解析した後に遷移
// 	 * 閉じる ) をチェックするだけ。
// 	 * カッコの後は入れ子で解析するため、ここで必ず解析終了とする。
// 	 */
// 	private parse_abst_decl_lp_abst(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// abstract-declarator 解析完了
// 				this.push_parse_node('abstract-declarator');
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('abstract-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// ) 以外が出現したら構文エラー
// 				this.push_error_node('abstract-declarator', 'not_found_right_paren');
// 				break;
// 		}

// 		return true;
// 	}

// 	/**
// 	 * abstract-declarator ( parameter-type-list まで解析した後に遷移
// 	 * 閉じる ) をチェックするだけ。
// 	 */
// 	private parse_abst_decl_lp_param(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_paren':
// 				// abstract-declarator 解析完了
// 				this.push_parse_node('abstract-declarator');
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('abstract-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// ) 以外が出現したら構文エラー
// 				this.push_error_node('abstract-declarator', 'not_found_right_paren');
// 				break;
// 		}

// 		// direct-abstract-declarator 解析を継続
// 		this.state = 'abstract-declarator';

// 		return finish;
// 	}

// 	/**
// 	 * abstract-declarator [ まで解析した後に遷移
// 	 */
// 	private parse_abst_decl_lb(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_bracket':
// 				// abstract-declarator [] で終了
// 				this.push_parse_node('abstract-declarator');
// 				// direct-abstract-declarator 解析を継続
// 				this.state = 'abstract-declarator';
// 				break;

// 			case 'asterisk':
// 				// abstract-declarator [*] で終了
// 				this.push_parse_node('abstract-declarator');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				// ] が続けば解析終了、出現しなければ構文エラー
// 				if (this.get_token_id() == 'right_bracket') {
// 					this.push_parse_node('abstract-declarator');
// 				} else {
// 					this.push_error_node('abstract-declarator', 'not_found_right_bracket');
// 				}
// 				// direct-abstract-declarator 解析を継続
// 				this.state = 'abstract-declarator';
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('abstract-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// 上記以外のtokenが出現したら type-qualifier / static / assignment-expression を解析
// 				this.state = 'abstract-declarator_lb_type';
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * abstract-declarator [ type-qualifier / static / assignment-expression を解析
// 	 */
// 	private parse_abst_decl_lb_type(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// 次状態を設定しておく
// 		this.state = 'abstract-declarator_rb';

// 		// static が出現していたら受理
// 		if (this.get_token_id() == 'static') {
// 			this.push_parse_node('abstract-declarator');
// 			// 空白をスキップ
// 			this.skip_whitespace();
// 		}

// 		// type-qualifier が出現していたら受理
// 		while (this.is_type_qualifier_token()) {
// 			this.push_parse_node('abstract-declarator');
// 			// 空白をスキップ
// 			this.skip_whitespace();
// 		}

// 		// static が出現していたら受理
// 		if (this.get_token_id() == 'static') {
// 			this.push_parse_node('abstract-declarator');
// 			// 空白をスキップ
// 			this.skip_whitespace();
// 		}

// 		// assignment-expression 解析
// 		if (this.get_token_id() != 'right_bracket') {
// 			// ] でなければ assingment-expression を解析
// 			this.switch_new_context('assignment-expression', 'assign-expr', 'abstract-declarator_rb');
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * abstract-declarator [ * ] まで解析した後に遷移
// 	 * 閉じる ] をチェックするだけ。
// 	 */
// 	private parse_abst_decl_rb(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_bracket':
// 				// abstract-declarator 解析完了
// 				this.push_parse_node('abstract-declarator');
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('abstract-declarator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// ] 以外が出現したら構文エラー
// 				this.push_error_node('abstract-declarator', 'not_found_right_bracket');
// 				break;
// 		}

// 		// direct-abstract-declarator 解析を継続
// 		this.state = 'abstract-declarator';

// 		return finish;
// 	}

// 	/**
// 	 * * が出現したら遷移する。
// 	 */
// 	private parse_pointer(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'asterisk':
// 			case 'const':
// 			case 'restrict':
// 			case 'volatile':
// 				// 解析ツリーに出現トークンを登録
// 				// pointer解析継続
// 				this.push_parse_node('pointer');
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('pointer', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			// 上記以外のtokenが出現したら解析終了
// 			default:
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * initializer解析
// 	 * assignment-expression or { initializer-list,  }
// 	 */
// 	private parse_initializer(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		if (this.is_expression_token()) {
// 			// expression tokenであればexpression解析開始
// 			this.switch_new_context('assignment-expression', 'assign-expr', 'initializer_end');
// 		} else if (this.get_token_id() == 'left_brace') {
// 			// { を登録
// 			this.push_parse_node('initializer');
// 			// initializer-list解析開始
// 			this.switch_new_context('initializer-list', 'initializer-list', 'initializer_lb_list');
// 		} else {
// 			// その他tokenはエラー
// 			this.push_error_node('initializer', 'unexpected-token');
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * initializer解析
// 	 * { initializer-list を検出した状態から解析を実施する
// 	 */
// 	private parse_initializer_lb_list(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_brace':
// 				// } が出現したら initializer 解析終了
// 				this.push_parse_node('initializer');
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('initializer', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// } 以外が出現したら構文エラー
// 				this.push_error_node('initializer', 'not_found_right_bracket');
// 				break;
// 		}

// 		// direct-abstract-declarator 解析を継続
// 		this.state = 'initializer_end';

// 		return finish;
// 	}
// 	/**
// 	 * initializer解析
// 	 * { initializer-list } or assign-expr を検出した状態から解析を実施する
// 	 */
// 	private parse_initializer_end(): boolean {
// 		let finish: boolean;
// 		finish = true;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		return finish;
// 	}

// 	/**
// 	 * initializer-list解析
// 	 * { designation(opt) initializer, }
// 	 */
// 	private parse_initializer_list(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		if (this.is_designator_token()) {
// 			// designator tokenが出現していればdesignator解析開始
// 			this.state = 'initializer-list_design';
// 		} else {
// 			// その他tokenが出現していたらinitializerの解析開始
// 			this.switch_new_context('initializer', 'initializer', 'initializer-list_init');
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * initializer-list解析
// 	 * designationの解析を実施
// 	 */
// 	private parse_initializer_list_design(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		// designation判定
// 		switch (this.get_token_id()) {
// 			case 'left_bracket':
// 				// [
// 				this.push_parse_node('initializer-list');
// 				// constant-expression
// 				this.switch_new_context('constant-expression', 'const-expr', 'initializer-list_design_lb_const-expr');
// 				break;
// 			case 'dot':
// 				// .
// 				this.push_parse_node('initializer-list');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				// identifier
// 				if (this.get_token_id() == 'identifier') {
// 					this.push_parse_node('designator');
// 				} else {
// 					// identifier以外は構文エラー
// 					// identifierの代わりとみなして解析継続
// 					this.push_parse_node('designator', 'unexpected-token');
// 				}
// 				break;

// 			case 'simple_assign_op':
// 				// 初回は必ずdesignator検出で遷移するので上記までのパスにいく
// 				// 2回目以降の解析で = が出現したらdesignation解析終了
// 				this.push_parse_node('designation');
// 				// initializerの解析開始
// 				this.switch_new_context('initializer', 'initializer', 'initializer-list_init');
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('initializer', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenは構文エラー
// 				this.push_error_node('initializer', 'unexpected-token');
// 				// initializerの解析開始
// 				this.switch_new_context('initializer', 'initializer', 'initializer-list_init');
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * initializer-list / designationの解析を実施
// 	 * [ const-expression まで解析した後に遷移する
// 	 * 閉じる ] をチェックするだけ。
// 	 */
// 	private parse_initializer_list_design_lb_constexpr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_bracket':
// 				// designator 解析完了
// 				this.push_parse_node('designator');
// 				// direct-abstract-declarator 解析を継続
// 				this.state = 'initializer-list_design';
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('designator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// ] 以外が出現したら構文エラー
// 				this.push_error_node('designator', 'not_found_right_bracket');
// 				// direct-abstract-declarator 解析を継続
// 				this.state = 'initializer-list_design';
// 				break;
// 		}


// 		return finish;
// 	}

// 	/**
// 	 * initializer-list解析
// 	 * designation(opt) initializer まで検出した状態から解析を実施
// 	 */
// 	private parse_initializer_list_init(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'right_brace':
// 				// } が出現したらinitializer-list終了
// 				finish = true;
// 				break;

// 			case 'comma':
// 				// , が出現したら次のtokenを解析
// 				this.push_parse_node('initializer-list');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'right_brace') {
// 					// } が出現したら終了
// 					finish = true;
// 				} else {
// 					// } 以外が出現したら initializer-list 解析継続
// 					this.state = 'initializer-list';
// 				}
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('designator', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他tokenが出現したら構文エラーで解析終了
// 				this.push_error_node('initializer-list', 'unexpected-token');
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	 * statement解析
// 	 */
// 	private parse_statement(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			// labeled-statement
// 			// expression-statement
// 			case 'identifier':
// 				// token先読み、空白はスキップする
// 				let t_id: token_id;
// 				let pos: number;
// 				[t_id, pos] = this.get_token_id_if_not_whitespace();
// 				if (t_id == 'colon') {
// 					// 直後に : が出現するならlabeled-statement
// 					// label登録
// 					this.push_parse_node('labeled-statement');
// 					// 空白をスキップ
// 					this.skip_whitespace();
// 					// :登録
// 					this.push_parse_node('labeled-statement');
// 					// statement解析開始
// 					this.switch_new_context('statement', 'statement', 'statement_end');
// 				} else {
// 					// それ以外なら expression-statement
// 					this.switch_new_context('expression', 'expr', 'statement_expr');
// 				}
// 				break;

// 			// labeled-statement
// 			case 'case':
// 				// case登録
// 				this.push_parse_node('labeled-statement');
// 				// statement解析開始
// 				this.switch_new_context('constant-expression', 'const-expr', 'statement_case');
// 				break;
// 			case 'default':
// 				// default登録
// 				this.push_parse_node('labeled-statement');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'colon') {
// 					// :登録
// 					this.push_parse_node('labeled-statement');
// 				} else {
// 					// : 以外が出現したら構文エラー
// 					this.push_error_node('labeled-statement', 'not_found_colon');
// 					// contextにエラーを設定
// 					this.set_current_context_error('not_found_colon');
// 				}
// 				// statement解析開始
// 				this.switch_new_context('statement', 'statement', 'statement_end');
// 				break;

// 			// expression-statement
// 			case 'semicolon':
// 				this.push_parse_node('expression-statement');
// 				finish = true;
// 				break;

// 			// selection-statement
// 			case 'if':
// 				// if登録
// 				this.push_parse_node('selection-statement');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'left_paren') {
// 					// ( 登録
// 					this.push_parse_node('selection-statement');
// 				} else {
// 					// ( 以外が出現したら構文エラー
// 					this.push_error_node('selection-statement', 'not_found_left_paren');
// 					// contextにエラーを設定
// 					this.set_current_context_error('not_found_left_paren');
// 				}
// 				// statement解析開始
// 				this.switch_new_context('statement', 'statement', 'statement_if');
// 				break;
// 			case 'switch':
// 				// switch登録
// 				this.push_parse_node('selection-statement');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'left_paren') {
// 					// ( 登録
// 					this.push_parse_node('selection-statement');
// 				} else {
// 					// ( 以外が出現したら構文エラー
// 					this.push_error_node('selection-statement', 'not_found_left_paren');
// 					// contextにエラーを設定
// 					this.set_current_context_error('not_found_left_paren');
// 				}
// 				// statement解析開始
// 				this.switch_new_context('statement', 'statement', 'statement_switch');
// 				break;

// 			// iteration-statement
// 			case 'while':
// 				// while登録
// 				this.push_parse_node('iteration-statement');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'left_paren') {
// 					// ( 登録
// 					this.push_parse_node('iteration-statement');
// 				} else {
// 					// ( 以外が出現したら構文エラー
// 					this.push_error_node('iteration-statement', 'not_found_left_paren');
// 					// contextにエラーを設定
// 					this.set_current_context_error('not_found_left_paren');
// 				}
// 				// statement解析開始
// 				this.switch_new_context('statement', 'statement', 'statement_while');
// 				break;
// 			case 'do':
// 				// do登録
// 				this.push_parse_node('iteration-statement');
// 				// statement解析開始
// 				this.switch_new_context('statement', 'statement', 'statement_do');
// 				break;
// 			case 'for':
// 				// for登録
// 				this.push_parse_node('iteration-statement');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'left_paren') {
// 					// ( 登録
// 					this.push_parse_node('iteration-statement');
// 				} else {
// 					// ( 以外が出現したら構文エラー
// 					this.push_error_node('iteration-statement', 'not_found_left_paren');
// 					// contextにエラーを設定
// 					this.set_current_context_error('not_found_left_paren');
// 				}
// 				this.state = 'statement_for_lp';
// 				break;

// 			// jump-statement
// 			case 'goto':
// 				// goto登録
// 				this.push_parse_node('jump-statement');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'identifier') {
// 					// identifier 登録
// 					this.push_parse_node('jump-statement');
// 				} else {
// 					// identifier 以外が出現したら構文エラー
// 					this.push_error_node('jump-statement', 'unexpected-token');
// 					// contextにエラーを設定
// 					this.set_current_context_error('unexpected-token');
// 				}
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'semicolon') {
// 					// ; 登録
// 					this.push_parse_node('jump-statement');
// 				} else {
// 					// ; 以外が出現したら構文エラー
// 					this.push_error_node('jump-statement', 'unexpected-token');
// 					// contextにエラーを設定
// 					this.set_current_context_error('unexpected-token');
// 				}
// 				finish = true;
// 				break;
// 			case 'continue':
// 			case 'break':
// 				// continue/break登録
// 				this.push_parse_node('jump-statement');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'semicolon') {
// 					// ; 登録
// 					this.push_parse_node('jump-statement');
// 				} else {
// 					// ; 以外が出現したら構文エラー
// 					this.push_error_node('jump-statement', 'unexpected-token');
// 					// contextにエラーを設定
// 					this.set_current_context_error('unexpected-token');
// 				}
// 				finish = true;
// 				break;
// 			case 'return':
// 				// goto登録
// 				this.push_parse_node('jump-statement');
// 				// 空白をスキップ
// 				this.skip_whitespace();
// 				if (this.get_token_id() == 'semicolon') {
// 					// 次の状態へ遷移
// 					this.state = 'statement_return';
// 				} else {
// 					// ; 以外が出現したらexpression解析開始
// 					this.switch_new_context('expression', 'expr', 'statement_return');
// 				}
// 				break;

// 			// compound statement
// 			case 'left_brace':
// 				this.state = 'statement_compound';
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('declaration', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他token
// 				// statementのcontextでdeclarationは出現しない
// 				/*if (this.is_declaration_token()) {
// 					// declaration開始tokenであれば解析開始
// 					this.switch_new_context('declaration', 'declaration', 'statement');
// 				} else*/ if (this.is_expression_token()) {
// 					// expression開始tokenであれば解析開始
// 					this.switch_new_context('expression', 'expr', 'statement_expr');
// 				} else {
// 					// その他は構文エラー
// 					// 解析ツリーに出現トークンを登録
// 					this.push_error_node('statement', 'unexpected-token');
// 					// contextにエラーを設定
// 					this.set_current_context_error('unexpected-token');
// 					finish = true;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * case const-expr まで検出
// 	 */
// 	private parse_statement_case(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		if (this.get_token_id() == 'colon') {
// 			// : が出現したら
// 			this.push_parse_node('labeled-statement');
// 		} else {
// 			// : 以外が出現したら構文エラー
// 			this.push_error_node('labeled-statement', 'not_found_colon');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_colon');
// 		}

// 		// statement解析へ以降する
// 		this.switch_new_context('statement', 'statement', 'statement_end');

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * if ( expr まで検出
// 	 */
// 	private parse_statement_if(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ) チェック
// 		if (this.get_token_id() == 'right_paren') {
// 			// ) が出現したら
// 			this.push_parse_node('selection-statement');
// 		} else {
// 			// ) 以外が出現したら構文エラー
// 			this.push_error_node('selection-statement', 'not_found_right_paren');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_right_paren');
// 		}

// 		// statement解析へ以降する
// 		this.switch_new_context('statement', 'statement', 'statement_if_state');

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * if ( expr ) statement まで検出
// 	 */
// 	private parse_statement_if_state(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// else チェック
// 		if (this.get_token_id() == 'else') {
// 			// else が出現したら
// 			this.push_parse_node('selection-statement');
// 			// statement解析へ以降する
// 			this.switch_new_context('statement', 'statement', 'statement_if_state');
// 		} else {
// 			// else 以外が出現したら解析終了
// 			finish = true;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * switch ( expr まで検出
// 	 */
// 	private parse_statement_switch(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ) チェック
// 		if (this.get_token_id() == 'right_paren') {
// 			// ) が出現したら
// 			this.push_parse_node('selection-statement');
// 		} else {
// 			// ) 以外が出現したら構文エラー
// 			this.push_error_node('selection-statement', 'not_found_right_paren');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_right_paren');
// 		}

// 		// statement解析へ以降する
// 		this.switch_new_context('statement', 'statement', 'statement_switch_state');

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * switch ( expr ) statement まで検出
// 	 */
// 	private parse_statement_switch_state(): boolean {
// 		return true;
// 	}
// 	/**
// 	 * statement解析
// 	 * while ( expr まで検出
// 	 */
// 	private parse_statement_while(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ) チェック
// 		if (this.get_token_id() == 'right_paren') {
// 			// ) が出現したら
// 			this.push_parse_node('iteration-statement');
// 		} else {
// 			// ) 以外が出現したら構文エラー
// 			this.push_error_node('iteration-statement', 'not_found_right_paren');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_right_paren');
// 		}

// 		// statement解析へ以降する
// 		this.switch_new_context('statement', 'statement', 'statement_while_state');

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * while ( expr ) statement まで検出
// 	 */
// 	private parse_statement_while_state(): boolean {
// 		return true;
// 	}
// 	/**
// 	 * statement解析
// 	 * do statement まで検出
// 	 */
// 	private parse_statement_do(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// while チェック
// 		if (this.get_token_id() == 'while') {
// 			// while が出現したら
// 			this.push_parse_node('iteration-statement');
// 		} else {
// 			// while 以外が出現したら構文エラー
// 			this.push_error_node('iteration-statement', 'not_found_while');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_while');
// 		}

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ( チェック
// 		if (this.get_token_id() == 'left_paren') {
// 			// ( が出現したら
// 			this.push_parse_node('iteration-statement');
// 		} else {
// 			// ( 以外が出現したら構文エラー
// 			this.push_error_node('iteration-statement', 'not_found_left_paren');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_left_paren');
// 		}

// 		// expression解析へ遷移する
// 		this.switch_new_context('expression', 'expr', 'statement_do_state');

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * do statement while ( expr まで検出
// 	 */
// 	private parse_statement_do_state(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ) チェック
// 		if (this.get_token_id() == 'right_paren') {
// 			// ) が出現したら
// 			this.push_parse_node('iteration-statement');
// 		} else {
// 			// ) 以外が出現したら構文エラー
// 			this.push_error_node('iteration-statement', 'not_found_right_paren');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_right_paren');
// 		}

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ; チェック
// 		if (this.get_token_id() == 'right_paren') {
// 			// ; が出現したら
// 			this.push_parse_node('iteration-statement');
// 		} else {
// 			// ; 以外が出現したら構文エラー
// 			this.push_error_node('iteration-statement', 'not_found_semicolon');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_semicolon');
// 		}

// 		return true;
// 	}
// 	/**
// 	 * statement解析
// 	 * for ( expr まで検出
// 	 */
// 	private parse_statement_for_lp(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		let is_expr: boolean = this.is_expression_token();
// 		let is_decl: boolean = this.is_declaration_token();
// 		if (this.get_token_id() == 'semicolon') {
// 			// ; が出現したら次の解析へ
// 			this.state = 'statement_for_lp_t';
// 		} else if (is_expr && is_decl) {
// 			// expression と declaration 重複
// 			// 重複するのはidentifierのみ
// 			if (this.is_typedef_token()) {
// 				// typedef-nameであればdeclarationのcontext
// 				this.switch_new_context('declaration', 'declaration', 'statement_for_lp_t');
// 			} else {
// 				// typedef-nameでなければ判定不可なのでidentifier解析へ
// 				this.switch_new_context('@undecided', 'statement_for_lp_id', 'statement_for_lp_t');
// 			}
// 		} else if (is_expr) {
// 			// expressionに該当ならexpression解析へ
// 			this.switch_new_context('expression', 'expr', 'statement_for_lp_t');
// 		} else if (is_decl) {
// 			// declarationに該当ならdeclaration解析へ
// 			this.switch_new_context('declaration', 'declaration', 'statement_for_lp_t');
// 		} else {
// 			// その他tokenは構文エラー
// 			this.push_error_node('iteration-statement', 'unexpected-token');
// 			// contextにエラーを設定
// 			this.set_current_context_error('unexpected-token');
// 			// 解析終了
// 			finish = true;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * for ( identifier まで検出
// 	 */
// 	private parse_statement_for_lp_id(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// expression or declarator の判定を実施
// 		// typedefの解析をしっかり行えば不要な判定なので
// 		// 強引に先読みして判定を実施する。
// 		let la_fin: boolean = false;
// 		let id: token_id;
// 		let pos: number = 0;			// 現在出現しているのがid、その次から見たいので[0]開始→[1]から検索
// 		let is_decl: boolean;
// 		let is_expr: boolean;
// 		let id_stack: token_id[] = [];

// 		// 判定：1token先読み
// 		// 空白文字以外のtokenを取得
// 		[id, pos] = this.get_token_id_if_not_whitespace(pos + 1);
// 		switch (id) {
// 			// expression context
// 			// exprのcontextにおいてidに続くtoken
// 			case 'dot':
// 			case 'arrow_op':
// 			case 'increment_op':
// 			case 'decrement_op':
// 				this.set_current_context('expression');
// 				this.state = 'expr';
// 				la_fin = true;
// 				break;

// 			// declaration context
// 			// idに続くtoken
// 			case 'typedef':
// 			case 'extern':
// 			case 'static':
// 			case 'auto':
// 			case 'register':
// 			case 'void':
// 			case 'char':
// 			case 'short':
// 			case 'int':
// 			case 'long':
// 			case 'int':
// 			case 'long':
// 			case 'float':
// 			case 'double':
// 			case 'signed':
// 			case 'unsigned':
// 			case '_Bool':
// 			case '_Complex':
// 			case 'struct':
// 			case 'union':
// 			case 'enum':
// 			case 'identifier':
// 			case 'const':
// 			case 'restrict':
// 			case 'volatile':
// 			case 'inline':
// 				this.set_current_context('declaration');
// 				this.state = 'declaration';
// 				la_fin = true;
// 				break;

// 			// 重複
// 			case 'left_bracket':
// 			case 'left_paren':
// 			case 'comma':
// 			case 'asterisk':
// 				// 次の解析へ
// 				la_fin = false;
// 				id_stack.push(id);
// 				// declarationのcontextでは再度decl tokenが出現する
// 				is_decl = this.is_declaration_token(id);
// 				// expressionのcontextでは再度expr tokenが出現する
// 				is_expr = this.is_expression_token(id);
// 				break;

// 			// EOF
// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('postfix-expression', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				la_fin = true;
// 				finish = true;
// 				break;
// 			default:
// 				// その他tokenは構文エラー、そのまま解析継続
// 				this.set_current_context_error('unexpected-token');
// 				break;
// 		}

// 		if (!la_fin) {
// 			// 判定：2token先読み
// 			// 空白文字以外のtokenを取得
// 			[id, pos] = this.get_token_id_if_not_whitespace(pos + 1);
// 			// declarationのcontextでは再度decl tokenが出現する
// 			is_decl = this.is_declaration_token(id);
// 			// expressionのcontextでは再度expr tokenが出現する
// 			is_expr = this.is_expression_token(id);

// 			if (is_decl && !is_expr) {
// 				this.set_current_context('declaration');
// 				this.state = 'declaration';
// 				la_fin = true;
// 			} else if (!is_decl && is_expr) {
// 				this.set_current_context('expression');
// 				this.state = 'expr';
// 				la_fin = true;
// 			} else {
// 				switch (id_stack[0]) {
// 					case 'left_bracket':
// 						if (id == 'right_bracket') {
// 							this.set_current_context('declaration');
// 							this.state = 'declaration';
// 							la_fin = true;
// 						}
// 						break;
// 					case 'left_paren':
// 						if (id == 'right_paren') {
// 							this.set_current_context('declaration');
// 							this.state = 'declaration';
// 							la_fin = true;
// 						}
// 						break;
// 					case 'comma':
// 						break;
// 					case 'asterisk':
// 						break;
// 				}

// 			}

// 		}

// 		if (!la_fin) {
// 			// 2つ先読みしてダメならexprに断定
// 			this.set_current_context('expression');
// 			this.state = 'expr';
// 			la_fin = true;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * for ( token まで検出
// 	 */
// 	private parse_statement_for_lp_t(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ; チェック
// 		if (this.get_token_id() == 'semicolon') {
// 			// ; が出現したら
// 			this.push_parse_node('iteration-statement');
// 		} else {
// 			// ; 以外が出現したら構文エラー
// 			this.push_error_node('iteration-statement', 'not_found_semicolon');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_semicolon');
// 		}

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ; チェック
// 		if (this.get_token_id() == 'semicolon') {
// 			// ; が出現したら次の解析へ
// 			this.state = 'statement_for_lp_t_s_expr';
// 		} else {
// 			// ; 以外ならexpression解析へ
// 			this.switch_new_context('expression', 'expr', 'statement_for_lp_t_s_expr');
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * for ( token ; expr まで検出
// 	 */
// 	private parse_statement_for_lp_t_s_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ; チェック
// 		if (this.get_token_id() == 'semicolon') {
// 			// ; が出現したら
// 			this.push_parse_node('iteration-statement');
// 		} else {
// 			// ; 以外が出現したら構文エラー
// 			this.push_error_node('iteration-statement', 'not_found_semicolon');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_semicolon');
// 		}

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ) チェック
// 		if (this.get_token_id() == 'right_paren') {
// 			// ) が出現したら次の解析へ
// 			this.state = 'statement_for_lp_t_s_expr_s_expr';
// 		} else {
// 			// ) 以外ならexpression解析へ
// 			this.switch_new_context('expression', 'expr', 'statement_for_lp_t_s_expr_s_expr');
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * for ( token ; expr ; expr まで検出
// 	 */
// 	private parse_statement_for_lp_t_s_expr_s_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ) チェック
// 		if (this.get_token_id() == 'semicolon') {
// 			// ) が出現したら
// 			this.push_parse_node('iteration-statement');
// 		} else {
// 			// ) 以外が出現したら構文エラー
// 			this.push_error_node('iteration-statement', 'not_found_right_paren');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_right_paren');
// 		}

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// statement チェック
// 		if (this.is_statement()) {
// 			// statement が出現したら解析へ
// 			this.switch_new_context('statement', 'statement', 'statement_for_lp_t_s_expr_s_expr_rp_state');
// 		} else {
// 			// statement 以外なら構文エラー
// 			// 解析ツリーに出現トークンを登録
// 			this.push_error_node('statement', 'unexpected-token');
// 			// contextにエラーを設定
// 			this.set_current_context_error('unexpected-token');
// 			// 解析終了
// 			finish = true;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * for ( token ; expr ; expr ) state まで検出
// 	 */
// 	private parse_statement_for_lp_t_s_expr_s_expr_rp_state(): boolean {
// 		return true;
// 	}
// 	/**
// 	 * statement解析
// 	 * return statement まで検出
// 	 */
// 	private parse_statement_return(): boolean {
// 		let finish: boolean;
// 		finish = true;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ; チェック
// 		if (this.get_token_id() == 'semicolon') {
// 			// ; が出現したら
// 			this.push_parse_node('jump-statement');
// 		} else {
// 			// ; 以外が出現したら構文エラー
// 			this.push_error_node('jump-statement', 'not_found_semicolon');
// 			// contextにエラーを設定
// 			this.set_current_context_error('not_found_semicolon');
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * { まで検出、ただしpushしていない
// 	 */
// 	private parse_statement_compound(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// { を登録
// 		this.push_parse_node('compound-statement');

// 		// 次状態へ遷移
// 		this.state = 'statement_compound_lb';

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * { まで検出
// 	 */
// 	private parse_statement_compound_lb(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// statement or declaration の繰り返しになる
// 		// } が出現したら終了
// 		switch (this.get_token_id()) {
// 			case 'right_brace':
// 				this.push_parse_node('compound-statement');
// 				finish = true;
// 				break;

// 			default:
// 				// contextを判定
// 				let ctx: parse_context;
// 				let pos: number;
// 				[ctx, pos] = this.lookahead_jdg_state_decl();
// 				switch (ctx) {
// 					case 'declaration':
// 						this.switch_new_context('declaration', 'declaration', 'statement_compound_lb');
// 						break;
// 					case 'statement':
// 						this.switch_new_context('statement', 'statement', 'statement_compound_lb');
// 						break;
// 					case '@undecided':
// 					default:
// 						// その他は構文エラー
// 						this.push_error_node('compound-statement', 'unexpected-token');
// 						// contextにエラーを設定
// 						this.set_current_context_error('unexpected-token');
// 						finish = true;
// 						break;
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析
// 	 * expression
// 	 */
// 	private parse_statement_expr(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白をスキップ
// 		this.skip_whitespace();

// 		// ; が出現したら終了
// 		switch (this.get_token_id()) {
// 			case 'semicolon':
// 				this.push_parse_node('expression-statement');
// 				finish = true;
// 				break;

// 			default:
// 				// その他は構文エラー
// 				this.push_error_node('expression-statement', 'unexpected-token');
// 				// contextにエラーを設定
// 				this.set_current_context_error('unexpected-token');
// 				finish = true;
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * statement解析完了
// 	 */
// 	private parse_statement_end(): boolean {
// 		return true;
// 	}

// 	/**
// 	 * function-definition解析
// 	 * declaration-specifiers declarator まで検出した状態から解析する
// 	 */
// 	private parse_func_def_decl_spec_decl(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		// 空白を事前にスキップ
// 		this.skip_whitespace();

// 		switch (this.get_token_id()) {
// 			case 'left_brace':
// 				// { が出現したらcompound-statementの解析開始
// 				this.switch_new_context('compound-statement', 'statement_compound', 'func-def_end');
// 				break;

// 			case 'EOF':
// 				// EOFは構文エラー
// 				// 解析ツリーに出現トークンを登録
// 				this.push_error_node('declaration', 'EOF_in_parse');
// 				// contextにエラーを設定
// 				this.set_current_context_error('EOF_in_parse');
// 				// 解析終了
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// その他token
// 				if (this.is_declaration_token()) {
// 					// declaration開始tokenであれば解析開始
// 					this.switch_new_context('declaration', 'declaration', 'func-def_decl-spec_decl');
// 				} else {
// 					// その他は構文エラー
// 					// エラー処理に任せる
// 					this.state = 'func-def_decl-spec_decl@err';
// 				}
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * function-definition解析
// 	 * declaration-specifiers declarator まで検出した状態から解析する
// 	 * この後にunexpected tokenが出現したときのエラー復帰処理
// 	 */
// 	private parse_func_def_decl_spec_decl_err(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		this.set_current_context_error('unexpected-token');

// 		switch (this.get_token_id()) {
// 			case 'EOF':
// 				// EOFは解析終了
// 				this.push_error_node('function-definition', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			default:
// 				// エラー登録、tokenを消費して解析継続
// 				this.push_parse_node('function-definition', 'unexpected-token');
// 				break;
// 		}

// 		return finish;
// 	}
// 	/**
// 	 * function-definition解析完了
// 	 * 
// 	 */
// 	private parse_func_def_end(): boolean {
// 		let finish: boolean;
// 		finish = true;

// 		return finish;
// 	}

// 	/**
// 	 * Preprocessing directives
// 	 * group-part まで出現
// 	 */
// 	private parse_pp_group_part(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		switch (this.get_token_id()) {
// 			case 'NEWLINE':
// 				// 改行が出現するまでは解析継続する
// 				this.push_parse_node('pp-directive');
// 				finish = true;
// 				break;

// 			case 'EOF':
// 				// EOF が出現したら構文エラーで終了
// 				this.set_current_context_error('EOF_in_parse');
// 				this.push_error_node('pp-directive', 'EOF_in_parse');
// 				this.state = 'EOF';
// 				finish = true;
// 				break;

// 			case 'pp_token':
// 				// 解析継続
// 				this.push_parse_node('pp-directive');
// 				break;
// 		}

// 		return finish;
// 	}

// 	/**
// 	private parse_(): boolean {
// 		let finish: boolean;
// 		finish = false;

// 		switch (this.get_token_id()) {
// 		}

// 		return finish;
// 	}

// 	 */


// }
