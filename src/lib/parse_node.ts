'use strict';

type parse_proc_t<State> = (node: ParseNode<State>) => boolean;
type parse_node_check = () => boolean;
type parse_node_action = () => void;
type parse_node_action_else<State> = (states: State[]) => void;

type parse_dict<State> = { [state: string]: ParseNode<State>; };
type parse_node_init<State> = [State, parse_node_check, parse_node_action];

/**
 * ParseNode<T>生成補助クラス
 */
export class ParseNodeGenerator<State> {
	private _node: ParseNode<State> | null;

	constructor() {
		this._node = null;
	}

	// ParseNode生成関数
	public root(state: State, check?: parse_node_check, action?: parse_node_action): ParseNode<State> {
		this._node = ParseNode.root<State>(state, check, action);
		return this._node;
	}
	public node(state: State, check?: parse_node_check, action?: parse_node_action): ParseNode<State> {
		this._node = ParseNode.node<State>(state, check, action);
		return this._node;
	}
	public eop(state: State, check?: parse_node_check, action?: parse_node_action): ParseNode<State> {
		this._node = ParseNode.eop<State>(state, check, action);
		return this._node;
	}
	public else(state: State, action?: parse_node_action): ParseNode<State> {
		this._node = ParseNode.else<State>(state, action);
		return this._node;
	}


	public seq(nodes: ParseNode<State>[]): ParseNode<State> {
		this._node = ParseNode.seq<State>(nodes);
		return this._node;
	}
	public or(nodes: ParseNode<State>[]): ParseNode<State> {
		this._node = ParseNode.or<State>(nodes);
		return this._node;
	}

	/**
	 * 保持しているノードを渡して生成完了
	 */
	public gen(): ParseNode<State> {
		if (this._node == null) throw new Error("ParseNodeGenerator:InvalidConstruct:gen() with non init object.");
		return this._node;
	}

}
class parse_tree_generator {

}

type parse_node_type =
	| 'root'				// ルートノード
	| 'hub'					// 接続用ハブノード
	| 'seq'					// seqノード
	| 'or'					// orノード
	| 'opt'					// optノード
	| 'many'				// manyノード
	| 'many1'				// many1ノード
	| 'else'				// elseマッチノード
	| 'eop'					// End of Perseノード
	| 'node';				// 通常ノード

type parse_check_result =
	| 'check_ok'			// 状態遷移可能
	| 'check_ng'			// 状態遷移不可
	| 'check_undef';		// 判定未確定

export class ParseNode<State> {
	// パーサノード情報
	private _state: State;													// 自状態
	private _check: parse_node_check | null;								// 状態遷移チェック
	private _action: parse_node_action | null;								// 状態処理
	private _action_post: parse_node_action | null;							// 状態後処理(状態処理実施後に常に実施)
	private _action_else: parse_node_action_else<State> | null;				// else処理
	private _node_type: parse_node_type;									// ノードタイプ
	private _err_stop: boolean;												// エラーストップフラグ
	private _parse_end: boolean;											// End of Perse到達フラグ

	// パーサテーブル
	private _next: ParseNode<State> | null;									// 次ノード
	private _else: ParseNode<State> | null;									// 次ノードのいずれにもマッチしなかったケース用ノード
	private _child: ParseNode<State>[];										// 子ノード
	// 次ノード解析情報
	private _tail: ParseNode<State>;										// 末尾ノード
	// 解析一時情報：解析完了で抜けるときにリセットする
	private _last_checked_idx: number;										// ノード遷移チェックで判定OKになったノード情報
	// ノード遷移チェック情報
	static readonly LAST_CHECKED_NULL: number = -1;							// 未設定/NG
	static readonly LAST_CHECKED_SELF: number = -2;							// 自身のcheckでOK
	static readonly LAST_CHECKED_SEQ: number = -3;							// SEQでOK
	static readonly LAST_CHECKED_CHILD: number = 0;							// CHILDでOK(idxナンバーを設定するのでこの定義は使われない)

