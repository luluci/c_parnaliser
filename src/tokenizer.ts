// 字句解析StateMachine Interface

'use strict';

export interface token_error_info {
	pos: number;
	err_id: any;
}

export interface tokenizer {
	text: string;
	len: number[];			// token文字列長。複数行にまたがる場合は行ごとに配列要素が増える。
	pos: number;
	pos_begin: number;
	pos_end: number;
	id: any;
	err_info: token_error_info[];

	exec() : boolean;
}
