import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";

interface QRScannerProps {
  onScan: (data: { lectureId: number; classAddress: string }) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, onCancel }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScan = (data: any) => {
    if (data) {
      try {
        // Handle different QR scanner response formats
        const rawData = data.text || data;
        let parsedData;
        
        if (typeof rawData === 'string') {
          parsedData = JSON.parse(rawData);
        } else {
          parsedData = rawData;
        }
        
        if (parsedData && parsedData.lectureId && parsedData.classAddress) {
          setIsScanning(false);
          onScan({
            lectureId: Number(parsedData.lectureId),
            classAddress: parsedData.classAddress
          });
        } else {
          setScanError("Invalid QR code format. Please scan a valid attendance QR code.");
        }
      } catch (error) {
        console.error("Error parsing QR code data:", error);
        setScanError("Could not parse QR code data. Please try again.");
      }
    }
  };

  const handleError = (err: Error) => {
    console.error("QR Scanner error:", err);
    onError(err);
  };

  return (
    <Card className="p-4 flex flex-col items-center">
      <div className="w-full max-w-sm mx-auto">
        {isScanning && (
          <>
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%', height: 'auto' }}
              constraints={{
                video: {
                  facingMode: 'environment'
                }
              }}
            />
            <div className="flex justify-center items-center mt-4">
              <LoaderCircle className="animate-spin mr-2" size={16} />
              <p>Scanning... Position QR code in view</p>
            </div>
          </>
        )}
        
        {scanError && (
          <div className="text-red-500 mt-2 text-center">
            {scanError}
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {scanError && (
          <Button onClick={() => {
            setScanError(null);
            setIsScanning(true);
          }}>
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
};

export default QRScanner; 