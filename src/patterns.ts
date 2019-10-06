import XRegExp from 'xregexp';
import { IPatternOptions } from './types.ts';

export const closingDivPatternString = '</div>';
export const closingSpanPatternString = '</span>';
export const codeDivOpeningPatternString = '<div class="slack_code">';
export const codeSpanOpeningPatternString = '<span class="slack_code">';
export const boldOpeningPatternString = '<span class="slack_bold">';
export const strikethroughOpeningPatternString = '<span class="slack_strikethrough">';
export const italicOpeningPatternString = '<span class="slack_italics">';
export const blockDivOpeningPatternString = '<div class="slack_block">';
export const blockSpanOpeningPatternString = '<span class="slack_block">';
export const lineBreakTagLiteral = '<br />';
export const newlineRegExp = XRegExp.cache('\\n', 'nsg');
export const whitespaceRegExp = XRegExp.cache('\\s', 'ns');

export const buildOpeningDelimiterRegExp = (delimiter: string, options: IPatternOptions = {}) => {
  const noAlphaNumericPadPattern = options.noAlphaNumericPadded ? '(?<=^|[^A-z0-9])' : '';
  const openingWhitespacePattern = options.openingWhitespace ? '(?<openingCapturedWhitespace>^|\\s)?' : '';
  return XRegExp.cache(`${noAlphaNumericPadPattern}${delimiter}${openingWhitespacePattern}(?=\\S)`, 'ns');
};

// We can't perform negative lookahead to capture the last consecutive delimiter
// since delimiters can be more than once character long
export const buildClosingDelimiterRegExp = (delimiter: string, options: IPatternOptions = {}) => {
  const closingWhitespacePattern = options.closingWhitespace ? '(?<closingCapturedWhitespace>\\s|$)?' : '';
  const noAlphaNumericPadPattern = options.noAlphaNumericPadded ? '(?=$|[^A-z0-9])' : '';
  return XRegExp.cache(`(?<=\\S)${closingWhitespacePattern}${delimiter}${noAlphaNumericPadPattern}`, 'ns');
};
