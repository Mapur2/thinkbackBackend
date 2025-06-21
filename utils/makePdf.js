import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { uploadOnCloudinary } from './cloudinary.js'; 
import { fileURLToPath } from 'url';

// For ES Modules: determine __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateImageBill = async (sale, user) => {
  try {
    // Canvas dimensions
    const width = 800;
    const height = 1100;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    // -------------------------
    // 1) HEADER SECTION
    // -------------------------
    // Business Name
    ctx.fillStyle = '#000';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(user.business_name || 'BUSINESS NAME', width / 2, 50);

    // GST Number & Additional Header Info
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`GST No: ${user.gst || 'N/A'}`, width / 2, 75);
    ctx.fillText(`Address: ${user.business_address || 'N/A'}`, width / 2, 95);

    // Invoice Title
    ctx.font = 'bold 20px Arial';
    ctx.fillText('INVOICE', width / 2, 125);

    // Left Align now for subsequent text
    ctx.textAlign = 'left';

    // -------------------------
    // 2) BILL & DATE SECTION
    // -------------------------
    ctx.font = '14px Arial';
    ctx.fillText(`Date: ${sale.saleDate.toLocaleDateString()}`, 50, 170);

    // -------------------------
    // 3) CUSTOMER DETAILS
    // -------------------------
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Customer Details:', 50, 200);

    ctx.font = '12px Arial';
    ctx.fillText(`Name: ${sale.customer_name}`, 60, 220);
    ctx.fillText(`Address: ${sale.customer_address}`, 60, 240);
    ctx.fillText(`Ph: ${sale.customer_phone || 'N/A'}`, 60, 260);

    // -------------------------
    // 4) TABLE HEADER
    // -------------------------
    // Table column positions
    const colX = {
      product: 50,
      price: 400,
      qty: 500,
      total: 600,
    };
    let tableY = 300;

    // Draw table header background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(50, tableY, 700, 30);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('Product', colX.product, tableY + 20);
    ctx.fillText('Price', colX.price, tableY + 20);
    ctx.fillText('Qty', colX.qty, tableY + 20);
    ctx.fillText('Amount', colX.total, tableY + 20);

    tableY += 40;

    // -------------------------
    // 5) TABLE ROWS
    // -------------------------
    ctx.font = '12px Arial';
    sale.items.forEach((item) => {
      // Product Name
      ctx.fillText(item.productName || 'N/A', colX.product, tableY);

      // Price (Right-aligned)
      const priceStr = `Rs. ${(item.priceAtSale).toFixed(2)}`;
      ctx.textAlign = 'right';
      ctx.fillText(priceStr, colX.price + 40, tableY);

      // Qty (Right-aligned)
      const qtyStr = item.quantity.toString();
      ctx.fillText(qtyStr, colX.qty + 40, tableY);

      // Amount (Right-aligned)
      const amtStr = `Rs. ${(item.priceAtSale * item.quantity).toFixed(2)}`;
      ctx.fillText(amtStr, colX.total + 40, tableY);

      // Reset to left align for next row
      ctx.textAlign = 'left';

      // Draw horizontal line under each row
      ctx.beginPath();
      ctx.moveTo(50, tableY + 15);
      ctx.lineTo(750, tableY + 15);
      ctx.strokeStyle = '#ddd';
      ctx.stroke();

      tableY += 25;
    });

    // -------------------------
    // 6) TOTAL & PAYMENT SECTION
    // -------------------------
    // Payment Info block
    let paymentBlockY = tableY + 30;
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Payment Details:', 50, paymentBlockY);
    paymentBlockY += 20;

    ctx.font = '12px Arial';
    ctx.fillText(`Payment Method: ${sale.paymentMethod}`, 60, paymentBlockY); 
    paymentBlockY += 20;
    ctx.fillText(`Payment Status: ${sale.paymentStatus}`, 60, paymentBlockY);
    paymentBlockY += 20;

    // Summaries
    ctx.fillText(`Paid Amount: Rs. ${sale.paidAmount.toFixed(2)}`, 60, paymentBlockY);
    paymentBlockY += 20;

    if (sale.paymentStatus === 'Partially Paid') {
      ctx.fillText(`Due Amount: Rs. ${(sale.dueAmount).toFixed(2)}`, 60, paymentBlockY);
      paymentBlockY += 20;
    }

    // GRAND TOTAL
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Total: Rs. ${sale.totalAmount}`, 60, paymentBlockY + 20);

    // Contact / T&C (Optional)
    const contactY = paymentBlockY + 80;
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Contact Details:', 50, contactY);
    ctx.font = '12px Arial';
    ctx.fillText(`Phone: ${user.phone || '1234567890'}`, 60, contactY + 20);

    // -------------------------
    // 7) SIGNATURE SECTION
    // -------------------------
    let signatureY = contactY + 120;
    if (user.signature) {
      ctx.font = '12px Arial';
      ctx.fillText('Authorized Signature', 600, signatureY);

      try {
        const signatureImage = await loadImage(user.signature);
        // Adjust signature position to align right
        const sigWidth = 100;
        const sigHeight = 50;
        ctx.drawImage(signatureImage, 600, signatureY + 15, sigWidth, sigHeight);
      } catch (err) {
        console.error("Error loading signature image:", err);
      }
    }

    // Convert canvas to buffer (PNG)
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(__dirname, 'public', 'temp', `${sale.customer_name}-${Date.now()}.png`);
    if (!fs.existsSync(path.join(__dirname, 'public', 'temp'))) {
      fs.mkdirSync(path.join(__dirname, 'public', 'temp'), { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);

    // Upload the image file to Cloudinary
    const cloudinaryResponse = await uploadOnCloudinary(filePath);

    return cloudinaryResponse;
  } catch (error) {
    console.error("Error generating image bill:", error);
    return null;
  }
};
