import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function downloadImagesAsZip(base64Images , filename) {
  const zip = new JSZip();

  // Loop through all base64 images
  base64Images.forEach((base64, index) => {
    // Remove prefix (data:image/png;base64,....)
    const base64Data = base64.split(",")[1];

    // Add to zip as a binary file
    zip.file(`image_${index + 1}.png`, base64Data, { base64: true });
  });

  // Generate the zip file
  const content = await zip.generateAsync({ type: "blob" });

  // Trigger download
  saveAs(content, `${filename}.zip`);
}

