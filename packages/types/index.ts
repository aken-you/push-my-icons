export interface SVGNode {
  id: string;
  name: string;
  svgText: string;
}

interface ExtractIconsMessage {
  type: "extractIcons";
  payload: {
    nodes: {
      id: string;
      name: string;
      node: Uint8Array<ArrayBufferLike>;
    }[];
  };
}

interface ErrorMessage {
  type: "error";
}

export interface UIMessageType {
  pluginMessage: ExtractIconsMessage | ErrorMessage;
}
