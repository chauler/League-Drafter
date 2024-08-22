import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { GetAccountFromName, GetMatchData, GetMatches } from "./main.js";
import { MatchDataType } from "./types.js";

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static("public"));
app.use(express.raw());

app.get("/", (req, res) => {
    res.sendFile(path.resolve("src/client/index.html"));
});

app.get("/user", async (req, res) => {
    const username = req.query.gameName?.toString();
    const tag = req.query.tagLine?.toString();
    if (!username || !tag) {
        res.sendStatus(404);
        return;
    }
    const existingMatches: MatchDataType[] = [];
    const accountData = await GetAccountFromName(username);
    if (!accountData) return;
    const matchList = await GetMatches(accountData.puuid, {
        limit: 5,
        offset: existingMatches.length,
    });
    if (!matchList) {
        res.sendStatus(404);
        return;
    }
    for (let i = 0; i < matchList.length; i++) {
        const data = await GetMatchData(matchList[i], accountData.puuid);
        if (typeof data === "number") {
            console.log("rate limited");
            break;
        } else if (!data) continue;
        existingMatches.push(data);
    }
    res.send(`<pre> ${JSON.stringify(existingMatches, null, 2)}</pre>`);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
function delay(arg0: number) {
    throw new Error("Function not implemented.");
}
