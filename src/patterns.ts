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
export const newlineRegExp = XRegExp.build('\\n', 'ng');
export const whitespaceRegExp = XRegExp.build('\\s', 'n');

const buildOpeningDelimiterRegExp = (delimiter: string, options: IPatternOptions = {}) => {
  const startPattern = '(?<=^|\\n)';
  const noAlphaNumericPadded = options.noAlphaNumericPadded ? '(?<=^|[^A-z0-9])' : '';
  const openingWhitespacePattern = options.openingWhitespace ? '(?<openingCapturedWhitespace>^|\\s*)' : '';
  return XRegExp.build(
    `${options.startAnchored ? startPattern : noAlphaNumericPadded}${delimiter}${openingWhitespacePattern}(?=\\S)`,
    'n',
  );
};

// We can't perform negative lookahead to capture the last consecutive delimiter
// since delimiters can be more than once character long
const buildClosingDelimiterRegExp = (delimiter: string, options: IPatternOptions = {}) => {
  const closingWhitespacePattern = options.closingWhitespace ? '(?<closingCapturedWhitespace>\\s*)' : '';
  const noAlphaNumericPadPattern = options.noAlphaNumericPadded ? '(?=$|[^A-z0-9])' : '';
  return XRegExp.build(`(?<=\\S)${closingWhitespacePattern}${delimiter}${noAlphaNumericPadPattern}`, 'n');
};

export const blockCodeDelimiter = '```';
export const inlineCodeDelimiter = '`';
export const boldDelimiter = '*';
export const strikethroughDelimiter = '~';
export const italicDelimiter = '_';
export const blockQuoteDelimiter = '&gt;&gt;&gt;';
export const inlineQuoteDelimiter = '&gt;';

export const blockCodeOpeningPattern = buildOpeningDelimiterRegExp(XRegExp.escape(blockCodeDelimiter), {
  openingWhitespace: true,
});

export const blockCodeClosingPattern = buildClosingDelimiterRegExp(XRegExp.escape('```'), {
  closingWhitespace: true,
});

export const inlineCodeOpeningPattern = buildOpeningDelimiterRegExp(XRegExp.escape(inlineCodeDelimiter), {
  openingWhitespace: true,
});

export const inlineCodeClosingPattern = buildClosingDelimiterRegExp(XRegExp.escape(inlineCodeDelimiter), {
  closingWhitespace: true,
});

export const boldOpeningPattern = buildOpeningDelimiterRegExp(XRegExp.escape(boldDelimiter), {
  noAlphaNumericPadded: true,
});

export const boldClosingPattern = buildClosingDelimiterRegExp(XRegExp.escape(boldDelimiter), {
  closingWhitespace: true,
  noAlphaNumericPadded: true,
});

export const strikethroughOpeningPattern = buildOpeningDelimiterRegExp(XRegExp.escape(strikethroughDelimiter), {
  noAlphaNumericPadded: true,
  openingWhitespace: true,
});

export const strikethroughClosingPattern = buildClosingDelimiterRegExp(XRegExp.escape(strikethroughDelimiter), {
  noAlphaNumericPadded: true,
});

export const italicOpeningPattern = buildOpeningDelimiterRegExp(XRegExp.escape(italicDelimiter), {
  noAlphaNumericPadded: true,
  openingWhitespace: true,
});

export const italicClosingPattern = buildClosingDelimiterRegExp(XRegExp.escape(italicDelimiter), {
  closingWhitespace: true,
  noAlphaNumericPadded: true,
});

export const blockQuoteOpeningPattern = buildOpeningDelimiterRegExp(XRegExp.escape(blockQuoteDelimiter), {
  openingWhitespace: true,
  startAnchored: true,
});

export const blockQuoteClosingPattern = XRegExp.build('$');

export const inlineQuoteOpeningPattern = buildOpeningDelimiterRegExp(XRegExp.escape(inlineQuoteDelimiter), {
  openingWhitespace: true,
  startAnchored: true,
});

export const inlineQuoteClosingPattern = XRegExp.build('\\n|$');
