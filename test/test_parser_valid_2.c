
typedef struct {
	int a;
	char b;
} user_def_type_t;
user_def_type_t user_t_1;
user_def_type_t *user_t_1p = &user_t_1;

int id;
long *id_ary;
void (*id_func)(int, short, char *, long *, signed, int*);
void (*id_func2)(void);

// A.2.1 Expressions
void A_2_1_Expressions(void)
{
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
	id_func( (*(&(&id)[12+23])), 300, "str3", ((long *)id_ary + 1 * 10 / 2), (400 - 200) * (1), (&((&user_t_1)->a)+1));
	id_func2();
	500[id_ary];
	user_t_1.a;
	user_t_1p->a;
	user_t_1.a++;
	user_t_1.a--;
	(user_def_type_t) { 1, 2 };
	((user_def_type_t) { 3, 4, }).a;
	// (6.5.3) unary-expression
	// (6.5.3) unary-operator: one of
	--user_t_1.a;
	++user_t_1.a;
	! ~-+(&((&user_t_1)->a))[0];
	sizeof user_t_1;
	sizeof user_t_1.a;
	sizeof (user_def_type_t){1, 2};
	sizeof !~-+(&((&user_t_1)->a))[0];
	sizeof(int);
	sizeof(user_def_type_t);
	// (6.5.4) cast-expression:
	(int)user_t_1.b;
	(char)user_t_1.a;
	(user_def_type_t *)&user_t_1;
	(unsigned int)500 [id_ary];
	(unsigned char)user_t_1.a;
	(unsigned short)user_t_1p->a;
	(signed short)user_t_1.a++;
	(void)user_t_1.a--;
	// (6.5.5) multiplicative-expression:
	user_t_1.a * user_t_1.b;
	user_t_1.a / user_t_1.b;
	user_t_1.a % user_t_1.b;
	(signed short)((user_def_type_t) { 3, 4, }).a * id_ary[id];
	// (6.5.6) additive-expression:
	user_t_1.a + user_t_1.b;
	user_t_1.a - user_t_1.b;
	user_t_1.a - user_t_1.b + user_t_1.b;
	(signed short)((user_def_type_t) { 3, 4, }).a + id_ary[id] - (--user_t_1.b) + (user_t_1.b++);
	// (6.5.7) shift-expression:
	user_t_1.a >> user_t_1.b;
	user_t_1.a << user_t_1.b;
	user_t_1.a >> user_t_1.b >> user_t_1.b << id_ary[id] >> user_t_1.a;
	// (6.5.8) relational-expression:
	user_t_1.a > user_t_1.b;
	user_t_1.a < user_t_1.b;
	user_t_1.a >= user_t_1.b;
	user_t_1.a <= user_t_1.b;
	user_t_1.a > user_t_1.b >= user_t_1.b <= id_ary[id] > user_t_1.a;
	// (6.5.9) equality-expression:
	user_t_1.a == user_t_1.b;
	user_t_1.a != user_t_1.b;
	user_t_1.a == user_t_1.b != user_t_1.b != id_ary[id] == user_t_1.a;
	// (6.5.10) AND-expression:
	user_t_1.a & user_t_1.b;
	user_t_1.a & user_t_1.b & user_t_1.b & id_ary[id] & user_t_1.a;
	// (6.5.11) exclusive-OR-expression:
	user_t_1.a ^ user_t_1.b;
	user_t_1.a ^ user_t_1.b ^ user_t_1.b ^ id_ary[id] ^ user_t_1.a;
	// (6.5.12) inclusive-OR-expression:
	id | user_t_1.a;
	user_t_1.a | user_t_1.b;
	id | user_t_1.a | id_ary[id] | user_t_1.b;
	// (6.5.13) logical-AND-expression:
	id && user_t_1.a;
	user_t_1.a && user_t_1.b;
	id && user_t_1.a && id_ary[id] && user_t_1.b;
	// (6.5.14) logical-OR-expression:
	id || user_t_1.a;
	user_t_1.a || user_t_1.b;
	id || user_t_1.a || id_ary[id] || user_t_1.b;
	// (6.5.15) conditional-expression:
	((user_t_1.a | user_t_1.b & user_t_1.b ^ id_ary[id]) ^ user_t_1.a && id || user_t_1.a != id) ? id : (signed short)((user_def_type_t) { 3, 4, }).a + id_ary[id] - (--user_t_1.b) + (user_t_1.b++);
	// (6.5.16) assignment-expression:
	id = user_t_1.a = id_ary[id] = user_t_1.b = id;
	id *= user_t_1.a /= id_ary[id] %= user_t_1.b += id -= user_t_1.a <<= id_ary[id] >>= user_t_1.b = id;
	// (6.5.17) expression:
	id_func((*(&(&id)[12 + 23])), 300, "str3", ((long *)id_ary + 1 * 10 / 2), (400 - 200) * (1), (&((&user_t_1)->a) + 1)),
	sizeof !~-+(&((&user_t_1)->a))[0],
	((user_t_1.a | user_t_1.b & user_t_1.b ^ id_ary[id]) ^ user_t_1.a && id || user_t_1.a != id) ? id : (signed short)((user_def_type_t) { 3, 4, }).a + id_ary[id] - (--user_t_1.b) + (user_t_1.b++);
}
