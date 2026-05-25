package mediapeer

import "testing"

func isVP8Keyframe(payload []byte) bool {
	return len(payload) > 0 && payload[0]&0x01 == 0
}

func TestEncodeRGBChunkToVP8SamplesUsesInterFramesInsideSegment(t *testing.T) {
	t.Parallel()

	const (
		width     = 32
		height    = 32
		numFrames = 8
		fps       = 20
	)
	rgb := make([]byte, width*height*3*numFrames)
	frameSize := width * height * 3
	for f := 0; f < numFrames; f++ {
		base := f * frameSize
		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				i := base + (y*width+x)*3
				rgb[i] = byte((x + f) % 256)
				rgb[i+1] = byte((y + f) % 256)
				rgb[i+2] = byte((x + y + f) % 256)
			}
		}
	}

	samples, err := EncodeRGBChunkToVP8SamplesWithBitrate(rgb, width, height, numFrames, fps, 500)
	if err != nil {
		t.Fatal(err)
	}
	if len(samples) < 2 {
		t.Fatalf("got %d samples want at least 2", len(samples))
	}
	if !isVP8Keyframe(samples[0].Data) {
		t.Fatalf("first VP8 sample should be a keyframe")
	}

	keyframes := 0
	for _, sample := range samples {
		if isVP8Keyframe(sample.Data) {
			keyframes++
		}
	}
	if keyframes == len(samples) {
		t.Fatalf("all %d VP8 samples are keyframes; expected inter frames inside the segment", len(samples))
	}
}
