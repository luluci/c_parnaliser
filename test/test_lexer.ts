
import fs from 'fs';
import lexer from '../src/lexer';
import { tokenizer_c, token_id, token_sub_id } from '../src/tokenizer_c';

function dump(lex: lexer<tokenizer_c, token_id, token_sub_id>): string {
    let result: string;

    result = "";
    result += "(";
    result += ("00000" + lex.row).slice(-5);
    result += ",";
    result += ("00000" + lex.col).slice(-5);
    result += ")";
    result += "[";
    result += lex.id.toString();
    if (lex.sub_id != 'null') result += `(${lex.sub_id.toString()})`;
    result += "]";
    result += "=\"";
    result += lex.token;
    result += "\"";

    return result;
}

function lexer_test(file_path: string) {
    let finish: boolean;
    finish = false;
    // ファイルを開く
    let buffer: Buffer
    let text: string;
    buffer = fs.readFileSync(file_path);
    text = buffer.toString();
    // lexer作成
    let lex: lexer<tokenizer_c, token_id, token_sub_id>;
    lex = new lexer<tokenizer_c, token_id, token_sub_id>(tokenizer_c, text);

    try {
        do {
            lex.exec();
            console.log(dump(lex));

            if (lex.id == 'EOF') finish = true;
        } while (!finish);
    } catch (e) {
        console.log(e);
    }
}



lexer_test('./test/test_lexer_1.c');

console.log("@test finish");
