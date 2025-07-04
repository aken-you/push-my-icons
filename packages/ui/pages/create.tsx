import { useEffect, useState } from "react";
import { SVGContent, PluginToUIMessage } from "../../types";
import { Octokit } from "@octokit/core";
import {
  createBranchName,
  createNewCommit,
  createNewTree,
  createPullRequest,
  getBaseBranch,
  getLatestCommitSha,
  getTree,
  createBlobs,
  getBranchFileDiffs,
  generatePullRequestBody,
} from "../utils/github";
import { useNavigate, useLocation } from "react-router-dom";

const LOADING_MESSAGE = {
  1: "Extracting SVG nodes from Figma...",
  2: "Creating a new branch...",
  3: "Creating SVG files...",
  4: "Creating a pull request...",
} as const;

type LoadingStep = keyof typeof LOADING_MESSAGE;

export const Create = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(location.state?.token || "");
  const [repoUrl, setRepoUrl] = useState(location.state?.repoUrl || "");
  const [folderPath, setFolderPath] = useState(
    location.state?.folderPath || ""
  );
  const [prTitle, setPrTitle] = useState(
    location.state?.prTitle || "Update icons from Figma"
  );
  const [prBody, setPrBody] = useState(
    location.state?.prBody ||
      "This PR was created by the Figma plugin to update icons."
  );
  const [includeChangedFilesSummary, setIncludeChangedFilesSummary] = useState(
    location.state?.includeChangedFilesSummary ?? true
  );

  const [loadingStep, setLoadingStep] = useState<LoadingStep | 0>(0);

  const handlePush = async () => {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/);

    if (!match) {
      alert("repository URL is invalid.");
      return;
    }

    setLoadingStep(1);

    parent.postMessage(
      {
        pluginMessage: {
          type: "extractIcons",
        },
      },
      "*"
    );
  };

  useEffect(() => {
    window.onmessage = async (event: MessageEvent<PluginToUIMessage>) => {
      const { type } = event.data.pluginMessage;

      if (type === "extractIcons") {
        const { payload } = event.data.pluginMessage;
        const { nodes } = payload;

        const decoder = new TextDecoder("utf-8");
        const svgNodes: SVGContent[] = nodes.map((node) => ({
          id: node.id,
          name: node.name,
          svgText: decoder.decode(node.node),
        }));

        setLoadingStep(2);

        const octokit = new Octokit({
          auth: token,
        });

        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/);

        if (!match) {
          throw new Error("repository URL is invalid.");
        }

        const owner = match[1];
        const repo = match[2];

        try {
          const baseBranch = await getBaseBranch({
            octokit,
            owner,
            repo,
          });

          const latestCommitSha = await getLatestCommitSha({
            baseBranch,
            octokit,
            owner,
            repo,
          });

          const newBranchName = await createBranchName({
            octokit,
            owner,
            repo,
            latestCommitSha,
          });

          setLoadingStep(3);

          const createdBlobs = await createBlobs({
            octokit,
            owner,
            repo,
            folderPath,
            svgNodes,
          });

          const previousTree = await getTree({
            octokit,
            owner,
            repo,
            treeSha: latestCommitSha,
          }).then((data) =>
            data.filter(
              (file) =>
                file.path.startsWith(folderPath + "/") &&
                file.path.endsWith(".svg")
            )
          );

          const createdPaths = createdBlobs.map((file) => file.path);
          const previousPaths = previousTree.map((file) => file.path);
          const removedPaths = previousPaths.filter(
            (path) =>
              previousPaths.includes(path) && !createdPaths.includes(path)
          );

          const newTree = [
            ...createdBlobs.map((file) => ({
              path: file.path,
              mode: "100644",
              type: "blob",
              sha: file.sha,
            })),
            ...removedPaths.map((path) => ({
              path,
              mode: "100644",
              type: "blob",
              sha: null,
            })),
          ];

          const treeSha = await createNewTree({
            octokit,
            owner,
            repo,
            baseTreeSha: latestCommitSha,
            tree: newTree,
          });

          await createNewCommit({
            octokit,
            owner,
            repo,
            treeSha,
            parentSha: latestCommitSha,
            branchName: newBranchName,
          });

          const { addedFiles, modifiedFiles, removedFiles } =
            await getBranchFileDiffs({
              octokit,
              owner,
              repo,
              baseBranch,
              branchName: newBranchName,
            });

          const isChanged = !(
            addedFiles.length === 0 &&
            modifiedFiles.length === 0 &&
            removedFiles.length === 0
          );

          if (!isChanged) {
            throw new Error("No changes detected. Please check the SVG files.");
            return;
          }

          setLoadingStep(4);

          const prUrl = await createPullRequest({
            octokit,
            owner,
            repo,
            branchName: newBranchName,
            baseBranch,
            title: prTitle,
            body: includeChangedFilesSummary
              ? prBody +
                "\n" +
                generatePullRequestBody({
                  added: addedFiles,
                  modified: modifiedFiles,
                  removed: removedFiles,
                })
              : prBody,
          });

          navigate("/result", {
            state: {
              prUrl,
              token,
              repoUrl,
              folderPath,
              prTitle,
              prBody,
              includeChangedFilesSummary,
            },
          });
        } catch (error) {
          if (error instanceof Error) {
            alert(error.message);
          }
          setLoadingStep(0);
        }
      }
      if (type === "error") {
        setLoadingStep(0);
      }
    };
  }, [repoUrl, token, folderPath, prTitle, prBody, includeChangedFilesSummary]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Push SVG Icons to GitHub</h1>

      {loadingStep !== 0 ? (
        <div className="space-y-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(loadingStep / 4) * 100}%` }}
            ></div>
          </div>
          <p className="text-center text-gray-600">
            {LOADING_MESSAGE[loadingStep as keyof typeof LOADING_MESSAGE]}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-sm text-blue-700">
              Select all frames that contain SVG icon components in Figma before
              pushing.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              GitHub Personal Access Token
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="password"
              className="w-full border px-2 py-1 rounded"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Your GitHub Personal Access Token with repository permissions.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              GitHub Repository URL
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              className="w-full border px-2 py-1 rounded"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/your_name/your_repository"
            />
            <p className="text-xs text-gray-500">
              GitHub repository URL where you want to store the SVG icons.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              SVG Folder Path
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              className="w-full border px-2 py-1 rounded"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="src/icons"
            />
            <p className="text-xs text-gray-500">
              The path where SVG files will be stored in the repository
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Pull Request Title
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              className="w-full border px-2 py-1 rounded"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              A title for the pull request that will be created.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Pull Request Body
            </label>
            <textarea
              className="w-full border px-2 py-1 rounded"
              value={prBody}
              onChange={(e) => setPrBody(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              A description for the pull request.
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeChangedFilesSummary}
                onChange={(e) =>
                  setIncludeChangedFilesSummary(e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Include changed files list in PR body
              </span>
            </label>
            <p className="text-xs text-gray-500">
              If checked, the list of added, modified, and removed files will be
              automatically added to the PR body.
            </p>
          </div>

          <button
            onClick={handlePush}
            disabled={!token || !repoUrl || !folderPath || !prTitle}
            className="w-full bg-blue-600 text-white py-2 rounded enabled:hover:bg-blue-700 disabled:opacity-15"
          >
            Push
          </button>
        </>
      )}
    </div>
  );
};
