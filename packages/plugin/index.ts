import { getSvgNodes } from "./utils";

// Figma 플러그인의 UI 사이즈 설정
figma.showUI(__html__, { width: 400, height: 600 });

const extractSvgNodes = () => {
  const selectedFrames = figma.currentPage.selection;
  const selectedFrame = selectedFrames[0];

  const isSelectedFrame =
    selectedFrames.length > 0 && selectedFrame.type === "FRAME";

  if (!isSelectedFrame) {
    figma.ui.postMessage({
      type: "error",
      message: "select a frame which contains SVG nodes",
    });
    return;
  }

  const svgNodes = getSvgNodes(selectedFrame);

  if (svgNodes.length === 0) {
    figma.ui.postMessage({
      type: "error",
      message: "no SVG nodes found in the selected frame",
    });
    return;
  }

  return svgNodes;
};

interface ExtractIcons {
  type: "extractIcons";
}

type MessageType = ExtractIcons;

// UI로부터 메세지를 받아 처리
figma.ui.onmessage = async (msg: MessageType) => {
  if (msg.type === "extractIcons") {
    const svgNodes = extractSvgNodes();

    if (!svgNodes) return;
  }
};
