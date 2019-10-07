export type EmojiMap = { [key: string]: string };
export type UserMap = { [key: string]: string };
export type ChannelMap = { [key: string]: string };
export type GroupMap = { [key: string]: string };

export interface IReplacedText {
  text: string;
  windows: number[][];
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
  disableNestedReplacement?: boolean;
  greedy?: boolean;
  maxReplacements?: number;
  noAlphaNumericPadded?: boolean;
  replaceNewlines?: boolean;
}

export interface IPatternOptions {
  allowCharacterPad?: boolean;
  closingWhitespace?: boolean;
  noQuotePad?: boolean;
  openingWhitespace?: boolean;
  startAnchored?: boolean;
}

export interface IControlSequenceOptions {
  channels: ChannelMap;
  usergroups: GroupMap;
  users: UserMap;
}
