import { z } from "zod";

export const RoleEnum = z.enum(["UTILITY", "TOP", "JUNGLE", "MIDDLE", "BOTTOM"]);
export type RoleEnumType = z.infer<typeof RoleEnum>;

export const QueueIDs = [400, 420, 440] as const;
export type QueueType = (typeof QueueIDs)[number];

export const AccountData = z.object({
    puuid: z.string(),
    gameName: z.string(),
    tagLine: z.string(),
});
export type AccountDataType = z.infer<typeof AccountData>;

export const PlayerData = z.object({
    championName: z.string(),
    riotIdGameName: z.string().optional(),
    teamPosition: RoleEnum,
    win: z.boolean(),
});
export type PlayerDataType = z.infer<typeof PlayerData>;

export const MatchData = z.object({
    user: PlayerData,
    opponents: PlayerData.array(),
});
export type MatchDataType = z.infer<typeof MatchData>;

export const MatchupRecord = z.object({
    wins: z.number(),
    losses: z.number(),
});
export type MatchupRecordType = z.infer<typeof MatchupRecord>;
