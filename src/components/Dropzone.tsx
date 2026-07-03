import { useDropzone } from 'react-dropzone';
import { Loader2, Lock, CheckCircle, MousePointerClick } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dropzone({ onDrop, isProcessing, file, label, color, disabled, id }: { 
  onDrop: (files: File[]) => void, 
  isProcessing: boolean, 
  file?: File,
  label: string,
  color: string,
  disabled?: boolean,
  id?: string
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    disabled: isProcessing || disabled,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
      'application/json': ['.json'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  } as any);

  return (
    <div 
      {...getRootProps()} 
      id={id}
      className={cn(
        "relative group cursor-pointer transition-all duration-500",
        "border-2 border-dashed rounded-[32px] p-10 text-center",
        isDragActive ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[1.02]" : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-indigo-200 hover:bg-[var(--bg-primary)] hover:shadow-xl hover:shadow-indigo-100/20",
        (isProcessing || disabled) && "opacity-50 cursor-not-allowed",
        file && "border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-900/10",
        disabled && "grayscale grayscale-0 hover:grayscale-0"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-5">
        <div className={cn(
          "w-16 h-16 rounded-[20px] flex items-center justify-center transition-all duration-500 shadow-lg",
          file ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-[var(--bg-primary)] text-[var(--text-tertiary)] group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200",
          disabled && "bg-[var(--bg-secondary)] text-[var(--text-tertiary)] group-hover:bg-[var(--bg-secondary)] group-hover:text-[var(--text-tertiary)]"
        )}>
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : disabled ? (
            <Lock className="w-8 h-8" />
          ) : file ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <MousePointerClick className="w-8 h-8" />
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-black tracking-tight text-[var(--text-primary)]">
            {isProcessing ? "Analyzing DNA..." : disabled ? "Limit Reached" : file ? file.name : label}
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
            {disabled ? "Upgrade to continue" : file ? `${(file.size / 1024).toFixed(1)} KB` : "PDF, DOCX, TXT or Image"}
          </p>
        </div>
      </div>
    </div>
  );
}
