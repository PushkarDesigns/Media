import { BadgeCheck, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const StoryViewer = ({ viewStory, setViewStory }) => {

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let timer, progressInterval;
        if (viewStory && viewStory.media_type !== 'video') {
            setProgress(0);
            const duration = 10000; // 10 seconds total
            const setTime = 100;    // Update every 100ms
            let elapsed = 0;

            progressInterval = setInterval(() => {
                elapsed += setTime;
                setProgress((elapsed / duration) * 100);
            }, setTime);

            // close story after 10seconds duration
            timer = setTimeout(() => {
                setViewStory(null);
            }, duration);
        }
        // Cleanup function to clear the timer
        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
    }, [viewStory, setViewStory]);

    const handleClose = () => {
        setViewStory(null)
    }

    const renderContent = () => {
        switch (viewStory.media_type) {
            case 'image':
                return (
                    <img src={viewStory.media_url} className='max-w-full max-h-screen object-contain' />
                );
            case 'video':
                return (
                    <video src={viewStory.media_url} className='max-h-screen' onEnded={() => setViewStory(null)} controls autoPlay />
                );
            case 'text':
                return (
                    <div className='w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center'>
                        {viewStory.content}
                    </div>
                )
            default:
                return null;
        }
    }

    return (
        <div className='fixed inset-0 h-screen bg-black bg-opacity-90 z-110 flex items-center justify-center' style={{ backgroundColor: viewStory.media_type === 'text' ? viewStory.background_color : '#000000' }}>

            {/* Progress Bar */}
            <div className='absolute top-0 left-0 w-full h-1 bg-gray-700'>
                <div className='h-full bg-white transition-all duration-100 ease-linear'
                    style={{ width: `${progress}%` }}>
                </div>
            </div>
            {/* user info - top left */}
            <div className='absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50'>
                <img src={viewStory.user?.profile_picture}
                    alt="" className='size-7 sm:size-8 rounded-full object-cover border border-white' />
                <div className='text-white font-medium flex items-center gap-1.5'>
                    <span>{viewStory.user?.full_name}</span>
                    <BadgeCheck size={18} />
                </div>
            </div>
            {/* Close Button */}
            <button onClick={handleClose} className='absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none'>
                <X className='w-8 h-8 hover:scale-110 transition cursor-pointer' />
            </button>
            {/* Content Wrapper */}
            <div className='max-w-[90vw] max-h-[90vh] flex items-center justify-center'>
                <div className='text-white text-center text-xl sm:text-3xl font-bold px-4'>
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}

export default StoryViewer;
