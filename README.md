# ScreenshotOne for Claude Code

Capture website screenshots, extract clean Markdown, and check your ScreenshotOne usage from Claude Code. This plugin connects to the [ScreenshotOne hosted MCP server](https://screenshotone.com/docs/mcp/) through browser-based OAuth sign-in.

You need Claude Code and a [ScreenshotOne account](https://dash.screenshotone.com) with available quota. Screenshot and Markdown renders use your organization's quota and plan limits; see [pricing](https://screenshotone.com/pricing/).

## Run locally

From the directory containing this plugin:

```bash
claude plugin validate ./screenshotone-claude-plugin --strict
claude --plugin-dir ./screenshotone-claude-plugin
```

Or, from inside the plugin directory:

```bash
claude plugin validate . --strict
claude --plugin-dir .
```

The `--plugin-dir` flag loads the plugin for that session without installing it globally.

1. Run `/mcp` and select the ScreenshotOne plugin server (`plugin:screenshotone:screenshotone`).
2. Choose **Authenticate**, sign in to ScreenshotOne in your browser, and approve the connection.
3. Return to Claude Code and ask: "Check my ScreenshotOne quota."
4. Try: "Take a screenshot of https://example.com and show me the result."

No local MCP server, npm package, or manually configured API key is required. Avoid adding a second ScreenshotOne MCP connection if you use this plugin.

## Tools and skill

| Tool | What it does |
| --- | --- |
| `render-website-screenshot` | Returns a temporary JPEG URL; supports full-page captures, vertical slices, and an optional HTML or Markdown content URL |
| `extract-website-markdown` | Accepts a URL and returns cleaned page Markdown directly |
| `get-usage` | Returns the connected organization's quota and concurrency usage; takes no arguments |

Claude can use the bundled [ScreenshotOne skill](skills/screenshot/SKILL.md) automatically, or you can invoke it explicitly:

```text
/screenshotone:screenshot Capture https://example.com as a full-page screenshot with vertical slices and Markdown content.
```

Other examples:

- "Check my ScreenshotOne quota."
- "Extract the Markdown from https://example.com and summarize the page."
- "Capture https://example.com with ads and cookie banners preserved."

This plugin exposes the hosted MCP server's three tools. Additional [ScreenshotOne API features](https://screenshotone.com/docs/), such as PDF/video output and custom viewport sizes, are available through the API and SDKs.

## Connection checks

With Node.js 18 or later, run this from the plugin directory:

```bash
node scripts/check-connection.mjs
```

This checks the configured endpoint, OAuth discovery, PKCE support, and the unauthenticated MCP bearer challenge. It does not sign in, call account tools, or consume rendering quota. See [TESTING.md](TESTING.md) for the authenticated test checklist and recorded results.

## Results and account access

Screenshot and slice URLs are temporary. Screenshot URLs are available for [up to four hours](https://screenshotone.com/docs/screenshot-url/); content URLs include an expiration timestamp. Download results you need to keep.

ScreenshotOne renders publicly reachable HTTP and HTTPS URLs. It cannot access your laptop's `localhost` or reuse your browser's signed-in session.

Requests send the URL and supported options to ScreenshotOne. Sign-in and consent happen in ScreenshotOne Dashboard, and Claude Code manages OAuth tokens. Manage or revoke connections under **Integrations → Connect MCP clients** in the [Dashboard](https://dash.screenshotone.com). See the [privacy policy](https://screenshotone.com/privacy-policy/) and [terms of service](https://screenshotone.com/terms-of-service/).

For authentication issues, open `/mcp` and reauthenticate the ScreenshotOne plugin server. For connection or rendering issues, contact [support@screenshotone.com](mailto:support@screenshotone.com).

## Publishing

The plugin source repository is [screenshotone/screenshotone-claude-plugin](https://github.com/screenshotone/screenshotone-claude-plugin). It contains the wrapper and skill; the hosted MCP backend is maintained separately. This plugin has not been submitted to a directory. After completing validation and testing, submit the public repository link through [Claude Console](https://platform.claude.com/plugins/submit).

Plugin source is licensed under [MIT](LICENSE).
