'use strict';

// implement:
//   Annex A
//   A.2 Phrase structure grammar

import lexer from '../src/lexer';
import { tokenizer_c, token_id, token_sub_id}  from '../src/tokenizer_c';

type cb_type = (id: token_id, row: number, col: number, token: string) => void;

type parser_state =
	| 'root'							// 解析root状態:translation-unit
	| 'root_decl-spec'					//	-> declaration-specifiers
	| 'root_decl-spec_declarator'		//		-> declarator

	| 'root_id'				// root -> identifier [context? primary-expression, type-specifier, labeled-statement]
	| 'root_type-name'		// root -> typedef-name [context? declaration-specifier]
	| 'root_lp'				// root -> left-paren [context? primary-expression, postfix-expression]
	| 'prim-expr'			// root -> primary-expression
	// Expressions
	| 'unary-expr'						// unary-expression
	| 'unary-expr_sizeof'				// unary-expression/sizeof
	| 'unary-expr_sizeof_lp_typename'	// unary-expression/sizeof ( type-name
	| 'expression'						// expression
	| 'expr_lbracket'					//	-> [
	| 'expr_lbracket_expr'				//		-> expression
	| 'expr_lparen'						//	-> ()
	| 'constant-expression'				// constant-expression
	| 'assign-expr'						// assignment-expression
	// Declarations
	| 'decl-specifiers'							// declaration-specifiers
	| 'sq-list'									// specifier-qualifier-list
	| 'struct-or-union-spec'					// struct-or-union-specifier
	| 'struct-declaration-list'					// struct-declaration-list
	| 'struct-declarator-list'					// struct-declarator-list(初回)
	| 'struct-declarator-list_re'				// struct-declarator-list(2回目以降)
	| 'enum-spec'								// enum-specifier
	| 'enum-spec_lb'							//	-> { enum-list
	| 'enum-list'								// enumerator-list
	| 'enum-list_re'							// enumerator-list(2回目以降)
	| 'declarator'								// declarator
	| 'pointer'									// pointer
	| 'parameter-type-list'						// parameter-type-list
	| 'parameter-type-list_type'				//	-> declaration-specifiers
	| 'parameter-type-list_type_lp_decl'		//		-> ( *
	| 'parameter-type-list_type_lp_rp'			//			-> ( * )
	| 'type-name'								// type-name
	| 'type-name_sq-list_abst-decl'				// type-name/specifier-qualifier-list -> abstract-declarator
	| 'type-name_end'							// type-name 解析完了
	| 'abstract-declarator'						// abstract-declarator
	| 'abstract-declarator_lp_abst'				// abstract-declarator ( abstract-declarator 
	| 'abstract-declarator_lp_param'			// abstract-declarator ( parameter-type-list
	| 'abstract-declarator_lb'					// abstract-declarator [
	| 'abstract-declarator_lb_type'				// abstract-declarator [ type-qualifier or static or assignment-expression
	| 'abstract-declarator_rb'					// abstract-declarator [ type-qualifier or static or assignment-expression ]
	| 'EOF'
	| 'null';				// 初期状態

type parse_context =
	| 'translation-unit'
	| '@undecided'		// 解析途中で出現したgrammarが未確定
	// Expressions
	| 'primary-expression'
	| 'postfix-expression'
	| 'unary-expression'				// unary-expression
	| 'expression'						// expression
	| 'constant-expression'				// constant-expression
	| 'assignment-expression'
	// Declarations
	| 'declaration'
	| 'declaration_dont_declare'
	| 'declaration_specifier'
	| 'type-specifier'					// 
	| 'type-qualifier'					//
	| 'struct-or-union-specifier'		// 
	| 'struct-or-union'					// 
	| 'struct-declaration-list'			// 
	| 'struct-declarator'				//
	| 'enum-specifier'					//
	| 'declarator'						// ≒変数名
	| 'pointer'							// pointer
	| 'parameter-type-list'				//
	| 'type-name'
	| 'typedef-name'					// typedefで定義されたユーザ定義型
	| 'abstract-declarator'
	// Preprocessor directives
	| 'pp-directive'
	| 'null';

type parse_error_info =
	| 'unknown_type'							// 未知の型が出現した
	| 'duplicate_type_specify'					// 2重に型指定された
	| 'unexpected-token'						// 規定のtokenが出現しなかった
	| 'not_found_declarator'					// declaratorが出現しなかった
	| 'not_found_right_paren'					// ) が出現すべきコンテキストで出現しなかった
	| 'not_found_right_bracket'					// ] が出現すべきコンテキストで出現しなかった
	| 'not_found_right_brace'					// } が出現すべきコンテキストで出現しなかった
	| 'null';

/** [parse_tree] 構成図
 * 	+[root]
 * 	`+<child>
 *   `+[expression]
 *    `+<child>
 *     `+[]
 *      +[]
 */
type parse_tree_node = {
	context: parse_context;
	child: parse_tree_node[];
	parent: parse_tree_node | null;
	lex: lex_info | null;
	err_info: parse_error_info;
}
type lex_info = {
	id: token_id;
	sub_id: token_sub_id;
	token: string;
	row: number;
	col: number;
	len: number;
	pos: number;
}

export default class parser {
	private lexer: lexer<tokenizer_c, token_id, token_sub_id>;
	private parse_cb?: cb_type;
	private state: parser_state;
	// parser解析ツリーもどき
	private tree: parse_tree_node;				// 解析ツリーもどきroot
	private tgt_node: parse_tree_node;			// 現コンテキストの解析ツリーもどきへの参照
	private typedef_tbl: string[];				// ユーザ定義型(typedef)テーブル, struct/unionはtypedefしなければidentifier単独で出現しないため、ここには登録しない
	private enum_tbl: string[];					// enum定義テーブル
	private state_stack_tbl: parser_state[];	// parser解析状態スタック：再帰処理をしないための遷移先管理テーブル
	private is_type_appear: boolean;			// declaration-specifiersの解析内でtype-specifierが出現したかどうかのフラグ

