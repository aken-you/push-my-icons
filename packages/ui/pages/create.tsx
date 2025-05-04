import { useState } from "react";

export const Create = () => {
  const [token, setToken] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [folderPath, setFolderPath] = useState("");

  const handlePush = async () => {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/);

    if (!match) {
      alert("repository URL is invalid.");
      return;
    }

    const [_, owner, repo] = match;

    try {
      parent.postMessage(
        {
          pluginMessage: {
            type: "createPullRequest",
            token,
            owner,
            repo,
            folderPath,
          },
        },
        "*"
      );
    } catch (error) {
      console.error("Error sending message to plugin:", error);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
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
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Push
      </button>
    </div>
  );
};
