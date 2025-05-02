import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import api from "../../utils/api"; 

export function MeterCounterImport() {
  const navigate = useNavigate();
  const [coldValue, setColdValue] = useState('');
  const [hotValue, setHotValue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Ванн');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const coldFileInputRef = useRef(null);
  const hotFileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentType, setCurrentType] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  const [hasExistingReadings, setHasExistingReadings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's apartments on component mount
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/water-meters/user');

        if (response.data.success) {
          setApartments(response.data.apartments || []);
          
          // If there are apartments, select the first one by default
          if (response.data.apartments && response.data.apartments.length > 0) {
            const defaultApartmentId = response.data.selectedApartmentId || response.data.apartments[0].id;
            setSelectedApartmentId(defaultApartmentId);
            
            // Check if current month already has readings
            setHasExistingReadings(response.data.hasReadings);
          }
        }
      } catch (error) {
        console.error('Error fetching apartments:', error);
        setError('Орон сууцны мэдээлэл авахад алдаа гарлаа.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApartments();
  }, []);

  // Function to handle apartment selection change
  const handleApartmentChange = async (e) => {
    const apartmentId = Number(e.target.value);
    setSelectedApartmentId(apartmentId);
    
    try {
      setIsLoading(true);
      const response = await api.get(`/water-meters/user?apartmentId=${apartmentId}`);

      if (response.data.success) {
        setHasExistingReadings(response.data.hasReadings);
      }
    } catch (error) {
      console.error('Error checking apartment readings:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSubmit = async () => {
    if (!coldValue || (selectedLocation !== 'Нойл' && !hotValue)) {
      setError('Бүх байршлын хүйтэн болон халуун усны тоолуурын заалтыг оруулна уу.');
      return;
    }

    if (!selectedLocation) {
      setError('Тоолуурын байршлыг сонгоно уу.');
      return;
    }

    if (!selectedApartmentId) {
      setError('Орон сууц сонгоно уу.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Prepare readings array for API
      const readings = [
        {
          type: 0, // Cold water
          location: selectedLocation,
          indication: parseFloat(coldValue)
        }
      ];

      if (selectedLocation !== 'Нойл') {
        readings.push({
          type: 1, // Hot water
          location: selectedLocation,
          indication: parseFloat(hotValue)
        });
      }
      
      const payload = {
        apartmentId: selectedApartmentId,
        readings: readings
      };
      
      const response = await api.post('/water-meters/add', payload);
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Тоолуурын заалт амжилттай хадгалагдлаа!');
        
        // Reset form after successful submission
        setColdValue('');
        setHotValue('');
        setProcessedImage(null);
        setHasExistingReadings(true);
        
        // Navigate back after 2 seconds
        setTimeout(() => {
          navigate('/user/metercounter');
        }, 2000);
      } else {
        setError(response.data.message || 'Хадгалахад алдаа гарлаа.');
      }
    } catch (error) {
      console.error('Error submitting readings:', error);
      setError(error.response?.data?.message || 'Серверт хүсэлт илгээхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden p-8">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold mt-4">Орон сууц олдсонгүй</h2>
            <p className="mt-2 text-gray-600">Таны хандалтай холбоотой орон сууц олдсонгүй.</p>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate('/user/apartments')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Орон сууц нэмэх
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Increased max-width to fix sizing issues */}
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-xl sm:text-2xl font-bold text-center">Тоолуурын заалт оруулах</h1>
        </div>

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

        <div className="p-4 sm:p-6">
          {/* Apartment Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="apartment">
              Орон сууц сонгох:
            </label>
            <select
              id="apartment"
              value={selectedApartmentId || ''}
              onChange={handleApartmentChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Орон сууц сонгох --</option>
              {apartments.map(apt => (
                <option key={apt.id} value={apt.id}>
                  {apt.displayName}
                </option>
              ))}
            </select>
          </div>
          
          {/* Existing Readings Warning */}
          {hasExistingReadings && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-4" role="alert">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Анхааруулга:</span>
                <span className="ml-2">Та энэ сард тоолуурын заалтаа өгсөн байна. Үргэлжлүүлбэл одоогийн утгыг дарж шинэчлэх болно.</span>
              </div>
            </div>
          )}

          {/* Canvas for displaying uploaded image */}
          {processedImage && (
            <div className="mb-4">
              <canvas 
                ref={canvasRef} 
                className="w-full max-h-96 object-contain border-2 border-gray-300 rounded-lg shadow-md"
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
          
          {/* Success Message */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          {/* Location Radio Buttons - Better spacing and layout */}
          <div className="mb-4 mt-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Байршил:
            </label>
            <div className="flex flex-wrap gap-4">
              {['Ванн', 'Гал тогоо', 'Нойл'].map(location => (
                <div key={location} className="flex items-center">
                  <input
                    type="radio"
                    id={location}
                    name="location"
                    value={location}
                    checked={selectedLocation === location}
                    onChange={() => setSelectedLocation(location)}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor={location} className="text-gray-700">{location}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Input Fields - Improved layout and sizing */}
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
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
              <div className="pt-8">
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
            </div>
            
            {/* Only show hot water input for locations other than Нойл */}
            {selectedLocation !== 'Нойл' && (
              <div className="flex items-start space-x-2">
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
                <div className="pt-8">
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
            )}
          </div>
          
          {/* Submit Button - Improved positioning and spacing */}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-2 sm:order-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Буцах
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedApartmentId}
              className={`w-full sm:w-auto order-1 sm:order-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center shadow-md ${
                (isSubmitting || !selectedApartmentId) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Оруулж байна...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Оруулах
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeterCounterImport;