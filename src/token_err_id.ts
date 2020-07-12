'use strict';


export type token_err_id =
	| 'univ_char_name'
	| 'octal_constant'
	| 'decimal_constant'
	| 'hex_constant'
	| 'decimal_float_constant'
	| 'hex_float_constant'
	| 'int_suffix'
	| 'float_suffix'
	| 'float_exponent'
	| 'binary_float_exponent'
	| 'char_constant'
	| 'string_literal'
	| 'escape_sequence'
	| 'hex_escape_sequence'
	| 'multi_comment'
	// PP-directive
	| 'pp_keyword'
	| 'null';
