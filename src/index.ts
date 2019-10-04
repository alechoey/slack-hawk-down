import XRegExp from 'xregexp';
import emoji from './emoji';

type EmojiMap = { [key: string]: string };
type UserMap = { [key: string]: string };
type ChannelMap = { [key: string]: string };
type GroupMap = { [key: string]: string };

interface IReplacedText {
  text: string;
  closedTagWindows: number[][];
}
interface IOptions {
  channels?: ChannelMap;
  customEmoji?: EmojiMap;
  markdown?: boolean;
  usergroups?: GroupMap;
  users?: UserMap;
}

interface IReplaceOptions {
  asymmetric?: boolean;
  endingPattern?: string;
  maxReplacements?: number;
  partitionWindowOnMatch?: boolean;
  replaceNewlines?: boolean;
  spacePadded?: boolean;
}

interface IPatternOptions {
  spacePadded?: boolean;
}

const expandEmoji = (text: string, customEmoji: EmojiMap) => {
  const allEmoji: EmojiMap = { ...emoji, ...customEmoji };
  return text.replace(/:([^\s, :]+):/g, (_match, originalKey) => {
    const aliasPattern = /alias:(\S+)/;
    let key = originalKey;
    let emojiValue;

    for (;;) {
      emojiValue = allEmoji[key];
      if (!emojiValue || !emojiValue.match(aliasPattern)) {
        break;
      }
      key = emojiValue.replace(aliasPattern, '$1');
    }

    if (key && emojiValue) {
      if (emojiValue.match(/https?:\/\/\S+/)) {
        return `<img alt="${originalKey}" src="${emojiValue}" class="slack_emoji" />`;
      }
      return emojiValue
        .split('-')
        .map((emojiCode) => `&#x${emojiCode}`)
        .join('');
    }
    return originalKey;
  });
};

const closingDivPatternString = '</div>';
const closingSpanPatternString = '</span>';
const codeDivOpeningPatternString = '<div class="slack_code">';
const codeSpanOpeningPatternString = '<span class="slack_code">';
const boldOpeningPatternString = '<span class="slack_bold">';
const strikethroughOpeningPatternString = '<span class="slack_strikethrough">';
const italicOpeningPatternString = '<span class="slack_italics">';
const blockDivOpeningPatternString = '<div class="slack_block">';
const blockSpanOpeningPatternString = '<span class="slack_block">';
const lineBreakTagLiteral = '<br>';
const newlineRegExp = XRegExp.cache('\\n', 'nsg');
const whitespaceRegExp = XRegExp.cache('\\s', 'ns');

// https://api.slack.com/docs/message-formatting
const userMentionRegExp = XRegExp.cache(
  '<@(((?<userID>U[^|>]+)(\\|(?<userName>[^>]+))?)|(?<userNameWithoutID>[^>]+))>',
  'ng',
);
const channelMentionRegExp = XRegExp.cache(
  '<#(((?<channelID>C[^|>]+)(\\|(?<channelName>[^>]+))?)|(?<channelNameWithoutID>[^>]+))>',
  'ng',
);
const linkRegExp = XRegExp.cache('<(?<linkUrl>https?:[^|>]+)(\\|(?<linkHtml>[^>]+))?>', 'ng');
const mailToRegExp = XRegExp.cache('<mailto:(?<mailTo>[^|>]+)(\\|(?<mailToName>[^>]+))?>', 'ng');
const subteamCommandRegExp = XRegExp.cache('<!subteam\\^(?<subteamID>S[^|>]+)(\\|(?<subteamName>[^>]+))?>', 'ng');
const commandRegExp = XRegExp.cache('<!(?<commandLiteral>[^|>]+)(\\|(?<commandName>[^>]+))?>', 'ng');
const knownCommands = ['here', 'channel', 'group', 'everyone'];

const escapeTags = (text: string) => ['&lt;', text.substring(1, text.length - 1), '&gt;'].join('');

const replaceUserName = (users: UserMap) => (match: any) => {
  const userName = match.userName || match.userNameWithoutID || (match.userID && users && users[match.userID]);
  if (userName) {
    return `@${userName}`;
  }
  return escapeTags(match.toString());
};

const replaceChannelName = (channels: ChannelMap) => (match: any) => {
  const channelName =
    match.channelName || match.channelNameWithoutID || (match.channelID && channels && channels[match.channelID]);
  if (channelName) {
    return `#${channelName}`;
  }
  return escapeTags(match.toString());
};

const replaceUserGroupName = (usergroups: GroupMap) => (match: any) => {
  const userGroupName = match.subteamName || (match.subteamID && usergroups && usergroups[match.subteamID]);
  if (userGroupName) {
    return `${userGroupName}`;
  }
  return escapeTags(match.toString());
};

const buildOpeningDelimiterRegExp = (delimiter: string, options: IPatternOptions = {}) => {
  return XRegExp.cache(`${options.spacePadded ? '(?<openingCapturedWhitespace>^|\\s)' : ''}${delimiter}`, 'ns');
};

