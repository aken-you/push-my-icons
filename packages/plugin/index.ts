import { getSvgNodes } from "./utils";

// Figma 플러그인의 UI 사이즈 설정
figma.showUI(__html__, { width: 400, height: 600 });

const extractSvgNodes = async () => {
  const selectedFrames = figma.currentPage.selection;

  const isSelectedFrames =
    selectedFrames.length > 0 &&
    selectedFrames.every((frame) => frame.type === "FRAME");

  if (!isSelectedFrames) {
    figma.notify("Select frames which contains SVG nodes", {
      error: true,
    });
    figma.ui.postMessage({
      type: "error",
    });
    return;
  }

  const svgNodes = selectedFrames.flatMap((frame) => getSvgNodes(frame));

  if (svgNodes.length === 0) {
    figma.notify("No SVG nodes found in the selected frame", {
      error: true,
    });
    figma.ui.postMessage({
      type: "error",
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

interface ExtractIconsMessage {
  type: "extractIcons";
}

interface ErrorMessage {
  type: "error";
}

type MessageType = ExtractIconsMessage | ErrorMessage;

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
