const maxPeaks = 100000;

type AudioPeak = [number, number];

/**
 * Class extracting audio waves from video and audio elements.
 */
export class AudioWaveParser {

    getWaves(media: string, duration: number): Promise<AudioPeak[]> {
        const peaks = this.calculateNumberOfPeaks(duration);

        return new Promise<AudioPeak[]>((resolve, reject) => {
            this.getData(media, peaks, waves => {
                resolve(waves);
            }, _ => {
                reject();
            });
        });
    }

    private calculateNumberOfPeaks(mediaDuration: number) {
        let peaks = Math.ceil(Math.min(mediaDuration * 60, maxPeaks));
        const mod = peaks % 100;
        peaks += 100 - mod;
        return peaks;

    }

    /**
     * Get audio data as numeric array in a callback. The returned data will be an array
     * of numbers where index % 0 is high and index % 1 is low. The size of the array returned
     * will be peakCount * 2.
     * @param url 
     * @param peakCount number of peaks to return
     * @param callback 
     */
    private getData(media: string, peakCount: number, callback: (data: AudioPeak[]) => void, onError: (message: string) => void) {

        const url = media;

        if (!url) {
            onError("no url");
            return;
        }

        const now = Date.now();

        const ctx = this.createAudioContext();

        if (!ctx) {
            onError("No Audio context");
            return;
        }

        const req = this.createXmlHttp();
        req.open('GET', url, true);
        req.responseType = 'arraybuffer';

        req.addEventListener("load", () => {

            ctx.decodeAudioData(req.response, buffer => {
                const response = this.getPeaks(buffer, peakCount);
                callback(response);
            }, _ => {
                onError("unable to decode");
            }).catch(_ => {
                onError("unable to decode");
            });
        });

        req.addEventListener("error", () => {
            onError("Unable to load media " + url);
        });

        req.send();
    }

    /**
     * Detects present of audio track and returns a boolean Promise.
     * The passed boolean will be true if given media element has sound tracks.
     * @param media 
     */
    detectAudio(media: string): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {

            const url = media;
            const audioContext = this.createAudioContext();

            if (!url || !audioContext) {
                resolve(false);
                return;
            }

            const req = this.createXmlHttp();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';

            req.addEventListener("load", () => {

                const successCallback = () => resolve(true);
                const errorCallback = () => resolve(false);

                audioContext
                    .decodeAudioData(req.response, successCallback, errorCallback)
                    .catch(_ => {
                        resolve(false);
                    });
            });

            req.addEventListener("error", () => {
                resolve(false);
            });

            req.send();

        });
    }

    private createXmlHttp() {
        return new XMLHttpRequest();
    }

    private createAudioContext() {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext || false);
        if (!AudioContextClass) {
            return;
        }
        return new AudioContextClass() as AudioContext;
    }

    /**
     * Returns audio data as a numeric array, double the size of given peakCount.
     * The returned value will be in pairs of min and max(index 0= max, index 1 = min, index 2 = max ...). 
     * 
     * All values returned will be in the range -1 to 1
     * 
     * @param peakCount 
     * @param buffer 
     * 
     * ref: https://thoughtbot.com/blog/javascript-audio-api
     */
    private getPeaks(buffer: AudioBuffer, peakCount: number) {
        const sampleSize = buffer.length / peakCount;
        const sampleStep = ~~(sampleSize / 10) || 1;
        const numberOfChannels = buffer.numberOfChannels;
        const mergedPeaks = [];

        for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
            const peaks = [];
            const channelData = buffer.getChannelData(channelNumber);

            for (let peakNumber = 0; peakNumber < peakCount; peakNumber++) {
                const start = ~~(peakNumber * sampleSize);
                const end = ~~(start + sampleSize);
                let min = channelData[0];
                let max = channelData[0];

                for (let sampleIndex = start; sampleIndex < end; sampleIndex += sampleStep) {
                    const value = channelData[sampleIndex];

                    if (value > max) { max = value; }
                    if (value < min) { min = value; }
                }

                peaks[2 * peakNumber] = max;
                peaks[2 * peakNumber + 1] = min;

                if (channelNumber === 0 || max > mergedPeaks[2 * peakNumber]) {
                    mergedPeaks[2 * peakNumber] = max;
                }

                if (channelNumber === 0 || min < mergedPeaks[2 * peakNumber + 1]) {
                    mergedPeaks[2 * peakNumber + 1] = min;
                }
            }
        }

        const ret: AudioPeak[] = [];

        for (let i = 0; i < mergedPeaks.length; i += 2) {
            ret.push([
                mergedPeaks[i],
                mergedPeaks[i + 1]
            ]);
        }

        return ret;
    }
}