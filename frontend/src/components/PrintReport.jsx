import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctorById } from '../store/doctor';
import { useNavigate } from 'react-router-dom';
import { resetOrderState, updateOrder } from '../store/order';
import { FilePenLine } from 'lucide-react';
import ModalEditForm from './ModalEditForm';
import { PDFDocument, rgb } from 'pdf-lib';
import { StandardFonts } from 'pdf-lib';


const PrintReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const doctorDetails = useSelector((state) => state.doctors.doctorDetails);
  const orderDetails = useSelector((state) => state.order.orderDetails);
  const [editOrderData, setEditOrderData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reflect the updated order in the UI
  const [localOrderDetails, setLocalOrderDetails] = useState(orderDetails);

  useEffect(() => {
    if (orderDetails?.referredBy) {
      dispatch(fetchDoctorById(orderDetails.referredBy));
    }
    setLocalOrderDetails(orderDetails); // Initialize local order details
  }, [dispatch, orderDetails]);

  const handleEditClick = (data) => {
    setEditOrderData(data); // Set the data to be edited
  };

  const handleEditSubmit = async (formData) => {
    try {
      const orderId = editOrderData._id;
      const action = await dispatch(updateOrder({ orderId, updatedData: formData }));

      if (action.type === 'order/updateOrder/fulfilled') {
        console.log('Order updated successfully:', action.payload);
        setLocalOrderDetails(action.payload); // Update local state with new order details
        setEditOrderData(null); // Close modal
      } else {
        console.error('Failed to update order:', action.payload);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const generatePdf = async () => {
    setLoading(true);
  
    try {
      const existingPdfBytes = await fetch('/final.pdf').then((res) => res.arrayBuffer());
      if (!existingPdfBytes) {
        throw new Error('Failed to fetch the existing PDF.');
      }
  
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const [firstPage] = pdfDoc.getPages();
      firstPage.setSize(595, 414); // changed to A5 size- Armaan Siddiqui
  
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
  
      // Format date
      const formatDate = (date) => {
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear())}`;
      };
  
      const fields = [
        { label: 'Date', value: formatDate(localOrderDetails.createdAt) },
        { label: 'S.No', value: localOrderDetails.serialNo },
        { label: 'Name', value: localOrderDetails.name, isHighlighted: true },
        { label: 'Age', value: localOrderDetails.age },
        { label: 'Gender', value: localOrderDetails.gender },
        { label: 'Address', value: localOrderDetails.address },
        { label: 'Phone No', value: localOrderDetails.phoneNo },
        { label: 'Category', value: localOrderDetails.category },
        { label: 'SubCategory', value: localOrderDetails.subcategory, isHighlighted: true },
        { label: 'Referred By', value: doctorDetails ? "Dr. " + doctorDetails.name : "N/A" },

        { label: 'Fees', value: localOrderDetails.fees },
        localOrderDetails.discount > 0 && { label: 'Discount', value: localOrderDetails.discount },

        //Added new fields to align with new logic and feature online + cash- Armaan Siddiqui
        // localOrderDetails.paymentMode === 'Online + Cash' && { label: 'Online Paid', value: localOrderDetails.online },
        // localOrderDetails.paymentMode === 'Online + Cash' && { label: 'Cash Paid', value: localOrderDetails.cash },
        { label: 'Final Payment', value: finalAmount ,isHighlighted: true },
        { label: 'Payment Mode', value: localOrderDetails.paymentMode },

      ].filter(Boolean);
  
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
            if (currentLine) {
              lines.push(currentLine);
            }
            currentLine = word;
          }
        });
  
        if (currentLine) {
          lines.push(currentLine);
        }
  
        return lines;
      };
  
      const drawDataInColumn = (startX, yPosition, fields) => {
        fields.forEach((field) => {
          const isHighlighted = field.isHighlighted || false;
          const fieldFont = isHighlighted ? boldFont : regularFont;
          const fieldColor = isHighlighted ? boldColor : color;
          const sanitizedValue = String(field.value).replace(/\n/g, ' ');
          const fieldText = `${field.label}: ${sanitizedValue}`;
          const fieldLines = wrapText(fieldText, colSpacing - 10, fieldFont, fontSizeText);
  
          fieldLines.forEach((line, index) => {
            firstPage.drawText(line, {
              x: startX,
              y: yPosition - index * lineHeight,
              size: fontSizeText,
              color: fieldColor,
              font: fieldFont,
            });
          });
  
          yPosition -= fieldLines.length * lineHeight + 4; // Spacing between fields
        });
  
        return yPosition;
      };
  
      let leftColumnY = drawDataInColumn(startX, yPosition, fields);
      drawDataInColumn(secondColX, yPosition, fields);
  
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
  
      const pdfFileName = `${localOrderDetails.name.replace(/\s+/g, '_')}_${localOrderDetails.serialNo}.pdf`;
  
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      const pdfWindow = window.open(url, '_blank');
      if (!pdfWindow) {
        throw new Error('Failed to open PDF in a new tab. Please allow popups for this site.');
      }
  
      pdfWindow.onload = () => {
        pdfWindow.print();
      };
  
      // Delay navigation and state reset to ensure PDF actions complete
      setTimeout(() => {
        dispatch(resetOrderState());
        window.location = '/'; // Redirect to the home page
       
      }, 500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`An error occurred while generating the PDF: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!localOrderDetails) {
    return (
      <div className="text-center text-xl mt-40">
        <p className="text-red-600 text-lg font-medium">Some error occurred. Please fill the form again.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-500 text-white font-semibold text-xl rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          Back
        </button>
      </div>
    );
  }




  const finalAmount = localOrderDetails.fees - (localOrderDetails.discount || 0);


  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg mt-36">
      <h1 className="text-3xl font-semibold text-center mb-8 text-gray-800">Report Details</h1>
      <h6 className="text-md font-semibold text-center mb-8 text-gray-800">
        <strong className="text-gray-700">Serial No: </strong>
        {localOrderDetails.serialNo}
      </h6>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <p><strong className="text-gray-700">Patient Name:</strong> {localOrderDetails.name}</p>
          <p><strong className="text-gray-700">Patient Age:</strong> {localOrderDetails.age}</p>
          <p><strong className="text-gray-700">Gender:</strong> {localOrderDetails.gender}</p>
          <p><strong className="text-gray-700">Patient Address:</strong> {localOrderDetails.address}</p>
          <p><strong className="text-gray-700">Patient Phone No:</strong> {localOrderDetails.phoneNo}</p>
          {doctorDetails && doctorDetails !== 0 && (
            <p><strong className="text-gray-700">Doctor Referred By:</strong> {doctorDetails.name}</p>
          )}
        </div>

        <div className="relative bg-gray-50 p-4 rounded-lg shadow-sm">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            onClick={() => handleEditClick(localOrderDetails)}
          >
            <FilePenLine size={20} />
          </button>
          <p><strong className="text-gray-700">Report Category:</strong> {localOrderDetails.category}</p>
          <p><strong className="text-gray-700">Report SubCategory:</strong> {localOrderDetails.subcategory}</p>
          <p><strong className="text-gray-700">Report Fee:</strong> {localOrderDetails.fees}</p>
          {localOrderDetails.discount > 0 && (
            <p><strong className="text-gray-700">Discount:</strong> {localOrderDetails.discount}</p>
          )}
          {/* 
          <p><strong className="text-gray-700">Final Payment:</strong> {localOrderDetails.finalPayment}</p>
          <p><strong className="text-gray-700">Payment Mode:</strong> {localOrderDetails.paymentMode}</p> 
          */}



          {/* Updated section with online + cash fields and also corrected final payment */}
          {localOrderDetails.paymentMode === 'Online + Cash' && (
            <div>
              <p><strong className="text-gray-700">Online Paid:</strong> {localOrderDetails.online}</p>
              <p><strong className="text-gray-700">Cash Paid:</strong> {localOrderDetails.cash}</p>
            </div>
          )}

          <p><strong className="text-gray-700">Final Payment:</strong> {finalAmount}</p>
          <p><strong className="text-gray-700">Payment Mode:</strong> {localOrderDetails.paymentMode}</p>
        </div>
      </div>

      <button
        onClick={generatePdf}
        className="w-full mt-6 py-3 px-6 bg-green-500 text-white rounded-lg text-lg hover:bg-green-600 transition-all duration-300"
      >
        {loading ? 'Generating PDF...' : 'Generate PDF'}
      </button>

      {editOrderData && (
        <ModalEditForm
          isOpen={true}
          onClose={() => setEditOrderData(null)}
          onSubmit={handleEditSubmit}
          initialData={editOrderData}
        />
      )}
    </div>
  );
};

export default PrintReport;
