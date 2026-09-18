# Local validation and testing

## Automated checks

From this plugin directory:

```bash
claude plugin validate . --strict
claude plugin validate skills --strict
claude --plugin-dir . plugin details screenshotone
node scripts/check-connection.mjs
```

The connection check exercises public OAuth discovery and an unauthenticated MCP initialization request. It verifies the authentication boundary without consuming rendering quota. It does not prove that sign-in or authenticated tools work.

## Authenticated Claude Code check

```bash
claude --plugin-dir .
```

1. Confirm `/screenshotone:screenshot` appears among the available skills.
2. Open `/mcp` and confirm the plugin's ScreenshotOne server is listed.
3. Authenticate through the browser and approve ScreenshotOne access.
4. Ask "Check my ScreenshotOne quota." Confirm `get-usage` returns account data.
5. Ask "Take a screenshot of https://example.com." Confirm `render-website-screenshot` returns a working image URL.
6. Ask "Extract the Markdown from https://example.com." Confirm `extract-website-markdown` returns page text.
7. Optionally test full-page slices and screenshot-associated Markdown. Confirm the returned slice and content links work.

Steps 5–7 use rendering quota. Do not claim an authenticated pass based solely on metadata checks, plugin loading, or simulated responses.

## Recorded results

Tested on 2026-09-18 with Claude Code **2.1.276** (updated from 2.1.32) and Node.js **24.19.0**. Node was run using the available bundled runtime because `node` was absent from the shell's PATH.

| Check | Result |
| --- | --- |
| Plugin manifest validation with `--strict` | Passed, no warnings |
| Skill validation with `--strict` | Passed, no warnings |
| `plugin details screenshotone` with `--plugin-dir` | Loaded version 0.1.0, one `screenshot` skill, and one `screenshotone` MCP server |
| Connection-check JavaScript syntax | Passed |
| Live unauthenticated MCP initialization | Returned HTTP 401 with a discoverable OAuth bearer challenge |
| Live protected-resource metadata | Correct MCP resource, authorization issuer, and `api:use` scope |
| Live authorization metadata | Authorization-code flow, HTTPS endpoints, PKCE S256, and client onboarding support |
| Claude Code plugin MCP connection after browser sign-in | Passed: `mcp get plugin:screenshotone:screenshotone` reported `Connected` for the correct HTTP endpoint |
| Authenticated `get-usage` | Passed: returned quota and concurrency data |
| Authenticated `render-website-screenshot` | Passed for `https://example.com` with full-page, slices, image quality 80, and Markdown metadata enabled |
| Screenshot and slice artifacts | Passed: both links returned HTTP 200, valid JPEGs, and 1920×1080 dimensions; screenshot visually inspected and showed the expected Example Domain page |
| Screenshot-associated Markdown | Passed: the temporary content link returned HTTP 200 and contained the expected page text and IANA link |
| Authenticated `extract-website-markdown` | Passed: returned the expected Example Domain Markdown inline |
| Rendering quota accounting | Passed: the screenshot render and standalone Markdown extraction consumed two requests in total |
| Claude Code agent invocation of the skill | Not tested: this shell has no Anthropic model login; plugin loading and the authenticated MCP connection were tested separately |

The CLI connection check was run from a separate temporary working directory to exercise the plugin's bundled configuration independently of a project `.mcp.json`:

```bash
claude --plugin-dir /absolute/path/to/screenshotone-claude-plugin \
  --setting-sources '' mcp get plugin:screenshotone:screenshotone
```

## Client coverage

The authenticated Claude Code MCP connection was checked through the real CLI with the plugin loaded via `--plugin-dir`. This confirms that the saved ScreenshotOne OAuth connection initializes successfully.

The live quota, rendering, and extraction calls were made through the authenticated ScreenshotOne MCP connector available in Codex. These were real service calls and returned real artifacts; they were not mocked. They validate the hosted tools separately from Claude Code's connection. Full-page slicing was exercised on a short page that produced one slice.

The checks above passed. A Claude Code agent prompt using `/screenshotone:screenshot` remains a manual check; no Anthropic model request was made from this shell. No directory submission has been made by this task.