// We can't perform negative lookahead to capture the last consecutive delimiter
// since delimiters can be more than once character long
const buildClosingDelimiterRegExp = (delimiter: string, options: IPatternOptions = {}) => {
  return XRegExp.cache(`${delimiter}${options.spacePadded ? '(?<closingCapturedWhitespace>\\s|$)' : ''}`, 'ns');
};

const incrementWindows = (windows: number[][], offset: number) => {
  windows.map((tagWindow) => {
    const window = tagWindow;
    window[0] += offset;
    window[1] += offset;
    return window;
  });
  return windows;
};

const replaceInWindows = (
  text: string,
  delimiterLiteral: string,
  replacementOpeningLiteral: string,
  replacementClosingLiteral: string,
  closedTagWindows: number[][],
  options: IReplaceOptions = {},
  tagWindowIndex: number = 0,
  tagWindowOffset: number = 0,
): IReplacedText => {
  const { asymmetric, endingPattern, partitionWindowOnMatch, replaceNewlines, spacePadded } = options;
  let maxReplacements = options.maxReplacements || Infinity;

  const openingDelimiterRegExp = buildOpeningDelimiterRegExp(delimiterLiteral, { spacePadded });
  const closingDelimiterRegExp =
    asymmetric && endingPattern
      ? buildClosingDelimiterRegExp(endingPattern)
      : buildClosingDelimiterRegExp(delimiterLiteral, { spacePadded });

  if (tagWindowIndex >= closedTagWindows.length || (maxReplacements && maxReplacements <= 0)) {
    return {
      text,
      closedTagWindows,
    };
  }

  const currentClosedTagWindow = closedTagWindows[tagWindowIndex];
  const tagWindowStartIndex = currentClosedTagWindow[0];
  const tagWindowEndIndex = currentClosedTagWindow[1];
  if (tagWindowStartIndex >= tagWindowEndIndex || tagWindowStartIndex + tagWindowOffset > tagWindowEndIndex) {
    return replaceInWindows(
      text,
      delimiterLiteral,
      replacementOpeningLiteral,
      replacementClosingLiteral,
      closedTagWindows,
      options,
      tagWindowIndex + 1,
    );
  }

  const openingMatch = XRegExp.exec(text, openingDelimiterRegExp, tagWindowStartIndex + tagWindowOffset);

  if (openingMatch && openingMatch.index < tagWindowEndIndex) {
    const closingDelimiterLength = asymmetric ? 0 : delimiterLiteral.length;
    // Allow matching the end of the string if on the last window
    const closingMatchMaxIndex =
      (tagWindowIndex === closedTagWindows.length - 1 && tagWindowEndIndex === text.length
        ? tagWindowEndIndex + 1
        : tagWindowEndIndex) -
      closingDelimiterLength +
      1;

    // Look ahead at the next index to greedily capture as much inside the delimiters as possible
    let closingMatch = XRegExp.exec(text, closingDelimiterRegExp, openingMatch.index + delimiterLiteral.length);
    let nextClosingMatch = closingMatch && XRegExp.exec(text, closingDelimiterRegExp, closingMatch.index + 1);
    while (nextClosingMatch) {
      // If the next match is still in the window and there is not whitespace in between the two, use the later one
      const nextWhitespace = XRegExp.exec(text, whitespaceRegExp, closingMatch.index + delimiterLiteral.length);
      const crossedWhitespace = nextWhitespace && nextWhitespace.index < closingMatchMaxIndex;
      if (nextClosingMatch.index >= closingMatchMaxIndex || crossedWhitespace) {
        break;
      }
      closingMatch = nextClosingMatch;
      nextClosingMatch = XRegExp.exec(text, closingDelimiterRegExp, closingMatch.index + 1);
    }

    if (closingMatch && closingMatch.index < closingMatchMaxIndex) {
      const afterDelimitersIndex = closingMatch.index + closingMatch[0].length;
      const textBeforeDelimiter = text.slice(0, openingMatch.index);
      const textAfterDelimiter = text.slice(afterDelimitersIndex);

      const openingReplacementString = `${
        spacePadded ? openingMatch.openingCapturedWhitespace : ''
      }${replacementOpeningLiteral}`;
      const closingReplacementString = `${replacementClosingLiteral}${
        spacePadded ? closingMatch.closingCapturedWhitespace : ''
      }${asymmetric ? closingMatch[0] : ''}`;

      const textBetweenDelimiters = text.slice(openingMatch.index + openingMatch[0].length, closingMatch.index);
      const replacedTextBetweenDelimiters = replaceNewlines
        ? XRegExp.replace(textBetweenDelimiters, newlineRegExp, lineBreakTagLiteral)
        : textBetweenDelimiters;

      const replacedDelimiterText = [
        openingReplacementString,
        replacedTextBetweenDelimiters,
        closingReplacementString,
      ].join('');

      const delimiterReplacementLength = delimiterLiteral.length + closingDelimiterLength;
      const windowOffset =
        replacementOpeningLiteral.length +
        replacementClosingLiteral.length -
        delimiterReplacementLength +
        replacedTextBetweenDelimiters.length -
        textBetweenDelimiters.length;
      const newUpperWindowLimit = tagWindowEndIndex + windowOffset;

      const nextWindowIndex = partitionWindowOnMatch ? tagWindowIndex + 1 : tagWindowIndex;
      const nextTagWindowOffset = partitionWindowOnMatch
        ? 0
        : afterDelimitersIndex + windowOffset - tagWindowStartIndex + 1;
      if (partitionWindowOnMatch) {
        // Split the current window into two by the occurrence of the delimiter pair
        currentClosedTagWindow[1] = openingMatch.index;
        closedTagWindows.splice(nextWindowIndex, 0, [
          closingMatch.index + closingDelimiterLength + windowOffset,
          newUpperWindowLimit,
        ]);
      } else {
        currentClosedTagWindow[1] = newUpperWindowLimit;
      }
      incrementWindows(closedTagWindows.slice(nextWindowIndex + 1), windowOffset);
      maxReplacements -= 1;

      return replaceInWindows(
        [textBeforeDelimiter, replacedDelimiterText, textAfterDelimiter].join(''),
        delimiterLiteral,
        replacementOpeningLiteral,
        replacementClosingLiteral,
        closedTagWindows,
        { maxReplacements, ...options },
        nextWindowIndex,
        nextTagWindowOffset,
      );
    }
  }

  return replaceInWindows(
    text,
    delimiterLiteral,
    replacementOpeningLiteral,
    replacementClosingLiteral,
    closedTagWindows,
    options,
    tagWindowIndex + 1,
  );
};

const expandText = (text: string) => {
  let expandedTextAndWindows: IReplacedText = { text, closedTagWindows: [[0, text.length]] };
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '```',
    codeDivOpeningPatternString,
    closingDivPatternString,
    expandedTextAndWindows.closedTagWindows,
    { partitionWindowOnMatch: true, replaceNewlines: true },
  );
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '`',
    codeSpanOpeningPatternString,
    closingSpanPatternString,
    expandedTextAndWindows.closedTagWindows,
    { partitionWindowOnMatch: true },
  );
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    XRegExp.escape('*'),
    boldOpeningPatternString,
    closingSpanPatternString,
    expandedTextAndWindows.closedTagWindows,
    { maxReplacements: 100 },
  );
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '~',
    strikethroughOpeningPatternString,
    closingSpanPatternString,
    expandedTextAndWindows.closedTagWindows,
    { maxReplacements: 100 },
  );
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '_',
    italicOpeningPatternString,
    closingSpanPatternString,
    expandedTextAndWindows.closedTagWindows,
    { spacePadded: true, maxReplacements: 100 },
  );
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '&gt;&gt;&gt;',
    blockDivOpeningPatternString,
    closingDivPatternString,
    expandedTextAndWindows.closedTagWindows,
    {
      asymmetric: true,
      endingPattern: '$',
      replaceNewlines: true,
      maxReplacements: 100,
    },
  );
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '&gt;',
    blockSpanOpeningPatternString,
    closingSpanPatternString,
    expandedTextAndWindows.closedTagWindows,
    { asymmetric: true, endingPattern: '\\n|$', maxReplacements: 100 },
  );

  return expandedTextAndWindows.text;
};

export const escapeForSlack = (text: string, options: IOptions = {}) => {
  const customEmoji = options.customEmoji || {};
  const users = options.users || {};
  const channels = options.channels || {};
  const usergroups = options.usergroups || {};
  const markdown = options.markdown || false;

  const expandedText = markdown ? expandText(text || '') : text || '';
  return expandEmoji(
    XRegExp.replaceEach(expandedText, [
      [userMentionRegExp, replaceUserName(users)],
      [channelMentionRegExp, replaceChannelName(channels)],
      [
        linkRegExp,
        (match) =>
          `<a href="${match.linkUrl}" target="_blank" rel="noopener noreferrer">${match.linkHtml || match.linkUrl}</a>`,
      ],
      [
        mailToRegExp,
        (match) =>
          `<a href="mailto:${match.mailTo}" target="_blank" rel="noopener noreferrer">${match.mailToName ||
            match.mailTo}</a>`,
      ],
      [subteamCommandRegExp, replaceUserGroupName(usergroups)],
      [
        commandRegExp,
        (match) => {
          if (match.commandLiteral && match.commandLiteral.startsWith('subteam')) {
            return match.toString();
          }
          if (knownCommands.includes(match.commandLiteral)) {
            return `@${match.commandLiteral}`;
          }
          if (match.commandName) {
            return `<${match.commandName}>`;
          }
          return `<${match.commandLiteral}>`;
        },
      ],
    ]),
    customEmoji,
  );
};

export const escapeForSlackWithMarkdown = (text: string, options = {}) => {
  return escapeForSlack(text, { ...options, markdown: true });
};
