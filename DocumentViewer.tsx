import React, { useState, useRef, useEffect } from 'react';
import { Document } from '../types';
import { XMarkIcon, ArrowTopRightOnSquareIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const PdfContentViewer: React.FC<{ document: Document, containerRef: React.RefObject<HTMLDivElement> }> = ({ document, containerRef }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    const toggleFullScreen = () => {
        if (!containerRef.current) return;
        if (!window.document.fullscreenElement && !isFullScreen) {
            containerRef.current.requestFullscreen().then(() => setIsFullScreen(true)).catch(err => console.error(err));
        } else {
            window.document.exitFullscreen().then(() => setIsFullScreen(false)).catch(err => console.error(err));
        }
    };
    
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!window.document.fullscreenElement);
        };
        window.document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => window.document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-shrink-0 bg-background/50 backdrop-blur-sm p-2 rounded-t-md flex items-center justify-between border-b border-accent">
                <p className="text-sm text-text-secondary">Use browser controls (Ctrl + Scroll) or the PDF viewer's own controls for zoom and page navigation.</p>
                <div className="flex items-center gap-2">
                    <button onClick={toggleFullScreen} className="p-2 rounded-md hover:bg-accent" title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                        {isFullScreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
                    </button>
                    <a href={`https://drive.google.com/file/d/${document.driveFileId}/view`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-accent" title="Open in Google Drive">
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </a>
                </div>
            </div>
            <div className="flex-grow w-full h-full">
                <iframe src={`https://drive.google.com/file/d/${document.driveFileId}/preview`} width="100%" height="100%" className="border-0"></iframe>
            </div>
        </div>
    );
};

const ImageContentViewer: React.FC<{ document: Document }> = ({ document }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const imgRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0 });

    const handleZoom = (direction: 'in' | 'out') => {
        setScale(prev => Math.max(0.1, direction === 'in' ? prev * 1.2 : prev / 1.2));
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) handleZoom('in');
        else handleZoom('out');
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        startPosRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        if(imgRef.current) imgRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - startPosRef.current.x,
            y: e.clientY - startPosRef.current.y
        });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = false;
        if(imgRef.current) imgRef.current.style.cursor = 'grab';
    };
    
    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    return (
        <div className="w-full h-full flex flex-col">
             <div className="flex-shrink-0 bg-background/50 backdrop-blur-sm p-2 rounded-t-md flex items-center justify-end border-b border-accent gap-2">
                 <button onClick={() => handleZoom('in')} className="p-2 rounded-md hover:bg-accent" title="Zoom In"><MagnifyingGlassPlusIcon className="w-5 h-5" /></button>
                 <button onClick={() => handleZoom('out')} className="p-2 rounded-md hover:bg-accent" title="Zoom Out"><MagnifyingGlassMinusIcon className="w-5 h-5" /></button>
                 <button onClick={resetView} className="p-2 rounded-md hover:bg-accent" title="Reset View"><ArrowPathIcon className="w-5 h-5" /></button>
                 <a href={`https://drive.google.com/file/d/${document.driveFileId}/view`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-accent" title="Open in Google Drive"><ArrowTopRightOnSquareIcon className="w-5 h-5" /></a>
            </div>
            <div 
                className="flex-grow w-full h-full overflow-hidden" 
                ref={imgRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <img 
                    src={`https://lh3.googleusercontent.com/d/${document.driveFileId}=s2048`} 
                    alt={document.name}
                    className="max-w-full max-h-full object-contain"
                    style={{ 
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        cursor: 'grab',
                        transition: 'transform 0.1s ease-out',
                    }}
                />
            </div>
        </div>
    );
};

const DocumentViewer: React.FC<{ document: Document; onClose: () => void; }> = ({ document, onClose }) => {
    const isImage = document.mimeType.startsWith('image/');
    const isPdf = document.mimeType === 'application/pdf';
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4 sm:p-8" onClick={onClose}>
            <div ref={containerRef} className="bg-surface rounded-xl shadow-2xl w-full h-full p-2 sm:p-4 relative flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center pb-2 mb-2 border-b border-accent">
                    <h2 className="text-xl font-bold text-text-primary truncate pr-4">{document.name}</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-primary transition-transform hover:rotate-90"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-grow relative bg-background rounded-md overflow-hidden">
                    {isPdf && <PdfContentViewer document={document} containerRef={containerRef} />}
                    {isImage && <ImageContentViewer document={document} />}
                    {!isPdf && !isImage && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                            <p className="text-lg font-semibold">Preview not available for this file type.</p>
                            <p className="text-text-secondary mb-4">MIME Type: {document.mimeType}</p>
                            <a href={`https://drive.google.com/file/d/${document.driveFileId}/view`} target="_blank" rel="noopener noreferrer" className="bg-primary text-white py-2 px-6 rounded-md font-semibold hover:bg-primary-light">
                                Open in Google Drive
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;