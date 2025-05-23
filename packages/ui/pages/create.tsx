import { useEffect, useState } from "react";
import { SVGNode, UIMessageType } from "../../types";
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
} from "../utils/github";
import { useNavigate } from "react-router-dom";

export const Create = () => {
  const [token, setToken] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [folderPath, setFolderPath] = useState("");

  const navigate = useNavigate();

  const handlePush = async () => {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/);

    if (!match) {
      alert("repository URL is invalid.");
      return;
    }

    // 1. 버튼 클릭
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
    // 2. Figma에서 SVG 노드 추출
    window.onmessage = async (event: MessageEvent<UIMessageType>) => {
      const { type, payload } = event.data.pluginMessage;

      if (type === "extractIcons") {
        const { nodes } = payload;

        const decoder = new TextDecoder("utf-8");
        const svgNodes: SVGNode[] = nodes.map((node) => ({
          id: node.id,
          name: node.name,
          svgText: decoder.decode(node.node),
        }));

        const octokit = new Octokit({
          auth: token,
        });

        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/);

        if (!match) {
          alert("repository URL is invalid.");
          return;
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
          const deletedPaths = previousPaths.filter(
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
            ...deletedPaths.map((path) => ({
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

          const prUrl = await createPullRequest({
            octokit,
            owner,
            repo,
            branchName: newBranchName,
            baseBranch,
          });

          navigate("/result", {
            state: {
              prUrl,
            },
          });
        } catch (error) {
          if (error instanceof Error) {
            console.error("Error: " + error.message);
          }
        }
      }
    };
  }, [repoUrl, token, folderPath]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create Pull Request</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">GitHub Token</label>
        <input
          type="password"
          className="w-full border px-2 py-1 rounded"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">GitHub Repo URL</label>
        <input
          type="text"
          className="w-full border px-2 py-1 rounded"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/your_name/your_repo"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">SVG Folder Path</label>
        <input
          type="text"
          className="w-full border px-2 py-1 rounded"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="src/icons"
        />
      </div>

      <button
        onClick={handlePush}
        disabled={!token || !repoUrl || !folderPath}
        className="w-full bg-blue-600 text-white py-2 rounded enabled:hover:bg-blue-700 disabled:opacity-15"
      >
        Push
      </button>
    </div>
  );
};
