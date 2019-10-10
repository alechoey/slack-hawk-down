# Changelog

## 0.5.3
- Fix markdown issues where certain delimiters would not wrap others

## 0.5.1
- Use browserify for building
- Fixes broken bundle imports

## 0.5.0
- Add typescript function definitions
- Various markdown behavior changes
  - **Bold**, _italic_, ~strikethrough~ will not apply for when adjacent to an alphanumeric character
  - Inline  and block quotes now must occur at the beginning of a line or message
  - **Bold** cannot occur with a leading whitespace
  - ~Strikethroughs~ cannot occur with an ending whitespace
- Update most package dependencies
