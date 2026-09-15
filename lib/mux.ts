import Mux from "@mux/mux-node";

let client: Mux | undefined;
export function getMux() {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) throw new Error("尚未配置 Mux");
  return client ??= new Mux(process.env.MUX_TOKEN_ID, process.env.MUX_TOKEN_SECRET);
}
