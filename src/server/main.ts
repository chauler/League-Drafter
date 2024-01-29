import { Writeable } from "./Writeable.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
    AccountDataType,
    PlayerDataType,
    MatchDataType,
    MatchupRecordType,
    AccountData,
    PlayerData,
    MatchData,
    MatchupRecord,
    RoleEnum,
    RoleEnumType,
    QueueType,
    QueueIDs,
} from "./types.js";
import { z } from "zod";

export function ParseChampData(data: MatchDataType[]) {
    const userToOpponentRecords = new Map<string, Map<string, MatchupRecordType>>();
    const opponentToUserRecords = new Map<string, Map<string, MatchupRecordType>>();
    for (const match of data) {
        const user = match.user;
        const opponents = match.opponents;
        const opponent = opponents.find((player) => player.teamPosition === user.teamPosition);
        if (!opponent) {
            console.log("Invalid match data - no opponent");
            return;
        }
        if (userToOpponentRecords.has(user.championName)) {
            const records: Map<string, MatchupRecordType> = userToOpponentRecords.get(user.championName)!;
            if (records.has(opponent.championName)) {
                const record = records.get(opponent.championName)!;
                records.set(
                    opponent.championName,
                    user.win
                        ? { wins: record.wins + 1, losses: record.losses }
                        : { wins: record.wins, losses: record.losses + 1 }
                );
            } else {
                records.set(opponent.championName, { wins: user.win ? 1 : 0, losses: user.win ? 0 : 1 });
            }
        } else {
            const records = new Map<string, MatchupRecordType>();
            records.set(opponent.championName, { wins: user.win ? 1 : 0, losses: user.win ? 0 : 1 });
            userToOpponentRecords.set(user.championName, records);
        }

        if (opponentToUserRecords.has(opponent.championName)) {
            const records: Map<string, MatchupRecordType> = opponentToUserRecords.get(opponent.championName)!;
            if (records.has(user.championName)) {
                const record = records.get(user.championName)!;
                records.set(
                    user.championName,
                    user.win
                        ? { wins: record.wins + 1, losses: record.losses }
                        : { wins: record.wins, losses: record.losses + 1 }
                );
            } else {
                records.set(user.championName, { wins: user.win ? 1 : 0, losses: user.win ? 0 : 1 });
            }
        } else {
            const records = new Map<string, MatchupRecordType>();
            records.set(user.championName, { wins: user.win ? 1 : 0, losses: user.win ? 0 : 1 });
            opponentToUserRecords.set(opponent.championName, records);
        }
    }
    return { userToOpponentRecords, opponentToUserRecords };
}

export async function GetAccountFromName(name: string): Promise<AccountDataType | undefined> {
    const response = await fetch(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}`, {
        headers: {
            "X-Riot-Token": process.env.RIOT_API_KEY || "",
        },
    });
    const parseResult = AccountData.safeParse(await response.json());
    if (!parseResult.success) {
        console.log(`Error getting account info from name\n${parseResult.error.toString()}`);
        return;
    }
    return parseResult.data;
}

export async function GetMatches(
    puuid: string,
    options: { limit: number; offset: number; queueID?: QueueType } = { limit: 1, offset: 0 }
): Promise<string[] | undefined> {
    const { limit, offset, queueID } = options;
    const startTime: number = 1623844800;
    const response = await fetch(
        `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startTime}${
            queueID ? "&queue=" + queueID : ""
        }&start=${offset}&count=${limit}`,
        {
            headers: {
                "X-Riot-Token": process.env.RIOT_API_KEY || "",
            },
        }
    );
    const parseResult = z
        .string()
        .array()
        .safeParse(await response.json());
    if (!parseResult.success) {
        console.log(`Error getting matches from match IDs\n${parseResult.error}`);
        return;
    }
    return parseResult.data;
}

export async function GetMatchData(matchid: string, puuid: string): Promise<MatchDataType | number | undefined> {
    const response = await fetch(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchid}`, {
        headers: {
            "X-Riot-Token": process.env.RIOT_API_KEY || "",
        },
    });
    const responseSchema = z.object({
        info: z.object({
            queueId: z.number(),
            participants: PlayerData.extend({
                puuid: z.string(),
                teamId: z.number(),
            }).array(),
        }),
    });
    const body = await response.json();
    if (response.status == 429) {
        console.log("Rate limited");
        return response.headers.get("Retry-After") ? parseInt(response.headers.get("Retry-After")!) : undefined;
    }
    const parseResult = responseSchema.safeParse(body);
    if (!parseResult.success) {
        console.log(`Error retrieving match data\n${body?.info?.queueId}\n`);
        return;
    }
    const user = parseResult.data.info.participants.find((player) => player.puuid === puuid);
    if (!user) {
        console.log("User not found in match somehow");
        return;
    }
    const opponents = parseResult.data.info.participants.filter((player) => player.teamId !== user.teamId);

    return {
        user: PlayerData.parse(user),
        opponents: PlayerData.array().parse(opponents),
    };
}

export {};
