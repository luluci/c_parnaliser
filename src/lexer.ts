'use strict';

import { token_id, token_sub_id } from './token_id';
import tokenizer from './tokenizer_c';

type cb_type = (row: number, col: number, token: string)=>void;

interface lexer_token {
	pos : number;
	row : number;
	col : number;
	len : number;
	keyword: boolean;
	token: string;
	id: token_id;
	sub_id: token_sub_id;
}
export function dump(token: lexer_token) : string {
	let result : string;

	result = "";
	result += "(";
	result += ("00000" + token.row).slice(-5);
	result += ",";
	result += ("00000" + token.col).slice(-5);
	result += ")";
	result += "[";
	result += token.id.toString();
	if (token.sub_id != 'null') result += `(${token.sub_id.toString()})`;
	result += "]";
	result += "=\"";
	result += token.token;
	result += "\"";

	return result;
}

export default class lexer {
	private text : string;
	private token_cb ?: cb_type;
	private row : number;
	private col : number;
	private pos: number;
	private id: token_id;
	private token: tokenizer;

	constructor(text_ : string, cb ?: cb_type) {
		this.text = text_;
		this.token_cb = cb;
		this.row = 0;
		this.col = 0;
		this.pos = 0;
		this.id = 'null';
		this.token = new tokenizer(this.text);
	}

	exec(cb ?: cb_type) : lexer_token {
		let result: lexer_token;
		result = { pos: 0, row: 0, col: 0, len: 0, keyword: false, token: "", id: 'null', sub_id:'null' };

		// 字句解析前情報を作成
		this.make_info_prelex();
		// 字句解析実施
		this.token.exec();
		// 字句解析後情報を作成
		this.make_info_postlex();

		// token情報を作成
		this.make_lexer_token(result);

		return result;
	}

	private make_info_prelex() {
		// 'null'は未解析なのでスキップ
		if (this.token.id == 'null') {
			// 何もしない
		} else {
			let row_step: number;
			let col_step: number;

			// 前回解析結果から解析開始位置を算出
			// 基本的にtoken=NEWLINEにより1行だけ改行する。
			// 複数行コメントのみ複数改行が発生する。
			if (this.token.id == 'NEWLINE')	{
				// 改行では固定で次の行の先頭へ移動する
				this.row += 1;
				this.col = 0;
			} else {
				// 解析時には最低1つtoken文字列長を格納している。
				// 要素数が2以上であれば解析中に改行を挟んでいる。
				// 改行があったときはrowを更新する。また、colは先頭に戻る。
				// 配列の末尾要素に最後の行において何文字進んだかの情報が入っている。
				row_step = this.token.len.length - 1;
				col_step = this.token.len[row_step];
				if (row_step == 0) {
					// 改行なし
					this.col += col_step;
				} else {
					// 改行あり
					this.row += row_step;
					this.col = col_step;
				}
			}

		}

	}

	private make_info_postlex() {
		this.id = this.token.id;
	}

	private make_lexer_token(token: lexer_token) {

		// token共通
		token.id = this.token.id;
		token.sub_id = this.token.sub_id;
		token.pos = this.token.pos;
		token.row = this.row;
		token.col = this.col;
		token.len = this.token.pos - this.token.pos_begin;
		token.keyword = this.token.is_keyword;
		// token個別
		switch (this.token.id) {
			// EOF到達
			case 'EOF':
			case 'NEWLINE':
			case 'WHITESPACE':
				token.token = "@" + this.token.id.toString();
				break;
			default:
				token.token = this.text.substring(this.token.pos_begin, this.token.pos_end);
				break;
		}
	}
}
