export const  formatDuration = (duration: number | undefined):string => {
    if (duration === undefined || duration <= 0) return '00:00:00';

    const h = Math.floor(duration / 3600);
    const m = Math.floor((duration % 3600) / 60);
    const s = Math.floor(duration % 60);


    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}