	// パース関数テーブル
	private _parse_proc_tbl: { [key: string]: parse_proc_t<State> };		// パース処理テーブル
	private _parse_check_tbl: { [key: string]: parse_proc_t<State> };		// パース遷移チェックテーブル

	// 自状態を定義する
	constructor(state: State, check?: parse_node_check, action?: parse_node_action) {
		//
		this._state = state;
		if (check == null) this._check = null;
		else this._check = check;
		if (action == null) this._action = null;
		else this._action = action;
		this._action_post = null;
		this._action_else = null;
		this._node_type = 'node';
		this._err_stop = false;
		this._parse_end = false;
		// 
		this._next = null;
		this._else = null;
		this._child = [];
		//
		this._tail = this;
		//
		this._last_checked_idx = ParseNode.LAST_CHECKED_NULL;

		// パース処理テーブル
		this._parse_proc_tbl = {};
		this._parse_proc_tbl['root'] = this._parse_proc_root;
		this._parse_proc_tbl['hub'] = this._parse_proc_hub;
		this._parse_proc_tbl['seq'] = this._parse_proc_seq;
		this._parse_proc_tbl['or'] = this._parse_proc_or;
		this._parse_proc_tbl['opt'] = this._parse_proc_opt;
		this._parse_proc_tbl['many'] = this._parse_proc_many;
		this._parse_proc_tbl['many1'] = this._parse_proc_many1;
		this._parse_proc_tbl['else'] = this._parse_proc_else;
		this._parse_proc_tbl['node'] = this._parse_proc_node;
		this._parse_proc_tbl['eop'] = this._parse_proc_eop;
		// パース遷移チェックテーブル
		this._parse_check_tbl = {};
		this._parse_check_tbl['root'] = this._parse_check_root;
		this._parse_check_tbl['hub'] = this._parse_check_hub;
		this._parse_check_tbl['seq'] = this._parse_check_seq;
		this._parse_check_tbl['or'] = this._parse_check_or;
		this._parse_check_tbl['opt'] = this._parse_check_opt;
		this._parse_check_tbl['many'] = this._parse_check_many;
		this._parse_check_tbl['many1'] = this._parse_check_many1;
		this._parse_check_tbl['else'] = this._parse_check_else;
		this._parse_check_tbl['node'] = this._parse_check_node;
		this._parse_check_tbl['eop'] = this._parse_check_eop;
	}
	// construct helper
	/** 
	 * construct root element  
	 * stateだけのnodeを作成する。
	 * @param state 
	 */
	static root<State>(state: State, check?: parse_node_check, action?: parse_node_action): ParseNode<State> {
		return new ParseNode<State>(state, check, action)._set_type('root');
	}
	static node<State>(state: State, check?: parse_node_check, action?: parse_node_action): ParseNode<State> {
		return new ParseNode<State>(state, check, action)._set_type('node');
	}
	static hub<State>(state: State, check?: parse_node_check, action?: parse_node_action): ParseNode<State> {
		return new ParseNode<State>(state, check, action)._set_type('hub');
	}
	static eop<State>(state: State, check?: parse_node_check, action?: parse_node_action): ParseNode<State> {
		return new ParseNode<State>(state, check, action)._set_type('eop');
	}

	private _set_type(node_type: parse_node_type): ParseNode<State> {
		this._node_type = node_type;
		return this;
	}

