////[NEWLINE]
    
////[int][WHITESPACE][identifier][semicolon][NEWLINE]
    int              id          ;          
////[long][WHITESPACE][asterisk][identifier][semicolon][NEWLINE]
    long              *         id_ary      ;          
////[void][WHITESPACE][left_paren][asterisk][identifier][right_paren][left_paren][int][comma][WHITESPACE][short][comma][WHITESPACE][char][asterisk][comma][WHITESPACE][long][asterisk][comma][WHITESPACE][signed][right_paren][semicolon][NEWLINE]
    void              (           *         id_func     )            (           int  ,                  short  ,                  char  *         ,                  long  *         ,                  signed  )            ;          
////[NEWLINE]
    
////[COMMENT]           [NEWLINE]
    // A.2.1 Expressions
////[void][WHITESPACE][identifier]     [left_paren][void][right_paren][WHITESPACE][left_brace][NEWLINE]
    void              A_2_1_Expressions(           void  )                        {           
////[WHITESPACE][COMMENT]                    [NEWLINE]
    	        // (6.5.1) primary-expression
////[WHITESPACE][identifier][semicolon][NEWLINE]
    	        id          ;          
////[WHITESPACE][decimal_constant][semicolon][NEWLINE]
    	        100               ;          
////[WHITESPACE][string_literal][semicolon][NEWLINE]
    	        "string-literal";          
////[WHITESPACE][left_paren][identifier][right_paren][semicolon][NEWLINE]
    	        (           id          )            ;          
////[WHITESPACE][left_paren][decimal_constant][right_paren][semicolon][NEWLINE]
    	        (           200               )            ;          
////[WHITESPACE][left_paren][string_literal]  [right_paren][semicolon][NEWLINE]
    	        (           "string-literal-2")            ;          
////[WHITESPACE][COMMENT]                    [NEWLINE]
    	        // (6.5.2) postfix-expression
////[WHITESPACE][identifier][left_bracket][identifier][right_bracket][semicolon][NEWLINE]
    	        id_ary      [             id          ]              ;          
////[WHITESPACE][identifier][left_paren][identifier][comma][WHITESPACE][decimal_constant][comma][WHITESPACE][string_literal][comma][WHITESPACE][identifier][comma][WHITESPACE][decimal_constant][right_paren][semicolon][NEWLINE]
    	        id_func     (           id          ,                  300               ,                  "str3"          ,                  id_ary      ,                  400               )            ;          
////[WHITESPACE][decimal_constant][left_bracket][identifier][right_bracket][semicolon][NEWLINE]
    	        500               [             id_ary      ]              ;          
////[right_brace][NEWLINE]
    }            
////[NEWLINE]
    
////
    
