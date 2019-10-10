import XRegExp from 'xregexp';

import {
  channelMentionPattern,
  commandPattern,
  linkPattern,
  mailToPattern,
  subteamCommandPattern,
  userMentionPattern,
} from './patterns';
import { ChannelMap, GroupMap, IControlSequenceOptions, UserMap } from './types';

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

const replaceLinks = (match: any) =>
  `<a href="${match.linkUrl}" target="_blank" rel="noopener noreferrer">${match.linkHtml || match.linkUrl}</a>`;
const replaceMailLinks = (match: any) =>
  `<a href="mailto:${match.mailTo}" target="_blank" rel="noopener noreferrer">${match.mailToName || match.mailTo}</a>`;

const knownCommands = ['here', 'channel', 'group', 'everyone'];
const replaceCommands = (match: any) => {
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
};

const replaceSlackdownControlSequences = (text: string, options: IControlSequenceOptions) => {
  return XRegExp.replaceEach(text, [
    [userMentionPattern, replaceUserName(options.users)],
    [channelMentionPattern, replaceChannelName(options.channels)],
    [linkPattern, replaceLinks],
    [mailToPattern, replaceMailLinks],
    [subteamCommandPattern, replaceUserGroupName(options.usergroups)],
    [commandPattern, replaceCommands],
  ]);
};

export default replaceSlackdownControlSequences;
