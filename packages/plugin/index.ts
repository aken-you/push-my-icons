import { getSvgNodes } from "./utils";

// Figma 플러그인의 UI 사이즈 설정
figma.showUI(__html__, { width: 400, height: 600 });

const extractSvgNodes = async () => {
  const selectedFrames = figma.currentPage.selection;

  if (
    selectedFrames.length === 0 ||
    !selectedFrames.every((frame) => frame.type === "FRAME")
  ) {
    figma.notify("select frames which contains SVG nodes", {
      error: true,
    });
    return;
  }

  const svgNodes = selectedFrames.flatMap((frame) => getSvgNodes(frame));

  if (svgNodes.length === 0) {
    figma.notify("no SVG nodes found in the selected frame", {
      error: true,
    });
    return;
  }

  const svgNodesData = await Promise.all(
    svgNodes.map(async (node) => {
      // node가 svg 형태로 export한 결과
      const svg = await node.exportAsync({ format: "SVG" });
      return { id: node.id, name: node.name, node: svg };
    })
  );

  return svgNodesData;
};

interface ExtractIcons {
  type: "extractIcons";
}

type MessageType = ExtractIcons;

// UI로부터 메세지를 받아 처리
figma.ui.onmessage = async (msg: MessageType) => {
  if (msg.type === "extractIcons") {
    const svgNodes = await extractSvgNodes();

    if (!svgNodes) return;

    figma.ui.postMessage({
      type: "extractIcons",
      payload: {
        nodes: svgNodes,
      },
    });
  }
};
