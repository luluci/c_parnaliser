
int id;
long *id_ary;
void (*id_func)(int, short, char *, long *, signed);
void (*id_func2)(void);

typedef struct {
	int a;
	char b;
} user_def_type_t;
user_def_type_t user_t_1;
user_def_type_t *user_t_1p = &user_t_1;

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
	// (6.5.2) argument-expression-list
	id_ary[id];
	id_func(id, 300, "str3", ((long*)id_ary + 1 * 10 / 2), (400-200)*(1));
	id_func2();
	500[id_ary];
	user_t_1.a;
	user_t_1p->a;
	user_t_1.a++;
	user_t_1.a--;
	(user_def_type_t) { 1, 2 };
	(user_def_type_t) { 3, 4, };
	// (6.5.3) unary-expression
	--user_t_1.a;
	++user_t_1.a;
}
