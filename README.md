# Google Document Revisions

## Resources
http://features.jsomers.net/how-i-reverse-engineered-google-docs/

## Observations
Newline will result in "↵" being inserted as a character in the revision data followed by an "as" operation adding a paragraph. To maintain the indexes and data, the ↵ (or /\n) will need to be added as a DOM paragraph instead. If we add the newline character we will add to the local document index count and thus become out of sync with the revision indexes.

For every paragraph (as:paragraph) in the revision data, Google Document renders the line with an additional span-tag containing a `&nbsp;` character. This additional space is kept at the end of all lines at all times. 
