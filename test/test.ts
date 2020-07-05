import lexer, { dump } from '../src/lexer';

import fs from 'fs';

let buffer: Buffer
let lex: lexer;
let text: string;

buffer = fs.readFileSync('./test/test.c');
text = buffer.toString();

lex = new lexer(text);

let finish: boolean;
finish = false;
let item;
do {
    item = lex.exec();
    console.log(dump(item));

    if (item.id == 'EOF') finish = true;
} while (!finish);

