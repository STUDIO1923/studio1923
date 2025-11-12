import React, { useState, useEffect } from 'react';

const AnalogClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    const secondHandRotation = seconds * 6;
    const minuteHandRotation = minutes * 6 + seconds * 0.1;
    const hourHandRotation = (hours % 12) * 30 + minutes * 0.5;

    return (
        <div className="relative w-10 h-10">
            <div className="w-full h-full rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
                {/* Hour Hand */}
                <div
                    className="absolute w-0.5 h-1/3 bg-slate-300 rounded-full"
                    style={{
                        transform: `rotate(${hourHandRotation}deg)`,
                        transformOrigin: 'bottom',
                        bottom: '50%',
                    }}
                ></div>
                {/* Minute Hand */}
                <div
                    className="absolute w-0.5 h-2/5 bg-slate-400 rounded-full"
                    style={{
                        transform: `rotate(${minuteHandRotation}deg)`,
                        transformOrigin: 'bottom',
                        bottom: '50%',
                    }}
                ></div>
                {/* Second Hand */}
                <div
                    className="absolute w-px h-1/2 bg-indigo-400"
                    style={{
                        transform: `rotate(${secondHandRotation}deg)`,
                        transformOrigin: 'bottom',
                        bottom: '50%',
                    }}
                ></div>
                {/* Center Dot */}
                <div className="absolute w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
            </div>
        </div>
    );
};

export default AnalogClock;