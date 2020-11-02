////[NEWLINE]
    
////[typedef][WHITESPACE][struct][WHITESPACE][left_brace][NEWLINE]
    typedef              struct              {           
////[WHITESPACE][int][WHITESPACE][identifier][semicolon][NEWLINE]
    	        int              a           ;          
////[WHITESPACE][char][WHITESPACE][identifier][semicolon][NEWLINE]
    	        char              b           ;          
////[right_brace][WHITESPACE][identifier]   [semicolon][NEWLINE]
    }                        user_def_type_t;          
////[identifier]   [WHITESPACE][identifier][semicolon][NEWLINE]
    user_def_type_t            user_t_1    ;          
////[identifier]   [WHITESPACE][asterisk][identifier][WHITESPACE][simple_assign_op][WHITESPACE][ampersand][identifier][semicolon][NEWLINE]
    user_def_type_t            *         user_t_1p               =                             &          user_t_1    ;          
////[NEWLINE]
    
////[int][WHITESPACE][identifier][semicolon][NEWLINE]
    int              id          ;          
////[long][WHITESPACE][asterisk][identifier][semicolon][NEWLINE]
    long              *         id_ary      ;          
////[void][WHITESPACE][left_paren][asterisk][identifier][right_paren][left_paren][int][comma][WHITESPACE][short][comma][WHITESPACE][char][WHITESPACE][asterisk][comma][WHITESPACE][long][WHITESPACE][asterisk][comma][WHITESPACE][signed][comma][WHITESPACE][int][asterisk][right_paren][semicolon][NEWLINE]
    void              (           *         id_func     )            (           int  ,                  short  ,                  char              *         ,                  long              *         ,                  signed  ,                  int  *         )            ;          
////[void][WHITESPACE][left_paren][asterisk][identifier][right_paren][left_paren][void][right_paren][semicolon][NEWLINE]
    void              (           *         id_func2    )            (           void  )            ;          
////[NEWLINE]
    
////[COMMENT]           [NEWLINE]
    // A.2.1 Expressions
////[void][WHITESPACE][identifier]     [left_paren][void][right_paren][NEWLINE]
    void              A_2_1_Expressions(           void  )            
