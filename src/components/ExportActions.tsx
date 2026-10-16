import React, { useState } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportActionsProps {
  contentRef: React.RefObject<HTMLElement | null> | React.MutableRefObject<HTMLElement | null>;
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'a4' | 'letter';
  downloadLabel?: string;
  printLabel?: string;
  disabled?: boolean;
}

const ExportActions: React.FC<ExportActionsProps> = ({
  contentRef,
  fileName = 'HealthForAll_Report',
  orientation = 'portrait',
  paperSize = 'a4',
  downloadLabel = '📥 Download PDF',
  printLabel = '🖨️ Print',
  disabled = false,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!contentRef.current) {
      alert('No content available to export.');
      return;
    }

    setDownloading(true);

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', paperSize);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const date = new Date().toISOString().split('T')[0];
      const sanitizedName = fileName.replace(/\s+/g, '_');
      pdf.save(`${sanitizedName}_${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!contentRef.current) {
      alert('No content available to print.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');

    if (!printWindow) {
      alert('Popup blocked. Please allow popups to print.');
      return;
    }

    const styles = `
      body {
        font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
        padding: 24px;
        margin: 0;
        color: #000000;
        background-color: #ffffff;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #dddddd;
        padding: 8px;
        text-align: left;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #1a1a1a;
      }
      @media print {
        body {
          margin: 0;
        }
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName}</title>
          <style>${styles}</style>
        </head>
        <body>
          ${contentRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        mb: 2,
      }}
    >
      <Button
        variant="contained"
        color="primary"
        startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
        onClick={handleDownload}
        disabled={disabled || downloading}
      >
        {downloading ? 'Generating...' : downloadLabel}
      </Button>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<PrintIcon />}
        onClick={handlePrint}
        disabled={disabled}
      >
        {printLabel}
      </Button>
    </Box>
  );
};

export default ExportActions;

