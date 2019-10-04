export type EmojiMap = { [key: string]: string };
export type UserMap = { [key: string]: string };
export type ChannelMap = { [key: string]: string };
export type GroupMap = { [key: string]: string };

export interface IReplacedText {
  text: string;
  closedTagWindows: number[][];
}
export interface IOptions {
  channels?: ChannelMap;
  customEmoji?: EmojiMap;
  markdown?: boolean;
  usergroups?: GroupMap;
  users?: UserMap;
}

export interface IReplaceOptions {
  asymmetric?: boolean;
  endingPattern?: string;
  maxReplacements?: number;
  partitionWindowOnMatch?: boolean;
  replaceNewlines?: boolean;
  spacePadded?: boolean;
}

export interface IPatternOptions {
  spacePadded?: boolean;
}
