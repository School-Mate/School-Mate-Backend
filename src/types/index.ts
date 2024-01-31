export enum WebhookType {
  VerifyRequest = 0,
  VerifyAccept = 1,
  VerifyReject = 2,
  ReportCreate = 3,
  ReportComplete = 4,
  BoardRequest = 5,
  BoardComplete = 6,
  ArticleDelete = 7,
}

export interface LeagueOfLegendsStats {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}
