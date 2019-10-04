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
export const lineBreakTagLiteral = '<br>';
export const newlineRegExp = XRegExp.cache('\\n', 'nsg');
export const whitespaceRegExp = XRegExp.cache('\\s', 'ns');

export const buildOpeningDelimiterRegExp = (delimiter: string, options: IPatternOptions = {}) => {
  return XRegExp.cache(`${options.spacePadded ? '(?<openingCapturedWhitespace>^|\\s)' : ''}${delimiter}`, 'ns');
};

// We can't perform negative lookahead to capture the last consecutive delimiter
// since delimiters can be more than once character long
export const buildClosingDelimiterRegExp = (delimiter: string, options: IPatternOptions = {}) => {
  return XRegExp.cache(`${delimiter}${options.spacePadded ? '(?<closingCapturedWhitespace>\\s|$)' : ''}`, 'ns');
};
