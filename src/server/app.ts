import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { GetAccountFromName, GetMatchData, GetMatches } from "./main.js";
const app = express();
const port = process.env.port || 3000;
app.use(express.static("public"));
app.use(express.raw());

app.get("/", (req, res) => {
    res.sendFile(path.resolve("src/client/index.html"));
});

app.get("/user", async (req, res) => {
    console.log("hit1");
    const username = req.query.username?.toString();
    if (!username) {
        res.sendStatus(404);
        return;
    }
    const existingMatches = [];
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
    console.log("hit");
    for (let i = 0; i < matchList.length; i++) {
        const data = await GetMatchData(matchList[i], accountData.puuid);
        if (typeof data === "number") {
            console.log("rate limited");
            break;
            //console.log(data);
            // await delay(data * 1000);
            // i--;
            // continue;
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
