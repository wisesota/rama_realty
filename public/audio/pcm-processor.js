class RamaPcmProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const requestedRate = options?.processorOptions?.targetSampleRate;
    const requestedDuration = options?.processorOptions?.chunkDurationMs;
    this.targetSampleRate = Number.isFinite(requestedRate) ? requestedRate : sampleRate;
    this.chunkDurationMs = Number.isFinite(requestedDuration) ? requestedDuration : 80;
    this.sourceChunkSize = Math.max(128, Math.round(sampleRate * this.chunkDurationMs / 1000));
    this.outputChunkSize = Math.max(
      128,
      Math.round(this.targetSampleRate * this.chunkDurationMs / 1000),
    );
    this.chunk = new Float32Array(this.sourceChunkSize);
    this.offset = 0;
  }

  resample(input) {
    if (sampleRate === this.targetSampleRate && input.length === this.outputChunkSize) {
      return input;
    }

    const output = new Float32Array(this.outputChunkSize);
    const ratio = (input.length - 1) / Math.max(1, output.length - 1);
    for (let index = 0; index < output.length; index += 1) {
      const position = index * ratio;
      const left = Math.floor(position);
      const right = Math.min(input.length - 1, left + 1);
      const mix = position - left;
      output[index] = input[left] * (1 - mix) + input[right] * mix;
    }
    return output;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    let sourceOffset = 0;
    while (sourceOffset < input.length) {
      const remaining = this.sourceChunkSize - this.offset;
      const copyLength = Math.min(remaining, input.length - sourceOffset);
      this.chunk.set(input.subarray(sourceOffset, sourceOffset + copyLength), this.offset);
      this.offset += copyLength;
      sourceOffset += copyLength;

      if (this.offset === this.sourceChunkSize) {
        const completeChunk = this.chunk;
        const outputChunk = this.resample(completeChunk);
        this.port.postMessage(outputChunk, [outputChunk.buffer]);
        this.chunk = new Float32Array(this.sourceChunkSize);
        this.offset = 0;
      }
    }

    return true;
  }
}

registerProcessor("rama-pcm-processor", RamaPcmProcessor);
