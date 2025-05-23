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
