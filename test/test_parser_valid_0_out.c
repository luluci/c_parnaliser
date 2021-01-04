////[left_paren][string_literal][right_paren][semicolon][NEWLINE]
    (           "hoge"          )            ;          
////[WHITESPACE][left_paren][left_paren][string_literal][right_paren][right_paren][semicolon][NEWLINE]
                (           (           "fuga"          )            )            ;          
////[left_paren][int][right_paren][left_paren][identifier][right_paren][semicolon][NEWLINE]
    (           int  )            (           hoge        )            ;          
////[NEWLINE]
    
////[string_literal][left_bracket][octal_constant][right_bracket][WHITESPACE][left_bracket][octal_constant][right_bracket][semicolon][NEWLINE]
    "fuga"          [             0               ]                          [             0               ]              ;          
////[string_literal][left_bracket][decimal_constant][right_bracket][semicolon][NEWLINE]
    "hoga"          [             1                 ]              ;          
////[identifier][left_bracket][decimal_constant][right_bracket][semicolon][NEWLINE]
    array       [             2                 ]              ;          
////[increment_op][WHITESPACE][decrement_op][WHITESPACE][identifier][WHITESPACE][increment_op][WHITESPACE][decrement_op][WHITESPACE][left_bracket][octal_constant][right_bracket][WHITESPACE][increment_op][WHITESPACE][decrement_op][semicolon][NEWLINE]
    ++                        --                        var                     ++                        --                        [             0               ]                          ++                        --            ;          
////[EOF]
    