	// ツリーコンストラクト
	//--------------------------
	// node          : [(node_type)]
	// child connect : +-            (no annotation)
	// seq connect   : +->           (has '>' annotation)
	//--------------------------
	// ParseTree image
	//  [root]->[or]-------->[many]------>[seq]
	//          +-[nodeA]    +-[nodeC]    +-[nodeD-seq1]
	//          +-[nodeB]                 +-[nodeD-seq2]
	//
	//  [root]         |  [node]           |
	//  +-state='x'    |  +-state='x'      |
	//  +-check=null   |  +-check=func()   |
	//  +-action=null  |  +-action=func()  |
	//  +-seq=node     |  +-seq=node       |
	//  +-child=[]     |  +-child=[]       |
	//
	//-------------------------
	// Method ref
	//	[method]	[description]
	//	seq			>>	次へ
	//	or			|	どちらか
	//	opt			?	0 or 1回
	//	many		*	0回以上繰り返す
	//	many1		+	1回以上繰り返す
	//-------------------------
	// public method -> thisに新しいノードを作成して接続する
	// static method -> 新しいノードを作成して返す
	public seq(node: ParseNode<State>[]): ParseNode<State> {
		// 空チェックしてseq追加を実施
		if (node.length > 0) {
			this._seq_impl(node);
		}
		return this;
	}
	static seq<State>(nodes: ParseNode<State>[]): ParseNode<State> {
		// 空チェック
		if (nodes.length == 0) throw new Error("ParseTree:InvalidConstruct:seq() require least one more node.");
		// seqノードを生成
		// 引数で渡されたノードへの参照をchildとする。
		let new_node = new ParseNode<State>(nodes[0]._state)._set_type('seq');
		for (let node of nodes) {
			new_node._child.push(node);
		}
		return new_node;
	}
	private _seq_impl(nodes: ParseNode<State>[]): void {
		// seqノードを作成
		let new_node = ParseNode.seq(nodes);
		// ノード登録
		this._next_push(new_node);
	}
	private _next_push(node: ParseNode<State>): void {
		// tailに追加
		this._tail._next = node;
		// tail更新
		this._tail = node;
	}
	/**
	 * opt  
	 * optional定義  
	 * ?  
	 * 0or1回マッチするノードを生成する。
	 * @param node 
	 */
	public opt(node: ParseNode<State>): ParseNode<State> {
		// 管理ノードを生成し、引数で渡されたノードへの参照をchildとする。
		let new_node = ParseNode.opt(node);
		// ノード登録
		this._next_push(new_node);
		return this;
	}
	static opt<State>(node: ParseNode<State>): ParseNode<State> {
		// optノードを生成
		// 引数で渡されたノードへの参照をchildとする。
		let new_node = new ParseNode<State>(node._state)._set_type('opt');
		new_node._child.push(node);
		return new_node;
	}
	/**
	 * or  
	 * |  
	 * orで枝分かれした後に合流は実装しない。
	 * @param child 
	 */
	public or(child: ParseNode<State>[]): ParseNode<State> {
		// 管理ノードを生成し、引数で渡されたノードへの参照をchildとする。
		let node = ParseNode.or(child);
		// ノード登録
		this._next_push(node);
		return this;
	}
	static or<State>(nodes: ParseNode<State>[]): ParseNode<State> {
		// 空チェック
		if (nodes.length == 0) throw new Error("ParseTree:InvalidConstruct:or() require least one more node.");
		// orノードを生成
		// 引数で渡されたノードへの参照をchildとする。
		let new_node = new ParseNode(nodes[0]._state)._set_type('or');
		for (let node of nodes) {
			// 特殊ノード判定
			if (node._node_type == 'else') {
				// elseノードは個別に設定
				new_node._set_else(node);
			} else {
				// その他ノードはseqに登録。
				new_node._child.push(node);
			}
		}
		return new_node;
	}
	/**
	 * many
	 * 
	 * @param child 
	 */
	public many(child: ParseNode<State>): ParseNode<State> {
		// 管理ノードを生成し、引数で渡されたノードへの参照をchildとする。
		let node = ParseNode.many(child);
		// ノード登録
		this._next_push(node);
		return this;
	}
	static many<State>(node: ParseNode<State>): ParseNode<State> {
		// manyノードを生成
		// 引数で渡されたノードへの参照をchildとする。
		let new_node = new ParseNode<State>(node._state)._set_type('many');
		new_node._child.push(node);
		return new_node;
	}
	/**
	 * many1
	 * 
	 * @param child 
	 */
	public many1(child: ParseNode<State>): ParseNode<State> {
		// 管理ノードを生成し、引数で渡されたノードへの参照をchildとする。
		let node = ParseNode.many1(child);
		// ノード登録
		this._next_push(node);
		return this;
	}
	static many1<State>(node: ParseNode<State>): ParseNode<State> {
		// many1ノードを生成
		// 引数で渡されたノードへの参照をchildとする。
		let new_node = new ParseNode<State>(node._state)._set_type('many1');
		new_node._child.push(node);
		return new_node;
	}
	/** else  
	 * 条件にマッチしなかった場合のノードを定義する。
	 * @param parent 
	 */
	public else(state: State, action?: parse_node_action_else<State>): ParseNode<State> {
		// elseノード
		let node = ParseNode.else(state, action);
		this._set_else(node);
		return this;
	}
	static else<State>(state: State, action?: parse_node_action_else<State>): ParseNode<State> {
		// いずれにもマッチしなかった場合に遷移とするのでcheckは除外する
		let new_node = new ParseNode<State>(state, undefined, undefined)._set_type('else');
		if (action) new_node.action_else(action);
		return new_node;
	}
	private _set_else(node: ParseNode<State>): ParseNode<State> {
		// elseノード
		if (this._else != null) {
			throw new Error("ParseTree:InvalidConstruct:else node has duplicated.")
		}
		this._else = node;
		return this;
	}

