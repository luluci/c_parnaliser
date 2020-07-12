// keyword test
auto break	char	continue 
default do double else enum extern	
float float for goto if inline int
 long register restrict return   
	short signed sizeof static struct switch
	 	typedef union unsigned void volatile
 	 while _Bool _Complex _Imaginary
// keyword? test
a
au
aut automata aut
o autoo absolute abs aaaaaaaaaaa
b br bre brea  breaking broken brea 
k cas case casee casechar		charr
	cons	onst	cconst	constt	cons	
	t dodo	d
		o doubl els 	el _ 	_Comp
lex 
/* identifier test */
_hoge
ahoge zhoge		identify001
a_identi\uFFF0fier
b_identi\u0000fier
b_identi\U00009999fier
	_識別子		だよ_999		_表示_777_
/** identifier? test
 */
0_type
9hoge   
a_identi\uFFFier
a_identi\UFFEEDDCCfier	_identi\UFFEEDDCier  

/**
 * integer-constant test
 */
// octal-constant
0
0123
01237
06u  05U  04uLL  03ll    02Ul  01Ull   00llu	
// octal-constant?
01238
08
012Ll    013lL      	014ullu 	015lull   016lulu
// hex-constant
0x12EF
0x3456  	0xABCDEEE	0xFFFFFFFFFFFFFF
	0x1234ll 	0x3333LL  0x4444U   0x5555LLU  0x66ULL 0x7LU 0x8ul
// hex-constant?
0x00FG
0xfgf
0xULL   0x  	0xZZ

// decimal-constant
1
123
8999
99999LLU
1ull
4lu
5Lu
6lU
9llu
10ull
11uLL
12Ull
13ul
14Ul
15uL
16UL
// decimal-constant?
2ullu
3llul
7lLU
8Llu
// floating-consntant test
// decimal-float
0123456789.
.0123456789
0123.4
0123.789
1.e
1.e10
1.e10L
12.34e+567
12.34e+567l
8.9e-012
8.9e-012f
.123e10
.123e10F
3.f
4.F
5.l
6.L
.7f
.8F
.9l
.11L

0xAB.CD
0x1.23F
0x4.ACP+12
0x.FFp+999
0x.FFp+999f
0X.abp-12l
0x.12FFL
0x9AP-89F
33.44hoge
// char-const
'a'
'(...)'
'abcd'
L'hoge'
'hoge_''fufufu'L'string-lit'	'\t\t\r\n'
L'\'\"\?\\\a\b\f\n\r\t\v   \0  \77 \012  \xFF \xA0 \xEEEEEEEEEEEEE'L'  \u12AB   \UAABBCCFF '
// char-const?
''
L''
'\uFFaz   \U123456789   \U1234567   \u123   \uABCDE'
// string-literal
""
"hoge_""fufufu"L"string-lit"	"\t\t\r\n"
L"\'\"\?\\\a\b\f\n\r\t\v   \0  \77 \012  \xFF \xA0 \xEEEEEEEEEEEEE"

#include <stdio.h>
#define HOGE (1)
#define FUGA(a,b)	a##b
#define A_INST(a)	#a
#define FUGA_IF(a,b)	\
		FUGA( A_INST(a), b )
#if (HOGE==1)
	#define BUFFF	111
#else
	#define FFFFF	1234
#endif

struct hoge
{
    int a;
    int b;
};
struct hoge hoge_ = {0};

int main(void) {

    return 0;
}
