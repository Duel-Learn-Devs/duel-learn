import { saveAs } from "file-saver";
import * as docx from "docx";
import { jsPDF } from "jspdf";

export interface ExportData {
  title: string;
  totalItems: number;
  status?: string;
  items: Array<{
    term: string;
    definition: string;
  }>;
  summary?: string;
}

// Export to TXT
export const exportToTxt = (data: ExportData) => {
  let content = `${data.title}\n`;
  content += `Total Terms: ${data.totalItems}\n\n`;

  if (data.summary) {
    content += `Summary:\n${data.summary}\n\n`;
  }

  content += `Terms and Definitions:\n\n`;
  data.items.forEach((item, index) => {
    content += `${index + 1}. Term: ${item.term}\n   Definition: ${
      item.definition
    }\n\n`;
  });

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${data.title}.txt`);
};

// Export to DOCX
export const exportToDocx = async (data: ExportData) => {
  const doc = new docx.Document({
    styles: {
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 32,
            bold: true,
            color: "120F1B",
          },
          paragraph: {
            spacing: { before: 240, after: 240 },
            alignment: docx.AlignmentType.CENTER,
          },
        },
        {
          id: "Heading",
          name: "Heading",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: "3B354D",
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: [
          new docx.Paragraph({
            text: data.title,
            style: "Title",
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `Total Terms: ${data.totalItems}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 400 },
          }),
          ...(data.summary
            ? [
                new docx.Paragraph({
                  text: "Summary:",
                  style: "Heading",
                  spacing: { before: 400 },
                }),
                new docx.Paragraph({
                  text: data.summary,
                  spacing: { before: 200 },
                }),
              ]
            : []),
          new docx.Paragraph({
            text: "Terms and Definitions:",
            style: "Heading",
            spacing: { before: 400 },
          }),
          ...data.items.flatMap((item, index) => [
            new docx.Paragraph({
              text: `${index + 1}. Term: ${item.term}`,
              style: "Heading",
              spacing: { before: 200 },
            }),
            new docx.Paragraph({
              text: `Definition: ${item.definition}`,
              spacing: { before: 100 },
            }),
          ]),
        ],
        footers: {
          default: new docx.Footer({
            children: [
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: "© 2024 Duel-Learn Inc.",
                    size: 18,
                  }),
                  new docx.TextRun({
                    text: "\t\t",
                    size: 18,
                  }),
                  new docx.TextRun({
                    children: [
                      docx.PageNumber.CURRENT,
                      " of ",
                      docx.PageNumber.TOTAL_PAGES,
                    ],
                    size: 18,
                  }),
                ],
                alignment: docx.AlignmentType.JUSTIFIED,
              }),
            ],
          }),
        },
      },
    ],
  });

  const blob = await docx.Packer.toBlob(doc);
  saveAs(blob, `${data.title}.docx`);
};

// Export to PDF
export const exportToPdf = async (data: ExportData, headerImage: string) => {
  const doc = new jsPDF();

  // Add header image with reduced height
  const headerImg = new Image();
  headerImg.src = headerImage;
  await new Promise((resolve) => {
    headerImg.onload = resolve;
  });
  doc.addImage(headerImg, "PNG", 0, 0, doc.internal.pageSize.width, 25);

  // Add title and metadata with smaller fonts
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(226, 221, 243);
  doc.text(data.title, 30, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${data.totalItems} Terms`, 30, 18);
  doc.text(`Created: ${new Date().toLocaleDateString()}`, 150, 10);

  let yPos = 35;

  // Add content with smaller fonts
  doc.setTextColor(59, 53, 77);
  doc.setFontSize(14);

  // Add summary if exists
  if (data.summary) {
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(18, 15, 27);
    const summaryLines = doc.splitTextToSize(data.summary, 170);
    summaryLines.forEach((line: string) => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    yPos += 8;
  }

  // Add terms and definitions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(59, 53, 77);
  doc.text("Terms and Definitions", 20, yPos);
  yPos += 8;

  data.items.forEach((item, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    // Term box
    doc.setFillColor(242, 239, 255);
    doc.rect(20, yPos, doc.internal.pageSize.width - 40, 12, "F");

    // Term text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(59, 53, 77);
    doc.text(`${index + 1}. ${item.term}`, 25, yPos + 8);

    yPos += 16;

    // Definition
    doc.setFont("helvetica", "normal");
    doc.setTextColor(18, 15, 27);
    const definitionLines = doc.splitTextToSize(item.definition, 160);
    definitionLines.forEach((line: string) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 25, yPos);
      yPos += 5;
    });
    yPos += 8;
  });

  // Add footer to all pages
  const pageCount = doc.internal.pages.length;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider
    doc.setDrawColor(209, 209, 209);
    doc.line(
      20,
      doc.internal.pageSize.height - 15,
      doc.internal.pageSize.width - 20,
      doc.internal.pageSize.height - 15
    );

    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(18, 15, 27);
    doc.text("© 2024 Duel-Learn Inc.", 20, doc.internal.pageSize.height - 8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 8
    );
  }

  doc.save(`${data.title}.pdf`);
};
