import JSZip from "jszip";
import type { TemplateFile } from "@/core/template";

export async function createZipBuffer(files: TemplateFile[]): Promise<Uint8Array> {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.path, file.contents);
  });

  return zip.generateAsync({ type: "uint8array" });
}
