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

Normal dictation (push-to-talk) works as usual — speech-to-text uses a separate gRPC connection that isn't affected by the proxy.

### Example

```
$ bun run ~/wispr/wispr-proxy.ts
wispr-proxy listening on http://localhost:61990
forwarding to https://api.wisprflow.ai
intercepting POST /llm/command_mode_route

[2026-02-21T16:17:43.761Z] COMMAND MODE
  instruction: I'm holding function and control right now. The indicator on the bottom of my screen is orange.
  full_text: ￼Skip to content￼￼￼chriswa￼wisprhackType / to search￼￼￼￼￼￼￼￼￼￼Repository navigationCodeIssuesPull requestsActionsProjectsWikiSecurityInsightsSettings￼￼￼wisprhackPublic￼Fork 0￼ Star 0￼￼chriswa/wisprhac
```

The `instruction` field is exactly what was spoken. The `full_text` field comes from whatever application was focused — in this case Chrome on a GitHub repo page.

**Note:** If the `BASE_WEB_URL` env var is set but the proxy isn't running, speech-to-text transcription still works (it uses a separate gRPC connection), but everything that goes through the REST API will break:

- AI text formatting/cleanup of transcriptions
- Command mode (shows "servers are busy")
- Polish feature
- History upload, notes sync, preference saving
- Subscription checks

The proxy should probably be running whenever Wispr is running if you have the env var set. Otherwise, `launchctl unsetenv BASE_WEB_URL` and restart Wispr.

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

## Acknowledgements

Thanks to Kaleigh for the idea behind this project.
