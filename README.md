# Baseline

Search for web platform features and view their [Baseline](https://web.dev/baseline) browser support status directly in your editor.

https://github.com/user-attachments/assets/2658408f-1de8-4ac3-b77e-a4b9875a9d0e

## Features

- **Search** for web platform features and get their Baseline info
- **Autocomplete** support for [baseline-todo](https://github.com/rviscomi/baseline-todo) syntax
- **Autocomplete** support for [`<baseline-status featureId>`](https://github.com/web-platform-dx/baseline-status)
- **Hover** over the [baseline-todo](https://github.com/rviscomi/baseline-todo) syntax to get Baseline info at a glance
- **Validation** of feature IDs within [baseline-todo](https://github.com/rviscomi/baseline-todo) syntax

<img width="631" alt="image" src="https://github.com/user-attachments/assets/c6b9c9ba-9d66-477d-a2f7-cfbded8fc3a8" />

<img width="570" alt="image" src="https://github.com/user-attachments/assets/cea1ea5b-77e9-4083-9c2e-648b2a3b9c26" />

<img width="795" alt="image" src="https://github.com/user-attachments/assets/df5258f3-ed0d-4081-9b69-3d306d448e36" />

![image](https://github.com/user-attachments/assets/765b3404-dc2b-47c3-a89e-8076c2324622)

<img width="713" alt="image" src="https://github.com/user-attachments/assets/c5eee49f-93b1-43c3-966e-d738a7f8f0e2" />

## Usage

### Search command

Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run **Baseline search** to look up any web platform feature by name.

### baseline-todo

Add `// @baseline <featureId>` comments in your code. The extension provides autocomplete, inline Baseline status on hover, and validation of feature IDs.

### baseline-status web component

When editing HTML, autocomplete is available for the `<baseline-status featureId>` attribute.

## Supported languages

JavaScript, TypeScript, HTML, CSS, SCSS, Less, Vue, Svelte, Astro, Markdown, MDX, YAML, JSON

## License

[Apache 2.0](https://github.com/rviscomi/baseline-vscode/blob/main/LICENSE)
