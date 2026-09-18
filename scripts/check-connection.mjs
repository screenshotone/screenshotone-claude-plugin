import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const config = JSON.parse(
  await readFile(new URL("../.mcp.json", import.meta.url), "utf8")
);
const server = config.mcpServers.screenshotone;
assert.equal(server.type, "http", "ScreenshotOne requires HTTP transport");
const endpoint = new URL(server.url);
assert.equal(endpoint.protocol, "https:", "The hosted MCP endpoint requires HTTPS");

async function request(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(15_000) });
}

async function json(url) {
  const response = await request(url, {
    headers: { Accept: "application/json" },
  });
  assert.equal(response.status, 200, `Metadata request failed: ${url}`);
  return response.json();
}

try {
  const challenge = await request(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "screenshotone-plugin-connection-check", version: "0.1.0" },
      },
    }),
  });
  assert.equal(challenge.status, 401, "Unauthenticated MCP requests must require sign-in");
  const authenticate = challenge.headers.get("www-authenticate") ?? "";
  assert.match(authenticate, /^Bearer\b/i, "Expected an OAuth bearer challenge");
  const metadataMatch = authenticate.match(/resource_metadata="([^"]+)"/);
  assert.ok(metadataMatch, "The challenge must advertise protected-resource metadata");
  const metadataUrl = new URL(metadataMatch[1]);
  assert.equal(metadataUrl.origin, endpoint.origin, "Expected metadata on the MCP host");
  await challenge.body?.cancel();
  console.log("PASS: HTTP MCP endpoint returns a discoverable OAuth bearer challenge");

  const resource = await json(metadataUrl);
  assert.equal(new URL(resource.resource).href, endpoint.href, "OAuth resource must match the MCP endpoint");
  assert.ok(resource.scopes_supported?.includes("api:use"), "Expected the api:use scope");
  assert.ok(resource.authorization_servers?.length, "Expected an authorization server");
  for (const issuer of resource.authorization_servers) {
    assert.equal(new URL(issuer).protocol, "https:", "OAuth issuers must use HTTPS");
  }
  console.log("PASS: Protected-resource metadata advertises the resource, issuer, and api:use scope");

  // The hosted MCP service publishes the Dashboard authorization metadata here.
  const authorization = await json(new URL("/.well-known/oauth-authorization-server", endpoint));
  assert.ok(resource.authorization_servers.includes(authorization.issuer), "Authorization issuer must match resource discovery");
  for (const field of ["authorization_endpoint", "token_endpoint"]) {
    assert.equal(new URL(authorization[field]).protocol, "https:", `${field} must use HTTPS`);
  }
  assert.ok(authorization.response_types_supported?.includes("code"), "Expected authorization-code OAuth");
  assert.ok(authorization.code_challenge_methods_supported?.includes("S256"), "Expected PKCE S256");
  assert.ok(
    authorization.registration_endpoint || authorization.client_id_metadata_document_supported,
    "Expected dynamic client registration or client ID metadata support"
  );
  console.log("PASS: OAuth metadata supports authorization code, PKCE S256, and client onboarding");
  console.log("Connection checks passed. Account tool calls still require browser authentication in Claude Code.");
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  if (error.cause?.message) console.error(error.cause.message);
  process.exitCode = 1;
}
