import { Octokit } from "@octokit/core";
import { SVGNode } from "../../types";

// 레포의 기본 브랜치 정보 가져오기
export const getBaseBranch = async ({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<string> => {
  const { data } = await octokit.request(`GET /repos/${owner}/${repo}`, {
    owner,
    repo,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  return data.default_branch;
};

// 기본 브랜치에서 최신 커밋 SHA 가져오기
export const getLatestCommitSha = async ({
  baseBranch,
  octokit,
  owner,
  repo,
}: {
  baseBranch: string;
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<string> => {
  const ref = `heads/${baseBranch}`;

  const { data } = await octokit.request(
    `GET /repos/${owner}/${repo}/git/ref/${ref}`,
    {
      owner,
      repo,
      ref,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return data.object.sha;
};

// 새로운 브랜치 생성
export const createBranchName = async ({
  octokit,
  owner,
  repo,
  latestCommitSha,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  latestCommitSha: string;
}) => {
  const branchName = `figma-icon-update-${Date.now()}`;

  await octokit.request(`POST /repos/${owner}/${repo}/git/refs`, {
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: latestCommitSha,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  return branchName;
};

export const uploadSvgNodes = async ({
  octokit,
  owner,
  repo,
  folderPath,
  svgNodes,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  folderPath: string;
  svgNodes: SVGNode[];
}): Promise<{ path: string; mode: "100644"; type: "blob"; sha: string }[]> => {
  return Promise.all(
    svgNodes.map(async (node) => {
      const { data } = await octokit.request(
        `POST /repos/${owner}/${repo}/git/blobs`,
        {
          owner,
          repo,
          content: node.svgText,
          encoding: "utf-8",
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      return {
        path: `${folderPath}/${node.name}.svg`,
        mode: "100644",
        type: "blob",
        sha: data.sha,
      };
    })
  );
};

// 새 트리 생성
export const createNewTree = async ({
  octokit,
  owner,
  repo,
  baseTreeSha,
  tree,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  baseTreeSha: string;
  tree: { path: string; mode: "100644"; type: "blob"; sha: string }[];
}) => {
  const { data } = await octokit.request(
    `POST /repos/${owner}/${repo}/git/trees`,
    {
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return data.sha;
};

// 새 커밋 생성
export const createNewCommit = async ({
  octokit,
  owner,
  repo,
  treeSha,
  parentSha,
  branchName,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  treeSha: string;
  parentSha: string;
  branchName: string;
}) => {
  const { data: newCommit } = await octokit.request(
    `POST /repos/${owner}/${repo}/git/commits`,
    {
      owner,
      repo,
      message: "Update icons from Figma",
      parents: [parentSha],
      tree: treeSha,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  const ref = `heads/${branchName}`;

  await octokit.request(`PATCH /repos/${owner}/${repo}/git/refs/${ref}`, {
    owner,
    repo,
    ref,
    sha: newCommit.sha,
    force: true,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
};

// 풀퀘 생성
export const createPullRequest = async ({
  octokit,
  owner,
  repo,
  branchName,
  baseBranch,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  branchName: string;
  baseBranch: string;
}) => {
  const { data } = await octokit.request(`POST /repos/${owner}/${repo}/pulls`, {
    owner,
    repo,
    title: "Update icons from Figma",
    body: "This PR was created by the Figma plugin to update icons.",
    head: branchName,
    base: baseBranch,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  return data.html_url;
};