	constructor(text: string, cb?: cb_type) {
		this.lexer = new lexer<tokenizer_c, token_id, token_sub_id>(tokenizer_c, text);
		this.state = 'null';
		this.tree = this.get_node('translation-unit');
		this.tgt_node = this.tree;
		this.typedef_tbl = [];
		this.enum_tbl = [];
		this.state_stack_tbl = [];
		this.is_type_appear = false;
	}

	exec() {
		// grammar解析
		this.parse();
	}

	private parse() {
		let finish: boolean;

		do {
			switch (this.state) {
				case 'null':
					// 初期状態ではtokenを取得する
					// 以降は解析内でtokenを解析ツリーに登録するたびに毎回次へ進める
					this.lexer.exec();
					this.state = 'root';
					finish = false;
					break;
				case 'root':
					finish = this.parse_root();
					break;
				case 'root_decl-spec':
					finish = this.parse_root_decl_spec();
					break;
				case 'root_decl-spec_declarator':
					finish = this.parse_root_decl_spec_declarator();
					break;


				case 'root_id':
					finish = this.parse_root_id();
					break;
				case 'root_type-name':
					finish = this.parse_root_typename();
					break;
				case 'root_lp':
					finish = this.parse_root_lp();
					break;
				case 'prim-expr':
					finish = this.parse_prim_expr();
					break;

				// Expressions 
				case 'expr_lbracket':
					finish = this.parse_expr_lbracket();
					break;
				case 'expr_lbracket_expr':
					finish = this.parse_postfix_expr_lbracket_exp();
					break;
				case 'unary-expr':
					finish = this.parse_unary_expr();
					break;
				case 'unary-expr_sizeof_lp_typename':
					finish = this.parse_unary_expr_sizeof_lp_typename();
					break;
				case 'expression':
					finish = this.parse_expression();
					break;

				// Declarations
				case 'struct-or-union-spec':
					finish = this.parse_struct_union_s();
					break;
				case 'struct-declaration-list':
					finish = this.parse_struct_declaration_list();
					break;
				case 'struct-declarator-list':
					finish = this.parse_struct_declarator_list();
					break;
				case 'struct-declarator-list_re':
					finish = this.parse_struct_declarator_list_re();
					break;
				case 'enum-spec':
					finish = this.parse_enum_spec();
					break;
				case 'enum-spec_lb':
					finish = this.parse_enum_spec_lb();
					break;
				case 'enum-list':
					finish = this.parse_enum_list();
					break;
				case 'enum-list_re':
					finish = this.parse_enum_list_re();
					break;
				case 'sq-list':
					finish = this.parse_sqlist();
					break;
				case 'declarator':
					finish = this.parse_declarator();
					break;
				case 'pointer':
					finish = this.parse_pointer();
					break;
				case 'parameter-type-list':
					finish = this.parse_param_type_list();
					break;
				case 'parameter-type-list_type':
					finish = this.parse_param_type_list_type();
					break;
				case 'parameter-type-list_type_lp_decl':
					finish = this.parse_param_type_list_type_lp_decl();
					break;
				case 'parameter-type-list_type_lp_rp':
					finish = this.parse_param_type_list_type_lp_rp();
					break;
				case 'type-name':
					finish = this.parse_typename();
					break;
				case 'type-name_sq-list_abst-decl':
					finish = this.parse_typename_abst_decl();
					break;
				case 'type-name_end':
					finish = this.parse_typename_end();
					break;
				case 'abstract-declarator':
					finish = this.parse_abst_decl();
					break;
				case 'abstract-declarator_lp_abst':
					finish = this.parse_abst_decl_lp_abst();
					break;
				case 'abstract-declarator_lp_param':
					finish = this.parse_abst_decl_lp_param();
					break;
				case 'abstract-declarator_lb':
					finish = this.parse_abst_decl_lb();
					break;
				case 'abstract-declarator_lb_type':
					finish = this.parse_abst_decl_lb_type();
					break;
				case 'abstract-declarator_rb':
					finish = this.parse_abst_decl_rb();
					break;
				case 'initializer':
					break;

				case 'EOF':
				default:
					// 解析終了
					finish = true;
					break;
			}

			// 一連のgrammarが解析終了したらfinish==trueとなる
			// 状態遷移の復帰先がスタックされていたら、そちらへ復帰する
			if (finish) {
				if (this.state_stack_tbl.length > 0) {
					let next_state: parser_state | undefined;
					finish = false;
					next_state = this.state_stack_tbl.pop();
					if (next_state) {
						this.state = next_state;
					}
				}
			}
		} while (!finish);

	}

