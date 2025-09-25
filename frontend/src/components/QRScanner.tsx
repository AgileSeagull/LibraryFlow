import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (qrCode: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError, isScanning }) => {
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('upload');
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle camera start when mode changes to camera
  useEffect(() => {
    if (scanMode === 'camera' && !isCameraActive && !isInitializedRef.current) {
      startCamera();
    } else if (scanMode === 'upload' && isCameraActive) {
      stopCamera();
    }
  }, [scanMode]);

  const startCamera = async () => {
    // Prevent multiple initializations
    if (isCameraActive || isInitializedRef.current) {
      return;
    }

    try {
      setCameraError('');
      isInitializedRef.current = true;
      
      // Check if scanner already exists
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e) {
          // Ignore errors if already stopped
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          // Don't stop camera, allow continuous scanning
        },
        (errorMessage) => {
          // Ignore continuous scanning errors
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      isInitializedRef.current = false;
      console.error('Camera start error:', err);
      let errorMsg = 'Failed to start camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Please grant camera permissions.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No camera found on this device.';
      } else {
        errorMsg += 'Try using the upload option instead.';
      }
      
      setCameraError(errorMsg);
      if (onScanError) onScanError(errorMsg);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (isCameraActive) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        setIsCameraActive(false);
        isInitializedRef.current = false;
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping camera:', err);
        // Force cleanup
        setIsCameraActive(false);
        isInitializedRef.current = false;
        scannerRef.current = null;
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setCameraError('');
      const html5QrCode = new Html5Qrcode('qr-reader-upload');
      const result = await html5QrCode.scanFile(file, true);
      onScanSuccess(result);
      
      // Clear the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const errorMsg = 'Failed to scan QR code from image. Please try again with a clearer image.';
      setCameraError(errorMsg);
      if (onScanError) onScanError(errorMsg);
      
      // Clear the file input even on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Mode Selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={async () => {
            if (scanMode !== 'camera') {
              await stopCamera();
              setScanMode('camera');
            }
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            scanMode === 'camera'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Camera Scan
          </div>
        </button>

        <button
          onClick={async () => {
            if (scanMode !== 'upload') {
              await stopCamera();
              setScanMode('upload');
            }
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            scanMode === 'upload'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Image
          </div>
        </button>
      </div>

      {/* Scanner Area */}
      {scanMode === 'camera' ? (
        <div>
          <div 
            id="qr-reader" 
            className="rounded-lg overflow-hidden border-4 border-blue-600 bg-black"
            style={{ maxWidth: '100%' }}
          ></div>
          
          {cameraError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">{cameraError}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Try switching to "Upload Image" mode instead.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isCameraActive && !cameraError && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center">
                <svg className="w-4 h-4 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" />
                </svg>
                Camera active. Point at a QR code to scan.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div 
            id="qr-reader-upload" 
            className="hidden"
          ></div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={handleUploadClick}
            className="w-full py-16 border-4 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="flex flex-col items-center">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-gray-700 mb-1">Click to upload QR code image</p>
              <p className="text-sm text-gray-500">or drag and drop</p>
            </div>
          </button>

          {cameraError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{cameraError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRScanner;

