# skills-library

The skills I use day to day, in one repo. Paste the repo link into a skill importer and all of them install together.

## Install

With the cross-agent skills CLI (works with Claude Code, Codex, Cursor and more):

```bash
npx skills add MrCrystal2/skills-library
```

Or in Claude Code as a plugin:

```
/plugin marketplace add MrCrystal2/skills-library
/plugin install skills-library@skills-library
```

## Skills

| Skill | What it does |
| --- | --- |
| apple-design | Apple's interface design and motion ideas, translated for the web. |
| untangle-codebase | Untangles a whole codebase in one pass so agents read less per change. |
| qr-code | Generates QR codes from a URL or text. |
| guided-learning | Teaches step by step instead of handing over ready answers. |
| humanizer | Removes signs of AI writing from text. Vendored from [blader/humanizer](https://github.com/blader/humanizer). |
| quickupdate | Small change pipeline: implement, test, ship. |
| security-audit | Security review guidance for codebases, APIs and services. |
| web-design-guidelines | Reviews UI code against web interface guidelines. |
| fetch-video | Downloads video from a link with yt-dlp. |

## Skills that live elsewhere

Two skills have their own repositories:

- [brainstormer](https://github.com/auditmos/brainstormer)
- [writes](https://github.com/auditmos/writes)

## Development

After changing anything under `skills/`, run:

```bash
npm test
```

The validator checks that every skill folder has a correct SKILL.md, no junk files sneak in, and both manifests stay consistent.

## License

MIT. The humanizer skill is MIT, Copyright Siqi Chen; its license file ships inside `skills/humanizer`.
