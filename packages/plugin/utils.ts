import { Octokit } from "@octokit/rest";

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
  const { data } = await octokit.rest.repos.get({ owner, repo });

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
  const {
    data: {
      object: { sha: latestCommitSha },
    },
  } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });

  return latestCommitSha;
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

  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: latestCommitSha,
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
  svgNodes: SceneNode[];
}): Promise<{ path: string; mode: "100644"; type: "blob"; sha: string }[]> => {
  return Promise.all(
    svgNodes.map(async (node) => {
      const svgBytes = await node.exportAsync({ format: "SVG" });
      const svgText = new TextDecoder().decode(svgBytes);

      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: svgText,
        encoding: "utf-8",
      });

      return {
        path: `${folderPath}/${node.name}.svg`,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
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
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree,
  });

  return newTree;
};

// 새 커밋 생성
export const createNewCommit = async ({
  octokit,
  owner,
  repo,
  message,
  treeSha,
  parentSha,
  branchName,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  message: string;
  treeSha: string;
  parentSha: string;
  branchName: string;
}) => {
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: treeSha,
    parents: [parentSha],
  });

  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branchName}`,
    sha: newCommit.sha,
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
  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: "Update icons from Figma",
    head: branchName,
    base: baseBranch,
    body: "This PR was created by the Figma plugin to update icons.",
  });

  return data;
};

// 주어진 노드 내부에 export 가능한 벡터(VectorNode)가 하나라도 존재하는지 확인
const containsVector = (node: SceneNode): boolean => {
  if ("children" in node) {
    return node.children.some((child) => {
      if (child.type === "VECTOR") return true;
      return containsVector(child);
    });
  }

  return false;
};

// 프레임 하위 노드 중 내부에 SVG export 가능한 벡터를 포함한 노드만 필터링
export const getSvgNodes = (frame: FrameNode): SceneNode[] => {
  const svgNodes = [];

  for (const child of frame.children) {
    if (containsVector(child)) {
      svgNodes.push(child); // 벡터를 포함하는 최상위 노드
    }
  }

  return svgNodes;
};
