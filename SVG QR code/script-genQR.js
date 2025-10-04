// Fixed default values
 	 const PREVIEW_SIZE = 256; // Size for on-screen display (fixed)
     const DOWNLOAD_SIZE = 512; // New size for PNG download
 	 const DEFAULT_EC = QRCode.CorrectLevel.H; // 30%
 	 const DEFAULT_FG = '#000000'; // Black
 	 const DEFAULT_BG = '#ffffff'; // White

 	 const qrcodeContainer = document.getElementById('qrcode');
 	 const textIn = document.getElementById('text');
     const copySvgButton = document.getElementById('copySvg');
     const defaultCopyText = 'Copy as SVG';


 	 let qr = null;

 	 function clearQr() {
 	 	 qrcodeContainer.innerHTML = '';
 	 	 qr = null;
 	 }
		
	 // Logic to normalize URL
 	 function normalizeUrl(input) {
 	 	 let text = input.trim();
 	 	 if (text && !text.match(/^(https?:\/\/|mailto:|tel:)/i)) {
 	 	 	 if (text.includes('.')) {
 	 	 	 	 return 'https://' + text;
 	 	 	 }
 	 	 }
 	 	 return text;
 	 }


 	 function generate() {
 	 	 const rawText = textIn.value;
 	 	 const text = normalizeUrl(rawText);

 	 	 if (!text.trim()) {	
 	 	 	 clearQr();
 	 	 	 return;
 	 	 }

 	 	 clearQr();
 	 		
 	 	 try {
 	 	 	 qr = new QRCode(qrcodeContainer, {
 	 	 	 	 text: text,
 	 	 	 	 width: PREVIEW_SIZE, // Use PREVIEW_SIZE for display
 	 	 	 	 height: PREVIEW_SIZE, // Use PREVIEW_SIZE for display
 	 	 	 	 colorDark: DEFAULT_FG,
 	 	 	 	 colorLight: DEFAULT_BG,
 	 	 	 	 correctLevel: DEFAULT_EC
 	 	 	 });
 	 	 } catch (e) {
 	 	 	 console.error(e);
 	 	 }
 	 }
     
     // Function to reset the copy button state
     function resetCopyButton() {
         copySvgButton.textContent = defaultCopyText;
         copySvgButton.classList.remove('success');
         copySvgButton.classList.add('secondary');
     }


 	 // --- Attach event for automatic code generation and reset copy button on new input ---
 	 textIn.addEventListener('input', () => {
         generate();
         resetCopyButton(); 
     });	

 	 // --- Download PNG ---
 	 document.getElementById('downloadPng').addEventListener('click', () => {
 	 	 const text = normalizeUrl(textIn.value);
         if (!text.trim()) {
             alert('Error: Please enter content to generate a QR Code.');
             return;
         }

         // 1. Create a temporary high-res canvas (512x512)
         const tempDiv = document.createElement('div');
         document.body.appendChild(tempDiv);
         
         new QRCode(tempDiv, {
            text: text,
            width: DOWNLOAD_SIZE, // Use 512px for download
            height: DOWNLOAD_SIZE, // Use 512px for download
            colorDark: DEFAULT_FG,
            colorLight: DEFAULT_BG,
            correctLevel: DEFAULT_EC
         });

         // The library generates an IMG or CANVAS, we need the Canvas for DataURL
         // We need a short delay to ensure the canvas is rendered
         setTimeout(() => {
            const canvas = tempDiv.querySelector('canvas');
            if (canvas) {
                downloadDataUrl(canvas.toDataURL('image/png'), 'qrcode_512.png');
            }
            // Clean up the temporary element
            tempDiv.remove();
         }, 50); 
 	 });

 	 // --- Copy as SVG (Copy foreground only) ---
 	 copySvgButton.addEventListener('click', async () => {
 	 	 const canvas = qrcodeContainer.querySelector('canvas');
         resetCopyButton(); 

 	 	 if (!canvas) {
 	 	 	 alert('Error: Please enter content to generate a QR Code first!');
 	 	 	 return;
 	 	 }

 	 	 const size = canvas.width;
 	 	 const ctx = canvas.getContext('2d');
 	 	 const imgData = ctx.getImageData(0, 0, size, size).data;
 	 	 const fg = DEFAULT_FG;

 	 	 const processedPixels = Array(size).fill(0).map(() => Array(size).fill(false));
 	 	 let rects = [];	

 	 	 const isBlack = (x, y) => {
 	 	 	 const i = (y * size + x) * 4;
 	 	 	 return imgData[i] < 128 && imgData[i+1] < 128 && imgData[i+2] < 128;
 	 	 };

 	 	 // Rectangle merging algorithm (optimization)
 	 	 for (let y = 0; y < size; y++) {
 	 	 	 for (let x = 0; x < size; x++) {
 	 	 	 	 if (isBlack(x, y) && !processedPixels[y][x]) {
 	 	 	 	 	 let currentX = x;
 	 	 	 	 	 let currentY = y;
 	 	 	 	 	 let width = 0;
 	 	 	 	 	 let height = 0;

 	 	 	 	 	 while (currentX < size && isBlack(currentX, y) && !processedPixels[y][currentX]) {
 	 	 	 	 	 	 width++;
 	 	 	 	 	 	 currentX++;
 	 	 	 	 	 }

 	 	 	 	 	 while (currentY < size) {
 	 	 	 	 	 	 let rowIsSolid = true;
 	 	 	 	 	 	 for (let i = 0; i < width; i++) {
 	 	 	 	 	 	 	 if (!isBlack(x + i, currentY) || processedPixels[currentY][x + i]) {
 	 	 	 	 	 	 	 	 rowIsSolid = false;
 	 	 	 	 	 	 	 	 break;
 	 	 	 	 	 	 	 }
 	 	 	 	 	 	 }
 	 	 	 	 	 	 if (rowIsSolid) {
 	 	 	 	 	 	 	 height++;
 	 	 	 	 	 	 	 currentY++;
 	 	 	 	 	 	 } else {
 	 	 	 	 	 	 	 break;
 	 	 	 	 	 	 }
 	 	 	 	 	 }

 	 	 	 	 	 for (let py = y; py < y + height; py++) {
 	 	 	 	 	 	 for (let px = x; px < x + width; px++) {
 	 	 	 	 	 	 	 processedPixels[py][px] = true;
 	 	 	 	 	 	 }
 	 	 	 	 	 }

 	 	 	 	 	 rects.push({ x: x, y: y, width: width, height: height });
 	 	 	 	 }
 	 	 	 }
 	 	 }

 	 	 // ONLY ADD <rect> tags (black color)
 	 	 let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" shape-rendering="crispEdges" viewBox="0 0 ${size} ${size}">`;

 	 	 rects.forEach(rect => {
 	 	 	 svg += `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${fg}"/>`;
 	 	 });

 	 	 svg += '</svg>';

 	 	 try {
 	 	 	 await navigator.clipboard.writeText(svg);
 	 	 	 
             // Success visual feedback
             copySvgButton.textContent = 'Copied to Clipboard!';
             copySvgButton.classList.remove('secondary');
             copySvgButton.classList.add('success');
             
             // Reset button after 3 seconds
             setTimeout(resetCopyButton, 3000); 

 	 	 } catch (err) {
 	 	 	 console.error(err);
 	 	 	 alert('❌ Error: Browser does not allow automatic copying.');
 	 	 }
 	 });

 	 function downloadDataUrl(dataUrl, filename) {
 	 	 const a = document.createElement('a');
 	 	 a.href = dataUrl;
 	 	 a.download = filename;
 	 	 document.body.appendChild(a);
 	 	 a.click();
 	 	 a.remove();
 	 }
 	 generate();