'use strict';

import { exception } from 'console';
import fs from 'fs';
import path from 'path';
//import { parser, parse_tree_node, lex_info } from '../src/parser'
import { parser, parse_tree_node, lex_info } from '../src/parser2'

type json_node = string | json_tree | null;
type json_tree = { [grammar: string]: json_node };

let row: number = 0;
let col: number = 0;
function parser_tree_dump(tree: parse_tree_node, jtree: json_tree, out_fd: number, out_fd_json: number) {
	let buff: {caption:string, lang:string}[];
	let is_eof: boolean = false;

	buff = [];
	buff.push({caption:"////", lang:"    "});
	is_eof = parser_tree_node_dump(tree, jtree, buff);

	for (let output of buff) {
		// file
		fs.writeSync(out_fd, output.caption + "\r\n");
		fs.writeSync(out_fd, output.lang + "\r\n");
		// stdout
		console.log(output.caption);
		console.log(output.lang);
	}
	fs.writeSync(out_fd_json, JSON.stringify(jtree));
}
function parser_tree_node_dump(tgt_node: parse_tree_node, jnode: json_node, output: { caption: string, lang: string }[]): boolean {
	let is_eof: boolean = false;
	let tgt_output: { caption: string, lang: string };
	let caption: string;
	let token: string;
	let caption_org: string = "";
	let token_org: string = "";
	let caption_len: number;
	let token_len: number;
	tgt_output = output[output.length - 1];
	let len: number = 0;

	// 字句情報があれば
	if (tgt_node.lex != null) {
		len = tgt_node.lex.len;
		switch (tgt_node.lex.id) {
			case 'EOF':
				tgt_output.caption += "[EOF]";
				is_eof = true;
				break;
			case 'NEWLINE':
				// 改行キャプション追記
				tgt_output.caption += "[NEWLINE]";
				// output改行
				output.push({ caption: "////", lang: "    " });
				//
				caption_org = "[NEWLINE]";
				token_org = tgt_node.lex.token;
				//
				row++;
				col = 0;
				len = 0;
				break;
			default:
				// dump文字列作成
				caption = "[";
				// err情報作成
				if (tgt_node.err_info != 'null') {
					caption += "(err)";
				}
				caption += tgt_node.lex.id.toString();
				token = tgt_node.lex.token;
				caption += "]";
				//
				caption_org = caption;
				token_org = token;
				// 文字列長取得
				caption_len = get_str_len(caption);
				token_len = get_str_len(token);
				// 幅合わせ
				if (caption_len > token_len) {
					for (let i = 0; i < caption_len - token_len; i++) {
						token += " ";
					}
				} else {
					for (let i = 0; i < token_len - caption_len; i++) {
						caption += " ";
					}
				}
				// 設定
				tgt_output.caption += caption;
				tgt_output.lang += token;
				break;
		}
	} else {
		// エラー情報のみトークンのとき
		if (tgt_node.child.length == 0 && tgt_node.err_info != 'null') {
			// dump文字列作成
			caption = "[(err)(" + tgt_node.err_info.toString() + ")]";
			token = "";
			// 文字列長取得
			caption_len = get_str_len(caption);
			token_len = get_str_len(token);
			//
			caption_org = caption;
			token_org = token;
			// 幅合わせ
			if (caption_len > token_len) {
				for (let i = 0; i < caption_len - token_len; i++) {
					token += " ";
				}
			} else {
				for (let i = 0; i < token_len - caption_len; i++) {
					caption += " ";
				}
			}
			// 設定
			tgt_output.caption += caption;
			tgt_output.lang += token;
		}
	}

	// json tree: ノードを作成
	let next_jnode: json_node;
	next_jnode = jnode;
	if (caption_org == "") caption_org = tgt_node.state;
	caption_org += "(" + row.toString() + "," + col.toString() + ")"
	if (jnode == null) {
		// ノードが未初期化
		if (tgt_node.child.length == 0) {
			// child がゼロなら末端
			if (tgt_node.lex != null) {
				// lexがあれば登録して終了
				jnode = {};
				jnode[caption_org] = token_org;
			} else {
				jnode = "empty";
			}
		}
		else {
			// child が存在したら
			jnode = {};
			jnode[caption_org] = {};
			next_jnode = jnode[caption_org];
		}
	} else {
		if (typeof jnode === "string") {
			// stringで初期化されてるのにこのパスにくるか？
			throw exception("String initialized node detected.");
		} else {
			// ノード存在
			if (tgt_node.child.length == 0) {
				// child がゼロなら末端
				if (tgt_node.lex != null) {
					// lexがあれば登録して終了
					jnode[caption_org] = token_org;
				} else {
					jnode[caption_org] = "???empty???";
				}
			}
			else {
				// child が存在したら
				jnode[caption_org] = {};
				next_jnode = jnode[caption_org];
			}
		}
	}



	// 子ツリーがいれば
	col += len
	for (let node of tgt_node.child) {
		parser_tree_node_dump(node, next_jnode, output);
	}
	// 

	return is_eof;
}
function get_str_len(str:string):number {
	let result: number=0;

	for (let i=0; i<str.length; i++) {
		switch (str[i]) {
			case '\t':
				result += 4;
				break;
			default:
				result += 1;
				break;
		}
	}

	return result;
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
	//出力先(json)を作成
	let outfile_json_path: string;
	outfile_json_path = parse_file_path.dir + "/" + parse_file_path.name + "_out.json";
	const fd_json = fs.openSync(outfile_json_path, "w");

//	console.time('parser: whole time:');
	console.time('parser: construct time:');
	// parser作成
	let parse: parser;
	parse = new parser(text);
	console.timeEnd('parser: construct time:');

	console.time('parser: parse time:');
	// 解析
	let tree: parse_tree_node;
	/*
	while (parse.exec()) {
		tree = parse.parse_tree;
	}*/
	parse.exec()
	tree = parse.parse_tree;
	let jtree: json_tree = {};
	console.timeEnd('parser: parse time:');
//	console.timeEnd('parser: whole time:');
	parser_tree_dump(parse.parse_tree, jtree, fd, fd_json);
	console.log("@test finish");
}


//parser_test('./test/test_parser_valid_1.c');
//parser_test('./test/test_parser_valid_2.c');
//parser_test('./test/test_parser_valid_3.c');
parser_test('./test/test_parser_valid_0.c');

