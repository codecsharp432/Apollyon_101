import React from 'react';

export const TerminalButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'warning';
  className?: string;
}> = ({ onClick, children, disabled, variant = 'primary', className = '' }) => {
  
  const baseStyles = "relative px-6 py-3 font-display uppercase tracking-widest text-sm transition-all duration-100 border focus:outline-none group";
  
  const variants = {
    primary: "border-term-green text-term-green hover:bg-term-green hover:text-black disabled:border-term-green-dim disabled:text-term-green-dim",
    danger: "border-term-red text-term-red hover:bg-term-red hover:text-black",
    warning: "border-term-amber text-term-amber hover:bg-term-amber hover:text-black"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      {!disabled && <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity" />}
    </button>
  );
};

export const Panel: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({ children, title, className = '' }) => (
  <div className={`border border-term-green/30 bg-term-black/80 p-6 relative ${className}`}>
    {title && (
      <div className="absolute -top-3 left-4 bg-term-black px-2 text-term-green text-xs font-mono border border-term-green/30">
        [{title}]
      </div>
    )}
    {/* Corner Decorations */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-term-green"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-term-green"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-term-green"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-term-green"></div>
    
    {children}
  </div>
);

export const LoadingBar: React.FC<{ progress: number; label?: string }> = ({ progress, label }) => (
  <div className="w-full">
    <div className="flex justify-between text-xs font-mono text-term-green mb-1">
      <span>{label || 'PROCESSING'}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="h-2 w-full border border-term-green/50 p-[1px]">
      <div 
        className="h-full bg-term-green transition-all duration-300 ease-out" 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

export const TypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 20, onComplete }) => {
  const [displayed, setDisplayed] = React.useState('');
  
  React.useEffect(() => {
    let index = 0;
    setDisplayed('');
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayed((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <span>{displayed}</span>;
};
