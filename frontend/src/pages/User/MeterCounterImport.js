import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';

export function MeterCounterImport() {
  const navigate = useNavigate();
  const [coldValue, setColdValue] = useState('');
  const [hotValue, setHotValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [error, setError] = useState(null);
  const coldFileInputRef = useRef(null);
  const hotFileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [currentType, setCurrentType] = useState(null);

  const extractMeterReadings = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Perform OCR on the entire image
      const { data: { text } } = await Tesseract.recognize(
        processedImage,
        'eng',
        { 
          logger: m => console.log(m),
          tessedit_char_whitelist: '0123456789',
          tessedit_image_preprocessing: 'advanced'
        }
      );

      // Extract 5-digit numbers
      const numbers = text.match(/\b\d{5}\b/g) || [];
      
      console.log('Extracted text:', text);
      console.log('Extracted numbers:', numbers);

      if (numbers.length > 0) {
        // Take the first 5-digit number
        const reading = numbers[0];
        
        if (currentType === 'cold') {
          setColdValue(reading);
        } else {
          setHotValue(reading);
        }
      } else {
        setError(`Тоолуурын дугаар олдсонгүй. Та зургаа сайн харна уу.`);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setError(`Зураг боловсруулахад алдаа гарлаа: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Set the processed image
        setProcessedImage(reader.result);
        setCurrentType(type);
        
        // Create image to display on canvas
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, img.width, img.height);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = (ref) => {
    ref.current.click();
  };

  const handleSubmit = () => {
    if (coldValue && hotValue) {
      console.log('Submitted values:', { coldValue, hotValue });
      alert('Тоолуурын заалт амжилттай хадгалагдлаа!');
    } else {
      alert('Бүх тоолуурын заалтыг оруулна уу.');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold text-center">Тоолуурын заалт оруулах</h1>
        </div>

        {/* Hidden File Inputs */}
        <input 
          type="file" 
          ref={coldFileInputRef}
          onChange={(e) => handleImageUpload(e, 'cold')}
          accept="image/*"
          className="hidden"
        />
        <input 
          type="file" 
          ref={hotFileInputRef}
          onChange={(e) => handleImageUpload(e, 'hot')}
          accept="image/*"
          className="hidden"
        />

        {/* Image Upload and Processing Section */}
        <div className="p-6">
          {/* Canvas for displaying uploaded image */}
          {processedImage && (
            <div className="mb-4">
              <canvas 
                ref={canvasRef} 
                className="w-full border-2 border-gray-300 rounded-lg shadow-md"
              />
            </div>
          )}

          {/* OCR Button */}
          {processedImage && (
            <div className="flex justify-center mb-4">
              <button 
                onClick={extractMeterReadings}
                disabled={isProcessing}
                className={`px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? 'Боловсруулж байна...' : 'Тоог ялгах'}
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Input Fields */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex-grow">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cold">
                  Хүйтэн усны тоолуур (m³)
                </label>
                <input
                  id="cold"
                  type="number"
                  value={coldValue}
                  onChange={(e) => setColdValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Хүйтэн усны утга оруулах"
                />
              </div>
              <button
                onClick={() => triggerFileInput(coldFileInputRef)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Зураг
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex-grow">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hot">
                  Халуун усны тоолуур (m³)
                </label>
                <input
                  id="hot"
                  type="number"
                  value={hotValue}
                  onChange={(e) => setHotValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Халуун усны утга оруулах"
                />
              </div>
              <button
                onClick={() => triggerFileInput(hotFileInputRef)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Зураг
              </button>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Оруулах
            </button>
          </div>
        </div>
      </div>
      
      {/* Back Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Буцах
        </button>
      </div>
    </div>
  );
}

export default MeterCounterImport;