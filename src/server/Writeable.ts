import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

export function Writeable(filepath: string, options: { append: boolean } = { append: false }) {
    //const __filename = fileURLToPath(import.meta.url);
    const rootdir = path.dirname(__filename).replace(`${path.sep}dist`, "");
    filepath = `${rootdir}${path.sep}${filepath}`;
    if (!options.append && fs.existsSync(filepath)) fs.unlinkSync(filepath);
    const stream = fs.createWriteStream(filepath, { flags: "a" });
    return function pipe(data: string) {
        return new Promise((res, rej) => {
            stream.write(data, (error) => {
                error ? rej("error writing") : res("Success");
            });
        });
    };
}
