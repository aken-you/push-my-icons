## Push My Icons

Push your Figma SVG icons to GitHub with ease.

## This plugin helps you:

- Automatically extract SVG nodes
- Upload them to your GitHub repository
- Generate a pull request with added/updated/removed icons

## How to Use

### 1. Open the plugin and fill in the following fields:

- GitHub personal access token
- GitHub repository URL
- Target folder path in the repo (e.g., src/icons)
- Pull request title and description

<img src="images/how-to-use-1.png" alt="step-1" width="300" />

#### Github personal access token

When creating a **Classic** PAT, enable `repo` scope.

<img src="images/how-to-use-1-classic-pat.png" alt="step-1" width="500" />

When creating a **Fine-grained** PAT, scroll down to the Repository permissions section and set the following:

- Contents: Read and write
- Metadata: Read-only
- Pull requests: Read and write

<img src="images/how-to-use-1-fg-pat.png" alt="step-1" width="500" />

#### Include changed files list in PR body

If this option checked, the list of added, modified, and removed files will be automatically added to the PR body.

<img src="images/how-to-use-1-checkbox.png" alt="step-1" width="500" />
<img src="images/how-to-use-1-pr-body.png" alt="step-1" width="500" />

### 2. Select all frames that contain your SVG icon components.

Each selected frame should be a top-level container for one or more SVGs.

<img src="images/how-to-use-2.png" alt="step-2" width="500" />

### 3. Click "Push" button.

<img src="images/how-to-use-3.png" alt="step-3" width="300" />

### 4. Success

<img src="images/how-to-use-4.png" alt="step-4" width="300" />