	/**
	 * translation-unit 解析
	 * function-definition or declaration の繰り返しになる
	 */
	private parse_root(): boolean {
		let finish: boolean;
		finish = false;

		// 必ずdeclaration-specifiersから始まる。
		// ただし、pp-directivesの処理をしていないのでここで登場する。
		switch (this.get_curr_token_id()) {
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
				// 1文で終了
				// 詳細解析はLexer側が未対応
				// 新規解析ツリーを作成
				this.push_parse_tree('pp-directive');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('pp-directive');
				finish = true;
				break;

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
				// declaration-specifiers であればそのまま解析継続
				// 新規解析ツリーを作成
				this.push_parse_tree('@undecided');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('declaration_specifier');
				//次の解析へ遷移
				this.state = 'root_decl-spec';
				// type-specifierが未出現
				this.is_type_appear = false;
				break;

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
				// declaration-specifiers であればそのまま解析継続
				// 新規解析ツリーを作成
				this.push_parse_tree('@undecided');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('declaration_specifier');
				//次の解析へ遷移
				this.state = 'root_decl-spec';
				// type-specifierが出現
				this.is_type_appear = true;
				break;
			case 'struct':
			case 'union':
				// struct or union であれば、struct-or-union-specifierの解析開始
				this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'root_decl-spec');
				// type-specifierが出現
				this.is_type_appear = true;
				break;
			case 'enum':
				// struct or union であれば、enum-specifierの解析開始
				this.switch_new_context('enum-specifier', 'enum-spec', 'root_decl-spec');
				// type-specifierが出現
				this.is_type_appear = true;
				break;

			case 'identifier':
				// 新規解析ツリーを作成
				this.push_parse_tree('@undecided');
				// typedefとして定義された型か判定
				if (this.is_typedef_token()) {
					// 定義済みであればエラーなし
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('declaration_specifier');
				} else {
					// 未定義でも型とみなして解析継続
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('declaration_specifier', 'unknown_type');
				}
				//次の解析へ遷移
				this.state = 'root_decl-spec';
				// type-specifierが出現
				this.is_type_appear = true;
				break;

			default:
				// その他tokenは構文エラー
				// 新規解析ツリーを作成
				this.push_parse_tree('translation-unit');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('translation-unit', 'unexpected-token');
				// 解析終了
				finish = true;
				break;
		}

		/*
		switch (this.get_curr_token_id()) {
			case 'identifier':
				// 型かどうかチェック
				if (this.is_typedef_token()) {
					// 型のとき -> type-specifier
					// 新規解析ツリーを作成
					this.push_parse_tree('declaration');
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('type-specifier');
					// 
					this.state = 'root_type-name';
					finish = false;
				} else {
					// 型でないとき -> 型 or identifier なのでコンテキスト未確定で解析継続
					// 新規解析ツリーを作成
					this.push_parse_tree('@undecided');
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('@undecided');
					// コンテキスト未確定で次の解析状態へ
					this.state = 'root_id';
					finish = false;
				}
				break;

			case 'octal_constant':
			case 'hex_constant':
			case 'decimal_constant':
			case 'decimal_float_constant':
			case 'hex_float_constant':
			case 'char_constant':
			case 'string_literal':
				// 新規解析ツリーを作成
				this.push_parse_tree('primary-expression');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('primary-expression');
				//
				this.state = 'prim-expr';
				finish = false;
				break;

			case 'left_paren':
				// 新規解析ツリーを作成
				this.push_parse_tree('@undecided');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('@undecided');
				//
				this.state = 'root_lp';
				finish = false;
				break;

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
				// 1文で終了
				// 詳細解析はLexer側が未対応
				// 新規解析ツリーを作成
				this.push_parse_tree('pp-directive');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('pp-directive');
				finish = true;
				break;
		}
		*/

