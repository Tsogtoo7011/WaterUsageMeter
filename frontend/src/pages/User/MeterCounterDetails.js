import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from "../../utils/api";
import Breadcrumb from '../../components/common/Breadcrumb';
import { Camera, ChevronLeft } from 'lucide-react';
import * as Tesseract from 'tesseract.js';

export default function MeterCounterDetails() {
  const [searchParams] = useSearchParams();
  const [meterReadings, setMeterReadings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [waterMeterData, setWaterMeterData] = useState({});
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [hasExistingReadings, setHasExistingReadings] = useState(false);
  const [expectedMeters, setExpectedMeters] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [previousMonthReadings, setPreviousMonthReadings] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [differences, setDifferences] = useState([]);
  const [pendingReadings, setPendingReadings] = useState({});
  const [processingImage, setProcessingImage] = useState(false);
  const [currentProcessingField, setCurrentProcessingField] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropImageSize, setCropImageSize] = useState({ width: 1, height: 1 });
  const cropImageRef = useRef(null);
  const fileInputRef = useRef({});
  const [monthsWithStatus, setMonthsWithStatus] = useState([]); 

  useEffect(() => {
    const urlApartmentId = searchParams.get('apartmentId');
    const urlMonth = searchParams.get('month');
    setSelectedMonth(urlMonth);
    fetchWaterMeterData(urlApartmentId, urlMonth);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedMonth || !waterMeterData || !monthsWithStatus.length) {
      setPreviousMonthReadings({});
      return;
    }
    const idx = monthsWithStatus.findIndex(m => m.monthKey === selectedMonth);
    let prevDoneMonth = null;
    for (let i = idx + 1; i < monthsWithStatus.length; i++) {
      if (monthsWithStatus[i].status === "done") {
        prevDoneMonth = monthsWithStatus[i].monthKey;
        break;
      }
    }
    const prevReadingsArr = prevDoneMonth && waterMeterData[prevDoneMonth] ? waterMeterData[prevDoneMonth] : [];
    const prevReadings = {};
    prevReadingsArr.forEach(meter => {
      prevReadings[`${meter.location}-${meter.type}`] = meter.indication;
    });
    setPreviousMonthReadings(prevReadings);
  }, [selectedMonth, waterMeterData, monthsWithStatus]);

  useEffect(() => {
    if (editMode && expectedMeters.length > 0 && previousMonthReadings) {
      const initial = {};
      expectedMeters.forEach(meter => {
        const key = `${meter.location}-${meter.type}`;
        initial[key] = previousMonthReadings[key] !== undefined ? previousMonthReadings[key] : '';
      });
      setMeterReadings(initial);
    }
  }, [editMode, expectedMeters, previousMonthReadings]);

  const fetchWaterMeterData = async (apartmentId = null, month = null) => {
    try {
      setIsLoading(true);
      let url = '/water-meters/details';
      if (apartmentId) {
        url += `?apartmentId=${apartmentId}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setWaterMeterData(response.data.waterMeters || {});
        setApartments(response.data.apartments || []);
        setExpectedMeters(response.data.expectedMeters || []);
        setMonthsWithStatus(response.data.months || []);
        const newSelectedId = response.data.selectedApartmentId ||
          (response.data.apartments && response.data.apartments.length > 0 ?
            response.data.apartments[0].id : null);
        setSelectedApartmentId(newSelectedId);

        const initialReadings = {};
        if (response.data.expectedMeters && response.data.expectedMeters.length > 0) {
          response.data.expectedMeters.forEach(meter => {
            const key = `${meter.location}-${meter.type}`;
            initialReadings[key] = '';
          });
        }
        setMeterReadings(initialReadings);

        const currentDate = new Date();
        const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        setHasExistingReadings(!!response.data.waterMeters[currentYearMonth]);

        if (month && (!response.data.waterMeters || !response.data.waterMeters[month])) {
          setEditMode(true);
        } else {
          setEditMode(false);
        }
      } else {
        setError('Мэдээлэл авахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Error fetching water meter details:', err);
      setError(err.response?.data?.message || 'Серверээс мэдээлэл авахад алдаа гарлаа.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const diffs = [];
    let hasError = false;
    expectedMeters.forEach(meter => {
      const key = `${meter.location}-${meter.type}`;
      const prev = Number(previousMonthReadings[key] || 0);
      const curr = Number(meterReadings[key]);
      if (isNaN(curr) || curr === '') {
        hasError = true;
        setError('Бүх заалтыг бөглөнө үү.');
        return;
      }
      if (curr < prev) {
        hasError = true;
        setError('Таны заалт буруу байна та сайн нягтлана уу.');
        return;
      }
      diffs.push({
        location: meter.location,
        type: meter.type,
        typeText: meter.type === 1 ? "Халуун ус" : "Хүйтэн ус",
        prev,
        curr,
        diff: (curr - prev).toFixed(2)
      });
    });
    if (hasError) return;
    setDifferences(diffs);
    setPendingReadings({ ...meterReadings });
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const readingsArr = expectedMeters.map(meter => ({
        location: meter.location,
        type: meter.type,
        indication: Number(pendingReadings[`${meter.location}-${meter.type}`])
      }));
      const res = await api.post('/water-meters/add', {
        apartmentId: selectedApartmentId,
        readings: readingsArr
      });
      if (res.data.success) {
        setSuccess(res.data.message);
        setEditMode(false);
        fetchWaterMeterData(selectedApartmentId, selectedMonth);
      } else {
        setError(res.data.message || 'Алдаа гарлаа.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Сервертэй холбогдоход алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirm(false);
    setPendingReadings({});
    setDifferences([]);
  };

  const handleCameraClick = (key) => {
    if (fileInputRef.current[key]) {
      fileInputRef.current[key].value = "";
      setImagePreview(null);
      setShowImageModal(false);
      setTimeout(() => {
        fileInputRef.current[key].click();
      }, 0);
    }
  };

  const handleImageUpload = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    setCurrentProcessingField(key);
    setPendingImageFile(file);
    setImageRotation(0);
    setError(null);
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
    setIsCropping(false);
    setImagePreview(null);
    setShowImageModal(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      setShowImageModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRotateImage = () => {
    setImageRotation((prev) => (prev + 30) % 360);
  };

  const handleStartCrop = () => {
    setIsCropping(true);
    setCropStart(null);
  };

  const handleCropMouseDown = (e) => {
    if (!isCropping) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropStart({ x, y });
    setCrop({ x, y, width: 0, height: 0 });
  };

  const handleCropMouseMove = (e) => {
    if (!isCropping || !cropStart) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newCrop = {
      x: Math.min(cropStart.x, x),
      y: Math.min(cropStart.y, y),
      width: Math.abs(x - cropStart.x),
      height: Math.abs(y - cropStart.y)
    };
    setCrop(newCrop);
  };

  const handleCropMouseUp = () => {
    if (!isCropping) return;
    setCropStart(null);
    setIsCropping(false);

    // If crop area is valid, crop immediately and show only the cropped preview
    if (crop && crop.width > 0 && crop.height > 0 && cropImageRef.current) {
      // Get displayed image size
      const display = cropImageRef.current;
      const displayWidth = display.width;
      const displayHeight = display.height;

      // Get actual image size
      const naturalWidth = display.naturalWidth;
      const naturalHeight = display.naturalHeight;

      // Calculate scale
      const scaleX = naturalWidth / displayWidth;
      const scaleY = naturalHeight / displayHeight;

      // Calculate crop area in natural image coordinates
      const cropX = Math.round(crop.x * scaleX);
      const cropY = Math.round(crop.y * scaleY);
      const cropW = Math.round(crop.width * scaleX);
      const cropH = Math.round(crop.height * scaleY);

      // Create a canvas to crop the image
      const img = new window.Image();
      img.src = imagePreview;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        const croppedDataUrl = canvas.toDataURL();
        setImagePreview(croppedDataUrl);
        setShowImageModal(true); // Ensure modal is shown after cropping
        // Reset crop rectangle after cropping
        setCrop({ x: 0, y: 0, width: 0, height: 0 });
      };
    }
  };

  const handleImageLoad = (e) => {
    setCropImageSize({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
  };

  const handleCancelImageModal = () => {
    setShowImageModal(false);
    setImagePreview(null);
    setImageRotation(0);
    setCurrentProcessingField(null);
    setPendingImageFile(null);
    setProcessingImage(false);
    setIsCropping(false);
    setCropStart(null);
    // Clear file input value so user can re-upload the same file
    Object.values(fileInputRef.current).forEach(input => {
      if (input) input.value = "";
    });
  };

  const handleConfirmImageModal = async () => {
    setProcessingImage(true);
    setShowImageModal(false);
    setError(null);
    try {
      // Create an image object from the preview
      const img = new window.Image();
      img.src = imagePreview;
      await new Promise((resolve) => { img.onload = resolve; });

      // Step 1: Handle rotation if needed
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const angle = imageRotation * Math.PI / 180;
      const sin = Math.abs(Math.sin(angle));
      const cos = Math.abs(Math.cos(angle));
      canvas.width = img.width * cos + img.height * sin;
      canvas.height = img.width * sin + img.height * cos;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      // Step 1.5: Crop the rotated image if cropping is enabled
      let cropDataUrl = null;
      if (crop && crop.width > 0 && crop.height > 0) {
        // Convert crop from displayed image to actual image coordinates
        const display = cropImageRef.current;
        const displayWidth = display ? display.width : 1;
        const displayHeight = display ? display.height : 1;
        const scaleX = canvas.width / displayWidth;
        const scaleY = canvas.height / displayHeight;
        const cropX = Math.round(crop.x * scaleX);
        const cropY = Math.round(crop.y * scaleY);
        const cropW = Math.round(crop.width * scaleX);
        const cropH = Math.round(crop.height * scaleY);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        cropCanvas.getContext('2d').drawImage(
          tempCanvas,
          cropX, cropY, cropW, cropH,
          0, 0, cropW, cropH
        );
        cropDataUrl = cropCanvas.toDataURL();
      }

      // Step 2: Apply image preprocessing for better OCR results
      const enhancedCanvas = document.createElement('canvas');
      const enhancedCtx = enhancedCanvas.getContext('2d');
      if (cropDataUrl) {
        const cropImg = new window.Image();
        cropImg.src = cropDataUrl;
        await new Promise((resolve) => { cropImg.onload = resolve; });
        enhancedCanvas.width = cropImg.width;
        enhancedCanvas.height = cropImg.height;
        enhancedCtx.drawImage(cropImg, 0, 0);
      } else {
        enhancedCanvas.width = canvas.width;
        enhancedCanvas.height = canvas.height;
        enhancedCtx.drawImage(canvas, 0, 0);
      }

      const imageData = enhancedCtx.getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height);
      const data = imageData.data;

      const factor = 2.5; 
      const intercept = 128 * (1 - factor);

      for (let i = 0; i < data.length; i += 4) {

        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        const enhanced = gray * factor + intercept;

        const threshold = 180;
        const value = enhanced > threshold ? 255 : 0;

        data[i] = value;     
        data[i + 1] = value; 
        data[i + 2] = value; 
      }

      // Put the modified image data back on the canvas
      enhancedCtx.putImageData(imageData, 0, 0);

      // Get the enhanced image as data URL
      const enhancedDataUrl = enhancedCanvas.toDataURL();

      // Step 3: Configure Tesseract with specific parameters for meter reading
      const result = await Tesseract.recognize(
        enhancedDataUrl,
        'eng',
        {
          logger: m => console.log(m),
          tessedit_char_whitelist: '0123456789.',
          tessedit_pageseg_mode: '7', // Treat the image as a single line of text
          preserve_interword_spaces: '0',
          tessjs_create_hocr: '0',
          tessjs_create_tsv: '0',
          tessjs_create_box: '0',
          tessjs_create_unlv: '0',
          tessjs_create_osd: '0'
        }
      );

      // Step 4: Process the OCR result with specialized logic for meter readings
      let text = result.data.text;
      console.log("Raw OCR result:", text);

      // Clean the text - remove all non-digit/decimal characters
      text = text.replace(/[^\d.]/g, '');

      // Step 5: Apply meter-specific validation and correction
      // For water meters, typically expect 5 digits (with possible leading zeros)
      if (text.length > 0) {
        // If we have multiple numbers (e.g. because the OCR picked up other displays)
        // try to find the most likely meter reading
        const possibleReadings = text.match(/\d{4,6}/g);

        if (possibleReadings && possibleReadings.length > 0) {
          // Use the longest matching sequence as it's likely the main display
          text = possibleReadings.reduce((a, b) => a.length >= b.length ? a : b);
        }

        // Convert to a number and format appropriately
        const reading = parseFloat(text);

        if (!isNaN(reading)) {
          // Update the reading in the form
          setMeterReadings(prev => ({
            ...prev,
            [currentProcessingField]: reading.toString()
          }));
          setSuccess(`Заалтыг амжилттай уншлаа: ${reading}`);
        } else {
          setError('Зурагнаас заалтыг таньж чадсангүй. Дахин оролдоно уу эсвэл гараар оруулна уу.');
        }
      } else {
        setError('Зурагнаас заалтыг таньж чадсангүй. Дахин оролдоно уу эсвэл гараар оруулна уу.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Зураг боловсруулахад алдаа гарлаа.');
    } finally {
      setProcessingImage(false);
      setCurrentProcessingField(null);
      setImagePreview(null);
      setImageRotation(0);
      setPendingImageFile(null);
      setIsCropping(false);
      setCropStart(null);
    }
  };

const renderMonthlyData = () => {
  if (!selectedMonth || !waterMeterData[selectedMonth]) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mt-4 text-center w-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 mt-3">Тоолуурын мэдээлэл олдсонгүй</p>
      </div>
    );
  }

  const readings = waterMeterData[selectedMonth];
  const [year, monthNum] = selectedMonth.split('-');
  const monthName = new Date(year, parseInt(monthNum) - 1, 1).toLocaleDateString('mn-MN', { month: 'long' });

  let hotTotal = 0;
  let coldTotal = 0;
  readings.forEach(meter => {
    if (meter.type === 1) {
      hotTotal += meter.indication;
    } else {
      coldTotal += meter.indication;
    }
  });

  let prevHotTotal = 0;
  let prevColdTotal = 0;
  readings.forEach(meter => {
    const prevKey = `${meter.location}-${meter.type}`;
    const prevIndication = previousMonthReadings[prevKey];
    if (meter.type === 1) {
      prevHotTotal += prevIndication !== undefined ? Number(prevIndication) : 0;
    } else {
      prevColdTotal += prevIndication !== undefined ? Number(prevIndication) : 0;
    }
  });

  const hotDiff = (hotTotal - prevHotTotal).toFixed(2);
  const coldDiff = (coldTotal - prevColdTotal).toFixed(2);
  const totalDiff = (hotTotal + coldTotal - prevHotTotal - prevColdTotal).toFixed(2);

  const tableRows = readings.map((meter) => {
    const prevKey = `${meter.location}-${meter.type}`;
    const previousIndication = previousMonthReadings[prevKey];
    const difference = previousIndication !== undefined
      ? (meter.indication - previousIndication).toFixed(2)
      : "-";
    return {
      id: meter.id,
      location: meter.location,
      type: meter.type,
      typeText: meter.type === 1 ? "Халуун ус" : "Хүйтэн ус",
      prev: previousIndication !== undefined ? previousIndication : "-",
      curr: meter.indication,
      diff: difference,
      date: formatDate(meter.date)
    };
  });

  return (
    <div className="w-full flex flex-col md:flex-row bg-white">
      {/* Left side: summary */}
      <div className="md:w-1/5 pb-4 pr-2">
        <h1 className="text-lg font-medium text-[#2D6B9F] mb-2">Таны усны хэрэглээ</h1>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span>
            {year} он {parseInt(monthNum)} сар
          </span>
          <span className="mx-1">•</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {/* Show hot/cold/total difference summary */}
          <div>
            <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Халуун ус</h3>
            <p className="text-gray-700">{hotDiff} м³</p>
          </div>
          <div>
            <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Хүйтэн ус</h3>
            <p className="text-gray-700">{coldDiff} м³</p>
          </div>
          <div>
            <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Нийт ус</h3>
            <p className="text-gray-700">{totalDiff} м³</p>
          </div>
        </div>
      </div>
      {/* Vertical gray line */}
      <div className="hidden md:block w-px bg-gray-300 mx-1"></div>
      {/* Right side: table */}
      <div className="md:w-4/5 flex flex-col h-full">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full bg-white divide-[#2D6B9F]/50 rounded-lg text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Байршил</th>
                <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Төрөл</th>
                <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Өмнөх заалт</th>
                <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Одоогийн заалт</th>
                <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Зөрүү</th>
                <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Огноо</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(row => (
                <tr key={row.id} className="hover:bg-blue-50 transition group">
                  <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-700">{row.location}</td>
                  <td className="px-2 py-2 border-b border-gray-100 text-center text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${row.type === 1 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {row.typeText}
                    </span>
                  </td>
                  <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-500">{row.prev}</td>
                  <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-500">{row.curr}</td>
                  <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-500">{row.diff}</td>
                  <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-500">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

  const renderEntryForm = () => {
    return (
      <div className="bg-white rounded-xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-[#2D6B9F]">Заалт өгөх</h2>
        {error && (
          <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-lg">
            <p>{success}</p>
          </div>
        )}
        <form onSubmit={handleFormSubmit}>
          <div className="overflow-x-auto w-full">
            <table className="min-w-full bg-white divide-[#2D6B9F]/50 rounded-lg text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Байршил</th>
                  <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Төрөл</th>
                  <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Өмнөх заалт</th>
                  <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Одоогийн заалт</th>
                  <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Зураг</th>
                </tr>
              </thead>
              <tbody>
                {expectedMeters.map((meter, index) => {
                  const key = `${meter.location}-${meter.type}`;
                  const prev = previousMonthReadings[key] !== undefined ? previousMonthReadings[key] : '';
                  return (
                    <tr key={index} className="hover:bg-blue-50 transition group">
                      <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-700">{meter.location}</td>
                      <td className="px-2 py-2 border-b border-gray-100 text-center text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${meter.type === 1 ? 'bg-red-100 text-red-800' : 'bg-[#2D6B9F] bg-opacity-10 text-[#2D6B9F]'}`}>
                          {meter.type === 1 ? "Халуун ус" : "Хүйтэн ус"}
                        </span>
                      </td>
                      <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-500">{prev !== '' ? prev : '-'}</td>
                      <td className="px-2 py-2 border-b border-gray-100 text-center text-sm">
                        <input
                          type="number"
                          className="border rounded-lg px-2 py-1 w-24 text-center focus:border-[#2D6B9F] focus:ring-[#2D6B9F]"
                          value={meterReadings[key] || ''}
                          min={prev}
                          onChange={(e) => setMeterReadings({
                            ...meterReadings,
                            [key]: e.target.value
                          })}
                          disabled={processingImage && currentProcessingField === key}
                          inputMode="decimal"
                          style={{ MozAppearance: 'textfield' }}
                          onWheel={e => e.target.blur()}
                        />
                        <style jsx>{`
                          input[type=number]::-webkit-inner-spin-button,
                          input[type=number]::-webkit-outer-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                          }
                        `}</style>
                        {meterReadings[key] !== '' && prev !== '' && Number(meterReadings[key]) < Number(prev) && (
                          <div className="text-xs text-red-600 mt-1">Таны заалт буруу байна та сайн нягтлана уу.</div>
                        )}
                      </td>
                      <td className="px-2 py-2 border-b border-gray-100 text-center text-sm">
                        {processingImage && currentProcessingField === key ? (
                          <div className="animate-spin h-5 w-5 border-t-2 border-[#2D6B9F] rounded-full mx-auto"></div>
                        ) : (
                          <button
                            type="button"
                            className="text-gray-500 hover:text-[#2D6B9F]"
                            onClick={() => handleCameraClick(key)}
                          >
                            <Camera size={20} />
                          </button>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, key)}
                          ref={el => fileInputRef.current[key] = el}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-[#2D6B9F] text-white rounded-lg hover:bg-[#2D6B9F]/90 transition"
              disabled={isSubmitting || processingImage}
            >
              Хадгалах
            </button>
          </div>
        </form>
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[110] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-[#2D6B9F]">
                  Таны энэхүү заалт өөрчлөгдөхгүй тул заалтаа сайн хянана уу!
                </h3>
                <button
                  className="text-gray-600 hover:text-[#2D6B9F] p-2 ml-2"
                  style={{ background: "none", border: "none" }}
                  onClick={handleCancelSubmit}
                  disabled={isSubmitting}
                  title="Болих"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-6">
                <table className="min-w-full bg-white  divide-[#2D6B9F]/50 rounded-lg text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Байршил</th>
                      <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Төрөл</th>
                      <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Өмнөх заалт</th>
                      <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Одоогийн заалт</th>
                      <th className="px-2 py-2 text-center text-sm font-semibold text-[#2D6B9F] border-b border-gray-200">Зөрүү</th>
                    </tr>
                  </thead>
                  <tbody>
                    {differences.map((d, i) => (
                      <tr key={i} className="hover:bg-blue-50 transition group">
                        <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-700">{d.location}</td>
                        <td className="px-2 py-2 border-b border-gray-100 text-center text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${d.type === 1 ? 'bg-red-100 text-red-800' : 'bg-[#2D6B9F] bg-opacity-10 text-[#2D6B9F]'}`}>
                            {d.typeText}
                          </span>
                        </td>
                        <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-500">{d.prev}</td>
                        <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-500">{d.curr}</td>
                        <td className="px-2 py-2 border-b border-gray-100 text-center text-sm text-gray-500">{d.diff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 mt-4">
                <button
                  className="px-6 py-2 bg-[#2D6B9F] text-white rounded-lg hover:bg-[#2D6B9F]/90 transition"
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  type="button"
                >
                  Оруулах
                </button>
              </div>
            </div>
          </div>
        )}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[110] p-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Зураг шалгах</h3>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full flex justify-center mb-4 relative">
                  <div
                    style={{
                      width: 256,
                      height: 256,
                      border: '3px solid #2563eb',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8fafc',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        transform: `rotate(${imageRotation}deg)`,
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Meter Preview"
                        className="rounded border-none"
                        ref={el => {
                          cropImageRef.current = el;
                          if (el && cropImageSize.width === 1) {
                            setTimeout(() => {
                              if (el) setCropImageSize({ width: el.naturalWidth, height: el.naturalHeight });
                            }, 100);
                          }
                        }}
                        style={{
                          display: 'block',
                          userSelect: 'none',
                          cursor: isCropping ? 'crosshair' : 'default',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          margin: 'auto'
                        }}
                        onLoad={handleImageLoad}
                        onMouseDown={handleCropMouseDown}
                        onMouseMove={handleCropMouseMove}
                        onMouseUp={handleCropMouseUp}
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-4 w-full">
                  <button
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={handleRotateImage}
                    type="button"
                  >
                    30° эргүүлэх
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-200 rounded hover:bg-blue-300"
                    onClick={handleStartCrop}
                    type="button"
                  >
                    Зураг хасах (Crop)
                  </button>
                  <span className="text-xs text-gray-500">
                    Зураг дээр хулганаар чирж crop хэсгээ сонгоно уу.
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-[#2D6B9F]/90 text-white hover:bg-[#2D6B9F] flex items-center justify-center px-4 py-2 rounded text-sm font-medium transition duration-200"
                    onClick={handleConfirmImageModal}
                    type="button"
                  >
                    Заалт авах
                  </button>
                  <button
                    className="bg-gray-300 hover:bg-gray-400 flex items-center justify-center px-4 py-2 rounded text-sm font-medium transition duration-200"
                    onClick={handleCancelImageModal}
                    type="button"
                  >
                    Болих
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-8 pt-4">
          <Breadcrumb />
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6B9F]"></div>
        </div>
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-8 pt-4">
          <Breadcrumb />
        </div>
        <div className="flex justify-center items-center h-96">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center max-w-md w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold mt-4 text-[#2D6B9F]">Орон сууц олдсонгүй</h2>
            <p className="mt-2 text-gray-600">Таны хандалтай холбоотой орон сууц олдсонгүй.</p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => window.location.href = '/user/apartments'}
                className="px-6 py-2 bg-[#2D6B9F]/90 text-white rounded-lg hover:bg-[#2D6B9F] transition"
              >
                Орон сууц нэмэх
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        <div className="flex mb-4 justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => window.history.back()}
              className="flex items-center px-2 py-1"
              style={{ color: "#2D6B9F" }}
              title="Буцах"
            >
              <ChevronLeft size={25} />
            </button>
            <span className="text-2xl font-bold text-[#2D6B9F] ml-3 select-none">
              Тоолуурын дэлгэрэнгүй мэдээлэл
            </span>
          </div>
        </div>
        <Breadcrumb />
      </div>
      <div className="max-w-6xl mx-auto py-4 px-4">
        {editMode ? renderEntryForm() : renderMonthlyData()}
      </div>
    </div>
  );
}