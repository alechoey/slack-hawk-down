import XRegExp from 'xregexp';

import emoji from './emoji.js';
import { ChannelMap, EmojiMap, GroupMap, IOptions, UserMap } from './types.ts';
import replaceSlackdown from './markdown.ts';

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
        .map((emojiCode: string) => `&#x${emojiCode}`)
        .join('');
    }
    return originalKey;
  });
};

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

export const escapeForSlack = (text: string, options: IOptions = {}) => {
  const customEmoji = options.customEmoji || {};
  const users = options.users || {};
  const channels = options.channels || {};
  const usergroups = options.usergroups || {};
  const markdown = options.markdown || false;

  const expandedText = markdown ? replaceSlackdown(text || '') : text || '';
  return expandEmoji(
    XRegExp.replaceEach(expandedText, [
      [userMentionRegExp, replaceUserName(users)],
      [channelMentionRegExp, replaceChannelName(channels)],
      [
        linkRegExp,
        (match: any) =>
          `<a href="${match.linkUrl}" target="_blank" rel="noopener noreferrer">${match.linkHtml || match.linkUrl}</a>`,
      ],
      [
        mailToRegExp,
        (match: any) =>
          `<a href="mailto:${match.mailTo}" target="_blank" rel="noopener noreferrer">${match.mailToName ||
            match.mailTo}</a>`,
      ],
      [subteamCommandRegExp, replaceUserGroupName(usergroups)],
      [
        commandRegExp,
        (match: any) => {
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
