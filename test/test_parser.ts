'use strict';

import fs from 'fs';
import path from 'path';
import { parser, parse_tree_node, lex_info } from '../src/parser'


function parser_tree_dump(tree: parse_tree_node, out_fd: number) {
	let buff: {caption:string, lang:string}[];
	let is_eof: boolean = false;

	buff = [];
	buff.push({caption:"//", lang:"  "});
	is_eof = parser_tree_node_dump(tree, buff);

	for (let output of buff) {
		// file
		fs.writeSync(out_fd, output.caption + "\r\n");
		fs.writeSync(out_fd, output.lang + "\r\n");
		// stdout
		console.log(output.caption);
		console.log(output.lang);
	}
}
function parser_tree_node_dump(tgt_node: parse_tree_node, output: { caption: string, lang: string }[]): boolean {
	let is_eof: boolean = false;
	let tgt_output: { caption: string, lang: string };
	let caption: string;
	let token: string;
	tgt_output = output[output.length - 1];

	// 字句情報があれば
	if (tgt_node.lex != null) {
		switch (tgt_node.lex.id) {
			case 'EOF':
				tgt_output.caption += "[EOF]";
				is_eof = true;
				break;
			case 'NEWLINE':
				// 改行キャプション追記
				tgt_output.caption += "[NEWLINE]";
				// output改行
				output.push({ caption: "//", lang: "  " });
				break;
			default:
				// 文字列を取得
				caption = "[" + tgt_node.lex.id.toString() + "]";
				token = tgt_node.lex.token;
				// 幅合わせ
				if (caption.length > token.length) {
					for (let i=0; i<caption.length-token.length+1; i++) {
						token += " ";
					}
				} else {
					for (let i = 0; i < token.length - caption.length + 1; i++) {
						caption += " ";
					}
				}
				// 設定
				tgt_output.caption += caption;
				tgt_output.lang += token;
				break;
		}
	}
	// 子ツリーがいれば
	for (let node of tgt_node.child) {
		parser_tree_node_dump(node, output);
	}
	// 

	return is_eof;
}

function parser_test(file_path: string) {
	// ファイルを開く
	let buffer: Buffer
	let text: string;
	buffer = fs.readFileSync(file_path);
	text = buffer.toString();
	//出力先を作成
	let outfile_path:string;
	let parse_file_path = path.parse(file_path);
	outfile_path = parse_file_path.dir + "/" + parse_file_path.name + "_out" + parse_file_path.ext;
	const fd = fs.openSync(outfile_path, "w");
	// parser作成
	let parse: parser;
	parse = new parser(text);

	// 解析
	let tree: parse_tree_node;
	while (parse.exec()) {
		tree = parse.parse_tree;
	}
	parser_tree_dump(parse.parse_tree, fd);
	console.log("@test finish");
}

//parser_test('./test/test_parser_valid_1.c');
parser_test('./test/test_parser_valid_2.c');

