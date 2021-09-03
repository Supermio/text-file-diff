"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamLineReader = void 0;
const events_1 = require("events");
const types_1 = require("./types");
const fs_1 = require("fs");
const readline_1 = require("readline");
// import myDebug = require('debug');
// const debug = myDebug('text-file-diff');
class StreamLineReader {
    constructor() {
        this.value = '';
        this.nextValue = '';
        this.lineNumber = -1;
        this.eof = -1;
    }
    async init(readStream) {
        const rl = (0, readline_1.createInterface)({
            input: readStream,
            crlfDelay: Number.POSITIVE_INFINITY
        });
        this.it = rl[Symbol.asyncIterator]();
        // move to first line
        await this.moveNext();
        await this.moveNext();
        return this;
    }
    async moveNext() {
        this.value = this.nextValue;
        const nextResult = await this.it.next();
        if (nextResult.done) {
            this.eof++;
            nextResult.value = '';
        }
        this.nextValue = nextResult.value;
        this.lineNumber++;
        return this.value;
    }
}
exports.StreamLineReader = StreamLineReader;
/**
 * line by line diff of two files
 */
class TextFileDiff extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = new types_1.TextFileDiffOption();
        Object.assign(this.options, options);
    }
    /**
     * run diff
     * @param  String file1 path to file 1
     * @param  String file2 path to file 2
     * @return Object         self
     */
    async diff(file1, file2) {
        const stream1 = (0, fs_1.createReadStream)(file1);
        const stream2 = (0, fs_1.createReadStream)(file2);
        return this.diffStream(stream1, stream2);
    }
    async diffplus(file1, encoding1, file2, encoding2) {
        const stream1 = (0, fs_1.createReadStream)(file1, {
            encoding: encoding1
        });
        const stream2 = (0, fs_1.createReadStream)(file2, {
            encoding: encoding2
        });
        return this.diffStream(stream1, stream2);
    }
    /**
     * run diffStream
     * @param  Readable stream1
     * @param  Readable stream2
     * @return Object         self
     */
    async diffStream(stream1, stream2) {
        const lineReader1 = await (new StreamLineReader()).init(stream1);
        const lineReader2 = await (new StreamLineReader()).init(stream2);
        if (this.options.skipHeader) {
            await lineReader1.moveNext();
            await lineReader2.moveNext();
        }
        /* eslint-disable no-await-in-loop */
        // while both files has valid val, check eof counter
        while (lineReader1.eof < 2 && lineReader2.eof < 2) {
            await this.doCompareLineReader(lineReader1, lineReader2);
        }
        /* eslint-enable no-await-in-loop */
        return this;
    }
    async doCompareLineReader(lineReader1, lineReader2) {
        // forEach line in File1, compare to line in File2
        const line1 = lineReader1.value;
        const line2 = lineReader2.value;
        const cmpar = this.options.compareFn(line1, line2);
        // debug(line1, line1, cmpar);
        // debug(lineReader1.nextValue, lineReader2.nextValue, 'next', lineReader1.eof, lineReader2.eof);
        // emit on compared
        this.emit('compared', line1, line2, cmpar, lineReader1, lineReader2);
        if (cmpar > 0) {
            // line1 > line2: new line detected
            // if file2 ended before file1, then file2 lost line1
            // else file2 has new line
            if (lineReader2.eof > lineReader1.eof) {
                this.emit('-', line1, lineReader1, lineReader2);
            }
            else {
                this.emit('+', line2, lineReader1, lineReader2);
            }
            // incr File2 to next line
            await lineReader2.moveNext();
        }
        else if (cmpar < 0) {
            // line1 < line2: deleted line
            // if file1 ended before file2, then file2 has new line
            // else file1 lost a line
            if (lineReader1.eof > lineReader2.eof) {
                this.emit('+', line2, lineReader1, lineReader2);
            }
            else {
                this.emit('-', line1, lineReader1, lineReader2);
            }
            // incr File1 to next line
            await lineReader1.moveNext();
        }
        else {
            // equals: 0 incr both files to next line
            await lineReader1.moveNext();
            await lineReader2.moveNext();
        }
    }
}
exports.default = TextFileDiff;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW9DO0FBQ3BDLG1DQUEyQztBQUMzQywyQkFBOEM7QUFDOUMsdUNBQW9EO0FBR3BELHFDQUFxQztBQUNyQywyQ0FBMkM7QUFFM0MsTUFBYSxnQkFBZ0I7SUFBN0I7UUFDRSxVQUFLLEdBQVcsRUFBRSxDQUFDO1FBQ25CLGNBQVMsR0FBVyxFQUFFLENBQUM7UUFDdkIsZUFBVSxHQUFXLENBQUMsQ0FBQyxDQUFDO1FBRXhCLFFBQUcsR0FBVyxDQUFDLENBQUMsQ0FBQztJQTZCbkIsQ0FBQztJQTVCQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQTJCO1FBQ3BDLE1BQU0sRUFBRSxHQUFHLElBQUEsMEJBQWUsRUFBQztZQUN6QixLQUFLLEVBQUUsVUFBVTtZQUNqQixTQUFTLEVBQUUsTUFBTSxDQUFDLGlCQUFpQjtTQUNwQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztRQUVyQyxxQkFBcUI7UUFDckIsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdEIsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFdEIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsS0FBSyxDQUFDLFFBQVE7UUFDWixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFFNUIsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXhDLElBQUksVUFBVSxDQUFDLElBQUksRUFBRTtZQUNuQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDWCxVQUFVLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztTQUN2QjtRQUVELElBQUksQ0FBQyxTQUFTLEdB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QUksV0FBVyxDQUFDLEdBQUcsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFO2dCQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2FBQ2pEO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7YUFDakQ7WUFFRCwwQkFBMEI7WUFDMUIsTUFBTSxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDOUI7YUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7WUFDcEIsOEJBQThCO1lBQzlCLHVEQUF1RDtZQUN2RCx5QkFBeUI7WUFDekIsSUFBSSxXQUFXLENBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7YUFDakQ7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQzthQUNqRDtZQUVELDBCQUEwQjtZQUMxQixNQUFNLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUM5QjthQUFNO1lBQ0wseUNBQXlDO1lBQ3pDLE1BQU0sV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzdCLE1BQU0sV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQzlCO0lBQ0gsQ0FBQztDQUNGO0FBdEdELCtCQXNHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IHtUZXh0RmlsZURpZmZPcHRpb259IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtQYXRoTGlrZSwgY3JlYXRlUmVhZFN0cmVhbX0gZnJvbSAnZnMnO1xuaW1wb3J0IHtJbnRlcmZhY2UsIGNyZWF0ZUludGVyZmFjZX0gZnJvbSAncmVhZGxpbmUnO1xuaW1wb3J0IHN0cmVhbSBmcm9tICdzdHJlYW0nO1xuXG4vLyBpbXBvcnQgbXlEZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJyk7XG4vLyBjb25zdCBkZWJ1ZyA9IG15RGVidWcoJ3RleHQtZmlsZS1kaWZmJyk7XG5cbmV4cG9ydCBjbGFzcyBTdHJlYW1MaW5lUmVhZGVyIHtcbiAgdmFsdWU6IHN0cmluZyA9ICcnO1xuICBuZXh0VmFsdWU6IHN0cmluZyA9ICcnO1xuICBsaW5lTnVtYmVyOiBudW1iZXIgPSAtMTtcbiAgaXQ/OiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPjtcbiAgZW9mOiBudW1iZXIgPSAtMTtcbiAgYXN5bmMgaW5pdChyZWFkU3RyZWFtOiBzdHJlYW0uUmVhZGFibGUpOiBQcm9taXNlPFN0cmVhbUxpbmVSZWFkZXI+IHtcbiAgICBjb25zdCBybCA9IGNyZWF0ZUludGVyZmFjZSh7XG4gICAgICBpbnB1dDogcmVhZFN0cmVhbSxcbiAgICAgIGNybGZEZWxheTogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZXG4gICAgfSk7XG4gICAgdGhpcy5pdCA9IHJsW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpO1xuXG4gICAgLy8gbW92ZSB0byBmaXJzdCBsaW5lXG4gICAgYXdhaXQgdGhpcy5tb3ZlTmV4dCgpO1xuICAgIGF3YWl0IHRoaXMubW92ZU5leHQoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYXN5bmMgbW92ZU5leHQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aGlzLnZhbHVlID0gdGhpcy5uZXh0VmFsdWU7XG5cbiAgICBjb25zdCBuZXh0UmVzdWx0ID0gYXdhaXQgdGhpcy5pdC5uZXh0KCk7XG5cbiAgICBpZiAobmV4dFJlc3VsdC5kb25lKSB7XG4gICAgICB0aGlzLmVvZisrO1xuICAgICAgbmV4dFJlc3VsdC52YWx1ZSA9ICcnO1xuICAgIH1cblxuICAgIHRoaXMubmV4dFZhbHVlID0gbmV4dFJlc3VsdC52YWx1ZTtcbiAgICB0aGlzLmxpbmVOdW1iZXIrKztcbiAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIGxpbmUgYnkgbGluZSBkaWZmIG9mIHR3byBmaWxlc1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0RmlsZURpZmYgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBvcHRpb25zOiBUZXh0RmlsZURpZmZPcHRpb247XG5cbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IFRleHRGaWxlRGlmZk9wdGlvbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5vcHRpb25zID0gbmV3IFRleHRGaWxlRGlmZk9wdGlvbigpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBydW4gZGlmZlxuICAgKiBAcGFyYW0gIFN0cmluZyBmaWxlMSBwYXRoIHRvIGZpbGUgMVxuICAgKiBAcGFyYW0gIFN0cmluZyBmaWxlMiBwYXRoIHRvIGZpbGUgMlxuICAgKiBAcmV0dXJuIE9iamVjdCAgICAgICAgIHNlbGZcbiAgICovXG4gIGFzeW5jIGRpZmYoZmlsZTE6IHN0cmluZywgZmlsZTI6IHN0cmluZykge1xuICAgIGNvbnN0IHN0cmVhbTEgPSBjcmVhdGVSZWFkU3RyZWFtKGZpbGUxKTtcbiAgICBjb25zdCBzdHJlYW0yID0gY3JlYXRlUmVhZFN0cmVhbShmaWxlMik7XG4gICAgcmV0dXJuIHRoaXMuZGlmZlN0cmVhbShzdHJlYW0xLCBzdHJlYW0yKTtcbiAgfVxuXG4gIGFzeW5jIGRpZmZwbHVzKFxuICAgIGZpbGUxOiBzdHJpbmcsXG4gICAgZW5jb2RpbmcxOiBCdWZmZXJFbmNvZGluZyxcbiAgICBmaWxlMjogc3RyaW5nLFxuICAgIGVuY29kaW5nMjogQnVmZmVyRW5jb2RpbmcpIHtcbiAgICBjb25zdCBzdHJlYW0xID0gY3JlYXRlUmVhZFN0cmVhbShmaWxlMSxcbiAgICAgIHtcbiAgICAgICAgZW5jb2Rpbmc6IGVuY29kaW5nMVxuICAgICAgfSk7XG4gICAgY29uc3Qgc3RyZWFtMiA9IGNyZWF0ZVJlYWRTdHJlYW0oZmlsZTIsXG4gICAgICB7XG4gICAgICAgIGVuY29kaW5nOiBlbmNvZGluZzJcbiAgICAgIH0pO1xuICAgIHJldHVybiB0aGlzLmRpZmZTdHJlYW0oc3RyZWFtMSwgc3RyZWFtMik7XG4gIH1cbiAgLyoqXG4gICAqIHJ1biBkaWZmU3RyZWFtXG4gICAqIEBwYXJhbSAgUmVhZGFibGUgc3RyZWFtMVxuICAgKiBAcGFyYW0gIFJlYWRhYmxlIHN0cmVhbTJcbiAgICogQHJldHVybiBPYmplY3QgICAgICAgICBzZWxmXG4gICAqL1xuICBhc3luYyBkaWZmU3RyZWFtKHN0cmVhbTE6IHN0cmVhbS5SZWFkYWJsZSwgc3RyZWFtMjogc3RyZWFtLlJlYWRhYmxlKSB7XG4gICAgY29uc3QgbGluZVJlYWRlcjEgPSBhd2FpdCAobmV3IFN0cmVhbUxpbmVSZWFkZXIoKSkuaW5pdChzdHJlYW0xKTtcbiAgICBjb25zdCBsaW5lUmVhZGVyMiA9IGF3YWl0IChuZXcgU3RyZWFtTGluZVJlYWRlcigpKS5pbml0KHN0cmVhbTIpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5za2lwSGVhZGVyKSB7XG4gICAgICBhd2FpdCBsaW5lUmVhZGVyMS5tb3ZlTmV4dCgpO1xuICAgICAgYXdhaXQgbGluZVJlYWRlcjIubW92ZU5leHQoKTtcbiAgICB9XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1hd2FpdC1pbi1sb29wICovXG4gICAgLy8gd2hpbGUgYm90aCBmaWxlcyBoYXMgdmFsaWQgdmFsLCBjaGVjayBlb2YgY291bnRlclxuICAgIHdoaWxlIChsaW5lUmVhZGVyMS5lb2YgPCAyICYmIGxpbmVSZWFkZXIyLmVvZiA8IDIpIHtcbiAgICAgIGF3YWl0IHRoaXMuZG9Db21wYXJlTGluZVJlYWRlcihsaW5lUmVhZGVyMSwgbGluZVJlYWRlcjIpO1xuICAgIH1cbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWF3YWl0LWluLWxvb3AgKi9cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYXN5bmMgZG9Db21wYXJlTGluZVJlYWRlcihsaW5lUmVhZGVyMTogU3RyZWFtTGluZVJlYWRlciwgbGluZVJlYWRlcjI6IFN0cmVhbUxpbmVSZWFkZXIpIHtcbiAgICAvLyBmb3JFYWNoIGxpbmUgaW4gRmlsZTEsIGNvbXBhcmUgdG8gbGluZSBpbiBGaWxlMlxuICAgIGNvbnN0IGxpbmUxID0gbGluZVJlYWRlcjEudmFsdWU7XG4gICAgY29uc3QgbGluZTIgPSBsaW5lUmVhZGVyMi52YWx1ZTtcbiAgICBjb25zdCBjbXBhciA9IHRoaXMub3B0aW9ucy5jb21wYXJlRm4obGluZTEsIGxpbmUyKTtcblxuICAgIC8vIGRlYnVnKGxpbmUxLCBsaW5lMSwgY21wYXIpO1xuICAgIC8vIGRlYnVnKGxpbmVSZWFkZXIxLm5leHRWYWx1ZSwgbGluZVJlYWRlcjIubmV4dFZhbHVlLCAnbmV4dCcsIGxpbmVSZWFkZXIxLmVvZiwgbGluZVJlYWRlcjIuZW9mKTtcbiAgICAvLyBlbWl0IG9uIGNvbXBhcmVkXG4gICAgdGhpcy5lbWl0KCdjb21wYXJlZCcsIGxpbmUxLCBsaW5lMiwgY21wYXIsIGxpbmVSZWFkZXIxLCBsaW5lUmVhZGVyMik7XG5cbiAgICBpZiAoY21wYXIgPiAwKSB7XG4gICAgICAvLyBsaW5lMSA+IGxpbmUyOiBuZXcgbGluZSBkZXRlY3RlZFxuICAgICAgLy8gaWYgZmlsZTIgZW5kZWQgYmVmb3JlIGZpbGUxLCB0aGVuIGZpbGUyIGxvc3QgbGluZTFcbiAgICAgIC8vIGVsc2UgZmlsZTIgaGFzIG5ldyBsaW5lXG4gICAgICBpZiAobGluZVJlYWRlcjIuZW9mID4gbGluZVJlYWRlcjEuZW9mKSB7XG4gICAgICAgIHRoaXMuZW1pdCgnLScsIGxpbmUxLCBsaW5lUmVhZGVyMSwgbGluZVJlYWRlcjIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5lbWl0KCcrJywgbGluZTIsIGxpbmVSZWFkZXIxLCBsaW5lUmVhZGVyMik7XG4gICAgICB9XG5cbiAgICAgIC8vIGluY3IgRmlsZTIgdG8gbmV4dCBsaW5lXG4gICAgICBhd2FpdCBsaW5lUmVhZGVyMi5tb3ZlTmV4dCgpO1xuICAgIH0gZWxzZSBpZiAoY21wYXIgPCAwKSB7XG4gICAgICAvLyBsaW5lMSA8IGxpbmUyOiBkZWxldGVkIGxpbmVcbiAgICAgIC8vIGlmIGZpbGUxIGVuZGVkIGJlZm9yZSBmaWxlMiwgdGhlbiBmaWxlMiBoYXMgbmV3IGxpbmVcbiAgICAgIC8vIGVsc2UgZmlsZTEgbG9zdCBhIGxpbmVcbiAgICAgIGlmIChsaW5lUmVhZGVyMS5lb2YgPiBsaW5lUmVhZGVyMi5lb2YpIHtcbiAgICAgICAgdGhpcy5lbWl0KCcrJywgbGluZTIsIGxpbmVSZWFkZXIxLCBsaW5lUmVhZGVyMik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmVtaXQoJy0nLCBsaW5lMSwgbGluZVJlYWRlcjEsIGxpbmVSZWFkZXIyKTtcbiAgICAgIH1cblxuICAgICAgLy8gaW5jciBGaWxlMSB0byBuZXh0IGxpbmVcbiAgICAgIGF3YWl0IGxpbmVSZWFkZXIxLm1vdmVOZXh0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGVxdWFsczogMCBpbmNyIGJvdGggZmlsZXMgdG8gbmV4dCBsaW5lXG4gICAgICBhd2FpdCBsaW5lUmVhZGVyMS5tb3ZlTmV4dCgpO1xuICAgICAgYXdhaXQgbGluZVJlYWRlcjIubW92ZU5leHQoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==