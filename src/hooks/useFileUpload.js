import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadFile } from '../services/api';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../constants';

const BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.js', '.vbs', '.wsf'];

function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Executable files are not allowed for security reasons.' };
  }
  const allowedExts = Object.values(ALLOWED_FILE_TYPES).map(t => t.ext);
  if (!allowedExts.includes(ext)) {
    return { valid: false, error: `Unsupported file type "${ext}". Allowed: ${allowedExts.join(', ')}` };
  }
  if (file.size === 0) {
    return { valid: false, error: 'Empty files are not allowed.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` };
  }
  return { valid: true, error: null };
}

export function useFileUpload() {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  const upload = useCallback(async (file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setStatus('error');
      setError(validation.error);
      return null;
    }

    setStatus('uploading');
    setProgress(0);
    setError(null);
    controllerRef.current = new AbortController();

    try {
      const result = await uploadFile(file, (p) => setProgress(p), controllerRef.current.signal);
      setStatus('success');
      setProgress(100);
      setUploadedData(result);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle');
        setProgress(0);
        setError(null);
        return null;
      }
      setStatus('error');
      setError(err.message || 'Upload failed. Please try again.');
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, []);

  const retry = useCallback(async (file) => {
    if (file) return upload(file);
    return null;
  }, [upload]);

  const removeFile = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setUploadedData(null);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setUploadedData(null);
  }, []);

  return { status, progress, error, uploadedData, upload, cancel, retry, removeFile, reset };
}