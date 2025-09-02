import { jsPDF } from "jspdf";


export function generatePDF(base64Images, {
    filename = "images",
    orientation = "p",
    format = "a4",
    margin = 10
} = {}) {
    if (!Array.isArray(base64Images) || base64Images.length === 0) {
        console.error("No images provided!");
        return;
    }

    const pdf = new jsPDF({ orientation, format });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    base64Images.forEach((img, index) => {
        if (index > 0) pdf.addPage();

        const imgProps = pdf.getImageProperties(img);

        const availableWidth = pageWidth - 2 * margin;
        const availableHeight = pageHeight - 2 * margin;

        const ratio = Math.min(
            availableWidth / imgProps.width,
            availableHeight / imgProps.height
        );

        const imgWidth = imgProps.width * ratio;
        const imgHeight = imgProps.height * ratio;

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(img, imgProps.fileType || "JPEG", x, y, imgWidth, imgHeight);
    });

    // Save once after adding all images
    pdf.save(`${filename}`);
}


export function generatePdf(files , {orientation, format, margin, filename }){
    const readers = [];

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        readers.push(
          new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file); // ❌ this is being called for each file inside the loop
          })
        );
      });

      Promise.all(readers).then((base64Images) => {
        generatePDF(base64Images, { orientation, format, margin, filename  });
      });
}
