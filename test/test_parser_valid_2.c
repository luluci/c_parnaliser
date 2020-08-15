
int id;
long *id_ary;
void (*id_func)(int, short, char*, long*, signed);

// A.2.1 Expressions
void A_2_1_Expressions(void) {
	// (6.5.1) primary-expression
	id;
	100;
	"string-literal";
	(id);
	(200);
	("string-literal-2");
	// (6.5.2) postfix-expression
	id_ary[id];
	id_func(id, 300, "str3", ((long*)id_ary + 1 * 10 / 2), (400-200)*(1));
	500[id_ary];
}

