import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PrintReportModal = ({ isOpen, onClose, orderDetails, doctorDetails }) => {
  const [loading, setLoading] = useState(false); // Armaan Siddiqui: To show loading status during PDF generation

  // Armaan Siddiqui: Return nothing if modal is closed or order data not available
  if (!isOpen || !orderDetails) return null;

  // Armaan Siddiqui: Used for final payment logic
  const finalAmount = orderDetails.fees - (orderDetails.discount || 0);

  // Armaan Siddiqui: Main PDF generation logic
  const generatePdf = async () => {
    setLoading(true);
    try {
      // Armaan Siddiqui: Load base PDF template
      const existingPdfBytes = await fetch('/final.pdf').then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const [firstPage] = pdfDoc.getPages();
      firstPage.setSize(595, 414); // Armaan Siddiqui: A8 size page

      // Armaan Siddiqui: PDF styling constants
      const color = rgb(0, 0, 0);
      const boldColor = rgb(0, 0, 0.8);
      const marginTop = 25;
      const lineHeight = 18;
      const colSpacing = 280;
      const fontSizeText = 11;
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      let yPosition =  414-90;
      const startX = 15;
      const secondColX = 595/2;

      // Armaan Siddiqui: Format createdAt date to DD/MM/YYYY
      const formatDate = (date) => {
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      };

      // Armaan Siddiqui: Prepare report fields to display
      const fields = [
        { label: 'Date', value: formatDate(orderDetails.createdAt) },
        { label: 'S.No', value: orderDetails.serialNo },
        { label: 'Name', value: orderDetails.name, isHighlighted: true },
        { label: 'Age', value: orderDetails.age },
        { label: 'Gender', value: orderDetails.gender },
        { label: 'Address', value: orderDetails.address },
        { label: 'Phone No', value: orderDetails.phoneNo },
        { label: 'Category', value: orderDetails.category },
        { label: 'SubCategory', value: orderDetails.subcategory, isHighlighted: true },
        { label: 'Referred By', value: doctorDetails?.name ? `Dr. ${doctorDetails.name}` : 'N/A' },
        { label: 'Fees', value: orderDetails.fees },
        orderDetails.discount > 0 && { label: 'Discount', value: orderDetails.discount },
        // orderDetails.paymentMode === 'Online + Cash' && { label: 'Online Paid', value: orderDetails.online },
        // orderDetails.paymentMode === 'Online + Cash' && { label: 'Cash Paid', value: orderDetails.cash },
        { label: 'Final Payment', value: finalAmount ,isHighlighted: true },
        { label: 'Payment Mode', value: orderDetails.paymentMode },

      ].filter(Boolean); // Armaan Siddiqui: Remove any falsy/null fields

      // Armaan Siddiqui: Utility to wrap long lines of text
      const wrapText = (text, maxWidth, font, fontSize) => {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';

        words.forEach((word) => {
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const width = font.widthOfTextAtSize(testLine, fontSize);
          if (width <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // Armaan Siddiqui: Function to draw data in a column
      const drawDataInColumn = (x, y, fields) => {
        fields.forEach((field) => {
          const isHighlighted = field.isHighlighted || false;
          const fieldFont = isHighlighted ? boldFont : regularFont;
          const fieldColor = isHighlighted ? boldColor : color;

          const lines = wrapText(`${field.label}: ${field.value}`, colSpacing - 10, fieldFont, fontSizeText);
          lines.forEach((line, i) => {
            firstPage.drawText(line, {
              x,
              y: y - i * lineHeight,
              size: fontSizeText,
              font: fieldFont,
              color: fieldColor,
            });
          });

          y -= lines.length * lineHeight + 4; // Armaan Siddiqui: Vertical spacing
        });
      };

      // Armaan Siddiqui: Draw both columns with the same fields
      drawDataInColumn(startX, yPosition, fields);
      drawDataInColumn(secondColX, yPosition, fields);

      // Armaan Siddiqui: Save and trigger download/print
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${orderDetails.name.replace(/\s+/g, '_')}_${orderDetails.serialNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const pdfWindow = window.open(url, '_blank');
      if (pdfWindow) {
        pdfWindow.onload = () => pdfWindow.print(); // Armaan Siddiqui: Auto-print
      }

      // Armaan Siddiqui: Auto-close after a delay
      setTimeout(() => onClose(), 500);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false); // Armaan Siddiqui: Reset loading state
    }
  };

  // Armaan Siddiqui: UI for modal and PDF generation
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-lg w-full shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-red-600 text-xl font-bold"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold text-center mb-4">Generate & Print Report</h2>
        <div className="flex flex-col items-center">
          <button
            onClick={generatePdf}
            className="bg-green-600 text-white py-2 px-6 rounded-lg text-lg hover:bg-green-700"
          >
            {loading ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintReportModal;
