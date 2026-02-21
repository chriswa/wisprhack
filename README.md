# wispr-proxy

Intercepts Wispr Flow's "command mode" voice commands locally instead of sending them to Wispr's cloud API. Everything else (normal dictation, auth, sync) forwards to the real API transparently.

## How it works

Wispr Flow supports a `BASE_WEB_URL` env var that redirects all API calls to a custom host. This proxy listens on `localhost:61990`, intercepts the `POST /llm/command_mode_route` endpoint (command mode), and forwards everything else to `https://api.wisprflow.ai`.

When you use the Lens shortcut (Fn+Ctrl) and speak a command, the transcribed text prints to the proxy's stdout instead of being sent to Wispr's AI backend.

## Setup

Requires [Bun](https://bun.sh).

```bash
# If you don't have bun:
curl -fsSL https://bun.sh/install | bash
```

## Usage

```bash
# Start the proxy
bun run ~/wispr/wispr-proxy.ts

# Set the env var so Wispr Flow routes API calls through the proxy
launchctl setenv BASE_WEB_URL http://localhost:61990
```

Then quit and reopen Wispr Flow normally (dock, Spotlight, etc). Do **not** launch the binary directly from Terminal — macOS will attribute microphone access to Terminal instead of Wispr Flow.

Use the Lens shortcut (Fn+Ctrl), speak a command, and watch the transcribed text appear in the proxy terminal.

Normal dictation (push-to-talk) works as usual — those API calls pass through to the real server.

**Note:** If the `BASE_WEB_URL` env var is set but the proxy isn't running, normal dictation still seems to work but command mode will show "servers are busy". Just start the proxy or `launchctl unsetenv BASE_WEB_URL` and restart Wispr.

## Teardown

```bash
launchctl unsetenv BASE_WEB_URL
```

Then quit and reopen Wispr Flow to restore normal behavior.

## Customizing

Edit `wispr-proxy.ts` to do something with the intercepted command. The request body has:

```ts
{
  instruction: string;    // the transcribed voice command
  selected_text: string;  // text selected in the active app
  full_text: string;      // full textbox contents
}
```

The response shape controls what Wispr does next:

```ts
// Paste text into the active app
{ name: "draft_text", arguments: "text to paste" }

// Do nothing (current default)
{ name: "draft_text", arguments: "" }
```

For example, you could shell out to a script, call an LLM API, or do anything else — just return the response shape above.