	/**
	 * 状態処理設定
	 * @param cb 
	 */
	public action(cb: parse_node_action): ParseNode<State> {
		this._action = cb;
		return this;
	}
	/**
	 * 状態処理後処理設定
	 * @param cb 
	 */
	public action_post(cb: parse_node_action): ParseNode<State> {
		this._action_post = cb;
		return this;
	}
	/**
	 * 状態else処理処理設定
	 * @param cb 
	 */
	public action_else(cb: parse_node_action_else<State>): ParseNode<State> {
		this._action_else = cb;
		return this;
	}
	/**
	 * エラーストップ設定  
	 * parseエラー発生時、エラーストップが設定されたノードでエラー伝播は停止、次のノードから処理を再開する。
	 * @param flag 
	 */
	public err_stop(flag: boolean): ParseNode<State> {
		this._err_stop = flag;
		return this;
	}

	/**
	 * パース実行
	 * 
	 */
	public parse(): boolean {
		// 自ノードを起点としてparse実行
		let result: boolean;
		result = this._parse_proc(this);
		return result;
	}
	public eop(): boolean {
		return this._parse_end;
	}
	// パース処理関数
	/**
	 * カレントノードに対してパース実行
	 * @param curr 
	 */
	private _parse_proc(curr: ParseNode<State>): boolean {
		let result: boolean;
		// ノードタイプに応じた処理を実施
		result = this._parse_proc_tbl[curr._node_type].call(this,curr);
		return result;
	}
	/**
	 * 
	 * @param curr 
	 */
	private _parse_proc_root(curr: ParseNode<State>): boolean {
		let result: boolean = false;
		// 'node'と同じ処理
		result = this._parse_proc_node(curr);
		return result;
	}
	private _parse_proc_node(curr: ParseNode<State>): boolean {
		let result: boolean = false;
		// カレントノード実行
		this._run_action(curr);
		// 状態遷移チェック
		if (curr._next == null) {
			// 末尾ノードであれば正常終了
			result = true;
		} else {
			// 次ノード処理(check,proc,else)
			result = this._parse_proc_impl_check_proc_else(curr._next, curr._else);
			// NGありのとき
			if (!result) {
				// エラーストップノードであれば次の処理からパース再開
				if (curr._err_stop) result = true;
			}
		}
		return result;
	}
	private _parse_proc_hub(curr: ParseNode<State>): boolean {
		let result: boolean = false;
		// hubはchildを1つだけ持っている
		if (curr._child.length > 1) throw new Error("ParseTree:InvalidConstructionDetect:hub has one node.");
		// hub内要素を実行
		result = this._parse_proc(curr._child[0]);
		// 失敗時
		if (!result) {
			// エラーストップノードであれば次の処理からパース再開
			if (curr._err_stop) result = true;
		}
		return result;
	}
	private _parse_proc_seq(curr: ParseNode<State>): boolean {
		let result: boolean = true;
		// カレントノード実行
		this._run_action(curr);
		// child処理
		result = this._parse_proc_seq_impl(curr);
		// EOPで解析終了
		if (this._parse_end) return result;
		// next処理
		if (result) result = this._parse_proc_node(curr);
		return result;
	}
	private _parse_proc_seq_impl(curr: ParseNode<State>): boolean {
		let result: boolean = true;
		// seqノード配下のchildを順に実行する
		// (failsafe)要素が空ならtrueで抜ける
		for (let node of curr._child) {
			// 次ノード処理(check,proc,else)
			result = this._parse_proc_impl_check_proc_else(node, curr._else);
			// NGありのとき
			if (!result) {
				// エラーストップノードであれば次の処理からパース再開
				if (node._err_stop) result = true;
			}
			// 異常発生時
			if (!result) break;
			// EOPで解析終了
			if (this._parse_end) return result;
		}
		// 異常発生時
		if (!result) {
			// エラーストップノードであれば次の処理からパース再開
			if (curr._err_stop) result = true;
		}
		return result;
	}
	private _parse_proc_or(curr: ParseNode<State>): boolean {
		let result: boolean = false;
		// カレントノード実行
		this._run_action(curr);
		// child処理
		result = this._parse_proc_or_impl(curr);
		// EOPで解析終了
		if (this._parse_end) return result;
		// next処理
		if (result) result = this._parse_proc_node(curr);
		return result;
	}
	private _parse_proc_or_impl(curr: ParseNode<State>): boolean {
		let result: boolean = false;
		// 状態遷移チェック
		let node_ptr: ParseNode<State> | null = null;
		for (let node of curr._child) {
			// seq遷移チェック
			result = this._parse_check(node);
			if (result) {
				// 遷移OK
				node_ptr = node;
				break;
			}
		}
		// 状態処理実施
		if (node_ptr != null) {
			// 遷移OK
			// 状態処理実行
			result = this._parse_proc(node_ptr);
		} else {
			// 遷移NG
			// else処理を実施
			if (!result) result = this._parse_proc_else_impl(curr, curr._else);
		}
		// 異常発生時
		if (!result) {
			// エラーストップノードであれば次の処理からパース再開
			if (curr._err_stop) result = true;
		}
		return result;
	}
	private _parse_proc_opt(curr: ParseNode<State>): boolean {
		let result: boolean = true;
		// カレントノード実行
		this._run_action(curr);
		// (failsafe)child要素チェック, optは必ず1つchildを持っている
		if (curr._child.length == 0) throw new Error("ParseTree:InvalidConstructionDetect:opt node has one node.");
		// 次ノード処理(check,proc)(elseなし)
		// 必ずtrueで終了
		result = this._parse_proc_impl_check_proc(curr._child[0]);
		// EOPで解析終了
		if (this._parse_end) return result;
		// next処理
		result = this._parse_proc_node(curr);
		return result;
	}
	private _parse_proc_many(curr: ParseNode<State>): boolean {
		let result: boolean = false;
		// カレントノード実行
		this._run_action(curr);
		// child処理
		result = this._parse_proc_many_impl(curr);
		// EOPで解析終了
		if (this._parse_end) return result;
		// next処理
		if (result) result = this._parse_proc_node(curr);
		return result;
	}
	private _parse_proc_many_impl(curr: ParseNode<State>): boolean {
		let result: boolean = false;
		let loop_check: boolean = true;
		// (failsafe)child要素チェック, manyは必ず1つ以上のchildを持っている
		if (curr._child.length == 0) throw new Error("ParseTree:InvalidConstructionDetect:many node has at least one of node.");
		// マッチする間繰り返す
		while (loop_check) {
			// 先頭要素チェック
			result = this._parse_check(curr._child[0]);
			if (result) {
				// 先頭要素が遷移OKならmanyノード全体の処理開始
				// 先頭は2回チェックしているがとりあえず放置
				for (let node of curr._child) {
					// 次ノード処理(check,proc,else)
					// とりあえずelseも実施するようにしておくが、manyノードに対してelseを設定する必要性があるか？
					result = this._parse_proc_impl_check_proc_else(node, curr._else);
					// EOPで解析終了
					if (this._parse_end) return result;
					// 処理失敗時は処理中断
					if (!result) break;
				}
				// 異常発生時
				if (!result) {
					// エラーストップノードであれば再開
					// そうでなければ、処理を抜ける
					if (curr._err_stop) loop_check = true;
					else loop_check = false;
				}
			} else {
				// 先頭要素が遷移NGなら正常終了で抜ける
				result = true;
				loop_check = false;
			}
		}
		return result;
	}
	private _parse_proc_many1(curr: ParseNode<State>): boolean {
		let result: boolean = false;
		// カレントノード実行
		this._run_action(curr);
		// child処理
		// エラーストップはそれぞれのimpl内で実施済み
		result = this._parse_proc_seq_impl(curr);
		// EOPで解析終了
		if (this._parse_end) return result;
		if (result) result = this._parse_proc_many_impl(curr);
		// EOPで解析終了
		if (this._parse_end) return result;
		// next処理
		if (result) result = this._parse_proc_node(curr);
		return result;
	}
	private _parse_proc_else(else_node: ParseNode<State>|null): boolean {
		let result: boolean = false;
		if (else_node != null) {
			result = this._parse_proc_else_impl(null, else_node);
		}
		return result;
	}
	private _parse_proc_else_impl(fail_node: ParseNode<State> | null, else_node: ParseNode<State> | null): boolean {
		if (else_node && else_node._action_else) {
			// fail_nodeから失敗ノードstateを取得
			let states: State[] = [];
			if (fail_node != null) {
				// thisセット
				states.push(fail_node._state);
				// childセット
				for (let node of fail_node._child) {
					states.push(node._state);
				}
				// nextセット
				if (fail_node._next != null) {
					states.push(fail_node._next._state);
				}
			}
			// action実行
			else_node._action_else(states);
		}
		return true;
	}
	private _parse_proc_eop(curr: ParseNode<State>): boolean {
		// カレントノード実行
		this._run_action(curr);
		// EOP設定
		this._parse_end = true;
		return true;
	}
	/**
	 * parse実行共通処理
	 * 指定されたノードに対して、check, proc, elseを実行する。
	 * @param curr 
	 */
	private _parse_proc_impl_check_proc_else(node: ParseNode<State>, else_node: ParseNode<State>|null): boolean {
		let result: boolean = false;
		// ノード遷移チェック
		result = this._parse_check(node);
		if (result) {
			// 遷移OK
			result = this._parse_proc(node);
		} else {
			// 遷移NG
			// スキップできるノードのチェック
			switch (node._node_type) {
				case 'many':
				case 'opt':
					if (node._next == null) {
						result = true;
					} else {
						result = this._parse_proc_impl_check_proc_else(node._next, node._else);
						// NGありのとき
						if (!result) {
							// エラーストップノードであれば次の処理からパース再開
							if (node._err_stop) result = true;
						}
					}
					break;

				default:
					// else処理を実施
					result = this._parse_proc_else_impl(node, else_node);
					break;
			}
		}
		return result;
	}
	/**
	 * parse実行共通処理
	 * 指定されたノードに対して、check, procを実行する。elseは実行しない。
	 * @param curr 
	 */
	private _parse_proc_impl_check_proc(node: ParseNode<State>): boolean {
		let result: boolean = false;
		// ノード遷移チェック
		result = this._parse_check(node);
		if (result) {
			// 遷移OK
			result = this._parse_proc(node);
		} else {
			// 遷移NG
			// elseは実行しない。
			// result = this._parse_proc_else_impl(node, node._else);
		}
		return result;
	}
	// パース遷移チェック関数
	/**
	 * 遷移先候補のノードに対して遷移可否チェックを実行する。
	 * @param next 
	 */
	private _parse_check(next: ParseNode<State>): boolean {
		let result: boolean;
		// ノードタイプに応じた処理を実施
		result = this._parse_check_tbl[next._node_type].call(this,next);
		return result;
	}
	/**
	 * checkに対して状態遷移判定を実行
	 * @param next 
	 */
	private _parse_check_impl_check(next: ParseNode<State>): parse_check_result {
		let result: parse_check_result = 'check_undef';
		let check_result: boolean;
		// 状態遷移チェック
		// 状態遷移チェック結果ログを最初に初期化しておく
		this._last_checked_idx = ParseNode.LAST_CHECKED_NULL;
		// 自ノードcheck判定
		if (next._check != null) {
			// checkが登録されていたら実施
			check_result = next._check();
			if (check_result) {
				// 判定OK
				result = 'check_ok';
				// 状態遷移チェック結果ログ更新
				this._last_checked_idx = ParseNode.LAST_CHECKED_SELF;
			} else {
				// 判定NG
				result = 'check_ng';
			}
		} else {
			// checkが未登録であれば
			result = 'check_undef';
		}
		return result;
	}
	private _parse_check_impl_seq(next: ParseNode<State>): parse_check_result {
		let result: parse_check_result = 'check_undef';
		let check_result: boolean;
		// 状態遷移チェック
		// 状態遷移チェック結果ログを最初に初期化しておく
		this._last_checked_idx = ParseNode.LAST_CHECKED_NULL;
		// 自ノードcheck判定
		if (next._next != null) {
			// checkが登録されていたら実施
			check_result = this._parse_check(next._next);
			if (check_result) {
				// 判定OK
				result = 'check_ok';
				// 状態遷移チェック結果ログ更新
				this._last_checked_idx = ParseNode.LAST_CHECKED_SEQ;
			} else {
				// 判定NG
				result = 'check_ng';
			}
		} else {
			// checkが未登録であれば
			result = 'check_undef';
		}
		return result;
	}
	private _parse_check_impl_child_all(next: ParseNode<State>): parse_check_result {
		let result: parse_check_result = 'check_undef';
		let check_result: boolean;
		let child_idx: number = 0;
		// 状態遷移チェック
		// 状態遷移チェック結果ログを最初に初期化しておく
		this._last_checked_idx = ParseNode.LAST_CHECKED_NULL;
		// childノードcheck判定
		// (failsafe)child空ではundefで終了する。
		for (let node of next._child) {
			// check判定実施
			check_result = this._parse_check(node);
			if (check_result) {
				// 判定OK
				result = 'check_ok';
				// 状態遷移チェック結果ログ更新
				this._last_checked_idx = child_idx;
				// 1つでも判定OKが見つかったら終了する
				break;
			} else {
				// 判定NG
				result = 'check_ng';
			}
			child_idx++;
		}
		return result;
	}
	private _parse_check_impl_child_head(next: ParseNode<State>): parse_check_result {
		let result: parse_check_result = 'check_undef';
		let check_result: boolean;
		let child_idx: number = 0;
		// 状態遷移チェック
		// 状態遷移チェック結果ログを最初に初期化しておく
		this._last_checked_idx = ParseNode.LAST_CHECKED_NULL;
		// childノードcheck判定
		// (failsafe)child空ではundefで終了する。
		if (next._child.length > 0) {
			// check判定実施
			check_result = this._parse_check(next._child[0]);
			if (check_result) {
				// 判定OK
				result = 'check_ok';
				// 状態遷移チェック結果ログ更新
				this._last_checked_idx = child_idx;
			} else {
				// 判定NG
				result = 'check_ng';
			}
			child_idx++;
		} else {
			// childが未登録であれば
			result = 'check_undef';
		}
		return result;
	}
	private _parse_check_root(next: ParseNode<State>): boolean {
		let result: boolean = false;
		// 'node'と同じ処理
		result = this._parse_check_node(next);
		return result;
	}
	private _parse_check_node(next: ParseNode<State>): boolean {
		let result: boolean = false;
		let check_result: parse_check_result;
		// 自ノードcheck判定
		check_result = this._parse_check_impl_check(next);
		// 未確定ならchild判定
		if (check_result == 'check_undef') check_result = this._parse_check_impl_child_head(next);
		// 未確定ならseq判定
		if (check_result == 'check_undef') check_result = this._parse_check_impl_seq(next);
		// check結果処理
		switch (check_result) {
		case 'check_ok':
			result = true;
			break;
		case 'check_ng':
			result = false;
			break;
		//case 'check_undef':
		default:
			// (failsafe)ここまでで確定しているべき。例外投げるか？
			result = true;
			break;
		}
		return result;
	}
	private _parse_check_hub(next: ParseNode<State>): boolean {
		let result: boolean = false;
		// 'node'と同じ処理
		result = this._parse_check_node(next);
		return result;
	}
	private _parse_check_seq(next: ParseNode<State>): boolean {
		let result: boolean = true;
		// 'node'と同じ処理
		result = this._parse_check_node(next);
		return result;
	}
	private _parse_check_or(next: ParseNode<State>): boolean {
		let result: boolean = false;
		let check_result: parse_check_result;
		// 自ノードcheck判定
		check_result = this._parse_check_impl_check(next);
		// 未確定ならchild判定
		if (check_result == 'check_undef') check_result = this._parse_check_impl_child_all(next);
		// 未確定ならseq判定
		if (check_result == 'check_undef') check_result = this._parse_check_impl_seq(next);
		// check結果処理
		switch (check_result) {
			case 'check_ok':
				result = true;
				break;
			case 'check_ng':
				result = false;
				break;
			//case 'check_undef':
			default:
				// (failsafe)ここまでで確定しているべき。例外投げるか？
				result = true;
				break;
		}
		return result;
	}
	private _parse_check_opt(next: ParseNode<State>): boolean {
		let result: boolean = false;
		// 'node'と同じ処理
		result = this._parse_check_node(next);
		return result;
	}
	private _parse_check_many(next: ParseNode<State>): boolean {
		let result: boolean = false;
		// 'node'と同じ処理
		result = this._parse_check_node(next);
		return result;
	}
	private _parse_check_many1(next: ParseNode<State>): boolean {
		let result: boolean = false;
		// 'node'と同じ処理
		result = this._parse_check_node(next);
		return result;
	}
	private _parse_check_else(next: ParseNode<State>): boolean {
		let result: boolean = true;
		return result;
	}
	private _parse_check_eop(next: ParseNode<State>): boolean {
		let result: boolean = false;
		// 'node'と同じ処理
		result = this._parse_check_node(next);
		return result;
	}

	/**
	 * 自ノードの状態処理を実施
	 */
	private _run_action = (curr: ParseNode<State>): void => {
		// nullのときは何もせず終了
		if (curr._action != null) {
			curr._action();
			// 共通後処理を実行
			this._run_action_post();
		}
	}
	private _run_action_post = (): void => {
		// nullのときは何もせず終了
		if (this._action_post != null) {
			this._action_post();
		}
	}

}
