import React, { useRef, useState, useEffect } from 'react';

export default function CustomerPhotoCapture({ value, onChange }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [open, setOpen]   = useState(false);
  const [error, setError] = useState('');

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setError('');
    try {
      // Use 'environment' instead of 'user' for back camera on mobile
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setOpen(true);
    } catch {
      setError('Camera access denied or not available. Please allow camera permission and use HTTPS.');
    }
  };

  const capture = () => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    // TODO: move to cloud storage (Vercel Blob) when customer count grows
    onChange(canvas.toDataURL('image/jpeg', 0.7));
    stopCamera();
    setOpen(false);
  };

  const remove = () => { onChange(null); stopCamera(); setOpen(false); };

  return (
    <div>
      <label className="label">Customer Photo (optional)</label>

      {open && (
        <div className="space-y-3 mb-2">
          <video ref={videoRef} autoPlay playsInline
            className="w-full max-w-xs rounded-xl border border-royal-200 dark:border-slate-600 bg-black" />
          <div className="flex gap-2">
            <button type="button" onClick={capture} className="btn-gold px-4 py-2 text-sm">📸 Capture</button>
            <button type="button" onClick={() => { stopCamera(); setOpen(false); }} className="btn-outline px-4 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {!open && (
        <div className="flex items-center gap-3">
          {value ? (
            <>
              <img src={value} alt="Customer"
                className="w-16 h-16 rounded-xl object-cover border-2 border-gold-400/40 flex-shrink-0" />
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={startCamera} className="btn-outline px-3 py-1.5 text-xs">🔄 Retake</button>
                <button type="button" onClick={remove} className="text-red-400 hover:underline text-xs font-semibold text-left">✕ Remove</button>
              </div>
            </>
          ) : (
            <button type="button" onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed
                         border-royal-200 dark:border-slate-600 text-slate-500 dark:text-slate-400
                         hover:border-gold-400 hover:text-gold-500 transition-all text-sm font-semibold">
              📷 Take Photo
            </button>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
