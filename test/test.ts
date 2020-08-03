import lexer, { dump } from '../src/lexer';

import fs from 'fs';


import c_tokenizer from '../src/tokenizer_c';

let buffer: Buffer
let lex: lexer<c_tokenizer>;
let text: string;

buffer = fs.readFileSync('./test/test.c');
text = buffer.toString();

lex = new lexer<c_tokenizer>(c_tokenizer, text);

let finish: boolean;
finish = false;
let item;

try {
    do {
        lex.exec();
        item = lex.make_lexer_token();
        console.log(dump(item));

        if (item.id == 'EOF') finish = true;
    } while (!finish);
} catch (e) {
    console.log(e);
}

console.log("@test finish");
