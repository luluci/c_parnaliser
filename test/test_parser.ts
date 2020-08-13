'use strict';

import fs from 'fs';
import { parser, parse_tree_node, lex_info } from '../src/parser'




function parser_test(file_path: string) {
	// ファイルを開く
	let buffer: Buffer
	let text: string;
	buffer = fs.readFileSync(file_path);
	text = buffer.toString();
	// parser作成
	let parse: parser;
	parse = new parser(text);

	// 解析
	let tree: parse_tree_node;
	while (parse.exec()) {
		tree = parse.parse_tree;
	}
	console.log("@test finish");
}

parser_test('./test/test_parser_valid_1.c');

