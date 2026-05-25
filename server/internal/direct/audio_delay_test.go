package direct

import (
	"bytes"
	"encoding/binary"
	"testing"
)

func testPCM(samples int, start int) []byte {
	pcm := make([]byte, samples*2)
	for i := 0; i < samples; i++ {
		binary.LittleEndian.PutUint16(pcm[i*2:], uint16(start+i+1))
	}
	return pcm
}

func TestCurrentVideoBitrateKbpsUsesGCCBudget(t *testing.T) {
	t.Parallel()
	p := &DirectPeer{}

	if got := p.currentVideoBitrateKbps(); got != defaultDirectVideoBitrateKbps {
		t.Fatalf("default bitrate=%d want %d", got, defaultDirectVideoBitrateKbps)
	}

	p.targetBitrateBps.Store(675_000)
	if got := p.currentVideoBitrateKbps(); got != minDirectVideoBitrateKbps {
		t.Fatalf("low GCC bitrate=%d want %d", got, minDirectVideoBitrateKbps)
	}

	p.targetBitrateBps.Store(2_000_000)
	if got := p.currentVideoBitrateKbps(); got != 1300 {
		t.Fatalf("scaled bitrate=%d want 1300", got)
	}

	p.targetBitrateBps.Store(4_000_000)
	if got := p.currentVideoBitrateKbps(); got != maxDirectVideoBitrateKbps {
		t.Fatalf("capped bitrate=%d want %d", got, maxDirectVideoBitrateKbps)
	}
}

func TestApplyAudioDelayInsertsSilenceAndPreservesLength(t *testing.T) {
	t.Parallel()
	p := &DirectPeer{}

	const sampleRate = 1000
	pcm := testPCM(200, 0)
	_ = p.applyAudioDelay(1, pcm, sampleRate)
	p.HandleAVSyncFeedback(1, 200, 180, "video_late_audio_leads")

	out := p.applyAudioDelay(1, pcm, sampleRate)
	if len(out) != len(pcm) {
		t.Fatalf("len=%d want %d", len(out), len(pcm))
	}

	delayBytes := audioDelayPCMBytes(audioDelayStepMS, sampleRate)
	if !bytes.Equal(out[:delayBytes], make([]byte, delayBytes)) {
		t.Fatalf("first %d bytes should be silence", delayBytes)
	}
	if !bytes.Equal(out[delayBytes:], pcm[:len(pcm)-delayBytes]) {
		t.Fatalf("audio content was not shifted by %d bytes", delayBytes)
	}
}

func TestApplyAudioDelayCarriesDelayedTail(t *testing.T) {
	t.Parallel()
	p := &DirectPeer{}

	const sampleRate = 1000
	first := testPCM(200, 0)
	second := testPCM(200, 1000)
	_ = p.applyAudioDelay(1, first, sampleRate)
	p.HandleAVSyncFeedback(1, 200, 180, "video_late_audio_leads")

	firstOut := p.applyAudioDelay(1, first, sampleRate)
	_ = firstOut
	secondOut := p.applyAudioDelay(1, second, sampleRate)

	delayBytes := audioDelayPCMBytes(audioDelayStepMS, sampleRate)
	if !bytes.Equal(secondOut[:delayBytes], first[len(first)-delayBytes:]) {
		t.Fatalf("second output does not start with delayed tail")
	}
}

func TestApplyAudioDelayResetsOnEpochChange(t *testing.T) {
	t.Parallel()
	p := &DirectPeer{}

	const sampleRate = 1000
	first := testPCM(200, 0)
	second := testPCM(200, 1000)
	_ = p.applyAudioDelay(1, first, sampleRate)
	p.HandleAVSyncFeedback(1, 200, 180, "video_late_audio_leads")
	_ = p.applyAudioDelay(1, first, sampleRate)

	out := p.applyAudioDelay(2, second, sampleRate)
	if !bytes.Equal(out, second) {
		t.Fatalf("new epoch should reset audio delay")
	}
}

func TestHandleAVSyncFeedbackIgnoresStaleTurn(t *testing.T) {
	t.Parallel()
	p := &DirectPeer{}
	p.AdvancePlaybackEpoch(2)

	const sampleRate = 1000
	pcm := testPCM(200, 0)
	_ = p.applyAudioDelay(2, pcm, sampleRate)
	p.HandleAVSyncFeedback(1, 200, 180, "video_late_audio_leads")

	out := p.applyAudioDelay(2, pcm, sampleRate)
	if !bytes.Equal(out, pcm) {
		t.Fatalf("stale feedback should not delay current epoch audio")
	}
}
