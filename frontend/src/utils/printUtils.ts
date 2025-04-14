import headerImage from "/General/print-header.png";
import { ExportData } from "./exportUtils";

export const handlePrint = async (data: ExportData) => {
  try {
    if (!data) {
      throw new Error("Failed to fetch study material data");
    }

    // Create an invisible iframe for printing
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.width = "0px";
    printFrame.style.height = "0px";
    printFrame.style.border = "none";
    document.body.appendChild(printFrame);

    const printDocument =
      printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!printDocument) throw new Error("Failed to access print document");

    // Write the document content
    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Print - ${data.title}</title>
          <style>
            @media print {
              @page { margin: 0; size: auto; }
              body { margin: 0; padding: 0; font-family: helvetica; }
              .page-container { width: 100%; min-height: 100vh; }
              .header-container { position: relative; width: 100%; }
              .header-image { width: 100%; max-height: 120px; object-fit: cover; }
              .header-content { position: absolute; bottom: 20px; left: 1.3in; color: #E2DDF3; }
              .header-title { font-size: 14px; font-weight: bold; margin-bottom: 6px; text-align: left; }
              .header-terms { font-size: 10px; opacity: 0.8; text-align: left; margin-bottom: 19px; }
              .creation-date { position: absolute; top: 20px; right: 0.2in; color: #E2DDF3; font-size: 12px; opacity: 0.8; }
              .content-container { padding: 20px 0.5in; margin-top: 10px; }
              h2 { font-size: 16px !important; margin-bottom: 16px !important; color: #3B354D !important; }
              h3 { font-size: 14px !important; color: #3B354D !important; margin: 0 !important; }
              p { font-size: 12px !important; color: #120F1B !important; margin-top: 10px !important; }
              .footer { position: fixed; bottom: 20px; left: 0.5in; right: 0.5in; display: flex; justify-content: space-between; font-size: 10px; color: #120F1B; }
              .footer-divider { position: fixed; bottom: 40px; left: 0.5in; right: 0.5in; border-top: 1px solid #D1D1D1; }
              .term-box { background-color: #F2EFFF !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="header-container">
              <img class="header-image" src="${headerImage}" alt="Header"/>
              <div class="creation-date">Created: ${new Date().toLocaleDateString()}</div>
              <div class="header-content">
                <div class="header-title">${data.title}</div>
                <div class="header-terms">${data.totalItems} Terms</div>
              </div>
            </div>

            <div class="content-container">
              ${
                data.summary
                  ? `
                <div style="margin-bottom: 24px;">
                  <h2>Summary</h2>
                  <p>${data.summary}</p>
                </div>
              `
                  : ""
              }

              <h2>Terms and Definitions</h2>
              ${data.items
                .map(
                  (item, index) => `
                <div style="margin-bottom: 20px;">
                  <div class="term-box" style="padding: 10px; border-radius: 3px;">
                    <h3>${index + 1}. ${item.term}</h3>
                  </div>
                  <p style="padding-left: 10px;">
                    ${item.definition || ""}
                  </p>
                </div>
              `
                )
                .join("")}
            </div>

            <div class="footer-divider"></div>
            <div class="footer">
              <span>© 2024 Duel-Learn Inc.</span>
              <span>Page 1</span>
            </div>
          </div>
        </body>
      </html>
    `);
    printDocument.close();

    // Wait for images to load before printing
    const images = printDocument.getElementsByTagName("img");
    if (images.length > 0) {
      images[0].onload = () => {
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      };
    } else {
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }

    return true;
  } catch (error) {
    console.error("Print error:", error);
    throw new Error("Failed to generate print preview. Please try again.");
  }
};
