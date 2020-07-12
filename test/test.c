// keyword test
a
au
aut
auto
automata
absolute abs aaaaaaaaaaa

b br bre brea break breaking broken
cas case casee
cha	char 			charr
const continue default do double else enum extern flo	
at float for goto if inline int long register restrict return   
short signed sizeof static struct switch typedef union 
unsigned void volatile while _Bool _Complex _Imaginary

/* identifier test */
a_identi\uFFF0fier
a_identi\uFFFier
a_identi\UFFEEDDCCfier
a_identi\UFFEEDDCier

/**
 * integer-constant test
 */
// octal-constant
0
0123
01237
01238

0x12EF
0x00FG
0x3456

1
123
8999
99999LLU
1ull
2ullu
3llul
4lu
5Lu
6lU
7lLU
8Llu
9llu
10ull
11uLL
12Ull
13ul
14Ul
15uL
16UL

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

''
'a'
'(...)'
'abcd'
L''
L'hoge'


struct hoge
{
    int a;
    int b;
};
struct hoge hoge_ = {0};

int main(void) {

    return 0;
}
