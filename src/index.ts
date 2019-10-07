import replaceSlackdownControlSequences from './controlSequences.ts';
import replaceEmoji from './emoji.ts';
import replaceSlackdown from './markdown.ts';
import { IOptions } from './types.ts';

export const escapeForSlack = (text: string, options: IOptions = {}) => {
  const customEmoji = options.customEmoji || {};
  const users = options.users || {};
  const channels = options.channels || {};
  const usergroups = options.usergroups || {};
  const markdown = options.markdown || false;

  const slackdownText = markdown ? replaceSlackdown(text || '') : text || '';
  const slackdownTextWithSequences = replaceSlackdownControlSequences(slackdownText, { channels, usergroups, users });
  return replaceEmoji(slackdownTextWithSequences, customEmoji);
};

export const escapeForSlackWithMarkdown = (text: string, options: IOptions = {}) => {
  return escapeForSlack(text, { ...options, markdown: true });
};