////[left_brace][NEWLINE]
    {           
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
////[WHITESPACE][identifier][left_paren][WHITESPACE][left_paren][asterisk][left_paren][ampersand][left_paren][ampersand][identifier][right_paren][left_bracket][decimal_constant][plus][decimal_constant][right_bracket][right_paren][right_paren][comma][WHITESPACE][decimal_constant][comma][WHITESPACE][string_literal][comma][WHITESPACE][left_paren][left_paren][long][WHITESPACE][asterisk][right_paren][identifier][WHITESPACE][plus][WHITESPACE][decimal_constant][WHITESPACE][asterisk][WHITESPACE][decimal_constant][WHITESPACE][div_op][WHITESPACE][decimal_constant][right_paren][comma][WHITESPACE][left_paren][decimal_constant][WHITESPACE][minus][WHITESPACE][decimal_constant][right_paren][WHITESPACE][asterisk][WHITESPACE][left_paren][decimal_constant][right_paren][comma][WHITESPACE][left_paren][ampersand][left_paren][left_paren][ampersand][identifier][right_paren][arrow_op][identifier][right_paren][plus][decimal_constant][right_paren][right_paren][semicolon][NEWLINE]
    	        id_func     (                       (           *         (           &          (           &          id          )            [             12                +     23                ]              )            )            ,                  300               ,                  "str3"          ,                  (           (           long              *         )            id_ary                  +                 1                             *                     10                            /                   2                 )            ,                  (           400                           -                  200               )                        *                     (           1                 )            ,                  (           &          (           (           &          user_t_1    )            ->        a           )            +     1                 )            )            ;          
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
////[WHITESPACE][left_paren][left_paren][identifier]   [right_paren][WHITESPACE][left_brace][WHITESPACE][decimal_constant][comma][WHITESPACE][decimal_constant][comma][WHITESPACE][right_brace][right_paren][dot][identifier][semicolon][NEWLINE]
    	        (           (           user_def_type_t)                        {                       3                 ,                  4                 ,                  }            )            .    a           ;          
////[WHITESPACE][COMMENT]                  [NEWLINE]
    	        // (6.5.3) unary-expression
////[WHITESPACE][COMMENT]                        [NEWLINE]
    	        // (6.5.3) unary-operator: one of
////[WHITESPACE][decrement_op][identifier][dot][identifier][semicolon][NEWLINE]
    	        --            user_t_1    .    a           ;          
////[WHITESPACE][increment_op][identifier][dot][identifier][semicolon][NEWLINE]
    	        ++            user_t_1    .    a           ;          
////[WHITESPACE][logical_negation_op][WHITESPACE][bitwise_complement_op][minus][plus][left_paren][ampersand][left_paren][left_paren][ampersand][identifier][right_paren][arrow_op][identifier][right_paren][right_paren][left_bracket][octal_constant][right_bracket][semicolon][NEWLINE]
    	        !                                ~                      -      +     (           &          (           (           &          user_t_1    )            ->        a           )            )            [             0               ]              ;          
////[WHITESPACE][sizeof][WHITESPACE][identifier][semicolon][NEWLINE]
    	        sizeof              user_t_1    ;          
////[WHITESPACE][sizeof][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        sizeof              user_t_1    .    a           ;          
////[WHITESPACE][sizeof][WHITESPACE][left_paren][identifier]   [right_paren][left_brace][decimal_constant][comma][WHITESPACE][decimal_constant][right_brace][semicolon][NEWLINE]
    	        sizeof              (           user_def_type_t)            {           1                 ,                  2                 }            ;          
////[WHITESPACE][sizeof][WHITESPACE][logical_negation_op][bitwise_complement_op][minus][plus][left_paren][ampersand][left_paren][left_paren][ampersand][identifier][right_paren][arrow_op][identifier][right_paren][right_paren][left_bracket][octal_constant][right_bracket][semicolon][NEWLINE]
    	        sizeof              !                    ~                      -      +     (           &          (           (           &          user_t_1    )            ->        a           )            )            [             0               ]              ;          
////[WHITESPACE][sizeof][left_paren][int][right_paren][semicolon][NEWLINE]
    	        sizeof  (           int  )            ;          
////[WHITESPACE][sizeof][left_paren][identifier]   [right_paren][semicolon][NEWLINE]
    	        sizeof  (           user_def_type_t)            ;          
////[WHITESPACE][COMMENT]                  [NEWLINE]
    	        // (6.5.4) cast-expression:
////[WHITESPACE][left_paren][int][right_paren][identifier][dot][identifier][semicolon][NEWLINE]
    	        (           int  )            user_t_1    .    b           ;          
////[WHITESPACE][left_paren][char][right_paren][identifier][dot][identifier][semicolon][NEWLINE]
    	        (           char  )            user_t_1    .    a           ;          
////[WHITESPACE][left_paren][identifier]   [WHITESPACE][asterisk][right_paren][ampersand][identifier][semicolon][NEWLINE]
    	        (           user_def_type_t            *         )            &          user_t_1    ;          
////[WHITESPACE][left_paren][unsigned][WHITESPACE][int][right_paren][decimal_constant][WHITESPACE][left_bracket][identifier][right_bracket][semicolon][NEWLINE]
    	        (           unsigned              int  )            500                           [             id_ary      ]              ;          
////[WHITESPACE][left_paren][unsigned][WHITESPACE][char][right_paren][identifier][dot][identifier][semicolon][NEWLINE]
    	        (           unsigned              char  )            user_t_1    .    a           ;          
////[WHITESPACE][left_paren][unsigned][WHITESPACE][short][right_paren][identifier][arrow_op][identifier][semicolon][NEWLINE]
    	        (           unsigned              short  )            user_t_1p   ->        a           ;          
////[WHITESPACE][left_paren][signed][WHITESPACE][short][right_paren][identifier][dot][identifier][increment_op][semicolon][NEWLINE]
    	        (           signed              short  )            user_t_1    .    a           ++            ;          
////[WHITESPACE][left_paren][void][right_paren][identifier][dot][identifier][decrement_op][semicolon][NEWLINE]
    	        (           void  )            user_t_1    .    a           --            ;          
////[WHITESPACE][COMMENT]                            [NEWLINE]
    	        // (6.5.5) multiplicative-expression:
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][asterisk][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       *                     user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][div_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       /                   user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][remain_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       %                      user_t_1    .    b           ;          
////[WHITESPACE][left_paren][signed][WHITESPACE][short][right_paren][left_paren][left_paren][identifier]   [right_paren][WHITESPACE][left_brace][WHITESPACE][decimal_constant][comma][WHITESPACE][decimal_constant][comma][WHITESPACE][right_brace][right_paren][dot][identifier][WHITESPACE][asterisk][WHITESPACE][identifier][left_bracket][identifier][right_bracket][semicolon][NEWLINE]
    	        (           signed              short  )            (           (           user_def_type_t)                        {                       3                 ,                  4                 ,                  }            )            .    a                       *                     id_ary      [             id          ]              ;          
////[WHITESPACE][COMMENT]                      [NEWLINE]
    	        // (6.5.6) additive-expression:
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][plus][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       +                 user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][minus][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       -                  user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][minus][WHITESPACE][identifier][dot][identifier][WHITESPACE][plus][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       -                  user_t_1    .    b                       +                 user_t_1    .    b           ;          
////[WHITESPACE][left_paren][signed][WHITESPACE][short][right_paren][left_paren][left_paren][identifier]   [right_paren][WHITESPACE][left_brace][WHITESPACE][decimal_constant][comma][WHITESPACE][decimal_constant][comma][WHITESPACE][right_brace][right_paren][dot][identifier][WHITESPACE][plus][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][minus][WHITESPACE][left_paren][decrement_op][identifier][dot][identifier][right_paren][WHITESPACE][plus][WHITESPACE][left_paren][identifier][dot][identifier][increment_op][right_paren][semicolon][NEWLINE]
    	        (           signed              short  )            (           (           user_def_type_t)                        {                       3                 ,                  4                 ,                  }            )            .    a                       +                 id_ary      [             id          ]                          -                  (           --            user_t_1    .    b           )                        +                 (           user_t_1    .    b           ++            )            ;          
////[WHITESPACE][COMMENT]                   [NEWLINE]
    	        // (6.5.7) shift-expression:
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][right_shift_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       >>                          user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][left_shift_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       <<                         user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][right_shift_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][right_shift_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][left_shift_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][right_shift_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       >>                          user_t_1    .    b                       >>                          user_t_1    .    b                       <<                         id_ary      [             id          ]                          >>                          user_t_1    .    a           ;          
////[WHITESPACE][COMMENT]                        [NEWLINE]
    	        // (6.5.8) relational-expression:
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][gt_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       >                  user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][lt_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       <                  user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][gte_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       >=                  user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][lte_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       <=                  user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][gt_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][gte_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][lte_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][gt_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       >                  user_t_1    .    b                       >=                  user_t_1    .    b                       <=                  id_ary      [             id          ]                          >                  user_t_1    .    a           ;          
////[WHITESPACE][COMMENT]                      [NEWLINE]
    	        // (6.5.9) equality-expression:
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][equal_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       ==                    user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][inequal_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       !=                      user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][equal_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][inequal_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][inequal_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][equal_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       ==                    user_t_1    .    b                       !=                      user_t_1    .    b                       !=                      id_ary      [             id          ]                          ==                    user_t_1    .    a           ;          
////[WHITESPACE][COMMENT]                  [NEWLINE]
    	        // (6.5.10) AND-expression:
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][ampersand][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       &                      user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][ampersand][WHITESPACE][identifier][dot][identifier][WHITESPACE][ampersand][WHITESPACE][identifier][dot][identifier][WHITESPACE][ampersand][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][ampersand][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       &                      user_t_1    .    b                       &                      user_t_1    .    b                       &                      id_ary      [             id          ]                          &                      user_t_1    .    a           ;          
////[WHITESPACE][COMMENT]                           [NEWLINE]
    	        // (6.5.11) exclusive-OR-expression:
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][bitwise_EXOR_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       ^                            user_t_1    .    b           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][bitwise_EXOR_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][bitwise_EXOR_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][bitwise_EXOR_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][bitwise_EXOR_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       ^                            user_t_1    .    b                       ^                            user_t_1    .    b                       ^                            id_ary      [             id          ]                          ^                            user_t_1    .    a           ;          
////[WHITESPACE][COMMENT]                           [NEWLINE]
    	        // (6.5.12) inclusive-OR-expression:
////[WHITESPACE][identifier][WHITESPACE][bitwise_OR_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        id                      |                          user_t_1    .    a           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][bitwise_OR_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       |                          user_t_1    .    b           ;          
////[WHITESPACE][identifier][WHITESPACE][bitwise_OR_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][bitwise_OR_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][bitwise_OR_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        id                      |                          user_t_1    .    a                       |                          id_ary      [             id          ]                          |                          user_t_1    .    b           ;          
////[WHITESPACE][COMMENT]                          [NEWLINE]
    	        // (6.5.13) logical-AND-expression:
////[WHITESPACE][identifier][WHITESPACE][logical_AND_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        id                      &&                          user_t_1    .    a           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][logical_AND_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       &&                          user_t_1    .    b           ;          
////[WHITESPACE][identifier][WHITESPACE][logical_AND_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][logical_AND_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][logical_AND_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        id                      &&                          user_t_1    .    a                       &&                          id_ary      [             id          ]                          &&                          user_t_1    .    b           ;          
////[WHITESPACE][COMMENT]                         [NEWLINE]
    	        // (6.5.14) logical-OR-expression:
////[WHITESPACE][identifier][WHITESPACE][logical_OR_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        id                      ||                         user_t_1    .    a           ;          
////[WHITESPACE][identifier][dot][identifier][WHITESPACE][logical_OR_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        user_t_1    .    a                       ||                         user_t_1    .    b           ;          
////[WHITESPACE][identifier][WHITESPACE][logical_OR_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][logical_OR_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][logical_OR_op][WHITESPACE][identifier][dot][identifier][semicolon][NEWLINE]
    	        id                      ||                         user_t_1    .    a                       ||                         id_ary      [             id          ]                          ||                         user_t_1    .    b           ;          
////[WHITESPACE][COMMENT]                          [NEWLINE]
    	        // (6.5.15) conditional-expression:
////[WHITESPACE][left_paren][left_paren][identifier][dot][identifier][WHITESPACE][bitwise_OR_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][ampersand][WHITESPACE][identifier][dot][identifier][WHITESPACE][bitwise_EXOR_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][right_paren][WHITESPACE][bitwise_EXOR_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][logical_AND_op][WHITESPACE][identifier][WHITESPACE][logical_OR_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][inequal_op][WHITESPACE][identifier][right_paren][WHITESPACE][conditional_op][WHITESPACE][identifier][WHITESPACE][colon][WHITESPACE][left_paren][signed][WHITESPACE][short][right_paren][left_paren][left_paren][identifier]   [right_paren][WHITESPACE][left_brace][WHITESPACE][decimal_constant][comma][WHITESPACE][decimal_constant][comma][WHITESPACE][right_brace][right_paren][dot][identifier][WHITESPACE][plus][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][minus][WHITESPACE][left_paren][decrement_op][identifier][dot][identifier][right_paren][WHITESPACE][plus][WHITESPACE][left_paren][identifier][dot][identifier][increment_op][right_paren][semicolon][NEWLINE]
    	        (           (           user_t_1    .    a                       |                          user_t_1    .    b                       &                      user_t_1    .    b                       ^                            id_ary      [             id          ]              )                        ^                            user_t_1    .    a                       &&                          id                      ||                         user_t_1    .    a                       !=                      id          )                        ?                           id                      :                  (           signed              short  )            (           (           user_def_type_t)                        {                       3                 ,                  4                 ,                  }            )            .    a                       +                 id_ary      [             id          ]                          -                  (           --            user_t_1    .    b           )                        +                 (           user_t_1    .    b           ++            )            ;          
////[WHITESPACE][COMMENT]                         [NEWLINE]
    	        // (6.5.16) assignment-expression:
////[WHITESPACE][identifier][WHITESPACE][simple_assign_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][simple_assign_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][simple_assign_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][simple_assign_op][WHITESPACE][identifier][semicolon][NEWLINE]
    	        id                      =                             user_t_1    .    a                       =                             id_ary      [             id          ]                          =                             user_t_1    .    b                       =                             id          ;          
////[WHITESPACE][identifier][WHITESPACE][mul_assign_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][div_assign_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][remain_assign_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][add_assign_op][WHITESPACE][identifier][WHITESPACE][sub_assign_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][left_shift_assign_op][WHITESPACE][identifier][left_bracket][identifier][right_bracket][WHITESPACE][right_shift_assign_op][WHITESPACE][identifier][dot][identifier][WHITESPACE][simple_assign_op][WHITESPACE][identifier][semicolon][NEWLINE]
    	        id                      *=                         user_t_1    .    a                       /=                         id_ary      [             id          ]                          %=                            user_t_1    .    b                       +=                         id                      -=                         user_t_1    .    a                       <<=                               id_ary      [             id          ]                          >>=                                user_t_1    .    b                       =                             id          ;          
////[right_brace][NEWLINE]
    }            
////
    
