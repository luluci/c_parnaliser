'use strict';

// implement:
//   Annex A
//   A.1 Lexical grammar

import { tokenizer } from './tokenizer';

export default class lexer<Tokenizer extends tokenizer<TokenId,TokenSubId>, TokenId, TokenSubId > {
	// 解析データ
	private text : string;
	private tokenizer: Tokenizer;
	// 解析結果tokenデータ
	private row_: number;
	private col_: number;
	private len_: number;

	constructor(BuildTokenizer: { new(str: string): Tokenizer; }, text_ : string) {
		this.text = text_;
		this.tokenizer = new BuildTokenizer(this.text);
		this.row_ = 0;
		this.col_ = 0;
		this.len_ = 0;
	}

	exec() {
		// 字句解析前情報を作成
		this.make_info_prelex();
		// 字句解析実施
		this.tokenizer.exec();
		// 字句解析後情報を作成
		this.make_info_postlex();
	}

	private make_info_prelex() {
		// 'null'は未解析なのでスキップ
		if (this.tokenizer.is_null()) {
			// 何もしない
		} else {
			let row_step: number;
			let col_step: number;

			// 前回解析結果から解析開始位置を算出
			// 基本的にtoken=NEWLINEにより1行だけ改行する。
			// 複数行コメントのみ複数改行が発生する。
			if (this.tokenizer.is_newline())	{
				// 改行では固定で次の行の先頭へ移動する
				this.row_ += 1;
				this.col_ = 0;
			} else {
				// 解析時には最低1つtoken文字列長を格納している。
				// 要素数が2以上であれば解析中に改行を挟んでいる。
				// 改行があったときはrowを更新する。また、colは先頭に戻る。
				// 配列の末尾要素に最後の行において何文字進んだかの情報が入っている。
				row_step = this.tokenizer.len.length - 1;
				col_step = this.tokenizer.len[row_step];
				if (row_step == 0) {
					// 改行なし
					this.col_ += col_step;
				} else {
					// 改行あり
					this.row_ += row_step;
					this.col_ = col_step;
				}
			}

		}

	}

	private make_info_postlex() {
		this.len_ = this.tokenizer.pos - this.tokenizer.pos_begin;
	}

	// getter
	get id() {
		return this.tokenizer.id;
	}
	get sub_id() {
		return this.tokenizer.sub_id;
	}
	get row() {
		return this.row_;
	}
	get col() {
		return this.col_;
	}
	get pos() {
		return this.tokenizer.pos;
	}
	get len() {
		return this.len_;
	}
	get is_keyword() {
		return this.tokenizer.is_keyword;
	}
	get token() {
		let result: string;
		result = this.text.substring(this.tokenizer.pos_begin, this.tokenizer.pos_end);
		return result;
	}
}
