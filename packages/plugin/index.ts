import { Octokit } from "@octokit/rest";
import {
  createBranchName,
  createNewCommit,
  createNewTree,
  createPullRequest,
  getBaseBranch,
  getLatestCommitSha,
  getSvgNodes,
  uploadSvgNodes,
} from "./utils";

// Figma 플러그인의 UI 사이즈 설정
figma.showUI(__html__, { width: 400, height: 600 });

// UI로부터 메세지를 받아 처리
figma.ui.onmessage = async (msg) => {
  if (msg.type === "createPullRequest") {
    const { token, owner, repo, folderPath } = msg;

    const octokit = new Octokit({ auth: token });

    try {
      // 1. 레포의 기본 브랜치 정보 가져오기
      const baseBranch = await getBaseBranch({ octokit, owner, repo });

      // 2. 기본 브랜치에서 최신 커밋 SHA 가져오기
      const latestCommitSha = await getLatestCommitSha({
        baseBranch,
        octokit,
        owner,
        repo,
      });

      // 3. 새로운 브랜치 생성
      const branchName = await createBranchName({
        octokit,
        owner,
        repo,
        latestCommitSha,
      });

      // 4. Figma에서 선택된 Frame 내 SVG 노드 추출
      const selectedFrames = figma.currentPage.selection;

      if (selectedFrames.length === 0 || selectedFrames[0].type !== "FRAME") {
        figma.ui.postMessage({
          type: "error",
          message: "select a frame which contains SVG nodes",
        });
        return;
      }

      const selectedFrame = selectedFrames[0];

      const svgNodes = getSvgNodes(selectedFrame);

      if (svgNodes.length === 0) {
        figma.ui.postMessage({
          type: "error",
          message: "no SVG nodes found in the selected frame",
        });
        return;
      }

      // 5. SVG 노드를 .svg 파일로 export하고 GitHub Blob으로 업로드
      const svgBlobs: {
        path: string;
        mode: "100644";
        type: "blob";
        sha: string;
      }[] = await uploadSvgNodes({
        octokit,
        owner,
        repo,
        folderPath,
        svgNodes,
      });

      // 6. 기존 트리를 기반으로 새 트리 생성
      const newTree = await createNewTree({
        octokit,
        owner,
        repo,
        baseTreeSha: latestCommitSha,
        tree: svgBlobs,
      });

      // 7. 커밋 생성
      await createNewCommit({
        octokit,
        owner,
        repo,
        message: "Update icons from Figma plugin",
        treeSha: newTree.sha,
        parentSha: latestCommitSha,
        branchName,
      });

      // 8. PR 생성
      const pullRequest = await createPullRequest({
        octokit,
        owner,
        repo,
        branchName,
        baseBranch,
      });

      // 9. 성공 메시지 전달
      figma.ui.postMessage({
        type: "success",
        url: pullRequest.html_url,
      });
    } catch (error: unknown) {
      figma.ui.postMessage({
        type: "error",
        message: "error occurred while creating pull request",
      });
    }
  }
};