		return finish;
	}

	/**
	 * translation-unit 解析
	 * function-definition or declaration の繰り返しになる
	 */
	private parse_root_decl_spec(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			// storage-class-specifier
			case 'typedef':
			case 'extern':
			case 'static':
			case 'auto':
			case 'register':
				// 先頭以外で出現するのはNGか？
			// type-qualifier
			case 'const':
			case 'restrict':
			case 'volatile':
			// function specifier
			case 'inline':
				// declaration-specifiers であればそのまま解析継続
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('declaration_specifier');
				//次の解析へ遷移
				//this.state = 'root_decl-spec';
				break;

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
				// declaration-specifiers の一連の解析内で型が出現済みか判定
				if (this.is_type_appear) {
					// 型出現済みであれば、2回以上出現したので構文エラー
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('declaration_specifier', 'duplicate_type_specify');
				} else {
					// 未出現であれば問題なし
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('declaration_specifier');
				}
				//次の解析へ遷移
				//this.state = 'root_decl-spec';
				// type-specifierが出現
				this.is_type_appear = true;
				break;
			case 'struct':
			case 'union':
				// declaration-specifiers の一連の解析内で型が出現済みか判定
				if (this.is_type_appear) {
					// 型出現済みであれば、2回以上出現したので構文エラー
					// struct or union であれば、struct-or-union-specifierの解析開始
					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'root_decl-spec', 'duplicate_type_specify');
				} else {
					// struct or union であれば、struct-or-union-specifierの解析開始
					this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'root_decl-spec');
				}
				// type-specifierが出現
				this.is_type_appear = true;
				break;
			case 'enum':
				// declaration-specifiers の一連の解析内で型が出現済みか判定
				if (this.is_type_appear) {
					// struct or union であれば、enum-specifierの解析開始
					this.switch_new_context('enum-specifier', 'enum-spec', 'root_decl-spec', 'duplicate_type_specify');
				} else {
					// struct or union であれば、enum-specifierの解析開始
					this.switch_new_context('enum-specifier', 'enum-spec', 'root_decl-spec');
				}
				// type-specifierが出現
				this.is_type_appear = true;
				break;

			case 'identifier':
				// typedefとして定義された型か判定
				if (this.is_typedef_token()) {
					// declaration-specifiers の一連の解析内で型が出現済みか判定
					if (this.is_type_appear) {
						// 型定義済み かつ 型出現済みであれば、2回以上出現したので構文エラー
						// 解析ツリーに出現トークンを登録
						this.push_parse_node('declaration_specifier', 'duplicate_type_specify');
					} else {
						// 型定義済み かつ 未出現であれば問題なし
						// 解析ツリーに出現トークンを登録
						this.push_parse_node('declaration_specifier');
					}
				} else {
					// 未定義でも型とみなして解析継続
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('declaration_specifier', 'unknown_type');
					// declaration-specifiers の一連の解析内で型が出現済みか判定
					if (this.is_type_appear) {
						// 型未定義 かつ 型出現済みであれば、declaratorとみなして次の解析へ遷移
						this.switch_new_context('declarator', 'declarator', 'root_decl-spec_declarator');
					} else {
						// 型未定義 かつ 未出現であれば型とみなして解析継続
						this.push_parse_node('declaration_specifier', 'unknown_type');
					}
				}
				// type-specifierが出現
				this.is_type_appear = true;
				break;

			default:
				// その他tokenは構文エラー
				// declaratorが出現しなかったものとして解析継続
				this.push_error_node('declarator', 'not_found_declarator');
				break;
		}

		return finish;
	}

	private parse_root_id(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'left_bracket':
				// [ が出現したら、postfix-expression構文とみなす
				// コンテキストはexpressionとなる
				this.set_current_context('expression');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('expression');
				// 
				this.state = 'expr_lbracket';
				break;
			case 'left_paren':
				// ( が出現したら、postfix-expression構文とみなす
				// コンテキストはexpressionとなる
				this.set_current_context('expression');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('expression');
				// 
				this.state = 'expr_lparen';
				break;

			case 'left_brace':
			case 'alt_left_brace':
			case 'alt_left_bracket':
			case 'dot':
			case 'arrow_op':
			case 'increment_op':
			case 'decrement_op':
				this.state = ;
				break;

			case 'identifier':
				// identifierが出現したら、type-name identifier という構文とみなす
				// 前回出現のtokenはtype-nameとみなす
				this.set_prev_node_context(1, 'type-name');
				// コンテキストはdeclarationとなる
				this.set_current_context('declaration');
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('declarator');
				// declarationのコンテキスト開始
				// type-name identifier の解析の続きから開始
				this.state = 'decl_type_id';
				finish = false;
				break;

			case 'semicolon':
				// ; が出現したら終了
				// "typedef-name;" or "expression;" の可能性がある。
				// "identifier;" は意味がないが許容される。
				// "typedef-name;" or "expression;" の可能性がある。
				if (this.is_typedef_token()) {
					// typedef-nameなら(ただし、#includeを解析していないので不正確)
					// コンテキストはdeclarationとなる
					this.set_current_context('declaration');
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('typedef-name');
				} else {
					// typedef-nameでないなら
					// コンテキストはexpressionとなる
					this.set_current_context('expression');
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('declarator');
				}
				// 解析終了
				finish = true;
				break;

			case 'colon':
				// : が出現した
				// labeled-statement
				break;

			case 'asterisk':
				// identifier * と続いたらdeclaration
				break;

			default:
				// 未既定のtokenが出現したら解析終了とする。
				break;
		}

		return finish;
	}

	private parse_expr_lbracket(): boolean {
		let finish: boolean;
		finish = false;

		// expression解析を開始
		this.switch_new_context('expression', 'expression', 'postfix-expr_lbracket_exp');

		return finish;
	}

	private parse_unary_expr(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			// unary-expression
			// -> unary-expression
			case 'increment_op':			// ++
			case 'decrement_op':			// --
				// 次の解析へ
				this.state = 'unary-expr';
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('unary-expression');
				break;

			// -> cast-expression
			case 'ampersand':				// &
			case 'asterisk':				// *
			case 'plus':					// +
			case 'minus':					// -
			case 'bitwise_complement_op':	// ~
			case 'logical_negation_op':		// !
				break;

			// -> unary-expression or type-name
			case 'sizeof':
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('unary-expression');
				// sizeofの処理を実施
				finish = this.parse_unary_expr_sizeof();
				break;
		}

		return finish;
	}
	private parse_unary_expr_sizeof(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'left_paren':
				// ( が登場したら type-name が続く
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('unary-expression');
				// 継続して次のtokenを解析
				this.parse_sqlist();
				// type-name解析を開始
				this.switch_new_context('unary-expression', 'type-name', 'unary-expr_sizeof_lp_typename');
				break;

			default:
				// ( 以外が登場したら unary-expression の解析へ遷移
				this.state = 'unary-expr';
				// token登録は実施しない
				break;
		}

		return finish;
	}

	private parse_expression(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			// unary-expression
			// -> unary-expression
			case 'increment_op':			// ++
			case 'decrement_op':			// --
				// 次の解析へ
				this.state = 'unary-expr';
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('unary-expression');
				break;
			// -> cast-expression
			case 'ampersand':				// &
			case 'asterisk':				// *
			case 'plus':					// +
			case 'minus':					// -
			case 'bitwise_complement_op':	// ~
			case 'logical_negation_op':		// !
			case 'sizeof':
				break;
		}

		return finish;
	}

	private parse_struct_union_s(): boolean {
		let finish: boolean;
		finish = false;

		// struct/unionを検出した状態でここに遷移するため、
		// 最初にstruct/unionを登録する。
		this.push_parse_node('struct-or-union');

		// check: identifier
		if (this.get_curr_token_id() == 'identifier') {
			// identifierであればtoken受理
			this.push_parse_node('struct-or-union');
		}

		// check: {
		if (this.get_curr_token_id() == 'left_brace') {
			// struct-declaration-list 解析開始
			this.push_parse_node('struct-or-union');
			this.state = 'struct-declaration-list';
		} else {
			// { が出現しなければここで解析終了
			finish = true;
		}

		return finish;
	}
	private parse_struct_declaration_list(): boolean {
		let finish: boolean;
		finish = false;

		// } が登場するまで繰り返す
		switch (this.get_curr_token_id()) {
			// } によりstruct/union定義終了
			case 'right_brace':
				this.push_parse_node('struct-or-union');
				finish = true;
				break;

			// } 以外が出現したら specifier-qualifier-list とみなす
			default:
				// specifier-qualifier-list解析を開始
				// 解析終了したら struct-declarator-list の解析へ遷移
				this.switch_new_context('struct-declaration-list', 'sq-list', 'struct-declarator-list');
				break;
		}

		return finish;
	}
	/**
	 * struct-declarator-list を解析する。
	 */
	private parse_struct_declarator_list(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'colon':
				// : が出現したら constant-expression が続く
				this.push_parse_node('struct-declarator');
				// constant-expression解析を開始
				// 解析終了したらstruct-declarator-list(2回目以降)の解析へ遷移
				this.switch_new_context('constant-expression', 'constant-expression', 'struct-declarator-list_re');
				break;

			default:
				// その他tokenが出現したら declarator 解析を実施
				// 解析終了したらstruct-declarator-list(2回目以降)の解析へ遷移
				this.switch_new_context('declarator', 'declarator', 'struct-declarator-list_re');
				break;
		}

		return finish;
	}
	/**
	 * struct-declarator-list(2回目以降) を解析する。
	 */
	private parse_struct_declarator_list_re(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'colon':
				// : が出現したら constant-expression が続く
				this.push_parse_node('struct-declarator');
				// constant-expression解析を開始
				// 解析終了したらstruct-declarator-list(2回目以降)の解析へ遷移
				this.switch_new_context('constant-expression', 'constant-expression', 'struct-declarator-list_re');
				break;

			case 'comma':
				// comma が出現したら struct-declaration-list の解析に戻る
				this.push_parse_node('struct-declarator');
				this.state = 'struct-declaration-list';
				break;

			case 'semicolon':
				// semicolon が出現したら struct-declaration の解析が終了。
				// struct-declaration-list の解析に戻る
				this.push_parse_node('struct-declarator');
				this.state = 'struct-declaration-list';
				break;

			default:
				// その他tokenが出現したら構文エラー
				// struct-declaration-list の解析に戻る
				this.push_error_node('struct-declarator', 'unexpected-token');
				this.state = 'struct-declaration-list';
				break;
		}

		return finish;
	}

	/**
	 * enum-specifier解析
	 * enumを検出したら遷移する
	 */
	private parse_enum_spec(): boolean {
		let finish: boolean;
		finish = false;

		// enum 出現を前提にtoken登録
		this.push_parse_node('enum-specifier');

		// identifierチェック
		if (this.get_curr_token_id() == 'identifier') {
			this.push_parse_node('enum-specifier');
		}

		// { チェック
		if (this.get_curr_token_id() == 'left_brace') {
			// { が出現していたらenumerator-listの解析を実施
			this.push_parse_node('enum-specifier');
			this.switch_new_context('enum-specifier', 'enum-list', 'enum-spec_lb');
		} else {
			// 出現しなかったら解析終了
			finish = true;
		}

		return finish;
	}
	/**
	 * enum-specifier解析
	 * enumerator-listの解析が終了したら遷移する
	 * } をチェックする
	 */
	private parse_enum_spec_lb(): boolean {
		let finish: boolean;
		finish = true;

		// { チェック
		if (this.get_curr_token_id() == 'right_brace') {
			// } が出現していたらenumerator-specifierの解析終了
			this.push_parse_node('enum-specifier');
		} else {
			// 出現しなかったら構文エラー
			this.push_parse_node('enum-specifier', 'not_found_right_brace');
		}

		return finish;
	}
	/**
	 * enumerator-list解析
	 * enum {} の中身を解析
	 */
	private parse_enum_list(): boolean {
		let finish: boolean;
		finish = false;

		// identifierチェック
		if (this.get_curr_token_id() == 'identifier') {
			// enum定義登録
			this.push_enum_const();
			// token登録
			this.push_parse_node('enum-specifier');
		}

		// = チェック
		if (this.get_curr_token_id() == 'simple_assign_op') {
			// = が出現していたらconstant-expression取得
			this.push_parse_node('enum-specifier');
			// constant-expression解析を開始
			// 解析終了したらenumerator-list(2回目以降)の解析へ遷移
			this.switch_new_context('constant-expression', 'constant-expression', 'enum-list_re');
		} else {
			// = が出現していなければenumeratorの解析終了
			// enumerator-listの2回目以降(,以降)の解析へ遷移
			this.state = 'enum-list_re';
		}

		return finish;
	}
	/**
	 * enumerator-list(2回目以降)解析
	 * enum {} の中身を解析
	 */
	private parse_enum_list_re(): boolean {
		let finish: boolean;
		finish = false;

		// ,チェック
		if (this.get_curr_token_id() == 'comma') {
			// token登録
			this.push_parse_node('enum-specifier');
			// } が続く可能性があるのでチェック
			if (this.get_curr_token_id() == 'right_brace') {
				// } が出現したら解析終了
				finish = true;
			} else {
				// enumeratorを再度解析
				this.state = 'enum-list';
			}
		} else {
			// , が出現しなければenumerator-list解析終了
			finish = true;
		}

		return finish;
	}

	/**
	 * parameter-type-list 解析
	 * 
	 */
	private parse_param_type_list(): boolean {
		let finish: boolean;
		finish = false;

		// parameter-declaration 解析
		this.switch_new_context('parameter-type-list', 'decl-specifiers', 'parameter-type-list_type');

		return finish;
	}

	/**
	 * parameter-type-list 解析
	 * declaration-specifiers の解析完了後に本状態へ遷移する。
	 * 型名の後の変数名が該当。
	 */
	private parse_param_type_list_type(): boolean {
		let finish: boolean;
		finish = false;

		// declarator, abstract-declarator 判定
		// 

		switch (this.get_curr_token_id()) {
			case 'comma':
				// , が出現したら次のparameter-list解析
				this.push_parse_node('parameter-type-list');
				// ... が続いたら可変長引数、ここでparameter-type-list終了
				if (this.get_curr_token_id() == 'ellipsis') {
					this.push_parse_node('parameter-type-list');
					finish = true;
				} else {
					// parameter-declaration 解析
					this.switch_new_context('parameter-type-list', 'decl-specifiers', 'parameter-type-list_type');
				}
				break;

			case 'left_paren':
				this.push_parse_node('parameter-type-list');
				// ( が出現したときは declarator か abstract-declarator が連続する
				// 次に出現するgrammarは identifier, abstract-declarator, parameter-type-list になる。
				// 次に出現するtokenは競合しないため、この時点で判定できる。
				// ※暫定で解析後の遷移先は共通に。個別に対応必要であれば都度実装
				if (this.get_curr_token_id() == 'identifier') {
					// identifier が出現したら declarator 解析
					this.switch_new_context('parameter-type-list', 'declarator', 'parameter-type-list_type_lp_decl');
				} else if (this.is_abst_decl_begin_token()) {
					// abstract-declarator の開始token
					this.switch_new_context('parameter-type-list', 'abstract-declarator', 'parameter-type-list_type_lp_decl');
				} else {
					// その他の場合は parameter-type-list として解析開始
					this.switch_new_context('parameter-type-list', 'parameter-type-list', 'parameter-type-list_type_lp_decl');
				}
				break;
		}

		return finish;
	}

	/**
	 * ( ? まで解析した後に遷移する。
	 * ) のチェックを実施する。
	 */
	private parse_param_type_list_type_lp_decl(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'right_paren':
				// abstract-declarator 解析完了
				this.push_parse_node('parameter-type-list');
				break;

			default:
				// ) 以外が出現したら構文エラー
				this.push_error_node('parameter-type-list', 'not_found_right_paren');
				break;
		}

		// paramater-declaration の解析まで完了
		// parameter-list が継続するかの判定へ遷移する
		this.state = 'parameter-type-list_type_lp_rp';

		return finish;
	}

	/**
	 * paramater-declaration の一連の解析完了時に遷移
	 * parameter-list が継続するか判定する。
	 */
	private parse_param_type_list_type_lp_rp(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'comma':
				this.push_parse_node('parameter-type-list');
				// , が出現したら、parameter-declaration か ... が続く
				if (this.get_curr_token_id() == 'ellipsis') {
					// ... が続いたら解析終了
					this.push_parse_node('parameter-type-list');
					finish = true;
				} else {
					// その他tokenが続いたら、再度 parameter-type-list を解析
					this.state = 'parameter-type-list';
				}
				break;

			default:
				// , 以外が出現したら解析終了
				finish = true;
				break;
		}

		return finish;
	}

	/**
	 * type-nameが登場するコンテキストでコールする。
	 * type-name = specifier-quailifier-list abstract-declarator(opt)
	 * のspecifier-quailifier-listを取得する処理を実施。
	 * parseエラーがあればエラーtokenをセットして終了。
	 */
	private parse_typename(): boolean {
		let finish: boolean;
		finish = false;

		// 必ず specifier-qualifier-listから開始する。
		// specifier-qualifier-list解析を開始
		this.switch_new_context('type-name', 'sq-list', 'type-name_sq-list_abst-decl');

		return finish;
	}
	/**
	 * specifier-qualifier-list 解析後に遷移する。
	 * type-name解析のコンテキストで出現するabstract-declaratorを解析する
	 */
	private parse_typename_abst_decl(): boolean {
		let finish: boolean;
		finish = false;

		// abstract-declarator は opt なので出現するかチェックする。
		// abstract-declarator は parameter-declaration と type-name のコンテキストで出現する。
		// parameter-declaration と type-name の後には ) が必ず続くので判別可能
		if (this.is_abst_decl_begin_token()) {
			// abstract-declarator解析を開始
			this.switch_new_context('abstract-declarator', 'abstract-declarator', 'type-name_end');
		} else {
			// abstract-declarator が出現しなければ解析終了
			this.state = 'type-name_end';
		}

		return finish;
	}
	/**
	 * type-name 解析完了時に遷移する。
	 * type-name の解析完了を通知する。
	 */
	private parse_typename_end(): boolean {
		let finish: boolean;
		finish = true;
		return finish;
	}

	/**
	 * specifier-quailifier-list 解析
	 * parseエラーがあればエラーtokenをセットして終了。
	 */
	private parse_sqlist(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			// type-qualifier
			case 'const':
			case 'restrict':
			case 'volatile':
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('type-qualifier');
				break;

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
				// 解析ツリーに出現トークンを登録
				this.push_parse_node('type-specifier');
				break;

			// type-specifier/struct or union
			case 'struct':
			case 'union':
				// struct-or-union-specifier解析を開始
				this.switch_new_context('struct-or-union-specifier', 'struct-or-union-spec', 'sq-list');
				break;

			// type-specifier/enum
			case 'enum':
				// enum-specifier解析を開始
				this.switch_new_context('enum-specifier', 'enum-spec', 'sq-list');
				break;

			// type-specifier/typedef
			case 'identifier':
				// includeを解析していないので、型であるかを断定不可。
				// よって、型であるとみなして解析を継続する。
				if (this.is_typedef_token()) {
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('type-specifier');
				} else {
					// 解析ツリーに出現トークンを登録
					this.push_parse_node('type-specifier', 'unknown_type');
				}
				break;

			// 上記で定義したtokenが出現している間はspecifier-quailifier-listとみなす。
			// 上記以外のtokenが出現したら解析終了
			default:
				finish = true;
				break;
		}

		return finish;
	}

	/**
	 * abstract-declarator解析
	 */
	private parse_abst_decl(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'asterisk':
				// pointer 解析を開始
				this.switch_new_context('abstract-declarator', 'pointer', 'abstract-declarator');
				break;

			case 'left_paren':
				this.push_parse_node('abstract-declarator');
				// ( が出現したら abstract-declarator か parameter-type-list が開始する。
				// 次に出現する文字は競合しないため、この時点で判定できる。
				if (this.is_abst_decl_begin_token()) {
					// abstract-declarator を入れ子で解析開始
					this.switch_new_context('abstract-declarator', 'abstract-declarator', 'abstract-declarator_lp_abst');
				} else {
					// parameter-type-list を解析開始
					this.switch_new_context('parameter-type-list', 'parameter-type-list', 'abstract-declarator_lp_param');
				}
				break;

			case 'left_bracket':
				// [ の中の解析へ遷移
				this.push_parse_node('abstract-declarator');
				this.state = 'abstract-declarator_lb';
				break;

			default:
				// その他tokenが出現したら解析終了
				finish = true;
				break;
		}

		return finish;
	}

	/**
	 * ( abstractor-declarator まで解析した後に遷移
	 * 閉じる ) をチェックするだけ。
	 * カッコの後は入れ子で解析するため、ここで必ず解析終了とする。
	 */
	private parse_abst_decl_lp_abst(): boolean {
		let finish: boolean;
		finish = true;

		switch (this.get_curr_token_id()) {
			case 'right_paren':
				// abstract-declarator 解析完了
				this.push_parse_node('abstract-declarator');
				break;

			default:
				// ) 以外が出現したら構文エラー
				this.push_error_node('abstract-declarator', 'not_found_right_paren');
				break;
		}

		return finish;
	}

	/**
	 * abstract-declarator ( parameter-type-list まで解析した後に遷移
	 * 閉じる ) をチェックするだけ。
	 */
	private parse_abst_decl_lp_param(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'right_paren':
				// abstract-declarator 解析完了
				this.push_parse_node('abstract-declarator');
				break;

			default:
				// ) 以外が出現したら構文エラー
				this.push_error_node('abstract-declarator', 'not_found_right_paren');
				break;
		}

		// direct-abstract-declarator 解析を継続
		this.state = 'abstract-declarator';

		return finish;
	}

	/**
	 * abstract-declarator [ まで解析した後に遷移
	 */
	private parse_abst_decl_lb(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'right_bracket':
				// abstract-declarator [] で終了
				this.push_parse_node('abstract-declarator');
				// direct-abstract-declarator 解析を継続
				this.state = 'abstract-declarator';
				break;

			case 'asterisk':
				// abstract-declarator [*] で終了
				this.push_parse_node('abstract-declarator');
				// ] が続けば解析終了、出現しなければ構文エラー
				if (this.get_curr_token_id() == 'right_bracket') {
					this.push_parse_node('abstract-declarator');
				} else {
					this.push_error_node('abstract-declarator', 'not_found_right_bracket');
				}
				// direct-abstract-declarator 解析を継続
				this.state = 'abstract-declarator';
				break;

			default:
				// 上記以外のtokenが出現したら type-qualifier / static / assignment-expression を解析
				this.state = 'abstract-declarator_lb_type';
				break;
		}

		return finish;
	}

	/**
	 * abstract-declarator [ type-qualifier / static / assignment-expression を解析
	 */
	private parse_abst_decl_lb_type(): boolean {
		let finish: boolean;
		finish = false;

		// 次状態を設定しておく
		this.state = 'abstract-declarator_rb';

		// static が出現していたら受理
		if (this.get_curr_token_id() == 'static') {
			this.push_parse_node('abstract-declarator');
		}

		// type-qualifier が出現していたら受理
		while (this.is_type_qualifier_token()) {
			this.push_parse_node('abstract-declarator');
		}

		// static が出現していたら受理
		if (this.get_curr_token_id() == 'static') {
			this.push_parse_node('abstract-declarator');
		}

		// assignment-expression 解析
		if (this.get_curr_token_id() != 'right_bracket') {
			// ] でなければ assingment-expression を解析
			this.switch_new_context('assignment-expression', 'assign-expr', 'abstract-declarator_rb');
		}

		return finish;
	}

	/**
	 * abstract-declarator [ * ] まで解析した後に遷移
	 * 閉じる ] をチェックするだけ。
	 */
	private parse_abst_decl_rb(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'right_bracket':
				// abstract-declarator 解析完了
				this.push_parse_node('abstract-declarator');
				break;

			default:
				// ] 以外が出現したら構文エラー
				this.push_error_node('abstract-declarator', 'not_found_right_bracket');
				break;
		}

		// direct-abstract-declarator 解析を継続
		this.state = 'abstract-declarator';

		return finish;
	}

	/**
	 * * が出現したら遷移する。
	 */
	private parse_pointer(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
			case 'asterisk':
			case 'const':
			case 'restrict':
			case 'volatile':
				// 解析ツリーに出現トークンを登録
				// pointer解析継続
				this.push_parse_node('pointer');
				break;

			// 上記以外のtokenが出現したら解析終了
			default:
				finish = true;
				break;
		}

		return finish;
	}

	/**
	private parse_(): boolean {
		let finish: boolean;
		finish = false;

		switch (this.get_curr_token_id()) {
		}

		return finish;
	}

	 */

	/**
	 * 現在出現しているtokenがtype-nameかどうか判定する
	 */
	private is_typedef_token(): boolean {
		let result: boolean;
		result = (this.typedef_tbl.indexOf(this.lexer.token) != undefined);
		return result;
	}

	/**
	 * 現在出現しているtokenがdeclaration-specifierかどうか判定する
	 */
	private is_decl_specifier_token(): boolean {
		let result: boolean;
		result = false;

		switch (this.get_curr_token_id()) {
			// strage-class-specifier
			case 'typedef':
			case 'extern':
			case 'static':
			case 'auto':
			case 'register':
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
			// type-qualifier
			case 'const':
			case 'restrict':
			case 'volatile':
			// function specifier
			case 'inline':
				result = true;
				break;

			case 'identifier':
				// identifierはtypedef-nameか判定が必要
				if (this.is_typedef_token()) {
					result = true;
				}
				break;
		}

		return result;
	}

	/**
	 * 現在出現しているtokenがtype-qualifierかどうか判定する
	 */
	private is_type_qualifier_token(): boolean {
		let result: boolean;
		result = false;

		switch (this.get_curr_token_id()) {
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

		switch (this.get_curr_token_id()) {
			case 'asterisk':
			case 'left_paren':
			case 'left_bracket':
				result = true;
				break;
		}

		return result;
	}

	/**
	 * 現在出現しているtokenをtypedefとして登録
	 */
	private push_typedef() {
		this.typedef_tbl.push(this.lexer.token);
	}

	/**
	 * 現在出現しているtokenをenumeration-constantとして登録
	 */
	private push_enum_const() {
		this.enum_tbl.push(this.lexer.token);
	}

	/**
	 * 新規解析ツリーを作成し、解析状態を新規grammarにスイッチする。
	 * 同時に解析完了したときに復帰先の状態を記憶しておく。
	 * @param ctx 
	 * @param next_state
	 * @param return_state
	 */
	private switch_new_context(ctx: parse_context, next_state: parser_state, return_state: parser_state, err_info_: parse_error_info = 'null') {
		// 新規解析ツリーを作成
		this.push_parse_tree(ctx, err_info_);
		// 復帰先状態を登録
		this.state_stack_tbl.push(return_state);
		// 次の解析状態へ遷移
		this.state = next_state;
	}
	/**
	 * 現在解析中のコンテキストが確定したときにコールする。
	 * 対象解析ツリーのコンテキストを設定する。
	 * @param ctx 
	 */
	private set_current_context(ctx: parse_context) {
		this.tgt_node.context = ctx;
	}
	/**
	 * 構文未確定で解析を進め、構文が確定したタイミングで、過去tokenに対してctx(,error)を設定する。
	 * 現在tokenはまだpushしていない状況で使用する。
	 * （使用状況イメージ：　this.tgt_node.child==以前までのtoken, this.lexer==現在のtoken）
	 * @param rel_idx 	セット対象tokenが何個前か指定する。(1:1個前, 2:2個前, ...)
	 * @param ctx 		設定context
	 * @param err_info 	設定error_info
	 */
	private set_prev_node_context(rel_idx: number, ctx: parse_context, err_info: parse_error_info = 'null') {
		// 1以上、配列要素数未満のとき有効
		if (rel_idx > 0 && rel_idx < this.tgt_node.child.length) {
			// this.tgt_node.child[]にアクセスするインデックスに変換
			rel_idx = this.tgt_node.child.length - rel_idx;
			// データ更新
			this.tgt_node.child[rel_idx].context = ctx;
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
	private push_parse_tree(ctx: parse_context, err_info_: parse_error_info = 'null') {
		let new_len: number;
		new_len = this.tgt_node.child.push(this.get_tree(ctx, err_info_));
		this.tgt_node.child[new_len - 1].parent = this.tgt_node;
		this.tgt_node = this.tgt_node.child[new_len-1];
	}
	/**
	 * tgt_nodeに字句nodeを追加する。
	 * nodeを追加したらlexerは次tokenを取得する
	 */
	private push_parse_node(ctx: parse_context, err_info:parse_error_info='null') {
		this.tgt_node.child.push(this.get_node(ctx, err_info));
		this.lexer.exec();
	}
	/**
	 * tgt_nodeにエラーnodeを追加する。
	 * 既定のtokenが出現しなかった場合はエラー情報だけの空nodeを追加する。
	 */
	private push_error_node(ctx: parse_context, err_info: parse_error_info) {
		this.tgt_node.child.push(this.get_empty_node(ctx, err_info));
	}

	/**
	 * 現在出現しているtoken idを返す
	 */
	private get_curr_token_id(): token_id {
		return this.lexer.id;
	}

	private get_tree(ctx: parse_context, err_info_: parse_error_info = 'null'): parse_tree_node {
		let node: parse_tree_node;
		node = {
			context: ctx,
			child: [],
			parent: null,
			lex: null,
			err_info: err_info_,
		};
		return node;
	}
	private get_node(ctx: parse_context, err_info_: parse_error_info = 'null'): parse_tree_node {
		let node: parse_tree_node;
		node = {
			context: ctx,
			child: [],
			parent: null,
			lex: {
				id: this.lexer.id,
				sub_id: this.lexer.sub_id,
				token: this.lexer.token,
				row: this.lexer.row,
				col: this.lexer.col,
				len: this.lexer.len,
				pos: this.lexer.pos,
			},
			err_info: err_info_,
		};
		return node;
	}
	private get_empty_node(ctx: parse_context, err_info_: parse_error_info = 'null'): parse_tree_node {
		let node: parse_tree_node;
		node = {
			context: ctx,
			child: [],
			parent: null,
			lex: {
				id: 'null',
				sub_id: 'null',
				token: "",
				row: 0,
				col: 0,
				len: 0,
				pos: 0,
			},
			err_info: err_info_,
		};
		return node;
	}

}
