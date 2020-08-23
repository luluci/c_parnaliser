////[NEWLINE]
    
////[int][WHITESPACE][identifier][semicolon][NEWLINE]
    int              id          ;          
////[long][WHITESPACE][asterisk][identifier][semicolon][NEWLINE]
    long              *         id_ary      ;          
////[void][WHITESPACE][left_paren][asterisk][identifier][right_paren][left_paren][int][comma][WHITESPACE][short][comma][WHITESPACE][char][WHITESPACE][asterisk][comma][WHITESPACE][long][WHITESPACE][asterisk][comma][WHITESPACE][signed][right_paren][semicolon][NEWLINE]
    void              (           *         id_func     )            (           int  ,                  short  ,                  char              *         ,                  long              *         ,                  signed  )            ;          
////[void][WHITESPACE][left_paren][asterisk][identifier][right_paren][left_paren][void][right_paren][semicolon][NEWLINE]
    void              (           *         id_func2    )            (           void  )            ;          
////[NEWLINE]
    
////[typedef][WHITESPACE][struct][WHITESPACE][left_brace][NEWLINE]
    typedef              struct              {           
////[WHITESPACE][int][WHITESPACE][identifier(err)][(unexpected-token)][semicolon][NEWLINE]
    	        int              a                                    ;          
////[WHITESPACE][char][WHITESPACE][identifier(err)][(unexpected-token)][semicolon][NEWLINE]
    	        char              b                                    ;          
////[right_brace][WHITESPACE][identifier]   [semicolon][NEWLINE]
    }                        user_def_type_t;          
////[identifier]   [WHITESPACE][identifier][semicolon][NEWLINE]
    user_def_type_t            user_t_1    ;          
////[identifier]   [WHITESPACE][asterisk][identifier][WHITESPACE][simple_assign_op][WHITESPACE][ampersand][identifier][semicolon][NEWLINE]
    user_def_type_t            *         user_t_1p               =                             &          user_t_1    ;          
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
////[WHITESPACE][COMMENT]                          [NEWLINE]
    	        // (6.5.2) argument-expression-list
////[WHITESPACE][identifier][left_bracket][identifier][right_bracket][semicolon][NEWLINE]
    	        id_ary      [             id          ]              ;          
////[WHITESPACE][identifier][left_paren][identifier][comma][WHITESPACE][decimal_constant][comma][WHITESPACE][string_literal][comma][WHITESPACE][left_paren][left_paren][long][asterisk][right_paren][identifier][WHITESPACE][plus][WHITESPACE][decimal_constant][WHITESPACE][asterisk][WHITESPACE][decimal_constant][WHITESPACE][div_op][WHITESPACE][decimal_constant][right_paren][comma][WHITESPACE][left_paren][decimal_constant][minus][decimal_constant][right_paren][asterisk][left_paren][decimal_constant][right_paren][right_paren][semicolon][NEWLINE]
    	        id_func     (           id          ,                  300               ,                  "str3"          ,                  (           (           long  *         )            id_ary                  +                 1                             *                     10                            /                   2                 )            ,                  (           400               -      200               )            *         (           1                 )            )            ;          
////[WHITESPACE][identifier][left_paren][right_paren][semicolon][NEWLINE]
    	        id_func2    (           )            ;          
////[WHITESPACE][decimal_constant][left_bracket][identifier][right_bracket][semicolon][NEWLINE]
    	        500               [             id_ary      ]              ;          
////[WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a           ;          
////[WHITESPACE][identifier][arrow_op][identifier][semicolon][NEWLINE]
    	        user_t_1p   ->        a           ;          
////[WHITESPACE][identifier][dot][identifier][increment_op][semicolon][NEWLINE]
    	        user_t_1    .    a           ++            ;          
////[WHITESPACE][identifier][dot][identifier][decrement_op][semicolon][NEWLINE]
    	        user_t_1    .    a           --            ;          
////[WHITESPACE][left_paren][identifier]   [right_paren][WHITESPACE][left_brace][WHITESPACE][decimal_constant][comma][WHITESPACE][decimal_constant][WHITESPACE][right_brace][semicolon][NEWLINE]
    	        (           user_def_type_t)                        {                       1                 ,                  2                             }            ;          
////[WHITESPACE][left_paren][identifier]   [right_paren][WHITESPACE][left_brace][WHITESPACE][decimal_constant][comma][WHITESPACE][decimal_constant][comma][WHITESPACE][right_brace][semicolon][NEWLINE]
    	        (           user_def_type_t)                        {                       3                 ,                  4                 ,                  }            ;          
////[WHITESPACE][COMMENT]                  [NEWLINE]
    	        // (6.5.3) unary-expression
////[WHITESPACE][decrement_op][identifier][dot][identifier][semicolon][NEWLINE]
    	        --            user_t_1    .    a           ;          
////[WHITESPACE][increment_op][identifier][dot][identifier][semicolon][NEWLINE]
    	        ++            user_t_1    .    a           ;          
////[right_brace][NEWLINE]
    }            
////
    
