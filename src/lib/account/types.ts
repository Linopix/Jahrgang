export type Account = { id: string; name: string };

export type BoardRange = "day" | "week" | "all";

export type BoardRow = {
  accountId: string;
  name: string;
  games: number;
  wins: number;
  points: number;
  heard: number;
  placedOk: number;
  hit: number;
  rank: number;
};

export type AccountStats = {
  games: number;
  wins: number;
  points: number;
  heard: number;
  placedOk: number;
  hit: number;
  rank: { day: number | null; week: number | null; all: number | null };
};
