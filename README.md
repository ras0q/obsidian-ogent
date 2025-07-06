# Obsidian Ogent

Run LLM agents in [Obsidian].

![demo.gif](./demo.gif)

## Installation

### Using BRAT

1. **Install and Enable** the [BRAT](https://obsidian.md/plugins?id=brat) plugin
   in Obsidian
2. Go to the BRAT plugin settings
3. Add this plugin from the `Add Plugin` button

## Development

You can use [Deno] for almost everything in development!

- Runtime: **Deno**
- Formatter: **Deno**
- Linter: **Deno**
- Type Checker: **Deno**
- Bundler: **esbuild**

1. Install [Deno]
2. Run `deno task dev`, which will:
   - Clone the [sample vault] to `./vault-for-my-feature`
   - Build the plugin with live reload
3. Open the sample vault in Obsidian
4. Enable the plugin in Obsidian settings

### IDE Integration

VSCode

```json:settings.json
{
  "[css]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[json]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },$$
  "[jsonc]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[markdown]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[yaml]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "deno.enable": true,
  "deno.lint": true
}
```

## Release

1. Update the version in `manifest.json`
2. Run `deno task build`, which will:
   - Build the plugin to `./dist`
3. Commit and push the changes to GitHub
4. Run `gh release create ./dist/main.js ./dist/manifest.json ./dist/styles.css`

[Obsidian]: https://obsidian.md
[Deno]: https://deno.com
[sample vault]: https://github.com/kepano/kepano-obsidian
