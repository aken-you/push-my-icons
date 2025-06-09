export interface SVGContent {
  id: string;
  name: string;
  svgText: string;
}

export const MESSAGE_TYPES = {
  EXTRACT_ICONS: "extractIcons",
  ERROR: "error",
} as const;

interface ExtractIconsMessage {
  type: typeof MESSAGE_TYPES.EXTRACT_ICONS;
  payload: {
    nodes: {
      id: string;
      name: string;
      node: Uint8Array<ArrayBufferLike>;
    }[];
  };
}

export interface PluginToUIMessage {
  pluginMessage:
    | ExtractIconsMessage
    | {
        type: typeof MESSAGE_TYPES.ERROR;
      };
}

export type UIToPluginMessage =
  | { type: typeof MESSAGE_TYPES.EXTRACT_ICONS }
  | { type: typeof MESSAGE_TYPES.ERROR };
