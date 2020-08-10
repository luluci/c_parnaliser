'use strict';


export type token_id =
	| 'EOF'
	| 'NEWLINE'
	| 'WHITESPACE'
	| 'COMMENT'
	| 'identifier'
//	| 'integer_constant'
	| 'octal_constant'
	| 'hex_constant'
	| 'decimal_constant'
	| 'decimal_float_constant'
	| 'hex_float_constant'
	| 'char_constant'
	| 'string_literal'
	// punctuator
	| 'left_bracket'				// [
	| 'right_bracket'				// ]
	| 'left_paren'					// (
	| 'right_paren'					// )
	| 'left_brace'					// {
	| 'right_brace'					// }
	| 'dot'							// .
	| 'arrow_op'					// ->
	| 'increment_op'				// ++
	| 'decrement_op'				// --
	| 'ampersand'					// &	address_operator | bitwise_AND_operator
	| 'asterisk'					// *	asterisk_punctuator | indirection_operator | multimlication_operator
	| 'plus'						// +
	| 'minus'						// -
	| 'bitwise_complement_op'		// ~
	| 'logical_negation_op'			// !
	| 'div_op'						// /
	| 'remain_op'					// %
	| 'left_shift_op'				// <<
	| 'right_shift_op'				// >>
	| 'lt_op'						// <
	| 'gt_op'						// >
	| 'lte_op'						// <=
	| 'gte_op'						// >=
	| 'equal_op'					// ==
	| 'inequal_op'					// !=
	| 'bitwise_EXOR_op'				// ^
	| 'bitwise_OR_op'				// |
	| 'logical_AND_op'				// &&
	| 'logical_OR_op'				// ||
	| 'conditional_op'				// ?
	| 'colon'						// :
	| 'semicolon'					// ;
	| 'ellipsis'					// ...
	| 'simple_assign_op'			// =
	| 'mul_assign_op'				// *=
	| 'div_assign_op'				// /=
	| 'remain_assign_op'			// %=
	| 'add_assign_op'				// +=
	| 'sub_assign_op'				// -=
	| 'left_shift_assign_op'		// <<=
	| 'right_shift_assign_op'		// >>=
	| 'bitwise_AND_assign_op'		// &=
	| 'bitwise_EXOR_assign_op'		// ^=
	| 'bitwise_OR_assign_op'		// |=
	| 'comma'						// ,
	| 'sharp'						// #
	| 'sharp_sharp'					// ##
	| 'alt_left_bracket'			// <:	== [
	| 'alt_right_bracket'			// :>	== ]
	| 'alt_left_brace'				// <%	== {
	| 'alt_right_brace'				// %>	== }
	| 'alt_sharp'					// %:	== #
	| 'alt_sharp_sharp_op'			// %:%:	== ##
	// keyword
	| 'auto'
	| 'break'
	| 'case'
	| 'char'
	| 'const'
	| 'continue'
	| 'default'
	| 'do'
	| 'double'
	| 'else'
	| 'enum'
	| 'extern'
	| 'float'
	| 'for'
	| 'goto'
	| 'if'
	| 'inline'
	| 'int'
	| 'long'
	| 'register'
	| 'restrict'
	| 'return'
	| 'short'
	| 'signed'
	| 'sizeof'
	| 'static'
	| 'struct'
	| 'switch'
	| 'typedef'
	| 'union'
	| 'unsigned'
	| 'void'
	| 'volatile'
	| 'while'
	| '_Bool'
	| '_Complex'
	| '_Imaginary'
	// PP-directive
	| 'pp_if'
	| 'pp_ifdef'
	| 'pp_ifndef'
	| 'pp_elif'
	| 'pp_else'
	| 'pp_endif'
	| 'pp_include'
	| 'pp_define'
	| 'pp_undef'
	| 'pp_line'
	| 'pp_error'
	| 'pp_pragma'
	| 'pp_invalid_keyword'
	| 'pp_token'
	// 特殊keyword
	//| 'far'
	//| 'near'
	| '__far'					// far, __far
	| '__near'					// near, __near
	// null
	| 'null';

export type token_sub_id =
	// COMMENT のサブ
	| '1line'
	| 'multiline'
	// punctuator のサブ
	| 'punctuator'
	// keyword のサブ
	| 'keyword'
	// integer-constant のサブ
	| 'long'						// long型
	| 'long_long'					// long-long型
	| 'unsigned_long'				// unsigned long型
	| 'unsigned_long_long'			// unsigned long-long型
	// character-constant, string-literal
	| 'char'						// 通常文字リテラル
	| 'wide_char'					// ワイド文字リテラル
	// PP-directive
	| 'pp_keyword'
	// null
	| 'null';
