# Put Twenty on GitHub

This is a clean source export of the completed birthday arcade. Extract the ZIP first. Open the inner `twenty-birthday-arcade-github` folder: `package.json`, `server.mjs`, and `dist/` should be directly inside it.

## Create your repository

1. Sign in to GitHub and create a new repository, for example `twenty-birthday-arcade`.
2. Choose public or private. Leave the README, .gitignore, and license initialization options unselected; this folder already has its own files.
3. Copy the repository's HTTPS URL.
4. Open a terminal in this extracted project folder and run these commands. Replace the example URL with your copied URL:

```sh
git init -b main
git add .
git commit -m "Add Twenty birthday arcade"
git remote add origin https://github.com/YOUR-USERNAME/twenty-birthday-arcade.git
git push -u origin main
```

Complete GitHub's sign-in prompt if it appears. Push the extracted contents using Git, rather than uploading the ZIP as a single repository file.

Official instructions: [Adding locally hosted code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github?platform=windows).

## Run the game on your computer

Install a current Node.js LTS release. No package installation or build is needed.

```sh
npm start
```

Open `http://127.0.0.1:4173` in a laptop or desktop browser at least 1,000 pixels wide. Use this local server instead of double-clicking an HTML file. Camera mode requires browser camera permission; choosing a cat photo is also supported.

Run the automated checks with:

```sh
npm test
```

## Find the editable files

| Folder or file | Contents |
| --- | --- |
| `dist/` | Complete game source and all runtime assets; keep this folder in Git |
| `dist/i18n-vi.mjs`, `dist/i18n-blocks.mjs` | Vietnamese translations with English reference comments |
| `TRANSLATIONS.md` | Guide to editing both languages |
| `scripts/music-scores.mjs` | Original music notes, chords, instruments, and rhythms |
| `scripts/render-music.mjs` | Synthesizer; rebuild tracks with `npm run music:render` |
| `dist/audio/` | Six finished game soundtracks |
| `dist/vendor/cat-check/` | Bundled local cat detector and its licenses |
| `dist/fonts/` | Bundled fonts and their licenses |
| `tests/` | Automated game and application checks |
| `README.md` | Complete game rules and implementation overview |

## Hosting and saves

Creating a GitHub repository stores your source. Website hosting is a separate step. This export contains no old Git history, remote configuration, account credentials, or Sites project binding. Your current hosted game is unaffected.

Player progress stays in each browser's local storage and is not part of the source export. Uploading or downloading this repository does not copy anyone's save. A website at a new address has separate progress; this project does not include cloud save synchronization.

Keep the bundled third-party license files with their assets. This export does not choose a new license for your own project.
