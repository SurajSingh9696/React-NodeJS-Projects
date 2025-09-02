import { saveAs } from "file-saver";

// Convert Base64 to Blob
export function base64ToBlob(base64, format , filename) {
  const byteChars = atob(base64.split(",")[1]); // decode base64 string
  const byteNumbers = new Array(byteChars.length);

  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: `image/${format}` });
}

 export function downloadImage(base64, format, filename = "image") {
    console.log(format , filename);
  const blob = base64ToBlob(base64, format, filename);
  saveAs(blob, `${filename}.${format}`); // triggers browser download
}
