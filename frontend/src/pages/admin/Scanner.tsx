import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../../components/QRScanner';
import qrService, { ScanResult, OccupancyStatus } from '../../services/qrService';

interface ScanHistory {
  id: string;
  userName: string;
  type: 'ENTRY' | 'EXIT';
  timestamp: string;
  occupancy: number;
}

const Scanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [occupancy, setOccupancy] = useState<OccupancyStatus | null>(null);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOccupancy();
  }, []);

  const fetchOccupancy = async () => {
    try {
      const status = await qrService.getOccupancy();
      setOccupancy(status);
    } catch (err) {
      console.error('Failed to fetch occupancy:', err);
    }
  };

  const playSuccessSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const handleScanSuccess = async (qrCode: string) => {
    if (processing) return; // Prevent duplicate scans
    
    try {
      setProcessing(true);
      setError('');
      
      const result = await qrService.scanQRCode(qrCode);
      setCurrentScan(result);
      setOccupancy({
        currentOccupancy: result.currentOccupancy,
        maxCapacity: result.maxCapacity,
        isAtCapacity: result.isAtCapacity
      });

      // Play success sound
      playSuccessSound();

      // Add to history
      const newHistory: ScanHistory = {
        id: Date.now().toString(),
        userName: result.userName,
        type: result.type,
        timestamp: result.timestamp,
        occupancy: result.currentOccupancy
      };

      setScanHistory(prev => [newHistory, ...prev].slice(0, 10)); // Keep last 10

      // Clear current scan after 3 seconds
      setTimeout(() => {
        setCurrentScan(null);
      }, 3000);

    } catch (err: any) {
      console.error('Scan error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Scan failed';
      setError(errorMsg);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      // Allow next scan after 1 second
      setTimeout(() => {
        setProcessing(false);
      }, 1000);
    }
  };

  const handleScanError = (errorMsg: string) => {
    setError(errorMsg);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
              <p className="text-gray-600">Scan student QR codes for entry/exit</p>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Scanner</h2>
              
              {/* Current Scan Result */}
              {currentScan && (
                <div className={`mb-6 p-6 rounded-lg border-2 ${
                  currentScan.type === 'ENTRY' 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-2xl font-bold ${
                        currentScan.type === 'ENTRY' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {currentScan.type} ✓
                      </p>
                      <p className={`text-lg ${
                        currentScan.type === 'ENTRY' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {currentScan.userName}
                      </p>
                    </div>
                    <div className={`text-4xl ${
                      currentScan.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {currentScan.type === 'ENTRY' ? '→' : '←'}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* QR Scanner */}
              <QRScanner 
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                isScanning={isScanning}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Occupancy Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
              
              {occupancy && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Occupancy</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {occupancy.currentOccupancy} / {occupancy.maxCapacity}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        occupancy.isAtCapacity
                          ? 'bg-red-500'
                          : occupancy.currentOccupancy / occupancy.maxCapacity >= 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((occupancy.currentOccupancy / occupancy.maxCapacity) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>

                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    occupancy.isAtCapacity
                      ? 'bg-red-100 text-red-800'
                      : occupancy.currentOccupancy / occupancy.maxCapacity >= 0.8
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      occupancy.isAtCapacity
                        ? 'bg-red-500'
                        : occupancy.currentOccupancy / occupancy.maxCapacity >= 0.8
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}></div>
                    {occupancy.isAtCapacity
                      ? 'At Capacity'
                      : occupancy.currentOccupancy / occupancy.maxCapacity >= 0.8
                      ? 'Almost Full'
                      : 'Available'}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Scans */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h3>
              
              {scanHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No scans yet</p>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan) => (
                    <div 
                      key={scan.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{scan.userName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(scan.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          scan.type === 'ENTRY'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {scan.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;

