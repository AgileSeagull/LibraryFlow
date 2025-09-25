import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';
import qrService from '../../services/qrService';

const MyQRCode: React.FC = () => {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const response = await qrService.getMyQRCode();
      setQrData(response.qrCode);
      
      // Generate QR code
      if (qrRef.current) {
        await QRCode.toCanvas(qrRef.current, response.qrCode, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Also generate data URL for download
        const url = await QRCode.toDataURL(response.qrCode, {
          width: 512,
          margin: 2
        });
        setQrCodeUrl(url);
      }
    } catch (err: any) {
      console.error('Failed to fetch QR code:', err);
      setError(err.response?.data?.message || 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `LibraryFlow-QR-${user?.firstName}_${user?.lastName}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ {error}</div>
          <button onClick={fetchQRCode} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">My QR Code</h1>
            <p className="text-blue-100">Use this code for library entry and exit</p>
          </div>

          {/* QR Code Display */}
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* QR Code */}
              <div className="flex-1 flex flex-col items-center">
                <div className="bg-white p-8 rounded-lg border-4 border-blue-600 shadow-xl">
                  <canvas 
                    ref={qrRef}
                    className="max-w-full h-auto"
                  />
                </div>
                
                <button
                  onClick={downloadQRCode}
                  className="mt-6 btn-primary inline-flex items-center"
                  disabled={!qrCodeUrl}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR Code
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>
                
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg text-gray-900">{user?.email}</p>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-lg text-gray-900">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {user?.role}
                      </span>
                    </p>
                  </div>

                  <div className="pb-4">
                    <label className="text-sm font-medium text-gray-500">QR Code ID</label>
                    <p className="text-lg font-mono font-semibold text-gray-900 break-all">
                      {qrData}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">How to use your QR Code</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">1.</span>
                  <span>Show this QR code at the library entrance/exit scanner</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">2.</span>
                  <span>The system will automatically log your entry or exit</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">3.</span>
                  <span>You can download and save this QR code for offline use</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">4.</span>
                  <span>Make sure the QR code is clearly visible when scanning</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyQRCode;

