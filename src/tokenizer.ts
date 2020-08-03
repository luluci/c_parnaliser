// 字句解析StateMachine Interface

'use strict';

export interface token_error_info {
	pos: number;
	err_id: any;
}

export interface tokenizer<id_t, sub_id_t> {
	text: string;
	len: number[];			// token文字列長。複数行にまたがる場合は行ごとに配列要素が増える。
	pos: number;
	pos_begin: number;
	pos_end: number;
	id: id_t;
	sub_id: sub_id_t;
	err_info: token_error_info[];
	is_keyword: boolean;

	exec() : boolean;
	is_null() : boolean;		// 未解析,解析データなし
	is_newline(): boolean;		// 改行検出
}
