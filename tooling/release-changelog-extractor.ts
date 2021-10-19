import * as fs from 'fs';

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

const startIndex = changelog.indexOf('### [');
const endIndex = changelog.indexOf('### [', startIndex + 1);

const changelogLatestRelease = changelog.slice(startIndex, endIndex);

fs.writeFileSync('CHANGELOG-latest.md', changelogLatestRelease);
