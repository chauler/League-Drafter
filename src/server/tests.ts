import path from "path";
import { fileURLToPath } from "url";
import { MatchData, MatchDataType, QueueType } from "./types.js";
import * as fs from "fs";
import { Writeable } from "./Writeable.js";
import { GetAccountFromName, GetMatchData, GetMatches, ParseChampData } from "./main.js";
import { z } from "zod";

const inputFile = "input.json";
const outputFile = "output.txt";

const __filename = fileURLToPath(import.meta.url);
const rootdir = path.dirname(__filename).replace(`${path.sep}dist`, "");
const inputJSON = MatchData.array().safeParse(
    (() => {
        try {
            const data = JSON.parse(fs.readFileSync(`${rootdir}${path.sep}${inputFile}`).toString());
            return data;
            // Do something with the JSON data
        } catch (err) {
            return [];
        }
    })()
);

TestFromFile(inputFile, outputFile);
//TestToFile(inputFile);

export async function TestFromFile(readfile: string, writefile: string) {
    const __filename = fileURLToPath(import.meta.url);
    const rootdir = path.dirname(__filename).replace(`${path.sep}dist`, "");
    const filepath = `${rootdir}${path.sep}${readfile}`;
    const data = fs.readFileSync(filepath).toString();
    const WriteToStream = Writeable(writefile);

    const matchdataResult = MatchData.array().safeParse(JSON.parse(data));
    if (!matchdataResult.success) {
        console.log("Invalid JSON");
        return;
    }

    const records = ParseChampData(matchdataResult.data);
    if (!records) return;
    if (!records.userToOpponentRecords) return;

    for (const champ of records.userToOpponentRecords.keys()) {
        await WriteToStream(champ + "\n");
        if (!records.userToOpponentRecords.has(champ)) continue;
        for (const enemychamp of records.userToOpponentRecords.get(champ)!.keys()) {
            const record = records.userToOpponentRecords.get(champ)?.get(enemychamp);
            if (!record) continue;
            await WriteToStream(
                `\t${enemychamp}: ${record.wins}-${record.losses}: ${
                    record.wins == 0 && record.losses == 0
                        ? 0
                        : record.wins == 0
                        ? 0
                        : record.losses == 0
                        ? 100
                        : ((record.wins / (record.wins + record.losses)) * 100).toFixed(2)
                }%\n`
            );
        }
        await WriteToStream("\n");
    }
    WriteToStream("\n\n\n");
    for (const champ of records.opponentToUserRecords.keys()) {
        await WriteToStream(champ + "\n");
        if (!records.opponentToUserRecords.has(champ)) continue;
        for (const enemychamp of records.opponentToUserRecords.get(champ)!.keys()) {
            const record = records.opponentToUserRecords.get(champ)?.get(enemychamp);
            if (!record) continue;
            await WriteToStream(
                `\t${enemychamp}: ${record.wins}-${record.losses}: ${
                    record.wins == 0 && record.losses == 0
                        ? 0
                        : record.wins == 0
                        ? 0
                        : record.losses == 0
                        ? 100
                        : ((record.wins / (record.wins + record.losses)) * 100).toFixed(2)
                }%\n`
            );
        }
        await WriteToStream("\n");
    }
}

export async function TestToFile(file: string) {
    const existingMatches = inputJSON.success ? inputJSON.data : [];
    const accountData = await GetAccountFromName("Chauler");
    if (!accountData) return;
    const matchList = await GetMatches(accountData.puuid, {
        limit: 100,
        offset: existingMatches.length,
    });
    if (!matchList) return;
    const WriteToStream = Writeable(file);
    for (let i = 0; i < matchList.length; i++) {
        const data = await GetMatchData(matchList[i], accountData.puuid);
        if (typeof data === "number") {
            console.log(data);
            await delay(data * 1000);
            i--;
            continue;
        } else if (!data) continue;
        existingMatches.push(data);
    }
    await WriteToStream(`${JSON.stringify(existingMatches, null, 2)}\n`);
}

function delay(milliseconds: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}
